(function initOrderName(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.LISNOrderName = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createOrderName() {
  "use strict";

  const SEGMENT_LIMIT = 28;

  function graphemes(value) {
    if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
      const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
      return Array.from(segmenter.segment(value), part => part.segment);
    }
    return null;
  }

  function normalizeSegment(value) {
    const normalized = String(value ?? "")
      .replace(/[·|]/g, "-")
      .replace(/\s+/g, " ")
      .trim();
    const units = graphemes(normalized);
    if (!units || units.length <= SEGMENT_LIMIT) return normalized;
    return `${units.slice(0, SEGMENT_LIMIT - 1).join("").trimEnd()}…`;
  }

  function summarize(values, fallback, format = value => value) {
    const normalized = values.map(format).map(normalizeSegment).filter(Boolean);
    if (!normalized.length) return fallback;
    return normalized.length === 1 ? normalized[0] : `${normalized[0]} +${normalized.length - 1}`;
  }

  function formatLocation(value) {
    const label = String(value).replace(/, United States$/, "");
    return label === "United States" ? "US" : label;
  }

  function formatLocalTimestamp(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) throw new TypeError("createdAt must be a valid date");
    const pad = number => String(number).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function included(facet) {
    return Array.isArray(facet?.include) ? facet.include : [];
  }

  function buildOrderName(spec, createdAt) {
    const filters = spec?.filters || {};
    const industries = included(filters.industries).map(item => item.name);
    const regions = included(filters.regions).map(item => item.name);
    const languages = Array.isArray(filters.profileLanguages) ? filters.profileLanguages : [];
    const headcounts = included(filters.companyHeadcounts);

    const industry = summarize(industries, "Any industry");
    let location;
    if (regions.length === 50 && regions.every(name => name.endsWith(", United States"))) location = "US 50 states";
    else if (regions.length === 56 && !regions.includes("United States")) location = "US 56 areas";
    else location = summarize(regions, "Any location", formatLocation);
    const language = summarize(languages, "Any language");
    const headcount = summarize(headcounts, "Any size");

    return [industry, location, language, headcount, formatLocalTimestamp(createdAt)].join(" · ");
  }

  return { buildOrderName, formatLocalTimestamp };
});
