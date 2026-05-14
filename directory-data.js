const directoryKey = "motherEarthDirectoryListings";
const claimKey = "motherEarthDirectoryClaims";
const researchQueueKey = "motherEarthDirectoryResearchQueue";

const publicEventDateHints = {
  "https://www.downtownkankakee.com/farmers-market": "2026-05-09",
  "https://www.visitkankakeecounty.com/event?eventid=3010": "2026-05-09",
  "https://www.downtownkankakee.com/events/sunset-stroll-north": "2026-05-29",
  "https://www.abraham-hicks.com/workshopsandcruises/": "2026-05-16",
  "https://www.mindvalley.com/events": "2026-05-16",
  "https://bodymindspiritfest.org/": "2026-06-05",
  "Kankakee Farmers Market": "2026-05-09",
  "Sunset Stroll North": "2026-05-29",
  "Merchant Street Music Fest 2026": "2026-07-24",
  "Mindvalley Events": "2026-05-16",
  "Body Mind Spirit Fest": "2026-06-05"
};

export const directoryCategories = [
  "Affiliate opportunity",
  "Spiritual healer",
  "Healing center",
  "Hypnotist / inner work guide",
  "Hypnotherapist",
  "QHHT practitioner",
  "Channeler / channeled teachings",
  "Yoga studio",
  "Wellness center",
  "Teacher / mentor guide",
  "Herbalist / natural living",
  "Farmers market",
  "Green business",
  "Event host / retreat",
  "Summit / conference",
  "Festival / expo",
  "Creator platform",
  "Maker / vendor",
  "Community ally"
];

export const directoryTagOptions = [
  "affiliate opportunity",
  "aromatherapy",
  "breathwork",
  "chakra balancing",
  "classes",
  "community hub",
  "energy work",
  "events",
  "farmers market",
  "green business",
  "healing arts",
  "herbal healing",
  "hypnosis",
  "intuitive guidance",
  "law of attraction",
  "local food",
  "maker/vendor",
  "meditation",
  "multiple speakers",
  "natural living",
  "QHHT",
  "retreats",
  "reiki",
  "sound therapy",
  "spiritual guidance",
  "spiritual channeling",
  "venue",
  "wellness center",
  "workshops",
  "yoga"
];

export const directoryScopes = [
  "Local Chapter 001 area",
  "Regional",
  "Online / broader network",
  "Traveling / event-based"
];

export function getDirectoryListings() {
  const storedListings = JSON.parse(localStorage.getItem(directoryKey) || "[]");
  const { listings: hydratedListings, changed } = hydrateDirectoryListings(storedListings);
  if (changed) {
    localStorage.setItem(directoryKey, JSON.stringify(hydratedListings));
  }
  return hydratedListings.map(normalizeStoredDirectoryItem);
}

export function saveDirectoryListings(listings) {
  localStorage.setItem(directoryKey, JSON.stringify(listings));
}

