"""Compute dated aggregate references from two primary research datasets.

No names, actors or historical political events are imported into the game.
--source-dir accepts the inspected mandato-frequency-{ucdp,coups}.csv files.
"""
import argparse
import csv
import hashlib
import io
import json
from pathlib import Path
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]
FIRST, LAST = 2000, 2025  # Completed years only; 2026 coup coding is provisional.
URLS = {
    "ucdp": "https://ucdp.uu.se/downloads/ucdpprio/ucdp-prio-acd-261-csv.zip",
    "coups": "https://jonathanmpowell.com/wp-content/uploads/2026/08/pt_20260829.csv",
}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path)
    args = parser.parse_args()
    sources, datasets = {}, {}
    for key, url in URLS.items():
        if args.source_dir:
            raw = (args.source_dir / f"mandato-frequency-{key}.csv").read_bytes()
        else:
            raw = urllib.request.urlopen(url, timeout=45).read()
            if key == "ucdp":
                archive = zipfile.ZipFile(io.BytesIO(raw))
                raw = archive.read("UcdpPrioConflict_v26_1.csv")
        datasets[key] = list(csv.DictReader(io.StringIO(raw.decode("utf-8-sig"))))
        sources[key] = {"url": url, "accessedOn": "2026-10-06", "csvSha256": hashlib.sha256(raw).hexdigest()}
    ucdp = datasets["ucdp"]
    coups = datasets["coups"]
    assert {"conflict_id", "type_of_conflict", "year", "start_date2", "version"} <= set(ucdp[0])
    assert {"year", "coup", "version"} <= set(coups[0])
    assert max(int(r["year"]) for r in ucdp) == LAST
    sources["ucdp"].update({"version": "26.1", "codebook": "https://ucdp.uu.se/downloads/ucdpprio/ucdp-prio-acd-261.pdf",
        "citation": "Davies, Pettersson & Öberg (2026), Organized violence 1989–2025, and violent political protests; Gleditsch et al. (2002), Armed Conflict 1946–2001: A New Dataset.", "license": "CC BY 4.0 according to the UCDP download center"})
    sources["coups"].update({"version": "2026.08.29", "codebook": "https://jonathanmpowell.com/coups/",
        "citation": "Powell & Thyne (2011), Global Instances of Coups from 1950 to 2010: A New Dataset, Journal of Peace Research 48(2):249–259, doi:10.1177/0022343310397436.", "license": "Only derived annual counts committed; publication terms require separate review."})
    episodes = {(r["conflict_id"], r["start_date2"]) for r in ucdp if r["type_of_conflict"] == "2" and FIRST <= int(r["start_date2"][:4]) <= LAST}
    annual = []
    for year in range(FIRST, LAST + 1):
        annual.append({"year": year,
            "interstateActiveConflicts": sum(r["type_of_conflict"] == "2" and int(r["year"]) == year for r in ucdp),
            "interstateEpisodeStarts": sum(int(date[:4]) == year for _, date in episodes),
            "successfulCoups": sum(int(r["year"]) == year and r["coup"] == "2" for r in coups),
            "failedCoupAttempts": sum(int(r["year"]) == year and r["coup"] == "1" for r in coups)})
    means = {key: sum(r[key] for r in annual) / len(annual) for key in annual[0] if key != "year"}
    output = {"accessedOn": "2026-10-06", "window": {"firstYear": FIRST, "lastYear": LAST, "years": len(annual)}, "sources": sources,
        "definitions": {"interstate": "UCDP type 2, conflict-year with at least 25 battle-related deaths; episode starts use unique conflict_id/start_date2, excluding starts before 2000.",
            "successfulCoup": "Powell/Thyne coup=2: unconstitutional overt removal with control for at least seven days. Failed attempts (1) are counted separately; provisional 2026 excluded."},
        "annual": annual, "annualMeans": means,
        "mappingLimit": "Game conflicts include five abstract forms and casualties are indices, not deaths. Coup transitions do not track seven-day control. These aggregates check orders of magnitude; they do not estimate country-specific risks or prove historical equivalence. Global shocks require a separately defined reference."}
    (ROOT / "docs/independent-world-reference.json").write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(means))


if __name__ == "__main__":
    main()
