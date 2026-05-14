import { getCurrentMember, signOut } from "./auth.js";
import {
  createDirectoryClaim,
  directoryCategories,
  directoryTagOptions,
  getDirectoryListings
} from "./directory-data.js";

const foundingCategories = [
  {
    name: "Spiritual Healing Arts",
    category: "healing",
    label: "Healing Arts",
    location: "Founding category",
    offer: "Energy workers, intuitive healers, spiritual counselors, and practitioners offering grounded sacred support.",
    stage: "Now gathering"
  },
  {
    name: "Hypnosis & Inner Work",
    category: "hypnosis",
    label: "Hypnotists",
    location: "Founding category",
    offer: "Hypnotists, subconscious re-patterning guides, trauma-informed inner work practitioners, and transformation coaches.",
    stage: "Now gathering"
  },
  {
    name: "Herbal & Natural Living",
    category: "herbal",
    label: "Herbalists",
    location: "Founding category",
    offer: "Herbalists, plant people, natural body care makers, food wisdom teachers, and seasonal living guides.",
    stage: "Now gathering"
  }
];

const cityCoordinates = {
  Beecher: [41.3406, -87.6214],
  Bourbonnais: [41.1417, -87.8750],
  Bradley: [41.1419, -87.8612],
  Frankfort: [41.4959, -87.8487],
  Kankakee: [41.1200, -87.8612],
  Manteno: [41.2506, -87.8314],
  Mokena: [41.5261, -87.8892],
  Monee: [41.4200, -87.7417],
  "Orland Park": [41.6303, -87.8539],
  Peotone: [41.3323, -87.7853],
  "Tinley Park": [41.5734, -87.7845]
};

const zipCoordinates = {
  "60401": [41.3406, -87.6214],
  "60423": [41.4959, -87.8487],
  "60448": [41.5261, -87.8892],
  "60449": [41.4200, -87.7417],
  "60462": [41.6303, -87.8539],
  "60467": [41.6028, -87.8912],
  "60468": [41.3323, -87.7853],
  "60477": [41.5734, -87.7845],
  "60901": [41.1200, -87.8612],
  "60914": [41.1417, -87.8750],
  "60915": [41.1419, -87.8612],
  "60950": [41.2506, -87.8314]
};

const directory = document.querySelector("#directory-list");
const searchInput = document.querySelector("#directory-search");
const categoryFilter = document.querySelector("#directory-category-filter");
const tagFilter = document.querySelector("#directory-tag-filter");
const sortSelect = document.querySelector("#directory-sort");
const locationStatus = document.querySelector("#location-status");
const primaryNav = document.querySelector("#primary-nav");
const menuToggle = document.querySelector(".menu-toggle");
const directoryFeed = document.querySelector("#directory-feed");
let visitorLocation = JSON.parse(localStorage.getItem("motherEarthVisitorLocation") || "null");

function renderSessionNav() {
  const member = getCurrentMember();
  if (!member) return;
  primaryNav.innerHTML = `
    <a href="index.html">Website</a>
    <a href="journal.html">Journal</a>
    <a href="directory.html">Directory</a>
    <a href="member.html">My Dashboard</a>
    ${member.role === "admin" && member.status === "active" ? `<a href="manage.html">Admin</a>` : ""}
    <button class="nav-button" id="site-logout-button" type="button">Log out</button>
  `;
  document.querySelector("#site-logout-button").addEventListener("click", () => {
    signOut();
    window.location.reload();
  });
}

function wireMenu() {
  if (!menuToggle) return;
  menuToggle.addEventListener("click", () => {
    const isOpen = primaryNav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.textContent = isOpen ? "Close" : "Menu";
  });
  primaryNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      primaryNav.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.textContent = "Menu";
    });
  });
}

function populateFilters() {
  categoryFilter.innerHTML += directoryCategories.map((category) => `<option value="${category}">${category}</option>`).join("");
  tagFilter.innerHTML += directoryTagOptions.map((tag) => `<option value="${tag}">${tag}</option>`).join("");
}

