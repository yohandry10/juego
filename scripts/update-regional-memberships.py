"""Update six official rosters; unknown names/counts abort before either file is written.

Runtime never fetches these pages. --source-dir accepts an inspected HTML cache
named mandato-roster-{un,eu,nato,au}.html. ASEAN and MERCOSUR are explicitly
transcribed from the cited official lists, with their scope recorded below.
"""
import argparse
import hashlib
import html
import json
from pathlib import Path
import re
import unicodedata
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
ACCESSED_ON = "2026-10-06"
SOURCES = {
    "un": ("https://www.un.org/en/about-us/member-states", 193),
    "eu": ("https://european-union.europa.eu/principles-countries-history/eu-countries_en", 27),
    "nato": ("https://www.nato.int/en/about-us/organization/nato-member-countries", 32),
    "au": ("https://au.int/en/AU_Member_States", 55),
}


def clean(value):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]*>", " ", value))).strip()


def normalize(value):
    return re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFD", value).encode("ascii", "ignore").decode().lower())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path)
    args = parser.parse_args()
    actors = json.loads((ROOT / "src/data/world-actors.json").read_text(encoding="utf-8"))["actors"]
    by_name = {normalize(a["name"]): a["code"] for a in actors}
    aliases = {
        "Congo": "COG", "Democratic Republic of the Congo": "COD", "Egypt": "EGY",
        "Iran (Islamic Republic of)": "IRN", "Venezuela (Bolivarian Republic of)": "VEN",
        "United Kingdom of Great Britain and Northern Ireland": "GBR", "United States of America": "USA",
        "Republic of Korea": "KOR", "Democratic People's Republic of Korea": "PRK",
        "Lao People's Democratic Republic": "LAO", "United Republic of Tanzania": "TZA",
        "Somalia": "SOM", "Türkiye": "TUR", "Côte d’Ivoire": "CIV", "Côte d'Ivoire": "CIV",
        "Viet Nam": "VNM", "VietNam": "VNM", "Czechia": "CZE", "North Macedonia": "MKD",
        "Cabo Verde": "CPV", "Swaziland": "SWZ", "The Netherlands": "NLD", "The Gambia": "GMB",
        "Sahrawi Republic": "SADR", "Guinea Bissau": "GNB", "Central African Republic": "CAF",
        "Brunei Darussalam": "BRN", "Lao PDR": "LAO", "Timor-Leste": "TLS",
        "Argentina": "ARG", "Bolivia": "BOL", "Brazil": "BRA", "Paraguay": "PRY", "Uruguay": "URY", "Venezuela": "VEN",
        "Bolivia (Plurinational State of)": "BOL", "China (the People's Republic of)": "CHN",
        "Gambia (Republic of The)": "GMB", "Kyrgyzstan": "KGZ", "Lao People’s Democratic Republic": "LAO",
        "Micronesia (Federated States of)": "FSM", "Netherlands (Kingdom of the)": "NLD", "Republic of Moldova": "MDA",
        "Saint Kitts and Nevis": "KNA", "Saint Lucia": "LCA", "Saint Vincent and the Grenadines": "VCT",
        "Slovakia": "SVK", "Venezuela, Bolivarian Republic of": "VEN", "Yemen": "YEM", "Gambia": "GMB",
        "DR Congo": "COD", "UR of Tanzania": "TZA",
    }
    by_name.update({normalize(k): v for k, v in aliases.items()})
    actor_codes = {a["code"] for a in actors}

    def rows(names):
        result = []
        for name in names:
            key = normalize(name)
            if key not in by_name:
                raise ValueError(f"Unmapped official name: {name}")
            result.append({"code": by_name[key], "name": name})
        return sorted(result, key=lambda row: row["code"])

    rosters = {}
    for key, (url, expected) in SOURCES.items():
        if args.source_dir:
            raw = (args.source_dir / f"mandato-roster-{key}.html").read_bytes()
        else:
            request = urllib.request.Request(url + ("?view=all" if key == "un" else ""), headers={"User-Agent": "Mozilla/5.0"})
            raw = urllib.request.urlopen(request, timeout=45).read()
        source = raw.decode("utf-8")
        if key == "un":
            names = [clean(s) for s in re.findall(r'<h2 class="mb-0">([\s\S]*?)</h2>', source)]
            names += [clean(s) for s in re.findall(r'<h2><a href="https://www.un.org/en/about-us/member-states/[^\"]+">([\s\S]*?)</a></h2>', source)]
        elif key == "eu":
            if args.source_dir:
                next_page = (args.source_dir / "mandato-roster-eu-page1.html").read_bytes()
            else:
                next_page = urllib.request.urlopen(urllib.request.Request(url + "?page=1", headers={"User-Agent": "Mozilla/5.0"}), timeout=45).read()
            source += next_page.decode("utf-8")
            raw += next_page
            names = [clean(s) for s in re.findall(r'<a[^>]*href="/principles-countries-history/eu-countries/[^"/]+_en"[^>]*>([\s\S]*?)</a>', source)]
        elif key == "nato":
            names = [clean(s) for s in re.findall(r'<p class="cie-country__name"[^>]*>([\s\S]*?)</p>', source)]
        else:
            table = next(s for s in re.findall(r'<table[^>]*>([\s\S]*?)</table>', source) if "Sahrawi" in s)
            names = [re.sub(r'\d+$', '', clean(re.sub(r'<sup[^>]*>[\s\S]*?</sup>', '', s))) for s in re.findall(r'<tr[^>]*>\s*<td[^>]*>([\s\S]*?)</td>', table)]
        rosters[key] = {"sourceUrl": url, "accessedOn": ACCESSED_ON, "officialMemberCount": expected,
                        "members": rows(names), "sourceSha256": hashlib.sha256(raw).hexdigest(), "method": "official-html-list"}
    rosters["asean"] = {"sourceUrl": "https://asean.org/about-asean/", "accessedOn": ACCESSED_ON, "officialMemberCount": 11,
        "method": "reviewed-transcription", "members": rows(["Brunei Darussalam", "Cambodia", "Indonesia", "Lao PDR", "Malaysia", "Myanmar", "Philippines", "Singapore", "Thailand", "Timor-Leste", "Viet Nam"]),
        "additionalSources": ["https://asean.org/forging-a-new-era-timor-leste-admitted-into-asean/"],
        "scopeNote": "Incluye Timor-Leste desde octubre de 2025. La representación de Myanmar y los procedimientos de consenso no se reproducen jurídicamente."}
    rosters["mercosur"] = {"sourceUrl": "https://www.mercosur.int/acerca-del-mercosur/paises", "accessedOn": ACCESSED_ON, "officialMemberCount": 6,
        "method": "reviewed-transcription", "members": rows(["Argentina", "Bolivia", "Brazil", "Paraguay", "Uruguay", "Venezuela"]),
        "additionalSources": ["https://www.mercosur.int/pt-br/a-bolivia-depositou-o-instrumento-de-ratificacao-do-protocolo-de-adesao-ao-mercosul"],
        "scopeNote": "Estados Partes; excluye asociados. Venezuela sigue siendo Estado Parte con participación suspendida. La nota portuguesa antigua sobre adhesión boliviana no se usa para excluir a Bolivia."}
    rosters["au"]["scopeNote"] = "Solo se usa la tabla de nombres, sin fechas ni notas históricas de suspensión. SADR es un identificador del organismo, sin actor: no se crean votos ni reconocimiento territorial. Las suspensiones actuales de participación requieren una curación separada; el motor aplica condiciones ficticias comunes."
    memberships_path = ROOT / "src/data/world-memberships.json"
    snapshot = json.loads(memberships_path.read_text(encoding="utf-8"))
    organizations_path = ROOT / "src/data/world-organizations.json"
    organizations = json.loads(organizations_path.read_text(encoding="utf-8"))
    for key, roster in rosters.items():
        members = roster["members"]
        if len(members) != roster["officialMemberCount"] or len({m["code"] for m in members}) != len(members):
            raise ValueError(f"Unexpected roster count or duplicate: {key}: {len(members)}")
        roster["representedActorCount"] = sum(m["code"] in actor_codes for m in members)
        roster["unrepresentedMembers"] = [m for m in members if m["code"] not in actor_codes]
        org = next(o for o in organizations["organizations"] if o["id"] == key)
        org["memberCodes"] = [m["code"] for m in members if m["code"] in actor_codes]
        org["rosterSource"] = {"url": roster["sourceUrl"], "accessedOn": ACCESSED_ON, "officialMemberCount": roster["officialMemberCount"], "scopeNote": roster.get("scopeNote", "Membresía oficial; las consultas y beneficios del motor son ficticios.")}
        if key == "mercosur":
            org["participationRestrictions"] = [{"code": "VEN", "sourceUrl": roster["sourceUrl"], "accessedOn": ACCESSED_ON,
                "reason": "La fuente oficial mantiene suspendidos sus derechos y obligaciones como Estado Parte. El snapshot conserva esa restricción; los índices de juego no la levantan."}]
        org["description"] = f"{roster['officialMemberCount']} miembros oficiales; {roster['representedActorCount']} con actor. " + org["rosterSource"]["scopeNote"]
        print(f"{key}: {roster['officialMemberCount']} official; {roster['representedActorCount']} represented")
    snapshot["rosters"].update(rosters)
    snapshot["snapshotDate"] = ACCESSED_ON
    organizations["snapshotDate"] = ACCESSED_ON
    memberships_path.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    organizations_path.write_text(json.dumps(organizations, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
