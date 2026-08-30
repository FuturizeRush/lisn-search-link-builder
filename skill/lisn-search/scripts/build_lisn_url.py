#!/usr/bin/env python3
"""Build validated LinkedIn Sales Navigator people or account search URLs.

Usage:
    python3 scripts/build_lisn_url.py spec.json
    python3 scripts/build_lisn_url.py -
    python3 scripts/build_lisn_url.py --json spec.json
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any
from urllib.parse import quote, unquote


class SpecError(ValueError):
    """Raised when a canonical LISN spec is invalid."""


def _terminal_safe(text: str) -> str:
    """Escape control characters before writing user-derived errors to a terminal."""
    escaped: list[str] = []
    for character in text:
        if character.isprintable():
            escaped.append(character)
        else:
            codepoint = ord(character)
            width = 4 if codepoint <= 0xFFFF else 8
            marker = "u" if width == 4 else "U"
            escaped.append(f"\\{marker}{codepoint:0{width}x}")
    return "".join(escaped)


HEADCOUNTS = {
    "Self-employed": "A",
    "1-10": "B",
    "11-50": "C",
    "51-200": "D",
    "201-500": "E",
    "501-1000": "F",
    "1001-5000": "G",
    "5001-10000": "H",
    "10001+": "I",
}

COMPANY_TYPES = {
    "Public Company": "C",
    "Privately Held": "P",
    "Non Profit": "N",
    "Educational Institution": "D",
    "Partnership": "S",
    "Self Employed": "E",
    "Self Owned": "O",
    "Government Agency": "G",
}

FUNCTIONS = {
    name: str(index)
    for index, name in enumerate(
        [
            "Accounting",
            "Administrative",
            "Arts and Design",
            "Business Development",
            "Community and Social Services",
            "Consulting",
            "Education",
            "Engineering",
            "Entrepreneurship",
            "Finance",
            "Healthcare Services",
            "Human Resources",
            "Information Technology",
            "Legal",
            "Marketing",
            "Media and Communication",
            "Military and Protective Services",
            "Operations",
            "Product Management",
            "Program and Project Management",
            "Purchasing",
            "Quality Assurance",
            "Real Estate",
            "Research",
            "Sales",
            "Customer Success and Support",
        ],
        1,
    )
}

SENIORITY = {
    "Owner / Partner": "320",
    "CXO": "310",
    "Vice President": "300",
    "Director": "220",
    "Experienced Manager": "210",
    "Entry Level Manager": "200",
    "Strategic": "130",
    "Senior": "120",
    "Entry Level": "110",
    "In Training": "100",
}

YEARS = {
    "Less than 1 year": "1",
    "1 to 2 years": "2",
    "3 to 5 years": "3",
    "6 to 10 years": "4",
    "More than 10 years": "5",
}

PROFILE_LANGUAGES = {
    "Arabic": "ar",
    "Bahasa Indonesia": "in",
    "Chinese": "zh",
    "Czech": "cs",
    "Danish": "da",
    "Dutch": "nl",
    "English": "en",
    "French": "fr",
    "German": "de",
    "Italian": "it",
    "Japanese": "ja",
    "Korean": "ko",
    "Malay": "ms",
    "Norwegian": "no",
    "Polish": "pl",
    "Portuguese": "pt",
    "Romanian": "ro",
    "Russian": "ru",
    "Spanish": "es",
    "Swedish": "sv",
    "Tagalog": "tl",
    "Turkish": "tr",
}

RELATIONSHIPS = {
    "1st degree connections": "F",
    "2nd degree connections": "S",
    "3rd+ degree connections": "O",
    "Group members": "A",
    "TeamLink connections": "T",
    "Executive TeamLink connections": "ET",
}

TOGGLES = {
    "postedOnLinkedin": ("POSTED_ON_LINKEDIN", "RPOL"),
    "followsYourCompany": ("FOLLOWS_YOUR_COMPANY", "CF"),
    "viewedYourProfile": ("VIEWED_YOUR_PROFILE", "VYP"),
    "pastColleague": ("PAST_COLLEAGUE", "PCOLL"),
    "sharedExperiences": ("WITH_SHARED_EXPERIENCES", "COMM"),
    "changedJobs": ("RECENTLY_CHANGED_JOBS", "RPC"),
}

FOLLOWERS = {
    "1-50": "NFR1",
    "51-100": "NFR2",
    "101-1000": "NFR3",
    "1001-5000": "NFR4",
    "5001+": "NFR5",
}

FORTUNE = {
    "Fortune 50": "1",
    "Fortune 51-100": "2",
    "Fortune 101-250": "3",
    "Fortune 251-500": "4",
}

ACCOUNT_ACTIVITIES = {
    "Senior leadership changes in last 3 months": "SLC",
    "Funding events in past 12 months": "RFE",
}

REVENUE_MIN = {0, 0.5, 1, 2.5, 5, 10, 20, 50, 100, 500, 1000}
REVENUE_MAX = {2.5, 5, 10, 20, 50, 100, 500, 1000, 1001}

PEOPLE_FIELDS = {
    "title",
    "pastTitle",
    "keywords",
    "companyHeadcounts",
    "companyTypes",
    "functions",
    "seniorityLevels",
    "yearsAtCurrentCompany",
    "yearsInCurrentPosition",
    "yearsOfExperience",
    "industries",
    "regions",
    "companyHeadquarters",
    "currentCompanies",
    "pastCompanies",
    "profileLanguages",
    "connectionOf",
    "connectionDegrees",
    *TOGGLES.keys(),
}

ACCOUNT_FIELDS = {
    "companyHeadcounts",
    "headquarters",
    "industries",
    "followers",
    "fortune",
    "accountActivities",
    "hiringOnLinkedin",
    "annualRevenue",
    "keywords",
}


def _value_text(value: Any, path: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise SpecError(f"{path} must be a non-empty string")
    return value.strip()


def _inner_escape(value: str) -> str:
    """URL-encode one value before the full query receives its second pass."""
    return quote(value, safe="-._~")


def _without_quoted_text(value: str) -> str:
    return re.sub(r'"[^"\\]*(?:\\.[^"\\]*)*"', '""', value)


def _validate_boolean_text(value: Any, path: str) -> str:
    text = _value_text(value, path)
    if len(text) > 2000:
        raise SpecError(f"{path} exceeds the 2000-character compatibility limit")
    if any(char in text for char in "“”‘’"):
        raise SpecError(f"{path} contains curly quotes; use straight double quotes")
    if "*" in text or "?" in text:
        raise SpecError(f"{path} contains an unsupported wildcard")

    depth = 0
    in_quote = False
    escaped = False
    for index, char in enumerate(text):
        if escaped:
            escaped = False
            continue
        if char == "\\" and in_quote:
            escaped = True
            continue
        if char == '"':
            in_quote = not in_quote
            continue
        if in_quote:
            continue
        if char == "(":
            depth += 1
        elif char == ")":
            depth -= 1
            if depth < 0:
                raise SpecError(f"{path} has an unmatched ')' at position {index}")
    if in_quote:
        raise SpecError(f"{path} has an unmatched double quote")
    if depth:
        raise SpecError(f"{path} has {depth} unmatched '('")

    stripped = _without_quoted_text(text)
    uppercase_syntax = bool(re.search(r"\b(?:AND|OR|NOT)\b", stripped))
    lowercase_operators = re.findall(r"\b(and|or|not)\b", stripped)
    if any(operator in {"or", "not"} for operator in lowercase_operators) or (
        uppercase_syntax and lowercase_operators
    ):
        raise SpecError(f"{path} uses a lowercase Boolean operator")
    operators = re.findall(r"\b(?:AND|OR|NOT)\b", stripped)
    if len(operators) > 15:
        raise SpecError(f"{path} uses {len(operators)} Boolean operators; compatibility limit is 15")
    if re.search(r"\(\s*\)", stripped):
        raise SpecError(f"{path} contains an empty Boolean group")
    if re.search(r"(?:^|\()\s*(?:AND|OR)\b", stripped):
        raise SpecError(f"{path} starts a group with an invalid Boolean operator")
    if re.search(r"\b(?:AND|OR|NOT)\s*(?:$|\))", stripped):
        raise SpecError(f"{path} ends a group with a Boolean operator")
    if re.search(r"\b(?:AND|OR|NOT)\s+(?:AND|OR)\b", stripped):
        raise SpecError(f"{path} contains adjacent incompatible Boolean operators")
    if re.search(r"\bNOT\s+NOT\b", stripped):
        raise SpecError(f"{path} contains adjacent NOT operators")
    return text


def _exact_keys(obj: dict[str, Any], allowed: set[str], path: str) -> None:
    unknown = sorted(set(obj) - allowed)
    if unknown:
        raise SpecError(f"{path} contains unknown field(s): {', '.join(unknown)}")


def _string_list(value: Any, path: str, allowed: dict[str, str] | None = None) -> list[str]:
    if not isinstance(value, list) or not value:
        raise SpecError(f"{path} must be a non-empty array")
    result: list[str] = []
    seen: set[str] = set()
    for index, item in enumerate(value):
        text = _value_text(item, f"{path}[{index}]")
        if allowed is not None and text not in allowed:
            raise SpecError(f"{path}[{index}] has unsupported value '{text}'")
        if text in seen:
            raise SpecError(f"{path} contains duplicate value '{text}'")
        seen.add(text)
        result.append(text)
    return result


def _include_exclude(
    value: Any,
    path: str,
    allowed: dict[str, str] | None = None,
    boolean_text: bool = False,
) -> tuple[list[str], list[str]]:
    if not isinstance(value, dict):
        raise SpecError(f"{path} must be an object with include/exclude arrays")
    _exact_keys(value, {"include", "exclude"}, path)
    include = _string_list(value["include"], f"{path}.include", allowed) if "include" in value else []
    exclude = _string_list(value["exclude"], f"{path}.exclude", allowed) if "exclude" in value else []
    if not include and not exclude:
        raise SpecError(f"{path} needs at least one include or exclude value")
    overlap = sorted(set(include) & set(exclude))
    if overlap:
        raise SpecError(f"{path} includes and excludes the same value(s): {', '.join(overlap)}")
    if boolean_text:
        include = [_validate_boolean_text(item, f"{path}.include") for item in include]
        exclude = [_validate_boolean_text(item, f"{path}.exclude") for item in exclude]
    return include, exclude


def _entity_list(value: Any, path: str, id_key: str) -> list[dict[str, str]]:
    if not isinstance(value, list) or not value:
        raise SpecError(f"{path} must be a non-empty array")
    result: list[dict[str, str]] = []
    seen: set[tuple[str, str]] = set()
    for index, item in enumerate(value):
        item_path = f"{path}[{index}]"
        if not isinstance(item, dict):
            raise SpecError(f"{item_path} must be an object")
        _exact_keys(item, {id_key, "name"}, item_path)
        entity_id = _value_text(item.get(id_key), f"{item_path}.{id_key}")
        name = _value_text(item.get("name"), f"{item_path}.name")
        key = (entity_id, name)
        if key in seen:
            raise SpecError(f"{path} contains duplicate entity '{name}'")
        seen.add(key)
        result.append({id_key: entity_id, "name": name})
    return result


def _entity_include_exclude(value: Any, path: str, id_key: str) -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    if not isinstance(value, dict):
        raise SpecError(f"{path} must be an object with include/exclude arrays")
    _exact_keys(value, {"include", "exclude"}, path)
    include = _entity_list(value["include"], f"{path}.include", id_key) if "include" in value else []
    exclude = _entity_list(value["exclude"], f"{path}.exclude", id_key) if "exclude" in value else []
    if not include and not exclude:
        raise SpecError(f"{path} needs at least one include or exclude entity")
    include_ids = {item[id_key] for item in include}
    overlap = sorted(include_ids & {item[id_key] for item in exclude})
    if overlap:
        raise SpecError(f"{path} includes and excludes the same id(s): {', '.join(overlap)}")
    return include, exclude


def _text_tuple(text: str, selection: str) -> str:
    return f"(text:{_inner_escape(text)},selectionType:{selection})"


def _id_tuple(entity_id: str, text: str, selection: str) -> str:
    return f"(id:{_inner_escape(entity_id)},text:{_inner_escape(text)},selectionType:{selection})"


def _id_only_tuple(entity_id: str) -> str:
    return f"(id:{_inner_escape(entity_id)},selectionType:INCLUDED)"


def _filter(filter_type: str, tuples: list[str]) -> str:
    return f"(type:{filter_type},values:List({','.join(tuples)}))"


def _text_filter(value: Any, path: str, filter_type: str) -> str:
    include, exclude = _include_exclude(value, path, boolean_text=True)
    tuples = [_text_tuple(item, "INCLUDED") for item in include]
    tuples.extend(_text_tuple(item, "EXCLUDED") for item in exclude)
    return _filter(filter_type, tuples)


def _enum_filter(value: Any, path: str, filter_type: str, mapping: dict[str, str]) -> str:
    include, exclude = _include_exclude(value, path, mapping)
    tuples = [_id_tuple(mapping[item], item, "INCLUDED") for item in include]
    tuples.extend(_id_tuple(mapping[item], item, "EXCLUDED") for item in exclude)
    return _filter(filter_type, tuples)


def _account_enum_filter(value: Any, path: str, filter_type: str, mapping: dict[str, str]) -> str:
    items = _string_list(value, path, mapping)
    return _filter(filter_type, [_id_tuple(mapping[item], item, "INCLUDED") for item in items])


def _entity_filter(value: Any, path: str, filter_type: str, id_key: str) -> str:
    include, exclude = _entity_include_exclude(value, path, id_key)
    for item in include + exclude:
        if not re.fullmatch(r"\d+", item[id_key]):
            raise SpecError(f"{path} ids must contain digits only")
    tuples = [_id_tuple(item[id_key], item["name"], "INCLUDED") for item in include]
    tuples.extend(_id_tuple(item[id_key], item["name"], "EXCLUDED") for item in exclude)
    return _filter(filter_type, tuples)


def _account_entity_filter(value: Any, path: str, filter_type: str, id_key: str) -> str:
    items = _entity_list(value, path, id_key)
    for item in items:
        if not re.fullmatch(r"\d+", item[id_key]):
            raise SpecError(f"{path} ids must contain digits only")
    return _filter(filter_type, [_id_tuple(item[id_key], item["name"], "INCLUDED") for item in items])


def _normalize_company_id(value: str, path: str) -> str:
    if re.fullmatch(r"\d+", value):
        return f"urn:li:organization:{value}"
    if re.fullmatch(r"urn:li:organization:\d+", value):
        return value
    raise SpecError(f"{path} must be a numeric organization id or urn:li:organization:<id>")


def _company_filter(value: Any, path: str, filter_type: str) -> str:
    include, exclude = _entity_include_exclude(value, path, "id")
    normalized: dict[str, list[tuple[str, str]]] = {"INCLUDED": [], "EXCLUDED": []}
    normalized_ids: dict[str, set[str]] = {"INCLUDED": set(), "EXCLUDED": set()}
    for selection, items in (("INCLUDED", include), ("EXCLUDED", exclude)):
        for index, item in enumerate(items):
            company_id = _normalize_company_id(item["id"], f"{path}.{selection.lower()}[{index}].id")
            if company_id in normalized_ids[selection]:
                raise SpecError(f"{path} contains duplicate company id '{company_id}'")
            normalized_ids[selection].add(company_id)
            normalized[selection].append((company_id, item["name"]))
    overlap = sorted(normalized_ids["INCLUDED"] & normalized_ids["EXCLUDED"])
    if overlap:
        raise SpecError(f"{path} includes and excludes the same company id(s): {', '.join(overlap)}")
    tuples: list[str] = []
    for selection in ("INCLUDED", "EXCLUDED"):
        tuples.extend(_id_tuple(company_id, name, selection) for company_id, name in normalized[selection])
    return _filter(filter_type, tuples)


def _people_filters(filters: dict[str, Any]) -> tuple[list[str], str | None, list[str]]:
    _exact_keys(filters, PEOPLE_FIELDS, "filters")
    built: list[str] = []
    warnings: list[str] = []

    if "title" in filters:
        built.append(_text_filter(filters["title"], "filters.title", "CURRENT_TITLE"))
    if "pastTitle" in filters:
        built.append(_text_filter(filters["pastTitle"], "filters.pastTitle", "PAST_TITLE"))

    keywords = None
    if "keywords" in filters:
        keywords = _validate_boolean_text(filters["keywords"], "filters.keywords")
        warnings.append("keywords can match unrelated current, past, education, or profile context")

    enum_specs = [
        ("companyHeadcounts", "COMPANY_HEADCOUNT", HEADCOUNTS),
        ("companyTypes", "COMPANY_TYPE", COMPANY_TYPES),
    ]
    for field, filter_type, mapping in enum_specs:
        if field in filters:
            built.append(_enum_filter(filters[field], f"filters.{field}", filter_type, mapping))

    if "industries" in filters:
        built.append(_entity_filter(filters["industries"], "filters.industries", "INDUSTRY", "id"))
    if "regions" in filters:
        built.append(_entity_filter(filters["regions"], "filters.regions", "REGION", "geo_id"))
    if "companyHeadquarters" in filters:
        built.append(_entity_filter(filters["companyHeadquarters"], "filters.companyHeadquarters", "COMPANY_HEADQUARTERS", "geo_id"))

    if "seniorityLevels" in filters:
        built.append(_enum_filter(filters["seniorityLevels"], "filters.seniorityLevels", "SENIORITY_LEVEL", SENIORITY))
    if "functions" in filters:
        built.append(_enum_filter(filters["functions"], "filters.functions", "FUNCTION", FUNCTIONS))

    years_specs = [
        ("yearsAtCurrentCompany", "YEARS_AT_CURRENT_COMPANY"),
        ("yearsInCurrentPosition", "YEARS_IN_CURRENT_POSITION"),
        ("yearsOfExperience", "YEARS_OF_EXPERIENCE"),
    ]
    for field, filter_type in years_specs:
        if field in filters:
            built.append(_enum_filter(filters[field], f"filters.{field}", filter_type, YEARS))

    if "currentCompanies" in filters:
        built.append(_company_filter(filters["currentCompanies"], "filters.currentCompanies", "CURRENT_COMPANY"))
    if "pastCompanies" in filters:
        built.append(_company_filter(filters["pastCompanies"], "filters.pastCompanies", "PAST_COMPANY"))

    if "profileLanguages" in filters:
        languages = _string_list(filters["profileLanguages"], "filters.profileLanguages", PROFILE_LANGUAGES)
        built.append(_filter("PROFILE_LANGUAGE", [_id_tuple(PROFILE_LANGUAGES[item], item, "INCLUDED") for item in languages]))

    if "connectionOf" in filters:
        item = filters["connectionOf"]
        if not isinstance(item, dict):
            raise SpecError("filters.connectionOf must be an object")
        _exact_keys(item, {"id", "name"}, "filters.connectionOf")
        member_id = _value_text(item.get("id"), "filters.connectionOf.id")
        name = _value_text(item.get("name"), "filters.connectionOf.name")
        if not re.fullmatch(r"AC[wo]AA[A-Za-z0-9_-]+", member_id):
            raise SpecError("filters.connectionOf.id must begin ACwAA or ACoAA")
        built.append(_filter("CONNECTION_OF", [_id_tuple(member_id, name, "INCLUDED")]))
        warnings.append("connectionOf searches are capped by LinkedIn at 1,000 results")

    if "connectionDegrees" in filters:
        values = _string_list(filters["connectionDegrees"], "filters.connectionDegrees", RELATIONSHIPS)
        built.append(_filter("RELATIONSHIP", [_id_tuple(RELATIONSHIPS[item], item, "INCLUDED") for item in values]))

    for field, (filter_type, toggle_id) in TOGGLES.items():
        if field not in filters:
            continue
        enabled = filters[field]
        if not isinstance(enabled, bool):
            raise SpecError(f"filters.{field} must be a boolean")
        if enabled:
            built.append(_filter(filter_type, [_id_only_tuple(toggle_id)]))

    return built, keywords, warnings


def _number(value: Any, path: str) -> float | int:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise SpecError(f"{path} must be a number")
    return value


def _format_number(value: float | int) -> str:
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value)


def _account_filters(filters: dict[str, Any]) -> tuple[list[str], str | None, list[str]]:
    _exact_keys(filters, ACCOUNT_FIELDS, "filters")
    built: list[str] = []
    warnings: list[str] = []

    keywords = None
    if "keywords" in filters:
        keywords = _validate_boolean_text(filters["keywords"], "filters.keywords")
        warnings.append("keywords can match unrelated company-page text")

    if "companyHeadcounts" in filters:
        built.append(_account_enum_filter(filters["companyHeadcounts"], "filters.companyHeadcounts", "COMPANY_HEADCOUNT", HEADCOUNTS))
    if "headquarters" in filters:
        built.append(_account_entity_filter(filters["headquarters"], "filters.headquarters", "REGION", "geo_id"))
    if "industries" in filters:
        built.append(_account_entity_filter(filters["industries"], "filters.industries", "INDUSTRY", "id"))
    if "followers" in filters:
        built.append(_account_enum_filter(filters["followers"], "filters.followers", "NUM_OF_FOLLOWERS", FOLLOWERS))
    if "fortune" in filters:
        built.append(_account_enum_filter(filters["fortune"], "filters.fortune", "FORTUNE", FORTUNE))
    if "accountActivities" in filters:
        built.append(_account_enum_filter(filters["accountActivities"], "filters.accountActivities", "ACCOUNT_ACTIVITIES", ACCOUNT_ACTIVITIES))

    if "hiringOnLinkedin" in filters:
        enabled = filters["hiringOnLinkedin"]
        if not isinstance(enabled, bool):
            raise SpecError("filters.hiringOnLinkedin must be a boolean")
        if enabled:
            built.append(_filter("JOB_OPPORTUNITIES", [_id_tuple("JO1", "Hiring on Linkedin", "INCLUDED")]))

    if "annualRevenue" in filters:
        revenue = filters["annualRevenue"]
        if not isinstance(revenue, dict):
            raise SpecError("filters.annualRevenue must be an object")
        _exact_keys(revenue, {"min", "max"}, "filters.annualRevenue")
        if set(revenue) != {"min", "max"}:
            raise SpecError("filters.annualRevenue requires both min and max")
        minimum = _number(revenue["min"], "filters.annualRevenue.min")
        maximum = _number(revenue["max"], "filters.annualRevenue.max")
        if minimum not in REVENUE_MIN:
            raise SpecError("filters.annualRevenue.min is not an allowed USD-million boundary")
        if maximum not in REVENUE_MAX:
            raise SpecError("filters.annualRevenue.max is not an allowed USD-million boundary")
        if minimum >= maximum:
            raise SpecError("filters.annualRevenue.min must be lower than max")
        built.append(
            "(type:ANNUAL_REVENUE,rangeValue:"
            f"(min:{_format_number(minimum)},max:{_format_number(maximum)}),selectedSubFilter:USD)"
        )

    return built, keywords, warnings


def build_lisn_url(spec: Any) -> dict[str, Any]:
    if not isinstance(spec, dict):
        raise SpecError("spec must be a JSON object")
    _exact_keys(spec, {"searchType", "filters"}, "spec")
    if set(spec) != {"searchType", "filters"}:
        raise SpecError("spec requires searchType and filters")
    search_type = spec["searchType"]
    if not isinstance(search_type, str) or search_type not in {"people", "account"}:
        raise SpecError("searchType must be 'people' or 'account'")
    filters = spec["filters"]
    if not isinstance(filters, dict) or not filters:
        raise SpecError("filters must be a non-empty object")

    if search_type == "people":
        filter_strings, keywords, warnings = _people_filters(filters)
        endpoint = "https://www.linkedin.com/sales/search/people"
    else:
        filter_strings, keywords, warnings = _account_filters(filters)
        endpoint = "https://www.linkedin.com/sales/search/company"

    query_parts: list[str] = []
    if keywords is not None:
        query_parts.append(f"keywords:{_inner_escape(keywords)}")
    if filter_strings:
        query_parts.append(f"filters:List({','.join(filter_strings)})")
    if not query_parts:
        raise SpecError("filters produce no effective search criteria")

    inner_query = f"({','.join(query_parts)})"
    url = f"{endpoint}?query={quote(inner_query, safe='')}"
    return {
        "searchType": search_type,
        "url": url,
        "decodedQuery": unquote(inner_query),
        "warnings": warnings,
    }


def _load_spec(source: str) -> Any:
    if source == "-":
        try:
            return json.load(sys.stdin)
        except json.JSONDecodeError as error:
            raise SpecError(f"invalid JSON on stdin: {error}") from error
    path = Path(source)
    if not path.is_file():
        raise SpecError(f"spec file not found: {path}")
    try:
        with path.open(encoding="utf-8") as handle:
            return json.load(handle)
    except json.JSONDecodeError as error:
        raise SpecError(f"invalid JSON in {path}: {error}") from error


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", help="JSON spec path or '-' for stdin")
    parser.add_argument("--json", action="store_true", dest="as_json", help="print URL, decoded query, and warnings as JSON")
    args = parser.parse_args(argv)
    try:
        result = build_lisn_url(_load_spec(args.source))
    except (SpecError, OSError) as error:
        print(f"Error: {_terminal_safe(str(error))}", file=sys.stderr)
        return 2
    if args.as_json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(result["url"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
