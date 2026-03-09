#!/usr/bin/env python3
"""
Claude Code session cost report.

Reads token usage from ~/.claude/projects/ session files and estimates
costs based on published pricing for API, Bedrock, or Vertex.

Usage:
    python3 claude-costs.py                                # last 30 days, API pricing
    python3 claude-costs.py --days 7                       # last week
    python3 claude-costs.py --pricing bedrock               # AWS Bedrock global
    python3 claude-costs.py --pricing vertex                # Google Vertex AI global
    python3 claude-costs.py --pricing bedrock --regional    # Bedrock regional (+10%)
    python3 claude-costs.py --budget 50                     # warn if total exceeds $50
    python3 claude-costs.py --budget 50 --notify            # also send OS notification
    python3 claude-costs.py --days 1 --budget 20 --notify   # daily alert under $20

Pricing source: https://docs.anthropic.com/en/docs/about-claude/pricing
"""
import json
import glob
import os
import platform
import subprocess
import sys
from datetime import datetime, timedelta, timezone

MODEL_PRICES = {
    "opus-4-6":   [5.0,   25.0,  6.25,   0.50],
    "opus-4-5":   [5.0,   25.0,  6.25,   0.50],
    "opus-4-1":   [15.0,  75.0,  18.75,  1.50],
    "opus-4":     [15.0,  75.0,  18.75,  1.50],
    "opus-3":     [15.0,  75.0,  18.75,  1.50],
    "sonnet-4-6": [3.0,   15.0,  3.75,   0.30],
    "sonnet-4-5": [3.0,   15.0,  3.75,   0.30],
    "sonnet-4":   [3.0,   15.0,  3.75,   0.30],
    "sonnet-3-7": [3.0,   15.0,  3.75,   0.30],
    "haiku-4-5":  [1.0,   5.0,   1.25,   0.10],
    "haiku-3-5":  [0.80,  4.0,   1.0,    0.08],
    "haiku-3":    [0.25,  1.25,  0.30,   0.03],
}

REGIONAL_PREMIUM_MODELS = {"4-5", "4-6"}


def get_pricing(model_name, regional_multiplier=1.0):
    model_lower = model_name.lower()
    for key in sorted(MODEL_PRICES.keys(), key=len, reverse=True):
        if key in model_lower:
            prices = MODEL_PRICES[key]
            version = key.split("-", 1)[1] if "-" in key else ""
            if regional_multiplier > 1.0 and version in REGIONAL_PREMIUM_MODELS:
                return [p * regional_multiplier for p in prices]
            return list(prices)
    return list(MODEL_PRICES["sonnet-4"])


def parse_sessions(base_dir, cutoff, regional_multiplier):
    rows = []
    for proj in os.listdir(base_dir):
        proj_dir = os.path.join(base_dir, proj)
        if not os.path.isdir(proj_dir):
            continue
        for filepath in glob.glob(os.path.join(proj_dir, "*.jsonl")):
            inp = out = cache_write = cache_read = 0
            model = ""
            first_ts = None

            for line in open(filepath):
                line = line.strip()
                if not line:
                    continue
                try:
                    entry = json.loads(line)
                except (json.JSONDecodeError, ValueError):
                    continue

                ts = entry.get("timestamp")
                if ts:
                    t = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                    if first_ts is None or t < first_ts:
                        first_ts = t

                if entry.get("type") == "assistant":
                    msg = entry.get("message", {})
                    usage = msg.get("usage", {})
                    model = msg.get("model", model)
                    inp += usage.get("input_tokens", 0)
                    out += usage.get("output_tokens", 0)
                    cache_write += usage.get("cache_creation_input_tokens", 0)
                    cache_read += usage.get("cache_read_input_tokens", 0)

            if not first_ts or first_ts < cutoff or not model:
                continue

            prices = get_pricing(model, regional_multiplier)
            cost = (
                inp * prices[0]
                + out * prices[1]
                + cache_write * prices[2]
                + cache_read * prices[3]
            ) / 1_000_000

            project_name = proj.replace("-", "/").split("/")[-1] or proj[:15]
            rows.append((
                first_ts.strftime("%Y-%m-%d %H:%M"),
                project_name,
                model,
                cost,
            ))

    return rows


def send_notification(title, message):
    system = platform.system()
    if system == "Darwin":
        subprocess.run([
            "osascript", "-e",
            f'display notification "{message}" with title "{title}"'
        ], check=False)
    elif system == "Linux":
        subprocess.run(["notify-send", title, message], check=False)


def get_arg(flag, default=None):
    if flag in sys.argv:
        try:
            return sys.argv[sys.argv.index(flag) + 1]
        except IndexError:
            return default
    return default


def main():
    if "--help" in sys.argv or "-h" in sys.argv:
        print(__doc__)
        sys.exit(0)

    days = int(get_arg("--days", "30"))
    pricing_mode = get_arg("--pricing", "api")
    regional = "--regional" in sys.argv
    budget_str = get_arg("--budget")
    budget = float(budget_str) if budget_str else None
    notify = "--notify" in sys.argv

    if pricing_mode not in ("api", "bedrock", "vertex"):
        print("--pricing must be api, bedrock, or vertex", file=sys.stderr)
        sys.exit(1)

    regional_multiplier = 1.0
    if regional and pricing_mode in ("bedrock", "vertex"):
        regional_multiplier = 1.10

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    base_dir = os.path.expanduser("~/.claude/projects")

    if not os.path.isdir(base_dir):
        print("No session data at ~/.claude/projects/", file=sys.stderr)
        sys.exit(1)

    rows = parse_sessions(base_dir, cutoff, regional_multiplier)
    rows.sort(reverse=True)
    total = sum(r[3] for r in rows)

    label = pricing_mode.upper()
    if regional:
        label += " regional"

    print(f"\n  Pricing: {label} | Period: {days} days | Sessions: {len(rows)}")
    print(f"\n{'Date':<18}{'Project':<16}{'Model':<24}{'Cost':>8}")
    print("-" * 66)
    for date, name, model, cost in rows:
        print(f"{date:<18}{name:<16}{model:<24}${cost:>7.4f}")
    print("-" * 66)
    pad = max(0, 36 - len(str(len(rows))) - len(str(days)))
    print(f"Total ({len(rows)} sessions, {days}d){' ' * pad}${total:>7.4f}")

    over_budget = False
    if budget is not None:
        remaining = budget - total
        if total > budget:
            over_budget = True
            print(f"\n  *** OVER BUDGET by ${total - budget:.2f} "
                  f"(budget: ${budget:.2f}, spent: ${total:.2f}) ***")
            if notify:
                send_notification(
                    "Claude Code: Over Budget",
                    f"${total:.2f} spent in {days}d (budget: ${budget:.2f})"
                )
        else:
            print(f"\n  Budget: ${budget:.2f} | Remaining: ${remaining:.2f} "
                  f"| Used: {total/budget*100:.0f}%")

    print(f"\nPricing: {label}. Estimates only — check your billing dashboard.")
    if pricing_mode == "bedrock":
        print("  AWS Cost Explorer > filter by 'Amazon Bedrock'")
    elif pricing_mode == "vertex":
        print("  GCP Billing > Reports > filter 'Vertex AI'")
    else:
        print("  console.anthropic.com > Billing > Usage")
    print()

    if over_budget:
        sys.exit(1)


if __name__ == "__main__":
    main()
