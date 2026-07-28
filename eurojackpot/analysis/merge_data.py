#!/usr/bin/env python3
"""Merge the base EuroJackpot dataset (npm-packaged official history through
2025-08-08) with search-mined draws (2025-08-12 onward), validate structurally,
and emit the full and last-200 CSVs.

Usage: python3 merge_data.py <base.csv> <mined.json> <out_full.csv> <out_last200.csv>
mined.json: {"accepted": [...], "resolved": [...]} with {date, main[5], euro[2], sources}.
"""
import csv
import json
import sys
from datetime import date, timedelta


def fail(msg):
    print(f"VALIDATION FAILURE: {msg}")
    sys.exit(1)


def main():
    base_csv, mined_json, out_full, out_last = sys.argv[1:5]

    draws = {}
    with open(base_csv) as f:
        for r in csv.DictReader(f):
            draws[r["date"]] = (
                [int(r[f"n{i}"]) for i in range(1, 6)],
                [int(r["e1"]), int(r["e2"])],
                "npm-base",
            )

    mined = json.load(open(mined_json))
    for rec in mined["accepted"] + mined["resolved"]:
        d = rec["date"]
        if d in draws:
            fail(f"mined draw {d} duplicates base data")
        draws[d] = (sorted(rec["main"]), sorted(rec["euro"]), rec["status"])

    # Structural validation
    fmt_change = date(2022, 3, 25)
    for d, (m, e, _) in draws.items():
        dd = date.fromisoformat(d)
        if len(set(m)) != 5 or not all(1 <= x <= 50 for x in m):
            fail(f"{d}: bad main {m}")
        lim = 10 if dd < fmt_change else 12
        if len(set(e)) != 2 or not all(1 <= x <= lim for x in e):
            fail(f"{d}: bad euro {e}")
        if dd >= fmt_change and dd.weekday() not in (1, 4):
            fail(f"{d}: not a Tue/Fri")

    # Calendar completeness since format change
    dates = sorted(draws)
    last = date.fromisoformat(dates[-1])
    d = fmt_change
    missing = []
    while d <= last:
        if d.weekday() in (1, 4) and d.isoformat() not in draws:
            missing.append(d.isoformat())
        d += timedelta(days=1)
    if missing:
        print(f"WARNING: {len(missing)} missing draw dates: {missing}")

    with open(out_full, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["date", "n1", "n2", "n3", "n4", "n5", "e1", "e2", "source"])
        for d in dates:
            m, e, src = draws[d]
            w.writerow([d, *sorted(m), *sorted(e), src])

    with open(out_last, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["date", "n1", "n2", "n3", "n4", "n5", "e1", "e2"])
        for d in dates[-200:]:
            m, e, _ = draws[d]
            w.writerow([d, *sorted(m), *sorted(e)])

    print(f"Merged {len(dates)} draws ({dates[0]} -> {dates[-1]}); "
          f"last-200 window {dates[-200]} -> {dates[-1]}; "
          f"missing-in-calendar: {len(missing)}")


if __name__ == "__main__":
    main()
