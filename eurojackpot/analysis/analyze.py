#!/usr/bin/env python3
"""EuroJackpot statistical analysis engine.

Analyzes the last N draws (default 200) of EuroJackpot (5/50 + 2/12):
frequencies, chi-square uniformity, gap/overdue stats, pair co-occurrence,
sum/parity/consecutive structure, repeat-lag behaviour, and a Monte Carlo
null model that says whether any observed pattern exceeds what pure chance
produces.

Usage: python3 analyze.py <full_draws.csv> [--window 200] [--out results.json]
CSV columns: date,n1..n5,e1,e2 (numbers sorted ascending per draw).
"""
import argparse
import csv
import itertools
import json
import math
from collections import Counter
from datetime import date

import numpy as np
from scipy import stats

MAIN_POOL = 50
EURO_POOL = 12
MAIN_PICK = 5
EURO_PICK = 2

JACKPOT_ODDS = math.comb(MAIN_POOL, MAIN_PICK) * math.comb(EURO_POOL, EURO_PICK)


def load(path):
    rows = []
    with open(path) as f:
        for r in csv.DictReader(f):
            rows.append({
                "date": r["date"],
                "main": sorted(int(r[f"n{i}"]) for i in range(1, 6)),
                "euro": sorted([int(r["e1"]), int(r["e2"])]),
            })
    rows.sort(key=lambda x: x["date"])
    return rows


def frequencies(draws):
    main = Counter(itertools.chain.from_iterable(d["main"] for d in draws))
    euro = Counter(itertools.chain.from_iterable(d["euro"] for d in draws))
    return (
        {n: main.get(n, 0) for n in range(1, MAIN_POOL + 1)},
        {n: euro.get(n, 0) for n in range(1, EURO_POOL + 1)},
    )


def chi_square(freq, pool, picks_per_draw, n_draws):
    observed = np.array([freq[n] for n in range(1, pool + 1)])
    expected = np.full(pool, n_draws * picks_per_draw / pool)
    chi2, p = stats.chisquare(observed, expected)
    return {"chi2": float(chi2), "dof": pool - 1, "p_value": float(p),
            "expected_per_number": float(expected[0])}


def gaps(draws, pool, key):
    """Draws since each number last appeared (0 = appeared in latest draw)."""
    last_seen = {}
    for i, d in enumerate(draws):
        for n in d[key]:
            last_seen[n] = i
    n_draws = len(draws)
    return {n: (n_draws - 1 - last_seen[n]) if n in last_seen else n_draws
            for n in range(1, pool + 1)}


def recency_weighted(draws, pool, key, half_life=50):
    """Exponentially decayed frequency (half-life in draws)."""
    lam = math.log(2) / half_life
    n_draws = len(draws)
    w = {n: 0.0 for n in range(1, pool + 1)}
    for i, d in enumerate(draws):
        decay = math.exp(-lam * (n_draws - 1 - i))
        for n in d[key]:
            w[n] += decay
    return {n: round(v, 3) for n, v in w.items()}


def pair_stats(draws):
    pairs = Counter()
    for d in draws:
        for a, b in itertools.combinations(d["main"], 2):
            pairs[(a, b)] += 1
    n = len(draws)
    # P(two specific numbers co-occur) = C(48,3)/C(50,5) = 2/245
    expected = n * math.comb(MAIN_POOL - 2, MAIN_PICK - 2) / math.comb(MAIN_POOL, MAIN_PICK)
    top = pairs.most_common(15)
    return {"expected_per_pair": round(expected, 3),
            "top_pairs": [{"pair": list(p), "count": c} for p, c in top],
            "max_count": top[0][1] if top else 0}


def structure(draws):
    sums = [sum(d["main"]) for d in draws]
    odd_counts = Counter(sum(1 for n in d["main"] if n % 2) for d in draws)
    low_counts = Counter(sum(1 for n in d["main"] if n <= 25) for d in draws)
    consec = Counter(
        sum(1 for a, b in zip(d["main"], d["main"][1:]) if b - a == 1) for d in draws
    )
    return {
        "sum_mean": round(float(np.mean(sums)), 2),
        "sum_std": round(float(np.std(sums)), 2),
        "sum_theoretical_mean": MAIN_PICK * (MAIN_POOL + 1) / 2,  # 127.5
        "odd_count_dist": {str(k): v for k, v in sorted(odd_counts.items())},
        "low_count_dist": {str(k): v for k, v in sorted(low_counts.items())},
        "consecutive_adjacent_dist": {str(k): v for k, v in sorted(consec.items())},
    }


def repeat_lag(draws):
    """How often numbers repeat from the immediately preceding draw."""
    repeats = sum(
        len(set(a["main"]) & set(b["main"]))
        for a, b in zip(draws, draws[1:])
    )
    n_pairs = len(draws) - 1
    expected_per_draw = MAIN_PICK * MAIN_PICK / MAIN_POOL  # 0.5
    observed_per_draw = repeats / n_pairs
    # Each of the 5 previous numbers reappears with p = 5/50 -> Binomial-ish test
    p_repeat = MAIN_PICK / MAIN_POOL
    total_trials = n_pairs * MAIN_PICK
    p_value = float(stats.binomtest(repeats, total_trials, p_repeat).pvalue)
    return {"observed_repeats_per_draw": round(observed_per_draw, 4),
            "expected_repeats_per_draw": expected_per_draw,
            "p_value": round(p_value, 4)}


