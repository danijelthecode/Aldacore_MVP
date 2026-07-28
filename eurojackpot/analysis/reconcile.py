#!/usr/bin/env python3
"""Reconcile mined claims with the independent verification pass.

Policy:
- CONFIRMED (both passes agree exactly)      -> accept, status "double-confirmed"
- newly_found (only verification pass has it) -> accept, status "single-pass-verifier"
- UNVERIFIED claim (only mining pass has it)  -> accept, status "single-pass-miner",
  and list it so the analysis can run a sensitivity check without these draws.
- MISMATCH (passes disagree)                  -> EXCLUDE, report loudly.

Usage: python3 reconcile.py <mined_claims.json> <independent_verification.json> <out_mined_final.json>
"""
import json
import sys


def main():
    claims_p, verif_p, out_p = sys.argv[1:4]
    claims = {c["date"]: c for c in json.load(open(claims_p))["claims"]}
    verif = json.load(open(verif_p))

    verdicts = {r["date"]: r for r in verif.get("results", [])}
    accepted, excluded = [], []

    for date, c in sorted(claims.items()):
        v = verdicts.get(date)
        if v and v.get("verdict") == "CONFIRMED":
            accepted.append({"date": date, "main": sorted(c["main"]), "euro": sorted(c["euro"]),
                             "status": "double-confirmed",
                             "sources": [c.get("source", ""), v.get("source", "")]})
        elif v and v.get("verdict") == "MISMATCH":
            excluded.append({"date": date, "miner": {"main": c["main"], "euro": c["euro"]},
                             "verifier": {"main": v.get("main"), "euro": v.get("euro")},
                             "reason": "passes disagree"})
        else:
            accepted.append({"date": date, "main": sorted(c["main"]), "euro": sorted(c["euro"]),
                             "status": "single-pass-miner", "sources": [c.get("source", "")]})

    for nf in verif.get("newly_found", []):
        accepted.append({"date": nf["date"], "main": sorted(nf["main"]), "euro": sorted(nf["euro"]),
                         "status": "single-pass-verifier", "sources": [nf.get("source", "")]})

    accepted.sort(key=lambda r: r["date"])
    still_missing = sorted(set(verif.get("still_missing", [])))
    single_pass = [r["date"] for r in accepted if r["status"].startswith("single-pass")]

    json.dump({"accepted": accepted, "resolved": [], "excluded_mismatches": excluded,
               "still_missing": still_missing, "single_pass_dates": single_pass},
              open(out_p, "w"), indent=1)

    n_conf = sum(1 for r in accepted if r["status"] == "double-confirmed")
    print(f"accepted={len(accepted)} (double-confirmed={n_conf}, single-pass={len(single_pass)}) "
          f"excluded-mismatches={len(excluded)} still-missing={len(still_missing)}")
    for e in excluded:
        print("MISMATCH EXCLUDED:", e)


if __name__ == "__main__":
    main()
