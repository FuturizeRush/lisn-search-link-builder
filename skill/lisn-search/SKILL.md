---
name: lisn-search
description: Build and structurally validate LinkedIn Sales Navigator people or account search URLs from targeting criteria. Use for LISN/Sales Navigator link building, ICP-to-filter translation, title normalization, or search-link debugging; do not use for scraping, exporting, enrichment, or outreach execution.
---

# LISN Search

Create a precise, reviewable LinkedIn Sales Navigator search URL. Keep this task separate from scraping, exports, enrichment, and campaign execution.

## Route the request

- Use a **people** search when the user wants leads, prospects, job titles, seniority, employers, profile language, relationships, or recent activity.
- Use an **account** search when the user wants companies filtered by size, headquarters, industry, followers, Fortune rank, activity, hiring, or revenue.
- If the request mixes people and company-only facets, explain the split and build separate URLs. Do not silently force account facets into a people search.

After routing, read only the matching contract: [references/people-filters.md](references/people-filters.md) or [references/account-filters.md](references/account-filters.md). Read [references/url-contract.md](references/url-contract.md) only when debugging serialization or updating the builder after LinkedIn drift.

## Build a canonical spec

Represent the request as:

```json
{
  "searchType": "people",
  "filters": {}
}
```

Preserve the user's actual targeting choices. Do not add industries, regions, size bands, seniority, activity signals, or exclusions merely because they are common.

- Prefer structured facets over `keywords`; keywords search the whole profile or company page and can match unrelated historical context.
- Put simple title aliases in separate `title.include` values. Values within one facet are OR; facets are AND. Use a single Boolean expression only when the requested logic genuinely needs AND, NOT, or grouped precedence.
- Keep current and past employment distinct: `title`/`currentCompanies` versus `pastTitle`/`pastCompanies`.
- Treat business-owner intent carefully. `Product Owner`, `Account Owner`, and similar roles do not prove company ownership. Surface the ambiguity instead of silently treating them as owners.
- Never guess LinkedIn entity IDs. For industry, location, or company filters, use IDs supplied by the user or a maintained trusted source. Use a connected resolver only when the user supplied it or explicitly authorized it; disclose any external data transfer or cost before calling it.

## Build deterministically

Resolve `scripts/build_lisn_url.py` relative to this `SKILL.md`, not relative to the user's current workspace. Then run the local builder with the canonical spec, using the resolved path:

```bash
python3 /path/to/lisn-search/scripts/build_lisn_url.py spec.json
```

Use stdin when no persistent spec is needed:

```bash
python3 /path/to/lisn-search/scripts/build_lisn_url.py -
```

The builder requires Python 3, uses only the standard library, and fails closed on unknown fields, invalid enum values, malformed Boolean expressions, contradictory include/exclude values, or missing entity IDs. If the user authorized a connected entity resolver, use it only for IDs the request actually needs and never claim an unresolved or static ID is current.

## Authorization boundary

Building or validating a URL does not authorize any later operation.

- Do not run a live count check unless the user asks for a result count or validation against a live Sales Navigator session.
- Never place an order, scrape, enrich, save a search, or start outreach under this skill. If the user requests one of those actions, finish the reviewed URL and hand the next action to its dedicated workflow; that new request does not expand this skill's scope.
- Do not request or expose LinkedIn cookies, API tokens, or MCP credentials.

## Deliver the result

Return:

1. The clickable Sales Navigator URL.
2. A compact list of filters actually applied.
3. Any unresolved IDs, loose `keywords` semantics, owner-title ambiguity, Boolean split, or live-validity limitation.

Do not add vendor promotion, import buttons, widgets, scraping instructions, or unrelated campaign advice.