export function createDirectoryListing(payload) {
  const normalized = normalizeDirectoryPayload(payload);
  const listing = {
    id: crypto.randomUUID(),
    name: normalized.name,
    category: normalized.category,
    tags: normalized.tags,
    scope: normalized.scope,
    city: normalized.city,
    state: normalized.state,
    zip: normalized.zip,
    summary: normalized.summary,
    offerings: normalized.offerings,
    website: normalized.website,
    social: normalized.social,
    contactEmail: normalized.contactEmail,
    affiliateStatus: normalized.affiliateStatus,
    affiliateApplyUrl: normalized.affiliateApplyUrl,
    affiliateLink: normalized.affiliateLink,
    affiliateTerms: normalized.affiliateTerms,
    affiliateNotes: normalized.affiliateNotes,
    surfacePriority: normalized.surfacePriority,
    eventDate: normalized.eventDate,
    sourceUrl: normalized.sourceUrl,
    confidence: normalized.confidence,
    status: normalized.status || "published",
    claimStatus: "unclaimed",
    claimedByMemberId: "",
    adminNotes: normalized.adminNotes,
    source: payload.source || "admin_seeded",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const listings = getDirectoryListings();
  listings.unshift(listing);
  saveDirectoryListings(listings);
  return listing;
}

export function normalizeDirectoryPayload(payload) {
  const baseTags = normalizeTags(payload.tags || payload.tag || "");
  return {
    name: payload.name || payload.title || "",
    category: payload.category || "Community ally",
    tags: baseTags.length ? baseTags : inferTags(payload),
    scope: payload.scope || "Regional",
    city: payload.city || "",
    state: payload.state || "",
    zip: payload.zip || "",
    summary: payload.summary || payload.description || "",
    offerings: payload.offerings || payload.keywords || "",
    website: payload.website || payload.url || "",
    social: payload.social || "",
    contactEmail: payload.contactEmail || payload.email || "",
    affiliateStatus: payload.affiliateStatus || "not-started",
    affiliateApplyUrl: payload.affiliateApplyUrl || payload.partnerUrl || payload.applicationUrl || "",
    affiliateLink: payload.affiliateLink || "",
    affiliateTerms: payload.affiliateTerms || payload.commission || "",
    affiliateNotes: payload.affiliateNotes || "",
    surfacePriority: payload.surfacePriority || "standard",
    eventDate: payload.eventDate || "",
    status: payload.status || "private",
    adminNotes: payload.adminNotes || payload.notes || "",
    sourceUrl: payload.sourceUrl || payload.source || "",
    researchedBy: payload.researchedBy || "OpenClaw",
    confidence: payload.confidence || ""
  };
}

export function updateDirectoryListing(listingId, updates) {
  const listings = getDirectoryListings().map((listing) => {
    if (listing.id !== listingId) return listing;
    return {
      ...listing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
  });
  saveDirectoryListings(listings);
  return listings.find((listing) => listing.id === listingId);
}

export function getDirectoryResearchQueue() {
  return JSON.parse(localStorage.getItem(researchQueueKey) || "[]").map(normalizeStoredDirectoryItem);
}

export function saveDirectoryResearchQueue(items) {
  localStorage.setItem(researchQueueKey, JSON.stringify(items));
}

export function removeDirectoryResearchItem(itemId) {
  const queue = getDirectoryResearchQueue().filter((item) => item.id !== itemId);
  saveDirectoryResearchQueue(queue);
}

export function addDirectoryResearchItems(items) {
  const existingKeys = new Set([
    ...getDirectoryResearchQueue().map(candidateKey),
    ...getDirectoryListings().map(candidateKey)
  ]);
  const uniqueItems = items.filter((item) => !existingKeys.has(candidateKey(item)));
  const queueItems = uniqueItems.map((item) => ({
    id: crypto.randomUUID(),
    ...normalizeDirectoryPayload(item),
    reviewStatus: "needs-review",
    importedAt: new Date().toISOString()
  }));
  const queue = getDirectoryResearchQueue();
  saveDirectoryResearchQueue([...queueItems, ...queue]);
  return queueItems;
}

function candidateKey(item) {
  const normalized = normalizeDirectoryPayload(item);
  return `${normalized.name.toLowerCase()}|${normalized.sourceUrl || normalized.website || normalized.social}`;
}

function normalizeStoredDirectoryItem(item) {
  const sourceKey = item.sourceUrl || item.website || item.social || "";
  const eventDate = item.eventDate || publicEventDateHints[sourceKey] || publicEventDateHints[item.name] || "";
  return {
    ...item,
    eventDate,
    tags: normalizeTags(item.tags).length ? normalizeTags(item.tags) : inferTags(item)
  };
}

function hydrateDirectoryListings(items) {
  let changed = false;
  const listings = items.map((item) => {
    const sourceKey = item.sourceUrl || item.website || item.social || "";
    const eventDate = item.eventDate || publicEventDateHints[sourceKey] || publicEventDateHints[item.name] || "";
    if (eventDate && item.eventDate !== eventDate) {
      changed = true;
      return { ...item, eventDate };
    }
    return item;
  });
  return { listings, changed };
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return [...new Set(tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean))];
  }
  return [...new Set(String(tags || "")
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean))];
}

function inferTags(item) {
  const haystack = `${item.name || ""} ${item.category || ""} ${item.summary || ""} ${item.offerings || ""}`.toLowerCase();
  const tags = directoryTagOptions.filter((tag) => haystack.includes(tag));
  if (haystack.includes("hypnot")) tags.push("hypnosis");
  if (haystack.includes("farmer")) tags.push("farmers market", "local food");
  if (haystack.includes("yoga")) tags.push("yoga", "classes");
  if (haystack.includes("wellness")) tags.push("wellness center");
  if (haystack.includes("healing center")) tags.push("healing center");
  if (haystack.includes("retreat")) tags.push("retreats", "venue");
  if (haystack.includes("reiki")) tags.push("reiki", "healing arts");
  return [...new Set(tags)];
}

export function updateDirectoryResearchItem(itemId, updates) {
  const queue = getDirectoryResearchQueue().map((item) => {
    if (item.id !== itemId) return item;
    return { ...item, ...updates, updatedAt: new Date().toISOString() };
  });
  saveDirectoryResearchQueue(queue);
  return queue.find((item) => item.id === itemId);
}

export function publishDirectoryResearchItem(itemId) {
  const queue = getDirectoryResearchQueue();
  const item = queue.find((entry) => entry.id === itemId);
  if (!item) return null;
  const listing = createDirectoryListing({ ...item, status: "published", source: "agent_research" });
  removeDirectoryResearchItem(itemId);
  return listing;
}

export function getDirectoryClaims() {
  return JSON.parse(localStorage.getItem(claimKey) || "[]");
}

export function saveDirectoryClaims(claims) {
  localStorage.setItem(claimKey, JSON.stringify(claims));
}

export function createDirectoryClaim(payload) {
  const claim = {
    id: crypto.randomUUID(),
    listingId: payload.listingId,
    listingName: payload.listingName,
    claimantName: payload.claimantName,
    claimantEmail: payload.claimantEmail,
    claimantPhone: payload.claimantPhone || "",
    relationship: payload.relationship || "",
    notes: payload.notes || "",
    status: "pending",
    createdAt: new Date().toISOString(),
    reviewedAt: ""
  };
  const claims = getDirectoryClaims();
  claims.unshift(claim);
  saveDirectoryClaims(claims);
  return claim;
}

export function updateDirectoryClaim(claimId, updates) {
  const claims = getDirectoryClaims().map((claim) => {
    if (claim.id !== claimId) return claim;
    return {
      ...claim,
      ...updates,
      reviewedAt: updates.status && updates.status !== "pending" ? new Date().toISOString() : claim.reviewedAt
    };
  });
  saveDirectoryClaims(claims);
  return claims.find((claim) => claim.id === claimId);
}
