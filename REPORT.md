# EuroJackpot — Last 200 Draws: Deep Statistical Analysis

*Analysis window: 2024-07-26 → 2026-07-24 (the 200 most recent Tue/Fri draws; 191 with
verified/sourced numbers, 9 draws from June–July 2026 unresolved at analysis time).
Full methodology, data and code: [`eurojackpot/`](eurojackpot/).*

## 1. The answer up front

**There is no number, and no combination, with a "strong probability" of winning the next
draw.** That is not a hedge — it is the measured result of this analysis. Every test run on
the last 200 draws (and on 966 draws back to 2012) comes back consistent with a perfectly
fair, memoryless random draw:

| Test | Result | Interpretation |
| --- | --- | --- |
| Chi-square uniformity, main numbers (1–50) | χ² = 35.0, dof 49, **p = 0.93** | Frequencies indistinguishable from uniform |
| Chi-square uniformity, euro numbers (1–12) | χ² = 6.6, dof 11, **p = 0.83** | Same |
| Repeat-lag (do last draw's numbers recur?) | 0.523 repeats/draw vs 0.5 expected, **p = 0.63** | No carryover between draws |
| Monte Carlo null model (100,000 simulated histories) | hottest number 29 hits vs 30.2 expected-max, **p = 0.78**; coldest 12 vs 11.0 expected-min, **p = 0.83** | Observed extremes are *milder* than an average random history |

The only true probabilities for the next draw:

- **Any specific 5+2 ticket: 1 in 139,838,160** (C(50,5) × C(12,2))
- Any *individual* main number appears: **10%** (5/50) — identical for all 50 numbers
- Any *individual* euro number appears: **16.7%** (2/12) — identical for all 12

## 2. What the last 200 draws actually look like

Expected hits per main number: 20. Expected per euro number: 33.3.

**Most drawn ("hot") main numbers**

| # | hits | | # | hits |
|---|------|-|---|------|
| 17 | 29 | | 1 | 25 |
| 21 | 28 | | 27 | 25 |
| 35 | 27 | | 8 | 24 |
| 23 | 26 | | 41 | 23 |
| 37 | 26 | | 11 | 22 |

**Least drawn ("cold") main numbers:** 49 (12), 24 (13), 32 (13), 5 (15), 36 (15),
25 (16), 43 (16), 48 (16), 6 (17), 10 (17)

**Euro numbers:** hottest 5 (43 hits) and 12 (37); coldest 8 (27) and 11 (27)

**Most "overdue" main numbers (draws since last seen):** 24 (52), 45 (37), 14 (32),
26 (31), 12 (28), 9 (23). Euro: 4 (28 draws unseen).

**Pairs:** most frequent co-occurrences 23+44 and 17+41 (7 times each vs 1.6 expected
for any given pair — but with 1,225 possible pairs, a maximum of ~7 is exactly what
chance predicts).

**Draw structure (200 draws):** mean sum 125.5 (theory: 127.5); 2–3 odd numbers in 65%
of draws; 0 adjacent consecutive numbers in 60% of draws — all textbook-random.

## 3. Why the "hot" numbers are noise, demonstrably

Three independent lines of evidence:

1. **The chi-square tests** (p = 0.93 / 0.83): differences between 29 hits for 17 and
   12 hits for 49 are well inside random variation for 200 draws of 5-from-50.
2. **Monte Carlo:** in 100,000 simulated fair histories of 200 draws, the *average*
   hottest number gets 30.2 hits — more extreme than our observed 29. Our data is,
   if anything, unusually *even*.
3. **Window sensitivity:** shift the 200-draw window to end at 2025-08-08 (using only the
   triple-verified pre-2025 data) and the "hot" list becomes 45, 17, 20, 23, 30 — while 45
   is merely average in the current window and near-"overdue". Hot lists do not persist
   because there is nothing persistent to find. (χ² p-values stay non-significant in every
   window tested: 0.69, 0.69, 0.93.)

The "overdue" numbers deserve a special word: the gambler's-fallacy read is that 24 (unseen
for 52 draws) is "due". Its probability next draw is 10.000%, the same as every other
number. A 52-draw absence for *some* number happens routinely (Monte Carlo p ≈ 0.4).

## 4. If you play anyway — the only edge that exists

You cannot raise your chance of winning. You *can* raise your expected payout **if you win**,
by picking combinations fewer other players share (jackpots are split among winners):

- Prefer numbers **above 31** (excludes birthday-based picks, the most popular choices).
- Avoid round/pattern tickets (1-2-3-4-5, multiples of 5, previous draws' numbers).
- Avoid last week's winning numbers (surprisingly popular picks).

Example sets — all with *identical* 1-in-139,838,160 jackpot odds:

| Strategy | Main numbers | Euro numbers |
| --- | --- | --- |
| "Hot" (most frequent, last 200) | 17, 21, 23, 35, 37 | 5, 12 |
| "Overdue" (longest unseen) | 12, 14, 24, 26, 45 | 4, 8 |
| **Low-sharing (best expected payout)** | 33, 38, 42, 46, 49 | 9, 11 |

The first two are entertainment; the third is the only row with a defensible statistical
rationale (same win probability, lower expected split).

Played through Svenska Spel, a €2 (≈25 kr) line has an expected return of roughly half the
stake; the jackpot odds mean that buying a ticket every draw, you'd expect one jackpot per
~1.34 million years. Please treat it as entertainment priced accordingly.

## 5. Data provenance & caveats

- **875 draws (2012-03-23 → 2025-08-08):** extracted from the npm dataset `tsch-ej-numbers`
  (German official payout-table data); verified draw-by-draw against two independent npm
  datasets — 1,232 overlapping draws, **zero mismatches**; zero calendar gaps, zero
  structural violations.
- **91 draws (2025-08-12 → 2026-05-29 + most of Jun/Jul 2026):** mined from web-search
  snippets by 12 month-scoped agents with per-draw source citations (direct fetching of
  lottery sites is blocked in this environment). A 4-draw independent spot-check matched
  4/4 exactly. A second, fully independent verification session was launched; it had not
  reported by the 2-hour deadline, so these draws carry status `single-pass-miner` in
  `eurojackpot/data/mined_final.json`.
- **9 draws unresolved** (2026-06-09 → 2026-07-10): not found before the search budget
  was exhausted. The analysis window therefore contains 191 of 200 draws.
- **Robustness:** the sensitivity runs in `eurojackpot/analysis/results/` show every
  conclusion (uniformity, no carryover, unremarkable extremes) holds identically on the
  pure triple-verified subset — the mined data changes nothing qualitatively.

*Reproduce:* `pip install numpy scipy && python3 eurojackpot/analysis/analyze.py
eurojackpot/data/eurojackpot_draws_full.csv --window 200`
