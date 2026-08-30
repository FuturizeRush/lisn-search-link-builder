# Account search filters

Account-search facets are include-only. Do not silently invent exclusions or people-search fields.

```json
{
  "searchType": "account",
  "filters": {
    "companyHeadcounts": ["1-10", "11-50"],
    "headquarters": [{"geo_id": "103644278", "name": "United States"}],
    "industries": [{"id": "27", "name": "Retail"}]
  }
}
```

| Field | Shape | Values |
|---|---|---|
| `companyHeadcounts` | `string[]` | `Self-employed`, `1-10`, `11-50`, `51-200`, `201-500`, `501-1000`, `1001-5000`, `5001-10000`, `10001+`. |
| `headquarters` | `[{geo_id,name}]` | Include-only resolved locations. |
| `industries` | `[{id,name}]` | Include-only resolved industries. |
| `followers` | `string[]` | `1-50`, `51-100`, `101-1000`, `1001-5000`, `5001+`. |
| `fortune` | `string[]` | `Fortune 50`, `Fortune 51-100`, `Fortune 101-250`, `Fortune 251-500`. |
| `accountActivities` | `string[]` | `Senior leadership changes in last 3 months`, `Funding events in past 12 months`. |
| `hiringOnLinkedin` | `boolean` | `true` adds the hiring facet. |
| `annualRevenue` | `{min:number,max:number}` | USD millions; min must be lower than max. Allowed min: `0, 0.5, 1, 2.5, 5, 10, 20, 50, 100, 500, 1000`; max: `2.5, 5, 10, 20, 50, 100, 500, 1000, 1001`. |
| `keywords` | `string` | Whole company-page text; Boolean supported. |

Industry and location names need current IDs. The US (`103644278`) and Retail (`27`) values are bundled for compatibility, not permanent guarantees.