function getListings() {
  const seededListings = getDirectoryListings()
    .filter((listing) => listing.status === "published")
    .map((listing) => {
      const coords = coordinatesFor(listing);
      return {
        id: listing.id,
        name: listing.name,
        category: normalizeCategory(listing.category),
        label: listing.category,
        rawCategory: listing.category,
        tags: listing.tags || [],
        location: [listing.city, listing.state].filter(Boolean).join(", ") || listing.scope,
        city: listing.city,
        zip: listing.zip,
        offer: listing.summary || listing.offerings || "Aligned directory listing.",
        actionUrl: listing.affiliateLink || listing.website || listing.social || "",
        actionLabel: listing.affiliateLink ? "Visit partner link" : "Visit website",
        isAffiliate: Boolean(listing.affiliateLink),
        surfacePriority: listing.surfacePriority || "standard",
        eventDate: listing.eventDate || "",
        stage: listing.claimStatus === "claimed" ? "Claimed listing" : "Unclaimed listing",
        canClaim: listing.claimStatus !== "claimed",
        createdAt: listing.createdAt || "",
        coords,
        distance: visitorLocation && coords ? distanceMiles(visitorLocation, coords) : null
      };
    });
  return seededListings.length ? seededListings : foundingCategories;
}

function renderDirectory() {
  const query = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;
  const tag = tagFilter.value;
  const sort = sortSelect.value;
  const allListings = getListings().filter((listing) => {
    const haystack = `${listing.name} ${listing.rawCategory || listing.label} ${listing.tags?.join(" ")} ${listing.location} ${listing.offer}`.toLowerCase();
    return (!query || haystack.includes(query))
      && (!category || listing.rawCategory === category)
      && (!tag || listing.tags?.includes(tag));
  });
  const feedListings = buildFeedSections(allListings, sort);
  renderFeed(feedListings, allListings);
  const listings = sortListings(allListings, sort);

  directory.innerHTML = listings.length ? listings.map((listing) => `
    <article class="member-card">
      <span class="tag">${listing.label}</span>
      <h3>${listing.name}</h3>
      ${listing.tags?.length ? `<div class="tag-list">${listing.tags.slice(0, 6).map((item) => `<span>${item}</span>`).join("")}</div>` : ""}
      <p>${listing.offer}</p>
      <p><strong>${listing.location || "Location varies"}</strong>${listing.distance !== null ? ` · ${Math.round(listing.distance)} miles away` : ""} · ${listing.stage}</p>
      ${listing.actionUrl ? `<a class="button quiet" href="${listing.actionUrl}" target="_blank" rel="${listing.isAffiliate ? "sponsored " : ""}noopener">${listing.actionLabel}</a>` : ""}
      ${listing.canClaim ? `<button class="button quiet claim-button" data-claim="${listing.id}" type="button">Claim this listing</button>` : ""}
    </article>
  `).join("") : `<p class="empty-state">No listings match those filters yet.</p>`;

  document.querySelectorAll("[data-claim]").forEach((button) => {
    button.addEventListener("click", () => renderClaimForm(button.dataset.claim));
  });
}

function renderFeed(sections, listings = []) {
  if (!directoryFeed) return;
  const displaySections = sections.length ? sections : [{
    kicker: "Public browse",
    title: "Start here without location",
    description: "You can browse the public feed right away. Sharing a ZIP code or location will simply improve the nearby suggestions.",
    items: sortFeedListings(listings, "curated").slice(0, 6).map((listing) => ({
      ...listing,
      feedLabel: listing.eventDate ? "Upcoming" : listing.surfacePriority === "spotlight" ? "Spotlight" : listing.surfacePriority === "featured" ? "Featured" : "Directory",
      displayDate: listing.eventDate ? formatEventDate(listing.eventDate) : ""
    }))
  }];
  directoryFeed.innerHTML = displaySections.map((section) => `
    <section class="feed-section">
      <div class="section-heading">
        <p class="section-kicker">${section.kicker}</p>
        <h3>${section.title}</h3>
        <p>${section.description}</p>
      </div>
      <div class="feed-grid">
        ${section.items.map((item) => `
          <article class="member-card feed-card">
            <span class="tag">${item.feedLabel}</span>
            <h4>${item.name}</h4>
            ${item.tags?.length ? `<div class="tag-list">${item.tags.slice(0, 4).map((tag) => `<span>${tag}</span>`).join("")}</div>` : ""}
            <p>${item.offer}</p>
            <p><strong>${item.location || "Location varies"}</strong>${item.displayDate ? ` · ${item.displayDate}` : ""}</p>
            ${item.actionUrl ? `<a class="button quiet" href="${item.actionUrl}" target="_blank" rel="${item.isAffiliate ? "sponsored " : ""}noopener">${item.actionLabel}</a>` : ""}
          </article>
        `).join("")}
      </div>
    </section>
  `).join("");
}

