# People search filters

Values within one people-search facet are OR; separate facets are AND.

```json
{
  "searchType": "people",
  "filters": {
    "title": {"include": ["Owner", "Founder"], "exclude": ["Product Owner"]}
  }
}
```

| Field | Shape | Notes |
|---|---|---|
| `title`, `pastTitle` | `{include: string[], exclude: string[]}` | Current versus previous title. Boolean expressions are allowed. |
| `keywords` | `string` | Searches the whole profile; use only when no structured facet fits. |
| `companyHeadcounts` | include/exclude enum | `Self-employed`, `1-10`, `11-50`, `51-200`, `201-500`, `501-1000`, `1001-5000`, `5001-10000`, `10001+`. |
| `companyTypes` | include/exclude enum | `Public Company`, `Privately Held`, `Non Profit`, `Educational Institution`, `Partnership`, `Self Employed`, `Self Owned`, `Government Agency`. |
| `functions` | include/exclude enum | Use exact Sales Navigator function names listed below. |
| `seniorityLevels` | include/exclude enum | `Owner / Partner`, `CXO`, `Vice President`, `Director`, `Experienced Manager`, `Entry Level Manager`, `Strategic`, `Senior`, `Entry Level`, `In Training`. |
| `yearsAtCurrentCompany`, `yearsInCurrentPosition`, `yearsOfExperience` | include/exclude enum | `Less than 1 year`, `1 to 2 years`, `3 to 5 years`, `6 to 10 years`, `More than 10 years`. |
| `industries` | `{include/exclude: [{id,name}]}` | Resolve with a current industry resolver; do not guess. |
| `regions`, `companyHeadquarters` | `{include/exclude: [{geo_id,name}]}` | Member location versus employer HQ. |
| `currentCompanies`, `pastCompanies` | `{include/exclude: [{id,name}]}` | Numeric organization ID or full `urn:li:organization:...`. |
| `profileLanguages` | `string[]` | Include-only; exact language names below. |
| `connectionOf` | `{id,name}` | One member ID beginning `ACwAA` or `ACoAA`; include-only. |
| `connectionDegrees` | `string[]` | Include-only relationship values below. |
| activity toggles | `boolean` | `postedOnLinkedin`, `followsYourCompany`, `viewedYourProfile`, `pastColleague`, `sharedExperiences`, `changedJobs`. Only `true` adds a filter. |

## Functions

`Accounting`, `Administrative`, `Arts and Design`, `Business Development`, `Community and Social Services`, `Consulting`, `Education`, `Engineering`, `Entrepreneurship`, `Finance`, `Healthcare Services`, `Human Resources`, `Information Technology`, `Legal`, `Marketing`, `Media and Communication`, `Military and Protective Services`, `Operations`, `Product Management`, `Program and Project Management`, `Purchasing`, `Quality Assurance`, `Real Estate`, `Research`, `Sales`, `Customer Success and Support`.

## Profile languages

`Arabic`, `Bahasa Indonesia`, `Chinese`, `Czech`, `Danish`, `Dutch`, `English`, `French`, `German`, `Italian`, `Japanese`, `Korean`, `Malay`, `Norwegian`, `Polish`, `Portuguese`, `Romanian`, `Russian`, `Spanish`, `Swedish`, `Tagalog`, `Turkish`.

## Connection degrees

`1st degree connections`, `2nd degree connections`, `3rd+ degree connections`, `Group members`, `TeamLink connections`, `Executive TeamLink connections`.

`connectionOf` searches are capped by LinkedIn at 1,000 results. URL building itself does not scrape or spend credits.

The current builder has no first-name or last-name facet. Do not hide a person's name in `keywords`; report that limitation.

## Example: US retail owners

Use discrete titles rather than one oversized OR expression:

```json
{
  "searchType": "people",
  "filters": {
    "title": {
      "include": ["Owner", "Co-Owner", "Principal Owner", "Shop Owner", "Small Business Owner", "Founder", "Co-Founder", "Managing Partner"],
      "exclude": ["Product Owner"]
    },
    "industries": {"include": [{"id": "27", "name": "Retail"}]},
    "regions": {"include": [{"geo_id": "103644278", "name": "United States"}]},
    "seniorityLevels": {"include": ["Owner / Partner"]}
  }
}
```

The industry and region IDs in this example are bundled compatibility values. Re-resolve them if LinkedIn rejects the URL or changes its entity IDs.
