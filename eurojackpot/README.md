# EuroJackpot Draw Analysis

Statistical analysis of EuroJackpot (5 numbers from 1–50 + 2 euro numbers from 1–12,
drawn every Tuesday and Friday), focused on the last 200 draws.

## Honest summary up front

EuroJackpot draws are independent random events. No analysis of past draws can
improve the probability of predicting future numbers: every 5+2 combination has
exactly the same chance, **1 in 139,838,160**, in every draw. The analysis here
quantifies that claim on real data (frequencies, chi-square uniformity tests,
gap analysis, repeat-lag tests, Monte Carlo null models) instead of asserting it.
What the data shows: observed "hot"/"cold"/"overdue" patterns are fully within
the range pure chance produces.

## Data pipeline & provenance

| File | Contents |
| --- | --- |
| `data/base_draws_2012_2025.csv` | 875 draws (2012-03-23 → 2025-08-08) extracted from the npm package `tsch-ej-numbers` (official German payout-table data); cross-verified draw-by-draw against two independent npm datasets (`ej-data`, `tsdev-ejm-data`) with zero mismatches over 1,232 overlapping draws. |
| `data/mined_claims.json` | Draws 2025-08-12 → 2026-07-24 mined from web-search snippets by 12 month-scoped agents (single pass, with per-draw source citations). |
| `data/independent_verification.json` | Second, independent search pass over every mined claim (separate session), verdicts CONFIRMED / MISMATCH / UNVERIFIED plus newly found draws. |
| `data/eurojackpot_draws_full.csv` | Merged, validated full history. |
| `data/eurojackpot_last200.csv` | The last-200-draw analysis window. |

Validation applied at merge time (`analysis/merge_data.py`): number ranges,
uniqueness, Tuesday/Friday calendar completeness, duplicate detection.
Draws where the two search passes disagreed are excluded and reported.

## Analysis

- `analysis/analyze.py` — the engine: frequencies, chi-square goodness-of-fit,
  hot/cold/overdue gaps, recency-weighted frequency, pair co-occurrence,
  sum/parity/consecutive structure, repeat-lag test, 100k-simulation Monte Carlo
  null model for extreme frequencies.
- `analysis/reconcile.py` — merges mining pass with the verification pass.
- `analysis/results/` — JSON outputs.
- `../REPORT.md` — full findings and the probability discussion.

Run:

```bash
pip install numpy scipy
python3 analysis/analyze.py data/eurojackpot_draws_full.csv --window 200
```