function buildFeedSections(listings, sort) {
  const eventListings = listings.filter(isEventLike);
  const featuredListings = listings.filter((listing) => !isEventLike(listing) && isFeatured(listing));
  const remainingListings = listings.filter((listing) => !isEventLike(listing) && !isFeatured(listing));
  const sortMode = sort === "name" ? "name" : sort === "nearby" ? "nearby" : "curated";

  return [
    {
      kicker: "Up next",
      title: "Upcoming events and gatherings",
      description: "Listings with event energy and a scheduled date are shown here first.",
      items: sortFeedListings(eventListings, sortMode).slice(0, 6).map((listing) => ({
        ...listing,
        feedLabel: listing.eventDate ? "Upcoming" : "Recent event",
        displayDate: listing.eventDate ? formatEventDate(listing.eventDate) : "Date coming soon"
      }))
    },
    {
      kicker: "Featured",
      title: "Affiliate and promoted listings",
      description: "Approved affiliates and featured items are given extra visibility here.",
      items: sortFeedListings(featuredListings, sortMode).slice(0, 6).map((listing) => ({
        ...listing,
        feedLabel: listing.surfacePriority === "spotlight" ? "Spotlight" : listing.isAffiliate ? "Affiliate" : "Featured",
        displayDate: listing.eventDate ? formatEventDate(listing.eventDate) : ""
      }))
    },
    {
      kicker: "Browse",
      title: "Everything else in the directory",
      description: "The full searchable directory continues below this feed.",
      items: sortFeedListings(remainingListings, sortMode).slice(0, 6).map((listing) => ({
        ...listing,
        feedLabel: "Directory",
        displayDate: listing.eventDate ? formatEventDate(listing.eventDate) : ""
      }))
    }
  ].filter((section) => section.items.length);
}

function sortFeedListings(listings, sort) {
  const items = [...listings];
  if (sort === "nearby" && visitorLocation) {
    return items.sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999));
  }
  if (sort === "name") {
    return items.sort((a, b) => a.name.localeCompare(b.name));
  }
  return items.sort((a, b) => {
    const aRank = feedRank(a);
    const bRank = feedRank(b);
    if (aRank !== bRank) return aRank - bRank;
    return compareFreshness(b, a);
  });
}

function feedRank(listing) {
  if (isEventLike(listing)) return 0;
  if (isFeatured(listing)) return 1;
  return 2;
}

function compareFreshness(a, b) {
  return toStamp(b) - toStamp(a);
}

function toStamp(listing) {
  const stamp = listing.eventDate || listing.createdAt || "";
  const value = Date.parse(stamp);
  return Number.isNaN(value) ? 0 : value;
}

function formatRelativeStamp(value) {
  if (!value) return "Recently added";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently added";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatEventDate(value) {
  if (!value) return "Date coming soon";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date coming soon";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function isEventLike(listing) {
  const haystack = `${listing.rawCategory || ""} ${listing.label || ""} ${listing.tags?.join(" ")} ${listing.offer || ""}`.toLowerCase();
  return Boolean(listing.eventDate)
    || listing.surfacePriority === "spotlight"
    || listing.surfacePriority === "featured"
    || haystack.includes("event")
    || haystack.includes("summit")
    || haystack.includes("festival")
    || haystack.includes("workshop")
    || haystack.includes("conference")
    || haystack.includes("market")
    || haystack.includes("retreat")
    || haystack.includes("multiple speakers")
    || haystack.includes("expo");
}

function isFeatured(listing) {
  return listing.surfacePriority === "featured"
    || listing.surfacePriority === "spotlight"
    || listing.affiliateStatus === "approved"
    || Boolean(listing.affiliateLink);
}

