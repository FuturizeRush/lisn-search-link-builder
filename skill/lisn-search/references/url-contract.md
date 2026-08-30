# URL contract

LinkedIn does not publish this Sales Navigator URL grammar as a stable public API. Treat it as a versioned compatibility contract, not a permanent standard.

## Compatibility grammar

People endpoint:

```text
https://www.linkedin.com/sales/search/people?query=<encoded-query>
```

Account endpoint:

```text
https://www.linkedin.com/sales/search/company?query=<encoded-query>
```

The decoded query is a Rest.li-like expression:

```text
(keywords:...,filters:List(
  (type:CURRENT_TITLE,values:List((text:Owner,selectionType:INCLUDED))),
  (type:REGION,values:List((id:103644278,text:United States,selectionType:INCLUDED)))
))
```

Every text or entity value is URL-encoded once before it is inserted into the grammar. The whole query is then URL-encoded a second time with no safe punctuation. This is why a space inside `Product Owner` becomes `%2520`, parentheses inside a Boolean title become `%2528`/`%2529`, and structural query parentheses become `%28`/`%29`.

## Drift response

If LinkedIn changes:

1. Reproduce the changed URL shape with the smallest possible search.
2. Compare its decoded query and exact URL to a stored compatibility case.
3. Update mappings, documentation, and tests together.
4. Treat local passing tests as compatibility checks, not proof that LinkedIn still accepts every URL.
