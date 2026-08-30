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

  // Bundled LinkedIn Industry Codes V2 compatibility snapshot, alphabetized for the searchable UI.
  const INDUSTRIES = [
    ["799", "Abrasives and Nonmetallic Minerals Manufacturing"],
    ["3246", "Accessible Architecture and Design"],
    ["3245", "Accessible Hardware Manufacturing"],
    ["2190", "Accommodation Services"],
    ["47", "Accounting"],
    ["73", "Administration of Justice"],
    ["1912", "Administrative and Support Services"],
    ["80", "Advertising Services"],
    ["709", "Agricultural Chemical Manufacturing"],
    ["901", "Agriculture, Construction, Mining Machinery Manufacturing"],
    ["2366", "Air, Water, and Waste Program Management"],
    ["94", "Airlines and Aviation"],
    ["120", "Alternative Dispute Resolution"],
    ["3253", "Alternative Fuel Vehicle Manufacturing"],
    ["125", "Alternative Medicine"],
    ["2077", "Ambulance Services"],
    ["2167", "Amusement Parks and Arcades"],
    ["481", "Animal Feed Manufacturing"],
    ["127", "Animation and Post-production"],
    ["598", "Apparel Manufacturing"],
    ["112", "Appliances, Electrical, and Electronics Manufacturing"],
    ["852", "Architectural and Structural Metal Manufacturing"],
    ["50", "Architecture and Planning"],
    ["71", "Armed Forces"],
    ["703", "Artificial Rubber and Synthetic Fiber Manufacturing"],
    ["38", "Artists and Writers"],
    ["973", "Audio and Video Equipment Manufacturing"],
    ["147", "Automation Machinery Manufacturing"],
    ["52", "Aviation and Aerospace Component Manufacturing"],
    ["529", "Baked Goods Manufacturing"],
    ["41", "Banking"],
    ["2217", "Bars, Taverns, and Nightclubs"],
    ["2197", "Bed-and-Breakfasts, Hostels, Homestays"],
    ["142", "Beverage Manufacturing"],
    ["390", "Biomass Electric Power Generation"],
    ["12", "Biotechnology Research"],
    ["3134", "Blockchain Services"],
    ["3125", "Blogs"],
    ["861", "Boilers, Tanks, and Shipping Container Manufacturing"],
    ["82", "Book and Periodical Publishing"],
    ["1602", "Book Publishing"],
    ["562", "Breweries"],
    ["36", "Broadcast Media Production and Distribution"],
    ["406", "Building Construction"],
    ["453", "Building Equipment Contractors"],
    ["460", "Building Finishing Contractors"],
    ["436", "Building Structure and Exterior Contractors"],
    ["11", "Business Consulting and Services"],
    ["3129", "Business Content"],
    ["3128", "Business Intelligence Platforms"],
    ["1641", "Cable and Satellite Programming"],
    ["129", "Capital Markets"],
    ["2212", "Caterers"],
    ["54", "Chemical Manufacturing"],
    ["690", "Chemical Raw Materials Manufacturing"],
    ["2128", "Child Day Care Services"],
    ["2048", "Chiropractors"],
    ["2139", "Circuses and Magic Shows"],
    ["90", "Civic and Social Organizations"],
    ["51", "Civil Engineering"],
    ["1738", "Claims Adjusting, Actuarial Services"],
    ["773", "Clay and Refractory Products Manufacturing"],
    ["3252", "Climate Data and Analytics"],
    ["3251", "Climate Technology Product Manufacturing"],
    ["341", "Coal Mining"],
    ["1938", "Collection Agencies"],
    ["1798", "Commercial and Industrial Equipment Rental"],
    ["2247", "Commercial and Industrial Machinery Maintenance"],
    ["918", "Commercial and Service Industry Machinery Manufacturing"],
    ["964", "Communications Equipment Manufacturing"],
    ["2374", "Community Development and Urban Planning"],
    ["2115", "Community Services"],
    ["118", "Computer and Network Security"],
    ["109", "Computer Games"],
    ["3", "Computer Hardware Manufacturing"],
    ["5", "Computer Networking Products"],
    ["24", "Computers and Electronics Manufacturing"],
    ["2368", "Conservation Programs"],
    ["48", "Construction"],
    ["871", "Construction Hardware Manufacturing"],
    ["1786", "Consumer Goods Rental"],
    ["91", "Consumer Services"],
    ["3068", "Correctional Institutions"],
    ["2019", "Cosmetology and Barber Schools"],
    ["3065", "Courts of Law"],
    ["1673", "Credit Intermediation"],
    ["849", "Cutlery and Handtool Manufacturing"],
    ["65", "Dairy Product Manufacturing"],
    ["2135", "Dance Companies"],
    ["2458", "Data Infrastructure and Analytics"],
    ["3130", "Data Security Software Products"],
    ["1", "Defense and Space Manufacturing"],
    ["2045", "Dentists"],
    ["99", "Design Services"],
    ["3101", "Desktop Computing Software Products"],
    ["3244", "Digital Accessibility Services"],
    ["564", "Distilleries"],
    ["132", "E-Learning Providers"],
    ["2375", "Economic Programs"],
    ["1999", "Education"],
    ["69", "Education Administration Programs"],
    ["998", "Electric Lighting Equipment Manufacturing"],
    ["383", "Electric Power Generation"],
    ["382", "Electric Power Transmission, Control, and Distribution"],
    ["2468", "Electrical Equipment Manufacturing"],
    ["2240", "Electronic and Precision Equipment Maintenance"],
    ["3099", "Embedded Software Products"],
    ["2122", "Emergency and Relief Services"],
    ["3242", "Engineering Services"],
    ["935", "Engines and Power Transmission Equipment Manufacturing"],
    ["28", "Entertainment Providers"],
    ["388", "Environmental Quality Programs"],
    ["86", "Environmental Services"],
    ["1779", "Equipment Rental Services"],
    ["110", "Events Services"],
    ["76", "Executive Offices"],
    ["1923", "Executive Search Services"],
    ["840", "Fabricated Metal Products"],
    ["122", "Facilities Services"],
    ["2060", "Family Planning Centers"],
    ["63", "Farming"],
    ["201", "Farming, Ranching, Forestry"],
    ["615", "Fashion Accessories Manufacturing"],
    ["43", "Financial Services"],
    ["2025", "Fine Arts Schools"],
    ["3070", "Fire Protection"],
    ["66", "Fisheries"],
    ["2020", "Flight Training"],
    ["23", "Food and Beverage Manufacturing"],
    ["1339", "Food and Beverage Retail"],
    ["34", "Food and Beverage Services"],
    ["2255", "Footwear and Leather Goods Repair"],
    ["622", "Footwear Manufacturing"],
    ["298", "Forestry and Logging"],
    ["385", "Fossil Fuel Electric Power Generation"],
    ["87", "Freight and Package Transportation"],
    ["504", "Fruit and Vegetable Preserves Manufacturing"],
    ["3255", "Fuel Cell Manufacturing"],
    ["101", "Fundraising"],
    ["1742", "Funds and Trusts"],
    ["26", "Furniture and Home Furnishings Manufacturing"],
    ["29", "Gambling Facilities and Casinos"],
    ["389", "Geothermal Electric Power Generation"],
    ["779", "Glass Product Manufacturing"],
    ["145", "Glass, Ceramics and Concrete Manufacturing"],
    ["2179", "Golf Courses and Country Clubs"],
    ["75", "Government Administration"],
    ["148", "Government Relations Services"],
    ["140", "Graphic Design"],
    ["1495", "Ground Passenger Transportation"],
    ["2353", "Health and Human Services"],
    ["68", "Higher Education"],
    ["431", "Highway, Street, and Bridge Construction"],
    ["2161", "Historical Sites"],
    ["1905", "Holding Companies"],
    ["2074", "Home Health Care Services"],
    ["150", "Horticulture"],
    ["31", "Hospitality"],
    ["2081", "Hospitals"],
    ["14", "Hospitals and Health Care"],
    ["2194", "Hotels and Motels"],
    ["1080", "Household and Institutional Furniture Manufacturing"],
    ["1005", "Household Appliance Manufacturing"],
    ["2318", "Household Services"],
    ["2369", "Housing and Community Development"],
    ["3081", "Housing Programs"],
    ["137", "Human Resources Services"],
    ["923", "HVAC and Refrigeration Equipment Manufacturing"],
    ["384", "Hydroelectric Power Generation"],
    ["88", "Individual and Family Services"],
    ["135", "Industrial Machinery Manufacturing"],
    ["1909", "Industry Associations"],
    ["84", "Information Services"],
    ["42", "Insurance"],
    ["1737", "Insurance Agencies and Brokerages"],
    ["1743", "Insurance and Employee Benefit Funds"],
    ["1725", "Insurance Carriers"],
    ["3126", "Interior Design"],
    ["74", "International Affairs"],
    ["141", "International Trade and Development"],
    ["1285", "Internet Marketplace Platforms"],
    ["3124", "Internet News"],
    ["3132", "Internet Publishing"],
    ["1504", "Interurban and Rural Bus Services"],
    ["1720", "Investment Advice"],
    ["45", "Investment Banking"],
    ["46", "Investment Management"],
    ["96", "IT Services and IT Consulting"],
    ["3102", "IT System Custom Software Development"],
    ["3106", "IT System Data Services"],
    ["1855", "IT System Design Services"],
    ["3104", "IT System Installation and Disposal"],
    ["3103", "IT System Operations and Maintenance"],
    ["3107", "IT System Testing and Evaluation"],
    ["3105", "IT System Training and Support"],
    ["1965", "Janitorial Services"],
    ["2934", "Landscaping Services"],
    ["2029", "Language Schools"],
    ["2272", "Laundry and Drycleaning Services"],
    ["77", "Law Enforcement"],
    ["9", "Law Practice"],
    ["128", "Leasing Non-residential Real Estate"],
    ["1759", "Leasing Residential Real Estate"],
    ["616", "Leather Product Manufacturing"],
    ["10", "Legal Services"],
    ["72", "Legislative Offices"],
    ["85", "Libraries"],
    ["794", "Lime and Gypsum Products Manufacturing"],
    ["1696", "Loan Brokers"],
    ["55", "Machinery Manufacturing"],
    ["994", "Magnetic and Optical Media Manufacturing"],
    ["25", "Manufacturing"],
    ["95", "Maritime Transportation"],
    ["97", "Market Research"],
    ["1862", "Marketing Services"],
    ["1095", "Mattress and Blinds Manufacturing"],
    ["983", "Measuring and Control Instrument Manufacturing"],
    ["521", "Meat Products Manufacturing"],
    ["3133", "Media & Telecommunications"],
    ["126", "Media Production"],
    ["2069", "Medical and Diagnostic Laboratories"],
    ["17", "Medical Equipment Manufacturing"],
    ["13", "Medical Practices"],
    ["139", "Mental Health Care"],
    ["345", "Metal Ore Mining"],
    ["883", "Metal Treatments"],
    ["887", "Metal Valve, Ball, and Roller Manufacturing"],
    ["928", "Metalworking Machinery Manufacturing"],
    ["2391", "Military and International Affairs"],
    ["56", "Mining"],
    ["3100", "Mobile Computing Software Products"],
    ["2214", "Mobile Food Services"],
    ["3131", "Mobile Gaming Apps"],
    ["53", "Motor Vehicle Manufacturing"],
    ["1042", "Motor Vehicle Parts Manufacturing"],
    ["1611", "Movies and Sound Recording"],
    ["35", "Movies, Videos and Sound"],
    ["2159", "Museums"],
    ["37", "Museums, Historical Sites, and Zoos"],
    ["115", "Musicians"],
    ["114", "Nanotechnology Research"],
    ["397", "Natural Gas Distribution"],
    ["3096", "Natural Gas Extraction"],
    ["81", "Newspaper Publishing"],
    ["100", "Non-profit Organizations"],
    ["356", "Nonmetallic Mineral Mining"],
    ["413", "Nonresidential Building Construction"],
    ["386", "Nuclear Electric Power Generation"],
    ["2091", "Nursing Homes and Residential Care Facilities"],
    ["1916", "Office Administration"],
    ["1090", "Office Furniture and Fixtures Manufacturing"],
    ["679", "Oil and Coal Product Manufacturing"],
    ["57", "Oil and Gas"],
    ["3095", "Oil Extraction"],
    ["332", "Oil, Gas, and Mining"],
    ["1445", "Online and Mail Order Retail"],
    ["113", "Online Audio and Video Media"],
    ["2401", "Operations Consulting"],
    ["2050", "Optometrists"],
    ["2063", "Outpatient Care Centers"],
    ["123", "Outsourcing and Offshoring Consulting"],
    ["146", "Packaging and Containers Manufacturing"],
    ["722", "Paint, Coating, and Adhesive Manufacturing"],
    ["61", "Paper and Forest Product Manufacturing"],
    ["1745", "Pension Funds"],
    ["39", "Performing Arts"],
    ["2130", "Performing Arts and Spectator Sports"],
    ["1600", "Periodical Publishing"],
    ["2258", "Personal and Laundry Services"],
    ["18", "Personal Care Product Manufacturing"],
    ["2259", "Personal Care Services"],
    ["2282", "Pet Services"],
    ["15", "Pharmaceutical Manufacturing"],
    ["131", "Philanthropic Fundraising Services"],
    ["136", "Photography"],
    ["2054", "Physical, Occupational and Speech Therapists"],
    ["2040", "Physicians"],
    ["1520", "Pipeline Transportation"],
    ["743", "Plastics and Rubber Product Manufacturing"],
    ["117", "Plastics Manufacturing"],
    ["107", "Political Organizations"],
    ["1573", "Postal Services"],
    ["67", "Primary and Secondary Education"],
    ["807", "Primary Metal Manufacturing"],
    ["83", "Printing Services"],
    ["1911", "Professional Organizations"],
    ["1810", "Professional Services"],
    ["105", "Professional Training and Coaching"],
    ["2360", "Public Assistance Programs"],
    ["2358", "Public Health"],
    ["79", "Public Policy Offices"],
    ["98", "Public Relations and Communications Services"],
    ["78", "Public Safety"],
    ["2143", "Racetracks"],
    ["1633", "Radio and Television Broadcasting"],
    ["1481", "Rail Transportation"],
    ["62", "Railroad Equipment Manufacturing"],
    ["64", "Ranching"],
    ["256", "Ranching and Fisheries"],
    ["44", "Real Estate"],
    ["1770", "Real Estate Agents and Brokers"],
    ["1757", "Real Estate and Equipment Rental Services"],
    ["40", "Recreational Facilities"],
    ["3256", "Regenerative Design"],
    ["89", "Religious Institutions"],
    ["3241", "Renewable Energy Equipment Manufacturing"],
    ["3240", "Renewable Energy Power Generation"],
    ["144", "Renewable Energy Semiconductor Manufacturing"],
    ["2225", "Repair and Maintenance"],
    ["70", "Research Services"],
    ["408", "Residential Building Construction"],
    ["32", "Restaurants"],
    ["27", "Retail"],
    ["19", "Retail Apparel and Fashion"],
    ["1319", "Retail Appliances, Electrical, and Electronic Equipment"],
    ["3186", "Retail Art Dealers"],
    ["111", "Retail Art Supplies"],
    ["1409", "Retail Books and Printed News"],
    ["1324", "Retail Building Materials and Garden Equipment"],
    ["1423", "Retail Florists"],
    ["1309", "Retail Furniture and Home Furnishings"],
    ["1370", "Retail Gasoline"],
    ["22", "Retail Groceries"],
    ["1359", "Retail Health and Personal Care Products"],
    ["143", "Retail Luxury Goods and Jewelry"],
    ["1292", "Retail Motor Vehicles"],
    ["1407", "Retail Musical Instruments"],
    ["138", "Retail Office Equipment"],
    ["1424", "Retail Office Supplies and Gifts"],
    ["3250", "Retail Pharmacies"],
    ["1431", "Retail Recyclable Materials & Used Merchandise"],
    ["2253", "Reupholstery and Furniture Repair"],
    ["3247", "Robot Manufacturing"],
    ["3248", "Robotics Engineering"],
    ["763", "Rubber Products Manufacturing"],
    ["1649", "Satellite Telecommunications"],
    ["1678", "Savings Institutions"],
    ["1512", "School and Employee Bus Services"],
    ["528", "Seafood Product Manufacturing"],
    ["2012", "Secretarial Schools"],
    ["1713", "Securities and Commodity Exchanges"],
    ["121", "Security and Investigations"],
    ["1956", "Security Guards and Patrol Services"],
    ["1958", "Security Systems Services"],
    ["7", "Semiconductor Manufacturing"],
    ["3243", "Services for Renewable Energy"],
    ["2112", "Services for the Elderly and Disabled"],
    ["1625", "Sheet Music Publishing"],
    ["58", "Shipbuilding"],
    ["1517", "Shuttles and Special Needs Transportation Services"],
    ["1532", "Sightseeing Transportation"],
    ["2181", "Skiing Facilities"],
    ["3254", "Smart Meter Manufacturing"],
    ["727", "Soap and Cleaning Product Manufacturing"],
    ["3127", "Social Networking Platforms"],
    ["4", "Software Development"],
    ["387", "Solar Electric Power Generation"],
    ["1623", "Sound Recording"],
    ["3089", "Space Research and Technology"],
    ["435", "Specialty Trade Contractors"],
    ["33", "Spectator Sports"],
    ["20", "Sporting Goods Manufacturing"],
    ["2027", "Sports and Recreation Instruction"],
    ["2142", "Sports Teams and Clubs"],
    ["873", "Spring and Wire Product Manufacturing"],
    ["104", "Staffing and Recruiting"],
    ["404", "Steam and Air-Conditioning Supply"],
    ["102", "Strategic Management Services"],
    ["428", "Subdivision of Land"],
    ["495", "Sugar and Confectionery Product Manufacturing"],
    ["3249", "Surveying and Mapping Services"],
    ["1505", "Taxi and Limousine Services"],
    ["2018", "Technical and Vocational Training"],
    ["6", "Technology, Information and Internet"],
    ["1594", "Technology, Information and Media"],
    ["8", "Telecommunications"],
    ["1644", "Telecommunications Carriers"],
    ["1931", "Telephone Call Centers"],
    ["1925", "Temporary Help Services"],
    ["60", "Textile Manufacturing"],
    ["2133", "Theater Companies"],
    ["130", "Think Tanks"],
    ["21", "Tobacco Manufacturing"],
    ["108", "Translation and Localization"],
    ["1029", "Transportation Equipment Manufacturing"],
    ["3085", "Transportation Programs"],
    ["116", "Transportation, Logistics, Supply Chain and Storage"],
    ["30", "Travel Arrangements"],
    ["92", "Truck Transportation"],
    ["1750", "Trusts and Estates"],
    ["876", "Turned Products and Fastener Manufacturing"],
    ["1497", "Urban Transit Services"],
    ["59", "Utilities"],
    ["3086", "Utilities Administration"],
    ["419", "Utility System Construction"],
    ["2226", "Vehicle Repair and Maintenance"],
    ["106", "Venture Capital and Private Equity Principals"],
    ["16", "Veterinary Services"],
    ["2125", "Vocational Rehabilitation Services"],
    ["93", "Warehousing and Storage"],
    ["1981", "Waste Collection"],
    ["1986", "Waste Treatment and Disposal"],
    ["400", "Water Supply and Irrigation Systems"],
    ["398", "Water, Waste, Steam, and Air Conditioning Services"],
    ["124", "Wellness and Fitness Services"],
    ["133", "Wholesale"],
    ["1267", "Wholesale Alcoholic Beverages"],
    ["1222", "Wholesale Apparel and Sewing Supplies"],
    ["1171", "Wholesale Appliances, Electrical, and Electronics"],
    ["49", "Wholesale Building Materials"],
    ["1257", "Wholesale Chemical and Allied Products"],
    ["1157", "Wholesale Computer Equipment"],
    ["1221", "Wholesale Drugs and Sundries"],
    ["1231", "Wholesale Food and Beverage"],
    ["1230", "Wholesale Footwear"],
    ["1137", "Wholesale Furniture and Home Furnishings"],
    ["1178", "Wholesale Hardware, Plumbing, Heating Equipment"],
    ["134", "Wholesale Import and Export"],
    ["1208", "Wholesale Luxury Goods and Jewelry"],
    ["1187", "Wholesale Machinery"],
    ["1166", "Wholesale Metals and Minerals"],
    ["1128", "Wholesale Motor Vehicles and Parts"],
    ["1212", "Wholesale Paper Products"],
    ["1262", "Wholesale Petroleum and Petroleum Products"],
    ["1153", "Wholesale Photography Equipment and Supplies"],
    ["1250", "Wholesale Raw Farm Products"],
    ["1206", "Wholesale Recyclable Materials"],
    ["2489", "Wind Electric Power Generation"],
    ["2500", "Wineries"],
    ["119", "Wireless Services"],
    ["625", "Women's Handbag Manufacturing"],
    ["784", "Wood Product Manufacturing"],
    ["103", "Writing and Editing"],
    ["2163", "Zoos and Botanical Gardens"],
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
    const normalized = value.trim();
    try {
      encodeURIComponent(normalized);
    } catch (error) {
      if (error instanceof URIError) throw new SpecError(`${path} contains an invalid Unicode surrogate`);
      throw error;
    }
    return normalized;
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
      industries: INDUSTRIES,
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