def monte_carlo(draws, n_sims=100_000, seed=42):
    """Simulate uniform 5/50 draws; compare observed extremes to the null."""
    rng = np.random.default_rng(seed)
    n_draws = len(draws)
    obs_freq, _ = frequencies(draws)
    obs_max = max(obs_freq.values())
    obs_min = min(obs_freq.values())

    max_counts = np.empty(n_sims)
    min_counts = np.empty(n_sims)
    for s in range(n_sims):
        counts = np.zeros(MAIN_POOL, dtype=np.int32)
        picks = rng.random((n_draws, MAIN_POOL)).argsort(axis=1)[:, :MAIN_PICK]
        np.add.at(counts, picks.ravel(), 1)
        max_counts[s] = counts.max()
        min_counts[s] = counts.min()
    return {
        "n_sims": n_sims,
        "observed_max_freq": int(obs_max),
        "null_max_freq_mean": round(float(max_counts.mean()), 2),
        "p_max_at_least_observed": round(float((max_counts >= obs_max).mean()), 4),
        "observed_min_freq": int(obs_min),
        "null_min_freq_mean": round(float(min_counts.mean()), 2),
        "p_min_at_most_observed": round(float((min_counts <= obs_min).mean()), 4),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("csv")
    ap.add_argument("--window", type=int, default=200)
    ap.add_argument("--out", default=None)
    args = ap.parse_args()

    all_draws = load(args.csv)
    draws = all_draws[-args.window:]
    n = len(draws)

    main_freq, euro_freq = frequencies(draws)
    main_gaps = gaps(draws, MAIN_POOL, "main")
    euro_gaps = gaps(draws, EURO_POOL, "euro")

    hot_main = sorted(main_freq, key=main_freq.get, reverse=True)
    cold_main = sorted(main_freq, key=main_freq.get)
    hot_euro = sorted(euro_freq, key=euro_freq.get, reverse=True)
    overdue_main = sorted(main_gaps, key=main_gaps.get, reverse=True)
    overdue_euro = sorted(euro_gaps, key=euro_gaps.get, reverse=True)

    results = {
        "window": {"n_draws": n, "from": draws[0]["date"], "to": draws[-1]["date"]},
        "odds": {
            "jackpot_one_in": JACKPOT_ODDS,
            "jackpot_probability": 1.0 / JACKPOT_ODDS,
            "any_single_number_next_draw": MAIN_PICK / MAIN_POOL,
            "any_single_euro_next_draw": EURO_PICK / EURO_POOL,
        },
        "main_frequency": main_freq,
        "euro_frequency": euro_freq,
        "hot_main_top10": [{"n": x, "count": main_freq[x]} for x in hot_main[:10]],
        "cold_main_bottom10": [{"n": x, "count": main_freq[x]} for x in cold_main[:10]],
        "hot_euro": [{"n": x, "count": euro_freq[x]} for x in hot_euro],
        "overdue_main_top10": [{"n": x, "draws_since_seen": main_gaps[x]} for x in overdue_main[:10]],
        "overdue_euro_top5": [{"n": x, "draws_since_seen": euro_gaps[x]} for x in overdue_euro[:5]],
        "recency_weighted_main_top10": sorted(
            recency_weighted(draws, MAIN_POOL, "main").items(),
            key=lambda kv: kv[1], reverse=True)[:10],
        "chi_square_main": chi_square(main_freq, MAIN_POOL, MAIN_PICK, n),
        "chi_square_euro": chi_square(euro_freq, EURO_POOL, EURO_PICK, n),
        "pairs": pair_stats(draws),
        "structure": structure(draws),
        "repeat_lag": repeat_lag(draws),
        "monte_carlo": monte_carlo(draws),
    }

    out = args.out or "results/core_results.json"
    with open(out, "w") as f:
        json.dump(results, f, indent=2)

    ch_m, ch_e = results["chi_square_main"], results["chi_square_euro"]
    print(f"Window: {n} draws, {draws[0]['date']} -> {draws[-1]['date']}")
    print(f"Hot main:   {[x['n'] for x in results['hot_main_top10']]}")
    print(f"Cold main:  {[x['n'] for x in results['cold_main_bottom10']]}")
    print(f"Hot euro:   {[x['n'] for x in results['hot_euro'][:4]]}")
    print(f"Overdue:    {[x['n'] for x in results['overdue_main_top10']]}")
    print(f"Chi2 main:  chi2={ch_m['chi2']:.1f} dof={ch_m['dof']} p={ch_m['p_value']:.3f}")
    print(f"Chi2 euro:  chi2={ch_e['chi2']:.1f} dof={ch_e['dof']} p={ch_e['p_value']:.3f}")
    print(f"Repeat lag: obs={results['repeat_lag']['observed_repeats_per_draw']} "
          f"exp={results['repeat_lag']['expected_repeats_per_draw']} p={results['repeat_lag']['p_value']}")
    mc = results["monte_carlo"]
    print(f"MonteCarlo: obs_max={mc['observed_max_freq']} null_mean={mc['null_max_freq_mean']} "
          f"p={mc['p_max_at_least_observed']}")
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
