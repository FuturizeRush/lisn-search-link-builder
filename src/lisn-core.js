(function initLisnCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.LISNCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createLisnCore() {
  "use strict";

  class SpecError extends Error {
    constructor(message) {
      super(message);
      this.name = "SpecError";
    }
  }

  const HEADCOUNTS = {
    "Self-employed": "A", "1-10": "B", "11-50": "C", "51-200": "D",
    "201-500": "E", "501-1000": "F", "1001-5000": "G",
    "5001-10000": "H", "10001+": "I",
  };

  const COMPANY_TYPES = {
    "Public Company": "C", "Privately Held": "P", "Non Profit": "N",
    "Educational Institution": "D", Partnership: "S", "Self Employed": "E",
    "Self Owned": "O", "Government Agency": "G",
  };

  const FUNCTION_NAMES = [
    "Accounting", "Administrative", "Arts and Design", "Business Development",
    "Community and Social Services", "Consulting", "Education", "Engineering",
    "Entrepreneurship", "Finance", "Healthcare Services", "Human Resources",
    "Information Technology", "Legal", "Marketing", "Media and Communication",
    "Military and Protective Services", "Operations", "Product Management",
    "Program and Project Management", "Purchasing", "Quality Assurance",
    "Real Estate", "Research", "Sales", "Customer Success and Support",
  ];
  const FUNCTIONS = Object.fromEntries(FUNCTION_NAMES.map((name, index) => [name, String(index + 1)]));

  const SENIORITY = {
    "Owner / Partner": "320", CXO: "310", "Vice President": "300", Director: "220",
    "Experienced Manager": "210", "Entry Level Manager": "200", Strategic: "130",
    Senior: "120", "Entry Level": "110", "In Training": "100",
  };

  const PROFILE_LANGUAGES = {
    Arabic: "ar", "Bahasa Indonesia": "in", Chinese: "zh", Czech: "cs", Danish: "da",
    Dutch: "nl", English: "en", French: "fr", German: "de", Italian: "it",
    Japanese: "ja", Korean: "ko", Malay: "ms", Norwegian: "no", Polish: "pl",
    Portuguese: "pt", Romanian: "ro", Russian: "ru", Spanish: "es", Swedish: "sv",
    Tagalog: "tl", Turkish: "tr",
  };

  const PEOPLE_TOGGLES = {
    postedOnLinkedin: ["POSTED_ON_LINKEDIN", "RPOL"],
    followsYourCompany: ["FOLLOWS_YOUR_COMPANY", "CF"],
    viewedYourProfile: ["VIEWED_YOUR_PROFILE", "VYP"],
    pastColleague: ["PAST_COLLEAGUE", "PCOLL"],
    sharedExperiences: ["WITH_SHARED_EXPERIENCES", "COMM"],
    changedJobs: ["RECENTLY_CHANGED_JOBS", "RPC"],
  };

  const CURRENT_JOB_TITLES = [
    "Owner", "Co-Owner", "Principal Owner", "Agency Owner", "Product Owner",
    "Shop Owner", "Small Business Owner", "Founder", "Co-Founder",
    "Associate Founder", "Director", "Managing Director", "Director of Operations",
    "Sales Director", "Marketing Director", "Partner", "Managing Partner",
    "Senior Partner", "Founding Partner", "Head of Operations",
  ];

  const FOLLOWERS = {
    "1-50": "NFR1", "51-100": "NFR2", "101-1000": "NFR3",
    "1001-5000": "NFR4", "5001+": "NFR5",
  };
  const FORTUNE = {
    "Fortune 50": "1", "Fortune 51-100": "2",
    "Fortune 101-250": "3", "Fortune 251-500": "4",
  };
  const ACCOUNT_ACTIVITIES = {
    "Senior leadership changes in last 3 months": "SLC",
    "Funding events in past 12 months": "RFE",
  };
  const REVENUE_MIN = [0, 0.5, 1, 2.5, 5, 10, 20, 50, 100, 500, 1000];
  const REVENUE_MAX = [2.5, 5, 10, 20, 50, 100, 500, 1000, 1001];

  // Curated retail-family options exposed by the UI.
  const RETAIL_INDUSTRIES = [
    ["27", "Retail"], ["1339", "Food and Beverage Retail"],
    ["1445", "Online and Mail Order Retail"], ["19", "Retail Apparel and Fashion"],
    ["1319", "Retail Appliances, Electrical, and Electronic Equipment"],
    ["3186", "Retail Art Dealers"], ["111", "Retail Art Supplies"],
    ["1409", "Retail Books and Printed News"],
    ["1324", "Retail Building Materials and Garden Equipment"],
    ["1423", "Retail Florists"], ["1309", "Retail Furniture and Home Furnishings"],
    ["1370", "Retail Gasoline"], ["22", "Retail Groceries"],
    ["1359", "Retail Health and Personal Care Products"],
    ["143", "Retail Luxury Goods and Jewelry"], ["1292", "Retail Motor Vehicles"],
    ["1407", "Retail Musical Instruments"], ["138", "Retail Office Equipment"],
    ["1424", "Retail Office Supplies and Gifts"], ["3250", "Retail Pharmacies"],
    ["1431", "Retail Recyclable Materials & Used Merchandise"],
  ].map(([id, name]) => ({ id, name }));

  // United States country, state, metro, and territory options exposed by the UI.
  const REGIONS = [
    ["US", "103644278", "United States"],
    ["US-AL", "102240587", "Alabama, United States"], ["US-AK", "100290991", "Alaska, United States"],
    ["US-AZ", "106032500", "Arizona, United States"], ["US-AR", "102790221", "Arkansas, United States"],
    ["US-CA", "102095887", "California, United States"], ["US-CO", "105763813", "Colorado, United States"],
    ["US-CT", "106914527", "Connecticut, United States"], ["US-DE", "105375497", "Delaware, United States"],
    ["US-FL", "101318387", "Florida, United States"], ["US-GA", "103950076", "Georgia, United States"],
    ["US-HI", "105051999", "Hawaii, United States"], ["US-ID", "102560739", "Idaho, United States"],
    ["US-IL", "101949407", "Illinois, United States"], ["US-IN", "103336534", "Indiana, United States"],
    ["US-IA", "103078544", "Iowa, United States"], ["US-KS", "104403803", "Kansas, United States"],
    ["US-KY", "106470801", "Kentucky, United States"], ["US-LA", "101822552", "Louisiana, United States"],
    ["US-ME", "101102875", "Maine, United States"], ["US-MD", "100809221", "Maryland, United States"],
    ["US-MA", "101098412", "Massachusetts, United States"], ["US-MI", "103051080", "Michigan, United States"],
    ["US-MN", "103411167", "Minnesota, United States"], ["US-MS", "106899551", "Mississippi, United States"],
    ["US-MO", "101486475", "Missouri, United States"], ["US-MT", "101758306", "Montana, United States"],
    ["US-NE", "101197782", "Nebraska, United States"], ["US-NV", "101690912", "Nevada, United States"],
    ["US-NH", "103532695", "New Hampshire, United States"], ["US-NJ", "101651951", "New Jersey, United States"],
    ["US-NM", "105048220", "New Mexico, United States"], ["US-NY", "105080838", "New York, United States"],
    ["US-NC", "103255397", "North Carolina, United States"], ["US-ND", "104611396", "North Dakota, United States"],
    ["US-OH", "106981407", "Ohio, United States"], ["US-OK", "101343299", "Oklahoma, United States"],
    ["US-OR", "101685541", "Oregon, United States"], ["US-PA", "102986501", "Pennsylvania, United States"],
    ["US-RI", "104877241", "Rhode Island, United States"], ["US-SC", "102687171", "South Carolina, United States"],
    ["US-SD", "100115110", "South Dakota, United States"], ["US-TN", "104629187", "Tennessee, United States"],
    ["US-TX", "102748797", "Texas, United States"], ["US-UT", "104102239", "Utah, United States"],
    ["US-VT", "104453637", "Vermont, United States"], ["US-VA", "101630962", "Virginia, United States"],
    ["US-WA", "103977389", "Washington, United States"], ["US-WV", "106420769", "West Virginia, United States"],
    ["US-WI", "104454774", "Wisconsin, United States"], ["US-WY", "100658004", "Wyoming, United States"],
    ["US-DC-BAL", "90000097", "Washington DC-Baltimore Area"],
    ["US-PR", "105245958", "Puerto Rico"], ["US-GU", "107006862", "Guam"],
    ["US-VI", "102119762", "US Virgin Islands"], ["US-AS", "102431220", "American Samoa"],
    ["US-MP", "103666514", "Northern Mariana Islands"],
  ].map(([code, geo_id, name]) => ({ code, geo_id, name }));

  const PEOPLE_FIELDS = new Set([
    "title", "keywords", "companyHeadcounts", "companyTypes", "functions",
    "seniorityLevels", "industries", "regions", "profileLanguages",
    ...Object.keys(PEOPLE_TOGGLES),
  ]);
  const ACCOUNT_FIELDS = new Set([
    "keywords", "companyHeadcounts", "headquarters", "industries", "followers",
    "fortune", "accountActivities", "hiringOnLinkedin", "annualRevenue",
  ]);

  function exactKeys(value, allowed, path) {
    const unknown = Object.keys(value).filter(key => !allowed.has(key));
    if (unknown.length) throw new SpecError(`${path} contains unknown field(s): ${unknown.join(", ")}`);
  }

  function text(value, path) {
    if (typeof value !== "string" || !value.trim()) throw new SpecError(`${path} must be a non-empty string`);
    return value.trim();
  }

  function encodeAll(value) {
    return encodeURIComponent(value).replace(/[!'()*]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
  }

  function innerEscape(value) {
    return encodeAll(value);
  }

  function validateBoolean(value, path) {
    const input = text(value, path);
    if (input.length > 2000) throw new SpecError(`${path} exceeds 2,000 characters`);
    if (/[“”‘’]/.test(input)) throw new SpecError(`${path} uses curly quotes`);
    if (/[*?]/.test(input)) throw new SpecError(`${path} contains an unsupported wildcard`);
    let depth = 0;
    let quoted = false;
    let escaped = false;
    for (const char of input) {
      if (escaped) { escaped = false; continue; }
      if (char === "\\" && quoted) { escaped = true; continue; }
      if (char === '"') { quoted = !quoted; continue; }
      if (quoted) continue;
      if (char === "(") depth += 1;
      if (char === ")" && --depth < 0) throw new SpecError(`${path} has an unmatched ')'`);
    }
    if (quoted) throw new SpecError(`${path} has an unmatched quote`);
    if (depth) throw new SpecError(`${path} has an unmatched '('`);
    const quotedTerms = input.match(/"(?:\\.|[^"\\])*"/g) || [];
    if (quotedTerms.some(term => !term.slice(1, -1).trim())) throw new SpecError(`${path} contains an empty quoted term`);
    const plain = input.replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, '""');
    const operators = plain.match(/\b(?:AND|OR|NOT)\b/g) || [];
    if (operators.length > 15) throw new SpecError(`${path} exceeds 15 Boolean operators`);
    if (/\b(?:or|not)\b/.test(plain) || (operators.length && /\b(?:and|or|not)\b/.test(plain))) throw new SpecError(`${path} uses a lowercase Boolean operator`);
    if (/\(\s*\)/.test(plain)) throw new SpecError(`${path} contains an empty Boolean group`);
    if (/\)\s*\(/.test(plain)) throw new SpecError(`${path} has adjacent Boolean groups`);
    if (/(?:^|\()\s*(?:AND|OR)\b/.test(plain) || /\b(?:AND|OR|NOT)\s*(?:$|\))/.test(plain)) throw new SpecError(`${path} has a misplaced Boolean operator`);
    if (/\b(?:AND|OR|NOT)\s+(?:AND|OR)\b/.test(plain) || /\bNOT\s+NOT\b/.test(plain)) throw new SpecError(`${path} has adjacent Boolean operators`);
    return input;
  }

  function stringList(value, path, mapping) {
    if (!Array.isArray(value) || !value.length) throw new SpecError(`${path} must be a non-empty array`);
    const seen = new Set();
    return value.map((raw, index) => {
      const item = text(raw, `${path}[${index}]`);
      if (mapping && !Object.hasOwn(mapping, item)) throw new SpecError(`${path}[${index}] has unsupported value '${item}'`);
      if (seen.has(item)) throw new SpecError(`${path} contains duplicate value '${item}'`);
      seen.add(item);
      return item;
    });
  }

  function includeExclude(value, path, mapping, booleanText = false) {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new SpecError(`${path} must be an object`);
    exactKeys(value, new Set(["include", "exclude"]), path);
    let include = Object.hasOwn(value, "include") ? stringList(value.include, `${path}.include`, mapping) : [];
    let exclude = Object.hasOwn(value, "exclude") ? stringList(value.exclude, `${path}.exclude`, mapping) : [];
    if (!include.length && !exclude.length) throw new SpecError(`${path} needs an include or exclude value`);
    if (include.some(item => exclude.includes(item))) throw new SpecError(`${path} includes and excludes the same value`);
    if (booleanText) {
      include = include.map(item => validateBoolean(item, `${path}.include`));
      exclude = exclude.map(item => validateBoolean(item, `${path}.exclude`));
    }
    return { include, exclude };
  }

  function entityList(value, path, idKey) {
    if (!Array.isArray(value) || !value.length) throw new SpecError(`${path} must be a non-empty array`);
    const seen = new Set();
    return value.map((raw, index) => {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new SpecError(`${path}[${index}] must be an object`);
      exactKeys(raw, new Set([idKey, "name"]), `${path}[${index}]`);
      const id = text(raw[idKey], `${path}[${index}].${idKey}`);
      const name = text(raw.name, `${path}[${index}].name`);
      if (!/^[1-9]\d*$/.test(id)) throw new SpecError(`${path}[${index}].${idKey} must be a positive ASCII integer without leading zeroes`);
      if (seen.has(id)) throw new SpecError(`${path} contains duplicate id '${id}'`);
      seen.add(id);
      return { id, name };
    });
  }

  function entityIncludeExclude(value, path, idKey) {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new SpecError(`${path} must be an object`);
    exactKeys(value, new Set(["include", "exclude"]), path);
    const include = Object.hasOwn(value, "include") ? entityList(value.include, `${path}.include`, idKey) : [];
    const exclude = Object.hasOwn(value, "exclude") ? entityList(value.exclude, `${path}.exclude`, idKey) : [];
    if (!include.length && !exclude.length) throw new SpecError(`${path} needs an include or exclude entity`);
    const excluded = new Set(exclude.map(item => item.id));
    if (include.some(item => excluded.has(item.id))) throw new SpecError(`${path} includes and excludes the same id`);
    return { include, exclude };
  }

  const textTuple = (value, selection) => `(text:${innerEscape(value)},selectionType:${selection})`;
  const idTuple = (id, label, selection = "INCLUDED") => `(id:${innerEscape(id)},text:${innerEscape(label)},selectionType:${selection})`;
  const idOnlyTuple = id => `(id:${innerEscape(id)},selectionType:INCLUDED)`;
  const filter = (type, tuples) => `(type:${type},values:List(${tuples.join(",")}))`;

  function textFilter(value, path, type) {
    const { include, exclude } = includeExclude(value, path, null, true);
    return filter(type, [...include.map(item => textTuple(item, "INCLUDED")), ...exclude.map(item => textTuple(item, "EXCLUDED"))]);
  }

  function enumFilter(value, path, type, mapping) {
    const { include, exclude } = includeExclude(value, path, mapping);
    return filter(type, [...include.map(item => idTuple(mapping[item], item)), ...exclude.map(item => idTuple(mapping[item], item, "EXCLUDED"))]);
  }

  function accountEnumFilter(value, path, type, mapping) {
    const items = stringList(value, path, mapping);
    return filter(type, items.map(item => idTuple(mapping[item], item)));
  }

  function entityFilter(value, path, type, idKey) {
    const { include, exclude } = entityIncludeExclude(value, path, idKey);
    return filter(type, [...include.map(item => idTuple(item.id, item.name)), ...exclude.map(item => idTuple(item.id, item.name, "EXCLUDED"))]);
  }

  function accountEntityFilter(value, path, type, idKey) {
    return filter(type, entityList(value, path, idKey).map(item => idTuple(item.id, item.name)));
  }

  function buildPeople(filters) {
    exactKeys(filters, PEOPLE_FIELDS, "filters");
    const built = [];
    const warnings = [];
    if (Object.hasOwn(filters, "title")) built.push(textFilter(filters.title, "filters.title", "CURRENT_TITLE"));
    const keywords = Object.hasOwn(filters, "keywords") ? validateBoolean(filters.keywords, "filters.keywords") : null;
    if (keywords) warnings.push("Keywords search the full profile and may match past roles or unrelated text.");
    if (Object.hasOwn(filters, "companyHeadcounts")) built.push(enumFilter(filters.companyHeadcounts, "filters.companyHeadcounts", "COMPANY_HEADCOUNT", HEADCOUNTS));
    if (Object.hasOwn(filters, "companyTypes")) built.push(enumFilter(filters.companyTypes, "filters.companyTypes", "COMPANY_TYPE", COMPANY_TYPES));
    if (Object.hasOwn(filters, "industries")) built.push(entityFilter(filters.industries, "filters.industries", "INDUSTRY", "id"));
    if (Object.hasOwn(filters, "regions")) built.push(entityFilter(filters.regions, "filters.regions", "REGION", "geo_id"));
    if (Object.hasOwn(filters, "seniorityLevels")) built.push(enumFilter(filters.seniorityLevels, "filters.seniorityLevels", "SENIORITY_LEVEL", SENIORITY));
    if (Object.hasOwn(filters, "functions")) built.push(enumFilter(filters.functions, "filters.functions", "FUNCTION", FUNCTIONS));
    if (Object.hasOwn(filters, "profileLanguages")) built.push(filter("PROFILE_LANGUAGE", stringList(filters.profileLanguages, "filters.profileLanguages", PROFILE_LANGUAGES).map(item => idTuple(PROFILE_LANGUAGES[item], item))));
    Object.entries(PEOPLE_TOGGLES).forEach(([field, [type, id]]) => {
      if (!Object.hasOwn(filters, field)) return;
      if (typeof filters[field] !== "boolean") throw new SpecError(`filters.${field} must be a boolean`);
      if (filters[field]) built.push(filter(type, [idOnlyTuple(id)]));
    });
    return { built, keywords, warnings };
  }

  function buildAccount(filters) {
    exactKeys(filters, ACCOUNT_FIELDS, "filters");
    const built = [];
    const warnings = [];
    const keywords = Object.hasOwn(filters, "keywords") ? validateBoolean(filters.keywords, "filters.keywords") : null;
    if (keywords) warnings.push("Keywords search the full company page and are broader than a structured industry filter.");
    if (Object.hasOwn(filters, "companyHeadcounts")) built.push(accountEnumFilter(filters.companyHeadcounts, "filters.companyHeadcounts", "COMPANY_HEADCOUNT", HEADCOUNTS));
    if (Object.hasOwn(filters, "headquarters")) built.push(accountEntityFilter(filters.headquarters, "filters.headquarters", "REGION", "geo_id"));
    if (Object.hasOwn(filters, "industries")) built.push(accountEntityFilter(filters.industries, "filters.industries", "INDUSTRY", "id"));
    if (Object.hasOwn(filters, "followers")) built.push(accountEnumFilter(filters.followers, "filters.followers", "NUM_OF_FOLLOWERS", FOLLOWERS));
    if (Object.hasOwn(filters, "fortune")) built.push(accountEnumFilter(filters.fortune, "filters.fortune", "FORTUNE", FORTUNE));
    if (Object.hasOwn(filters, "accountActivities")) built.push(accountEnumFilter(filters.accountActivities, "filters.accountActivities", "ACCOUNT_ACTIVITIES", ACCOUNT_ACTIVITIES));
    if (Object.hasOwn(filters, "hiringOnLinkedin")) {
      if (typeof filters.hiringOnLinkedin !== "boolean") throw new SpecError("filters.hiringOnLinkedin must be a boolean");
      if (filters.hiringOnLinkedin) built.push(filter("JOB_OPPORTUNITIES", [idTuple("JO1", "Hiring on Linkedin")]));
    }
    if (Object.hasOwn(filters, "annualRevenue")) {
      const revenue = filters.annualRevenue;
      if (!revenue || typeof revenue !== "object" || Array.isArray(revenue)) throw new SpecError("filters.annualRevenue must be an object");
      exactKeys(revenue, new Set(["min", "max"]), "filters.annualRevenue");
      const { min, max } = revenue;
      if (!REVENUE_MIN.includes(min) || !REVENUE_MAX.includes(max) || min >= max) throw new SpecError("Annual revenue must use a supported min/max boundary");
      built.push(`(type:ANNUAL_REVENUE,rangeValue:(min:${min},max:${max}),selectedSubFilter:USD)`);
    }
    return { built, keywords, warnings };
  }

  function buildLisnUrl(spec) {
    if (!spec || typeof spec !== "object" || Array.isArray(spec)) throw new SpecError("spec must be an object");
    exactKeys(spec, new Set(["searchType", "filters"]), "spec");
    if (!['people', 'account'].includes(spec.searchType)) throw new SpecError("searchType must be 'people' or 'account'");
    if (!spec.filters || typeof spec.filters !== "object" || !Object.keys(spec.filters).length) throw new SpecError("Select at least one filter");
    const { built, keywords, warnings } = spec.searchType === "people" ? buildPeople(spec.filters) : buildAccount(spec.filters);
    const parts = [];
    if (keywords) parts.push(`keywords:${innerEscape(keywords)}`);
    if (built.length) parts.push(`filters:List(${built.join(",")})`);
    if (!parts.length) throw new SpecError("Select at least one active filter");
    const query = `(${parts.join(",")})`;
    const endpoint = spec.searchType === "people" ? "people" : "company";
    return {
      searchType: spec.searchType,
      url: `https://www.linkedin.com/sales/search/${endpoint}?query=${encodeAll(query)}`,
      query,
      warnings,
      filterCount: built.length + (keywords ? 1 : 0),
    };
  }

  return {
    SpecError,
    buildLisnUrl,
    catalogs: {
      currentJobTitles: CURRENT_JOB_TITLES,
      industries: RETAIL_INDUSTRIES,
      regions: REGIONS,
      usStateCodes: REGIONS.filter(item => item.name.endsWith(", United States")).map(item => item.code),
      usDetailedRegionCodes: REGIONS.filter(item => item.code !== "US").map(item => item.code),
      headcounts: Object.keys(HEADCOUNTS),
      companyTypes: Object.keys(COMPANY_TYPES),
      functions: Object.keys(FUNCTIONS),
      seniority: Object.keys(SENIORITY),
      profileLanguages: Object.keys(PROFILE_LANGUAGES),
      followers: Object.keys(FOLLOWERS),
      fortune: Object.keys(FORTUNE),
      accountActivities: Object.keys(ACCOUNT_ACTIVITIES),
      revenueMin: REVENUE_MIN,
      revenueMax: REVENUE_MAX,
    },
  };
});