function sortListings(listings, sort) {
  if (sort === "nearby" && visitorLocation) {
    return [...listings].sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999));
  }
  if (sort === "name") {
    return [...listings].sort((a, b) => a.name.localeCompare(b.name));
  }
  return [...listings].sort((a, b) => {
    const aPriority = overallRank(a);
    const bPriority = overallRank(b);
    if (aPriority !== bPriority) return aPriority - bPriority;
    return compareFreshness(b, a) || a.name.localeCompare(b.name);
  });
}

function overallRank(listing) {
  if (listing.surfacePriority === "spotlight") return 0;
  if (listing.surfacePriority === "featured") return 1;
  if (listing.affiliateStatus === "approved" || listing.affiliateLink) return 2;
  if (isEventLike(listing)) return 3;
  return 4;
}

function coordinatesFor(listing) {
  if (listing.zip && zipCoordinates[listing.zip]) return zipCoordinates[listing.zip];
  if (listing.city && cityCoordinates[listing.city]) return cityCoordinates[listing.city];
  return null;
}

function distanceMiles(start, end) {
  const toRad = (value) => value * Math.PI / 180;
  const [lat1, lon1] = start;
  const [lat2, lon2] = end;
  const radius = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normalizeCategory(category = "") {
  const value = category.toLowerCase();
  if (value.includes("hypnotist") || value.includes("hypnotherapist")) return "hypnosis";
  if (value.includes("healer") || value.includes("healing")) return "healing";
  if (value.includes("herbal") || value.includes("natural")) return "herbal";
  if (value.includes("farmers market")) return "green-business";
  if (value.includes("green") || value.includes("maker") || value.includes("vendor")) return "green-business";
  return "teacher";
}

function renderClaimForm(listingId) {
  const listing = getDirectoryListings().find((item) => item.id === listingId);
  if (!listing) return;
  const claimSection = document.querySelector("#claim-listing");
  claimSection.hidden = false;
  claimSection.scrollIntoView({ behavior: "smooth", block: "start" });
  document.querySelector("#claim-listing-name").textContent = listing.name;
  document.querySelector("#claim-listing-id").value = listing.id;
  document.querySelector("#claim-listing-title").value = listing.name;
}

document.querySelector("#use-location-button").addEventListener("click", () => {
  if (!navigator.geolocation) {
    locationStatus.textContent = "Location is not available in this browser. You can enter a ZIP code instead.";
    return;
  }
  locationStatus.textContent = "Waiting for browser permission...";
  navigator.geolocation.getCurrentPosition((position) => {
    visitorLocation = [position.coords.latitude, position.coords.longitude];
    localStorage.setItem("motherEarthVisitorLocation", JSON.stringify(visitorLocation));
    sortSelect.value = "nearby";
    locationStatus.textContent = "Nearby suggestions are turned on.";
    renderDirectory();
  }, () => {
    locationStatus.textContent = "Location permission was not granted. You can enter a ZIP code instead.";
  });
});

document.querySelector("#zip-location-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const zip = new FormData(event.currentTarget).get("zip")?.trim();
  if (!zipCoordinates[zip]) {
    locationStatus.textContent = "That ZIP is not in the local suggestion map yet.";
    return;
  }
  visitorLocation = zipCoordinates[zip];
  localStorage.setItem("motherEarthVisitorLocation", JSON.stringify(visitorLocation));
  sortSelect.value = "nearby";
  locationStatus.textContent = `Nearby suggestions are using ${zip}.`;
  renderDirectory();
});

document.querySelector("#claim-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const claimForm = event.currentTarget;
  const data = Object.fromEntries(new FormData(claimForm).entries());
  createDirectoryClaim(data);
  claimForm.reset();
  document.querySelector("#claim-status").textContent = "Your claim request has been saved for administrator review.";
});

[searchInput, categoryFilter, tagFilter, sortSelect].forEach((control) => {
  control.addEventListener("input", renderDirectory);
  control.addEventListener("change", renderDirectory);
});

populateFilters();
renderDirectory();
renderSessionNav();
wireMenu();
if (!visitorLocation && locationStatus) {
  locationStatus.textContent = "You can browse the public feed without location. Location just helps nearby suggestions rise to the top.";
}
