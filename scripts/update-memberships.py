"""Refresh official rosters without executing third-party JavaScript.

Run only during development. Runtime reads the committed, dated snapshot.
Every source row must map explicitly; unknown names stop the update.
"""
import datetime
import html
import json
from pathlib import Path
import re
import unicodedata
import urllib.request
import urllib.error

ROOT = Path(__file__).resolve().parents[1]
ACCESSED_ON = "2026-10-06"


def fetch(url):
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        response = urllib.request.urlopen(request, timeout=45)
    except urllib.error.HTTPError as error:
        if error.code != 403:
            raise
        response = urllib.request.urlopen(url, timeout=45)
    data = response.read()
    try:
        return data.decode("utf-8")
    except UnicodeDecodeError:
        return data.decode("cp1252")


def clean(value):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]*>", " ", value))).strip()


def normalize(value):
    return re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFD", value).encode("ascii", "ignore").decode().lower())


world = json.loads((ROOT / "src/data/world-actors.json").read_text(encoding="utf-8"))
by_name = {normalize(actor["name"]): actor["code"] for actor in world["actors"]}
actor_codes = {actor["code"] for actor in world["actors"]}
aliases = {
    "Egypt": "EGY", "Iran, Islamic Republic of": "IRN", "Venezuela, República Bolivariana de": "VEN",
    "Venezuela, Republica Bolivariana de": "VEN", "Turkey": "TUR", "Türkiye": "TUR",
    "Syrian Arab Republic": "SYR", "Afghanistan, Islamic Rep. of": "AFG", "Korea": "KOR",
    "Korea, Republic of": "KOR", "Vietnam": "VNM", "Lao People's Democratic Republic": "LAO",
    "Somalia": "SOM", "Somalia, Federal Republic of": "SOM", "Tanzania": "TZA",
    "Côte d'Ivoire": "CIV", "Congo, Republic of": "COG", "Congo, Democratic Republic of the": "COD",
    "Congo, Democratic Republic of": "COD", "Swaziland": "SWZ", "Cape Verde": "CPV",
    "Yemen, Republic of": "YEM", "Macedonia, former Yugoslav Republic of": "MKD", "Czech Republic": "CZE",
    "Micronesia, Federated States of": "FSM", "Nauru": "NRU", "Naoero": "NRU",
    "Andorra, Principality of": "AND", "Liechtenstein, Principality of": "LIE", "Egypt, Arab Republic of": "EGY",
    "Bahamas": "BHS", "Gambia": "GMB", "Viet Nam": "VNM",
}
by_name.update({normalize(name): code for name, code in aliases.items()})


def map_name(name):
    plain = re.sub(r"\s*\([^)]*\)", "", name).strip()
    code = by_name.get(normalize(plain))
    if not code:
        raise ValueError(f"Unmapped official member: {name}")
    return code


def snapshot(roster, expected, url, **extra):
    roster.sort(key=lambda row: row["code"])
    if len(roster) != expected or len({row["code"] for row in roster}) != expected:
        raise ValueError(f"Invalid roster: {len(roster)} rows; expected {expected} unique members")
    return {"sourceUrl": url, "accessedOn": ACCESSED_ON, "officialMemberCount": expected,
            "representedActorCount": sum(row["code"] in actor_codes for row in roster),
            "unrepresentedMembers": [row for row in roster if row["code"] not in actor_codes],
            "members": roster, **extra}


wto_url = "https://www.wto.org/english/thewto_e/whatis_e/tif_e/org6_e.htm"
wto_data_url = "https://www.wto.org/library/news/news_vars_e.js"
wto_data = fetch(wto_data_url)
wto = []
for block in re.findall(r"country\[country.length\]\s*=\s*\{([\s\S]*?)\};", wto_data):
    fields = dict(re.findall(r'\b(code|name|status|joindate):\s*"([^"]*)"', block))
    if fields.get("status") == "MBR":
        code = {"ROM": "ROU", "EEC": "EU", "CHT": "TWN"}.get(fields["code"], fields["code"])
        if code not in actor_codes and code not in {"EU", "TWN"}:
            raise ValueError(f"Unmapped WTO code: {code}")
        wto.append({"code": code, "name": fields["name"], "joinedOn": fields["joindate"][:10].replace(".", "-")})
