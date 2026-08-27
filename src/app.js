(function initApp() {
  "use strict";

  const { catalogs, buildLisnUrl } = window.LISNCore;
  const { buildOrderName } = window.LISNOrderName;
  const byId = id => document.getElementById(id);
  const form = byId("builder-form");
  const customIndustries = [];
  const STRICT_OWNER_TITLES = [
    "Owner", "Co-Owner", "Principal Owner", "Agency Owner", "Shop Owner",
    "Small Business Owner", "Founder", "Co-Founder", "Associate Founder",
    "Partner", "Managing Partner", "Senior Partner", "Founding Partner",
  ];
  const SIGNAL_LABELS = {
    postedOnLinkedin: "Posted on LinkedIn",
    changedJobs: "Recently changed jobs",
    followsYourCompany: "Follows your company",
    viewedYourProfile: "Viewed your profile",
    pastColleague: "Past colleague",
    sharedExperiences: "Shared experiences",
  };
  let toastTimer;
  let orderNameMode = "auto";
  let orderCreatedAt = new Date();

  function optionId(group, value) {
    return `${group}-${String(value).replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
  }

  function renderOptionGroup(containerId, group, items, getValue = item => item, getLabel = item => item, className = "option-item") {
    const fragment = document.createDocumentFragment();
    items.forEach(item => {
      const value = String(getValue(item));
      const labelText = String(getLabel(item));
      const wrapper = document.createElement("div");
      const input = document.createElement("input");
      const label = document.createElement("label");
      wrapper.className = className;
      wrapper.dataset.search = labelText.toLocaleLowerCase();
      input.type = "checkbox";
      input.id = optionId(group, value);
      input.value = value;
      input.dataset.group = group;
      label.htmlFor = input.id;
      label.textContent = labelText;
      wrapper.append(input, label);
      fragment.append(wrapper);
    });
    byId(containerId).replaceChildren(fragment);
  }

  function renderCatalogs() {
    renderOptionGroup("title-options", "title", catalogs.currentJobTitles);
    renderOptionGroup("industry-options", "industry", catalogs.industries, item => item.id, item => item.name);
    renderOptionGroup("region-options", "region", catalogs.regions, item => item.code, item => item.name);
    renderOptionGroup("headcount-options", "headcount", catalogs.headcounts, undefined, undefined, "pill-item");
    renderOptionGroup("seniority-options", "seniority", catalogs.seniority, undefined, undefined, "pill-item");
    renderOptionGroup("function-options", "function", catalogs.functions);
    renderOptionGroup("company-type-options", "companyType", catalogs.companyTypes, undefined, undefined, "pill-item");
    renderOptionGroup("language-options", "language", catalogs.profileLanguages, undefined, undefined, "pill-item");
  }

  function selected(group) {
    return [...form.querySelectorAll(`input[data-group="${group}"]:checked`)].map(input => input.value);
  }

  function setSelected(group, values) {
    const wanted = new Set(values.map(String));
    form.querySelectorAll(`input[data-group="${group}"]`).forEach(input => {
      input.checked = wanted.has(input.value);
    });
  }

  function parseLines(value) {
    const seen = new Set();
    return value.split(/\r?\n/).map(item => item.trim()).filter(item => {
      if (!item || seen.has(item)) return false;
      seen.add(item);
      return true;
    });
  }

  function unique(values) {
    return [...new Set(values)];
  }

  function sameValues(left, right) {
    if (left.length !== right.length) return false;
    const expected = new Set(right.map(String));
    return left.every(value => expected.has(String(value)));
  }

  function setTextIfChanged(element, value) {
    if (element.textContent !== value) element.textContent = value;
  }

  function entitySelections(group, catalog, idKey) {
    const chosen = new Set(selected(group));
    return catalog.filter(item => chosen.has(item.code || item.id)).map(item => ({
      [idKey]: item.geo_id || item.id,
      name: item.name,
    }));
  }

  function collectSpec() {
    const filters = {};
    const builtInIndustries = entitySelections("industry", catalogs.industries, "id");
    const industries = [...builtInIndustries, ...customIndustries.map(item => ({ id: item.id, name: item.name }))];
    const regions = entitySelections("region", catalogs.regions, "geo_id");
    const titleInclude = unique([...selected("title"), ...parseLines(byId("title-include").value)]);
    const titleExclude = parseLines(byId("title-exclude").value);
    const headcounts = selected("headcount");
    const seniority = selected("seniority");
    const functions = selected("function");
    const companyTypes = selected("companyType");
    const languages = selected("language");
    const keywords = byId("people-keywords").value.trim();

    if (titleInclude.length || titleExclude.length) filters.title = {
      ...(titleInclude.length && { include: titleInclude }),
      ...(titleExclude.length && { exclude: titleExclude }),
    };
    if (headcounts.length) filters.companyHeadcounts = { include: headcounts };
    if (companyTypes.length) filters.companyTypes = { include: companyTypes };
    if (industries.length) filters.industries = { include: industries };
    if (regions.length) filters.regions = { include: regions };
    if (seniority.length) filters.seniorityLevels = { include: seniority };
    if (functions.length) filters.functions = { include: functions };
    if (languages.length) filters.profileLanguages = languages;
    if (keywords) filters.keywords = keywords;
    form.querySelectorAll("[data-people-toggle]").forEach(input => {
      if (input.checked) filters[input.dataset.peopleToggle] = true;
    });
    return { searchType: "people", filters };
  }

  function listFromFacet(facet) {
    return [
      ...(facet?.include || []).map(value => ({ value: typeof value === "string" ? value : value.name, excluded: false })),
      ...(facet?.exclude || []).map(value => ({ value: typeof value === "string" ? value : value.name, excluded: true })),
    ];
  }

  function logicGroups(spec) {
    const filters = spec.filters;
    const groups = [];
    const add = (label, values) => {
      const normalized = values.map(value => typeof value === "object" && Object.hasOwn(value, "value")
        ? value
        : ({ value: String(value), excluded: false }));
      if (normalized.length) groups.push({ label, values: normalized });
    };
    add("Industry", listFromFacet(filters.industries));
    add("Location", listFromFacet(filters.regions));
    add("Title", listFromFacet(filters.title));
    add("Company headcount", listFromFacet(filters.companyHeadcounts));
    add("Profile language", filters.profileLanguages || []);
    if (filters.postedOnLinkedin) add(SIGNAL_LABELS.postedOnLinkedin, ["Yes"]);
    add("Seniority", listFromFacet(filters.seniorityLevels));
    add("Function", listFromFacet(filters.functions));
    add("Company type", listFromFacet(filters.companyTypes));
    Object.entries(SIGNAL_LABELS).forEach(([field, label]) => {
      if (field !== "postedOnLinkedin" && filters[field]) add(label, ["Yes"]);
    });
    add("Keywords", filters.keywords ? [filters.keywords] : []);
    return groups;
  }

  function renderLogic(groups, emptyMessage = "No active filters.") {
    const rail = byId("logic-rail");
    if (!groups.length) {
      const empty = document.createElement("p");
      empty.className = "logic-empty";
      empty.textContent = emptyMessage;
      rail.replaceChildren(empty);
      return;
    }
    const fragment = document.createDocumentFragment();
    groups.forEach((group, index) => {
      const wrapper = document.createElement("div");
      const heading = document.createElement("div");
      const label = document.createElement("span");
      const relation = document.createElement("em");
      const values = document.createElement("div");
      wrapper.className = "logic-group";
      heading.className = "logic-label";
      label.textContent = group.label;
      relation.textContent = index === 0 ? `${group.values.length} value${group.values.length === 1 ? "" : "s"}` : "AND";
      heading.append(label, relation);
      values.className = "logic-values";
      group.values.forEach(item => {
        const chip = document.createElement("span");
        chip.className = `logic-chip${item.excluded ? " is-excluded" : ""}`;
        chip.textContent = `${item.excluded ? "NOT · " : ""}${item.value}`;
        values.append(chip);
      });
      wrapper.append(heading, values);
      fragment.append(wrapper);
    });
    rail.replaceChildren(fragment);
  }

  function renderWarnings(warnings, url) {
    const all = [...warnings];
    if (url.length > 1900) all.push("Long URL. Open it and confirm that Sales Navigator kept every filter.");
    const fragment = document.createDocumentFragment();
    all.forEach(message => {
      const item = document.createElement("div");
      item.className = "warning-item";
      item.textContent = message;
      fragment.append(item);
    });
    byId("warning-list").replaceChildren(fragment);
  }

  function setOutputEnabled(url) {
    const copy = byId("copy-link");
    const open = byId("open-link");
    copy.disabled = !url;
    open.classList.toggle("is-disabled", !url);
    open.setAttribute("aria-disabled", String(!url));
    open.href = url || "#";
    if (url) open.removeAttribute("tabindex");
    else open.tabIndex = -1;
  }

  function clearFieldErrors() {
    ["title-include-error", "title-exclude-error", "keywords-inline-error"].forEach(id => {
      byId(id).hidden = true;
      byId(id).textContent = "";
    });
    ["title-include", "title-exclude", "people-keywords"].forEach(id => byId(id).removeAttribute("aria-invalid"));
  }

  function userFacingError(message) {
    const friendly = message
      .replace(/^filters\.title\.include/, "Additional titles")
      .replace(/^filters\.title\.exclude/, "Excluded titles")
      .replace(/^filters\.title/, "Title filters")
      .replace(/^filters\.keywords/, "Keywords")
      .replace(/\bincludes and excludes\b/, "include and exclude");
    const verbs = { has: "have", uses: "use", contains: "contain", exceeds: "exceed", includes: "include", needs: "need" };
    return friendly.replace(/^(Additional titles|Excluded titles|Title filters|Keywords) (has|uses|contains|exceeds|includes|needs)\b/, (_, subject, verb) => `${subject} ${verbs[verb]}`);
  }

  function showFieldError(error) {
    const message = error instanceof Error ? error.message : String(error);
    const displayMessage = userFacingError(message);
    if (message.includes("filters.title")) {
      const includeOnly = message.includes("filters.title.include");
      const excludeOnly = message.includes("filters.title.exclude");
      if (!excludeOnly) {
        byId("title-include-error").textContent = displayMessage;
        byId("title-include-error").hidden = false;
        byId("title-include").setAttribute("aria-invalid", "true");
      }
      if (!includeOnly) {
        byId("title-exclude-error").textContent = displayMessage;
        byId("title-exclude-error").hidden = false;
        byId("title-exclude").setAttribute("aria-invalid", "true");
      }
    }
    if (message.includes("filters.keywords")) {
      byId("keywords-inline-error").textContent = displayMessage;
      byId("keywords-inline-error").hidden = false;
      byId("people-keywords").setAttribute("aria-invalid", "true");
    }
  }

  function updateOrderNameFromSpec(spec) {
    if (orderNameMode === "auto") byId("order-name").value = buildOrderName(spec, orderCreatedAt);
    const value = byId("order-name").value;
    setTextIfChanged(byId("order-name-mode"), orderNameMode === "auto" ? "Auto" : "Custom");
    setTextIfChanged(byId("preview-order-name"), value.trim() || "Untitled order");
    byId("copy-order-name").disabled = !value.trim();
  }

  function normalizeManualOrderName() {
    const field = byId("order-name");
    if (orderNameMode === "manual") field.value = field.value.trim();
    updateOrderNameFromSpec(collectSpec());
    return field.value;
  }

  function updatePreview() {
    const spec = collectSpec();
    const groups = logicGroups(spec);
    updateAdvancedSummary();
    updateOrderNameFromSpec(spec);
    byId("spec-output").textContent = JSON.stringify(spec, null, 2);
    clearFieldErrors();
    if (!Object.keys(spec.filters).length) {
      renderLogic([]);
      byId("filter-count").textContent = "0 active filters";
      byId("search-url").value = "";
      byId("url-length").textContent = "0 characters";
      byId("error-message").hidden = true;
      byId("empty-message").hidden = false;
      byId("warning-list").replaceChildren();
      setOutputEnabled("");
      return;
    }

    try {
      const result = buildLisnUrl(spec);
      renderLogic(groups);
      byId("search-url").value = result.url;
      byId("url-length").textContent = `${result.url.length.toLocaleString()} characters`;
      byId("filter-count").textContent = `${result.filterCount} active filter${result.filterCount === 1 ? "" : "s"}`;
      byId("error-message").hidden = true;
      byId("empty-message").hidden = true;
      setOutputEnabled(result.url);
      renderWarnings(result.warnings, result.url);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      byId("search-url").value = "";
      byId("url-length").textContent = "0 characters";
      byId("error-message").textContent = userFacingError(message);
      byId("error-message").hidden = false;
      byId("empty-message").hidden = true;
      byId("warning-list").replaceChildren();
      renderLogic([], "Fix the highlighted filter to review this search.");
      byId("filter-count").textContent = "Needs attention";
      setOutputEnabled("");
      showFieldError(error);
      updateAdvancedSummary({ needsAttention: true });
    }
  }

  function labelFor(group, value) {
    if (group === "industry") return catalogs.industries.find(item => item.id === value)?.name || value;
    if (group === "region") return catalogs.regions.find(item => item.code === value)?.name || value;
    return value;
  }

  function summaryLabel(values, emptyLabel) {
    if (!values.length) return emptyLabel;
    return values.length === 1 ? values[0] : `${values[0]} +${values.length - 1}`;
  }

  function renderSelectedSummary(containerId, values, emptyLabel) {
    const container = byId(containerId);
    if (!values.length) {
      const empty = document.createElement("span");
      empty.className = "summary-empty";
      empty.textContent = emptyLabel;
      container.replaceChildren(empty);
      return;
    }
    const fragment = document.createDocumentFragment();
    values.slice(0, 4).forEach(value => {
      const token = document.createElement("span");
      token.className = "summary-chip";
      token.textContent = value;
      fragment.append(token);
    });
    if (values.length > 4) {
      const more = document.createElement("span");
      more.className = "summary-more";
      more.textContent = `+${values.length - 4} more`;
      fragment.append(more);
    }
    container.replaceChildren(fragment);
  }

  function updateIndustrySummary() {
    const names = [...selected("industry").map(value => labelFor("industry", value)), ...customIndustries.map(item => item.name)];
    setTextIfChanged(byId("industry-selection-count"), `${names.length} selected`);
    setTextIfChanged(byId("industry-picker-summary"), summaryLabel(names, "Any industry"));
    renderSelectedSummary("industry-selected", names, "Any industry");
  }

  function updateRegionSummary() {
    const values = selected("region");
    const names = values.map(value => labelFor("region", value));
    const isFiftyStates = sameValues(values, catalogs.usStateCodes);
    const isAllAreas = sameValues(values, catalogs.usDetailedRegionCodes);
    setTextIfChanged(byId("region-selection-count"), `${names.length} selected`);
    const summary = isFiftyStates ? "US 50 states" : isAllAreas ? "US 56 areas" : summaryLabel(names, "Any location");
    setTextIfChanged(byId("region-picker-summary"), summary);
    renderSelectedSummary("region-selected", names, "Any location");
    byId("select-us").setAttribute("aria-pressed", String(sameValues(values, ["US"])));
    byId("select-us-states").setAttribute("aria-pressed", String(sameValues(values, catalogs.usStateCodes)));
    byId("select-all-us-areas").setAttribute("aria-pressed", String(sameValues(values, catalogs.usDetailedRegionCodes)));
  }

  function updateTitleSummary() {
    const builtIn = selected("title");
    const manual = parseLines(byId("title-include").value);
    const included = unique([...builtIn, ...manual]);
    setTextIfChanged(byId("title-selection-count"), `${included.length} title${included.length === 1 ? "" : "s"}`);
    renderSelectedSummary("title-summary", included, "Any title");
    const owner = sameValues(included, STRICT_OWNER_TITLES);
    const all = sameValues(included, catalogs.currentJobTitles);
    const status = owner ? "Owner-focused" : all ? "All titles" : included.length ? "Custom selection" : "No title filter";
    setTextIfChanged(byId("title-preset-status"), status);
    byId("select-owner-titles").setAttribute("aria-pressed", String(owner));
    byId("select-all-titles").setAttribute("aria-pressed", String(all));
  }

  function updateAdvancedSummary({ needsAttention = false } = {}) {
    const active = [];
    if (selected("seniority").length) active.push("Seniority");
    if (selected("function").length) active.push("Function");
    if (selected("companyType").length) active.push("Company type");
    const builtInTitles = new Set(selected("title"));
    const hasEffectiveManualTitle = parseLines(byId("title-include").value).some(title => !builtInTitles.has(title));
    if (hasEffectiveManualTitle || parseLines(byId("title-exclude").value).length) active.push("Title logic");
    if (byId("people-keywords").value.trim()) active.push("Keywords");
    if ([...form.querySelectorAll('[data-people-toggle]:not(#posted-on-linkedin):checked')].length) active.push("Signals");
    const status = !active.length
      ? "No active filters"
      : needsAttention
        ? `Needs attention: ${active.join(", ")}`
        : `${active.length} active: ${active.join(", ")}`;
    setTextIfChanged(byId("advanced-filter-status"), status);
  }

  function updateHeadcountSummary() {
    const count = selected("headcount").length;
    setTextIfChanged(byId("headcount-selection-count"), count ? `${count} selected` : "Any size");
  }

  function updateLanguageSummary() {
    const values = selected("language");
    setTextIfChanged(byId("language-selection-count"), values.length ? `${values.length} selected` : "Any language");
    setTextIfChanged(byId("language-picker-summary"), summaryLabel(values, "Any language"));
    renderSelectedSummary("language-selected", values, "Any language");
  }

  function filterOptions(inputId, containerId, emptyId, statusId, extraSelected = 0) {
    const query = byId(inputId).value.trim().toLocaleLowerCase();
    const items = [...byId(containerId).querySelectorAll(".option-item")];
    let matchCount = 0;
    let selectedCount = extraSelected;
    items.forEach(item => {
      const input = item.querySelector("input");
      const matches = !query || item.dataset.search.includes(query);
      const show = input.checked || matches;
      if (input.checked) selectedCount += 1;
      if (matches) matchCount += 1;
      item.classList.toggle("is-filtered-out", !show);
    });
    const empty = byId(emptyId);
    const label = inputId === "industry-search" ? "industries" : "locations";
    empty.hidden = !query || matchCount > 0;
    empty.textContent = selectedCount
      ? `No additional ${label} match. Selected items remain visible.`
      : `No matching ${label}.`;
    const availability = query
      ? `${matchCount} match${matchCount === 1 ? "" : "es"}`
      : `${items.length} available`;
    setTextIfChanged(byId(statusId), `${selectedCount} selected · ${availability}`);
  }

  function updateAllSummaries() {
    updateIndustrySummary();
    updateRegionSummary();
    updateTitleSummary();
    updateHeadcountSummary();
    updateLanguageSummary();
    updateAdvancedSummary();
    filterOptions("industry-search", "industry-options", "industry-empty", "industry-option-status", customIndustries.length);
    filterOptions("region-search", "region-options", "region-empty", "region-option-status");
  }

  function showToast(message) {
    const toast = byId("toast");
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1800);
  }

  function renderCustomIndustries() {
    const fragment = document.createDocumentFragment();
    customIndustries.forEach(item => {
      const token = document.createElement("span");
      const remove = document.createElement("button");
      token.className = "token";
      token.append(document.createTextNode(`${item.name} · ${item.id}`));
      remove.type = "button";
      remove.dataset.removeIndustry = item.id;
      remove.setAttribute("aria-label", `Remove ${item.name}`);
      remove.textContent = "×";
      token.append(remove);
      fragment.append(token);
    });
    byId("custom-industry-list").replaceChildren(fragment);
  }

  function addCustomIndustry() {
    const nameField = byId("custom-industry-name");
    const idField = byId("custom-industry-id");
    const name = nameField.value.trim();
    const id = idField.value.trim();
    if (!name || !/^[1-9]\d*$/.test(id)) {
      showToast("Enter a name and a positive Industry ID without leading zeroes.");
      return;
    }
    if (customIndustries.some(item => item.id === id) || catalogs.industries.some(item => item.id === id)) {
      showToast("This Industry ID already exists.");
      return;
    }
    customIndustries.push({ id, name });
    nameField.value = "";
    idField.value = "";
    renderCustomIndustries();
    updateAllSummaries();
    updatePreview();
    showToast("Industry added.");
  }

  function clearSearch(inputId, containerId, emptyId, statusId) {
    byId(inputId).value = "";
    filterOptions(inputId, containerId, emptyId, statusId);
  }

  function applyTitlePreset(titles) {
    setSelected("title", titles);
    byId("title-include").value = "";
    byId("title-exclude").value = "";
    updateAllSummaries();
    updatePreview();
  }

  function reconcileCheckedTitle(title) {
    const exclusions = parseLines(byId("title-exclude").value);
    const next = exclusions.filter(item => item !== title);
    if (next.length !== exclusions.length) byId("title-exclude").value = next.join("\n");
  }

  function clearTitles() {
    setSelected("title", []);
    byId("title-include").value = "";
    byId("title-exclude").value = "";
    updateAllSummaries();
    updatePreview();
  }

  function selectRegionPreset(values) {
    clearSearch("region-search", "region-options", "region-empty", "region-option-status");
    setSelected("region", values);
    updateAllSummaries();
    updatePreview();
  }

  function clearFilters({ update = true } = {}) {
    form.querySelectorAll('input[type="checkbox"]').forEach(input => { input.checked = false; });
    ["title-include", "title-exclude", "people-keywords", "industry-search", "region-search", "custom-industry-name", "custom-industry-id"].forEach(id => {
      byId(id).value = "";
    });
    customIndustries.splice(0);
    renderCustomIndustries();
    ["industry-picker", "region-picker", "title-picker", "language-picker", "more-filters"].forEach(id => { byId(id).open = false; });
    updateAllSummaries();
    if (update) updatePreview();
  }

  function loadRetailOwnerExample() {
    clearFilters({ update: false });
    setSelected("industry", ["27"]);
    setSelected("region", ["US"]);
    setSelected("title", STRICT_OWNER_TITLES);
    orderNameMode = "auto";
    orderCreatedAt = new Date();
    updateAllSummaries();
    updatePreview();
  }

  async function copyValue(value, field, successMessage) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        field.focus();
        field.select();
        if (!document.execCommand("copy")) throw new Error("copy command failed");
        window.getSelection()?.removeAllRanges();
      }
      showToast(successMessage);
    } catch {
      field.focus();
      field.select();
      showToast("Could not copy automatically. The value is selected.");
    }
  }

  function copyLink() {
    const output = byId("search-url");
    if (output.value) copyValue(output.value, output, "Search link copied.");
  }

  function copyOrderName() {
    const field = byId("order-name");
    const value = normalizeManualOrderName();
    if (value) copyValue(value, field, "Order name copied.");
  }

  function bindEvents() {
    document.querySelectorAll('a[href="#builder-form"], a[href="#preview-panel"]').forEach(link => {
      link.addEventListener("click", event => {
        event.preventDefault();
        const target = document.querySelector(link.getAttribute("href"));
        target.focus({ preventScroll: true });
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    form.addEventListener("submit", event => event.preventDefault());
    byId("order-name").addEventListener("blur", normalizeManualOrderName);
    form.addEventListener("input", event => {
      if (event.target.id === "order-name") {
        orderNameMode = "manual";
        updateOrderNameFromSpec(collectSpec());
        return;
      }
      if (event.target.id === "industry-search") {
        filterOptions("industry-search", "industry-options", "industry-empty", "industry-option-status", customIndustries.length);
        return;
      }
      if (event.target.id === "region-search") {
        filterOptions("region-search", "region-options", "region-empty", "region-option-status");
        return;
      }
      if (["custom-industry-name", "custom-industry-id"].includes(event.target.id)) return;
      if (["title-include", "title-exclude", "people-keywords"].includes(event.target.id)) {
        updateTitleSummary();
        updatePreview();
      }
    });
    form.addEventListener("change", event => {
      const target = event.target;
      if (!target.matches('input[type="checkbox"]')) return;
      if (target.matches('input[data-group="title"]')) {
        if (target.checked) reconcileCheckedTitle(target.value);
      } else if (target.matches('input[data-group="region"]') && target.checked) {
        if (target.value === "US") setSelected("region", ["US"]);
        else form.querySelector('input[data-group="region"][value="US"]').checked = false;
      }
      updateAllSummaries();
      updatePreview();
    });
    byId("select-us").addEventListener("click", () => selectRegionPreset(["US"]));
    byId("select-us-states").addEventListener("click", () => selectRegionPreset(catalogs.usStateCodes));
    byId("select-all-us-areas").addEventListener("click", () => selectRegionPreset(catalogs.usDetailedRegionCodes));
    byId("select-owner-titles").addEventListener("click", () => applyTitlePreset(STRICT_OWNER_TITLES));
    byId("select-all-titles").addEventListener("click", () => applyTitlePreset(catalogs.currentJobTitles));
    byId("clear-titles").addEventListener("click", clearTitles);
    byId("add-custom-industry").addEventListener("click", addCustomIndustry);
    byId("custom-industry-list").addEventListener("click", event => {
      const id = event.target.dataset.removeIndustry;
      if (!id) return;
      const index = customIndustries.findIndex(item => item.id === id);
      if (index >= 0) customIndustries.splice(index, 1);
      renderCustomIndustries();
      updateAllSummaries();
      updatePreview();
    });
    byId("load-example").addEventListener("click", loadRetailOwnerExample);
    byId("reset-builder").addEventListener("click", () => clearFilters());
    byId("regenerate-order-name").addEventListener("click", () => {
      orderNameMode = "auto";
      orderCreatedAt = new Date();
      updatePreview();
      showToast("Order name regenerated.");
    });
    byId("copy-order-name").addEventListener("click", copyOrderName);
    byId("copy-link").addEventListener("click", copyLink);
    byId("open-link").addEventListener("click", event => {
      if (event.currentTarget.getAttribute("aria-disabled") === "true") event.preventDefault();
    });
  }

  renderCatalogs();
  bindEvents();
  loadRetailOwnerExample();
})();