wto_count = int(re.search(r"var numMembers\s*=\s*(\d+)", fetch("https://www.wto.org/library/countrylib.js")).group(1))

imf_url = "https://www.imf.org/external/np/sec/memdir/memdate.htm"
imf_html = fetch(imf_url)
imf = []
for row in re.split(r"</tr>", imf_html, flags=re.I):
    cells = re.findall(r"<td[^>]*>([\s\S]*?)</td>", row, re.I)
    if len(cells) != 2:
        continue
    name, date = map(clean, cells)
    if not re.search(r"\d{4}", date) or date.startswith("("):
        continue  # Parenthesized rows describe former memberships, not current members.
    name = re.sub(r"\s+[\d,]+$", "", name)
    date = re.search(r"[A-Za-z]+\s+\d{1,2},\s*\d{4}", date).group(0)
    imf.append({"code": map_name(name), "name": name, "joinedOn": datetime.datetime.strptime(date, "%B %d, %Y").date().isoformat()})
imf_count = int(re.search(r"(\d+)\s+Member Countries", clean(imf_html)).group(1))

bank_url = "https://www.worldbank.org/en/about/leadership/members"
bank_html = fetch(bank_url + "?view=all")
bank_table = next(table for table in re.findall(r"<table[^>]*>([\s\S]*?)</table>", bank_html, re.I) if "Afghanistan" in table)
bank = []
for cell in re.findall(r"<td[^>]*>([\s\S]*?)</td>", bank_table, re.I):
    name_match = re.search(r"<b>([\s\S]*?)</b>", cell, re.I)
    if not name_match or not re.search(r"\d{4}", clean(cell)):
        continue
    name = clean(name_match.group(1))
    date = re.search(r"[A-Za-z]+\s+\d{1,2},\s*\d{4}", clean(cell)[len(name):]).group(0)
    bank.append({"code": map_name(name), "name": name, "joinedOn": datetime.datetime.strptime(date, "%b %d, %Y").date().isoformat()})
bank_count = int(re.search(r"(\d+)\s+countries", clean(bank_html)).group(1))

rosters = {"wto": snapshot(wto, wto_count, wto_url, dataUrl=wto_data_url),
           "imf": snapshot(imf, imf_count, imf_url),
           "world-bank": snapshot(bank, bank_count, bank_url, institution="IBRD")}
organizations_path = ROOT / "src/data/world-organizations.json"
organizations = json.loads(organizations_path.read_text(encoding="utf-8"))
for organization in organizations["organizations"]:
    if organization["id"] in rosters:
        roster = rosters[organization["id"]]
        organization["memberCodes"] = [member["code"] for member in roster["members"] if member["code"] in actor_codes]
        if organization["id"] == "wto":
            organization["description"] = "Membresía oficial fechada: 166 miembros, 164 con actor. UE y el territorio aduanero de Chinese Taipei no tienen actor independiente en este catálogo; no se inventan votos para ellos. Disputas y compromisos simplificados de juego."
organizations["snapshotDate"] = ACCESSED_ON
memberships_path = ROOT / "src/data/world-memberships.json"
snapshot_data = json.loads(memberships_path.read_text(encoding="utf-8"))
snapshot_data["rosters"].update(rosters)  # Preserve the independently curated regional rosters.
snapshot_data["snapshotDate"] = ACCESSED_ON
memberships_path.write_text(json.dumps(snapshot_data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
organizations_path.write_text(json.dumps(organizations, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
for key, value in rosters.items():
    print(f"{key}: {value['officialMemberCount']} official members; {value['representedActorCount']} actors")
