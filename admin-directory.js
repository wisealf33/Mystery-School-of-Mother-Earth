import { getMembers, requireMember, signOut } from "./auth.js";
import { openClawDirectoryCandidates } from "./data/openclaw-directory-candidates.js";
import { nationalEventAffiliateCandidates } from "./data/national-event-affiliate-candidates.js";
import { qhhtChannelingCandidates } from "./data/qhht-channeling-candidates.js";
import { wireResponsiveNav } from "./nav.js";
import {
  createDirectoryListing,
  directoryCategories,
  directoryScopes,
  directoryTagOptions,
  addDirectoryResearchItems,
  getDirectoryClaims,
  getDirectoryListings,
  getDirectoryResearchQueue,
  publishDirectoryResearchItem,
  removeDirectoryResearchItem,
  updateDirectoryClaim,
  updateDirectoryListing
} from "./directory-data.js";

const adminMember = requireMember({ adminOnly: true });

if (adminMember) {
  document.querySelector(".dashboard-header small").textContent = `admin: ${adminMember.name}`;
  document.querySelector("#admin-logout-button").addEventListener("click", () => {
    signOut();
    window.location.href = "login.html";
  });
}

const directoryForm = document.querySelector("#directory-form");
const directoryStatus = document.querySelector("#directory-status");
const directorySummary = document.querySelector("#directory-summary");
const adminDirectoryList = document.querySelector("#admin-directory-list");
const claimList = document.querySelector("#claim-list");
const directoryMapPlanner = document.querySelector("#directory-map-planner");
const agentImportForm = document.querySelector("#agent-import-form");
const agentImportStatus = document.querySelector("#agent-import-status");
const researchQueueList = document.querySelector("#research-queue-list");
const affiliateOpportunityList = document.querySelector("#affiliate-opportunity-list");
const directorySearch = document.querySelector("#directory-search");
const directoryStatusFilter = document.querySelector("#directory-status-filter");
const directoryCategoryFilter = document.querySelector("#directory-category-filter");
const directoryTagFilter = document.querySelector("#directory-tag-filter");
const primaryNav = document.querySelector("#primary-nav");
const menuToggle = document.querySelector(".menu-toggle");

document.querySelector("#directory-category").innerHTML = directoryCategories
  .map((category) => `<option value="${category}">${category}</option>`)
  .join("");
document.querySelector("#directory-scope").innerHTML = directoryScopes
  .map((scope) => `<option value="${scope}">${scope}</option>`)
  .join("");
document.querySelector("#directory-tag-options").innerHTML = directoryTagOptions
  .map((tag) => `<option value="${tag}"></option>`)
  .join("");
directoryCategoryFilter.innerHTML += directoryCategories
  .map((category) => `<option value="${category}">${category}</option>`)
  .join("");
directoryTagFilter.innerHTML += directoryTagOptions
  .map((tag) => `<option value="${tag}">${tag}</option>`)
  .join("");

const autoImported = addDirectoryResearchItems([
  ...openClawDirectoryCandidates,
  ...nationalEventAffiliateCandidates,
  ...qhhtChannelingCandidates
]);
if (autoImported.length) {
  agentImportStatus.textContent = `${autoImported.length} OpenClaw candidate${autoImported.length === 1 ? "" : "s"} loaded into the review queue.`;
}

wireResponsiveNav(primaryNav, menuToggle);

function renderDirectoryAdmin() {
  const listings = getDirectoryListings();
  const claims = getDirectoryClaims();
  const published = listings.filter((listing) => listing.status === "published");
  const unclaimed = listings.filter((listing) => listing.claimStatus !== "claimed");
  const pendingClaims = claims.filter((claim) => claim.status === "pending");
  const researchQueue = getDirectoryResearchQueue().filter((item) => item.reviewStatus === "needs-review");
  const needsReview = researchQueue.filter((item) => item.reviewStatus === "needs-review");

  directorySummary.innerHTML = `
    <article><span>Total listings</span><strong>${listings.length}</strong></article>
    <article><span>Published</span><strong>${published.length}</strong></article>
    <article><span>Unclaimed</span><strong>${unclaimed.length}</strong></article>
    <article><span>Research review</span><strong>${needsReview.length}</strong></article>
    <article><span>Pending claims</span><strong>${pendingClaims.length}</strong></article>
    <article><span>Claimed</span><strong>${listings.length - unclaimed.length}</strong></article>
  `;

  researchQueueList.innerHTML = researchQueue.length
    ? researchQueue.map(renderResearchItem).join("")
    : `<p class="empty-state">No agent research imported yet.</p>`;
  if (needsReview.length) {
    researchQueueList.insertAdjacentHTML("afterbegin", `
      <div class="queue-actions">
        <button class="button quiet" data-publish-all-research type="button">Add all as public listings</button>
      </div>
    `);
  }

  claimList.innerHTML = claims.length
    ? claims.map(renderClaim).join("")
    : `<p class="empty-state">No claim requests yet.</p>`;

  const filteredListings = filterDirectoryListings(listings);
  adminDirectoryList.innerHTML = filteredListings.length
    ? renderListingTable(filteredListings)
    : `<p class="empty-state">No directory listings yet. Add the first aligned person or organization.</p>`;
  renderAffiliateOpportunities(listings);
  renderZipPlanner(listings);

  document.querySelectorAll("[data-claim-status]").forEach((select) => {
    select.addEventListener("change", () => {
      updateDirectoryClaim(select.dataset.claimStatus, { status: select.value });
      renderDirectoryAdmin();
    });
  });

  document.querySelectorAll("[data-listing-status]").forEach((select) => {
    select.addEventListener("change", () => {
      updateDirectoryListing(select.dataset.listingStatus, { status: select.value });
      renderDirectoryAdmin();
    });
  });

  document.querySelectorAll("[data-surface-priority]").forEach((select) => {
    select.addEventListener("change", () => {
      updateDirectoryListing(select.dataset.surfacePriority, { surfacePriority: select.value });
      renderDirectoryAdmin();
    });
  });

  document.querySelectorAll("[data-claim-member]").forEach((select) => {
    select.addEventListener("change", () => {
      const listingId = select.dataset.claimMember;
      const memberId = select.value;
      updateDirectoryListing(listingId, {
        claimStatus: memberId ? "claimed" : "unclaimed",
        claimedByMemberId: memberId
      });
      renderDirectoryAdmin();
    });
  });

  document.querySelectorAll("[data-affiliate-status-quick]").forEach((select) => {
    select.addEventListener("change", () => {
      updateDirectoryListing(select.dataset.affiliateStatusQuick, { affiliateStatus: select.value });
      renderDirectoryAdmin();
    });
  });

  document.querySelectorAll("[data-publish-research]").forEach((button) => {
    button.addEventListener("click", () => {
      publishDirectoryResearchItem(button.dataset.publishResearch);
      renderDirectoryAdmin();
    });
  });

  document.querySelectorAll("[data-dismiss-research]").forEach((button) => {
    button.addEventListener("click", () => {
      removeDirectoryResearchItem(button.dataset.dismissResearch);
      renderDirectoryAdmin();
    });
  });

  document.querySelectorAll("[data-publish-all-research]").forEach((button) => {
    button.addEventListener("click", () => {
      getDirectoryResearchQueue()
        .filter((item) => item.reviewStatus === "needs-review")
        .forEach((item) => publishDirectoryResearchItem(item.id));
      renderDirectoryAdmin();
    });
  });

  document.querySelectorAll("[data-affiliate-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      updateDirectoryListing(form.dataset.affiliateForm, {
        affiliateStatus: data.affiliateStatus,
        affiliateApplyUrl: data.affiliateApplyUrl,
        affiliateLink: data.affiliateLink,
        affiliateTerms: data.affiliateTerms,
        affiliateNotes: data.affiliateNotes
      });
      renderDirectoryAdmin();
    });
  });
}

function renderResearchItem(item) {
  return `
    <div class="deliverable-item scheduled">
      <div>
        <h4>${item.name || "Unnamed research item"}</h4>
        <p>${item.category} · ${item.scope}</p>
        ${renderTags(item.tags)}
        <p>${[item.city, item.state, item.zip].filter(Boolean).join(", ") || "Location not recorded"}</p>
        ${item.summary ? `<p>${item.summary}</p>` : ""}
        ${item.sourceUrl ? `<p><strong>Source:</strong> ${item.sourceUrl}</p>` : ""}
        <p><strong>Status:</strong> ${item.reviewStatus}${item.confidence ? ` · Confidence: ${item.confidence}` : ""}</p>
      </div>
      <div class="inline-actions">
        <button class="button quiet" data-publish-research="${item.id}" type="button">Add as public listing</button>
        <button class="button quiet" data-dismiss-research="${item.id}" type="button">Dismiss</button>
      </div>
    </div>
  `;
}

function renderClaim(claim) {
  return `
    <div class="deliverable-item ${claim.status === "approved" ? "fulfilled" : claim.status === "pending" ? "scheduled" : ""}">
      <div>
        <h4>${claim.listingName}</h4>
        <p><strong>Claimant:</strong> ${claim.claimantName} · ${claim.claimantEmail}</p>
        <p>${claim.claimantPhone || "No phone"}${claim.relationship ? ` · ${claim.relationship}` : ""}</p>
        ${claim.notes ? `<p>${claim.notes}</p>` : ""}
      </div>
      <select data-claim-status="${claim.id}" aria-label="Claim review status">
        <option value="pending" ${claim.status === "pending" ? "selected" : ""}>Pending</option>
        <option value="approved" ${claim.status === "approved" ? "selected" : ""}>Approved</option>
        <option value="rejected" ${claim.status === "rejected" ? "selected" : ""}>Rejected</option>
      </select>
    </div>
  `;
}

function renderListing(listing) {
  const members = getMembers();
  return `
    <div class="deliverable-item ${listing.claimStatus === "claimed" ? "fulfilled" : ""}">
      <div>
        <h4>${listing.name}</h4>
        <p>${listing.category} · ${listing.scope}</p>
        ${renderTags(listing.tags)}
        <p>${locationLine(listing)}</p>
        <p><strong>Claim:</strong> ${listing.claimStatus} · <strong>Affiliate:</strong> ${listing.affiliateStatus || "not-started"}</p>
        <p><strong>Priority:</strong> ${listing.surfacePriority || "standard"}${listing.eventDate ? ` · <strong>Event date:</strong> ${listing.eventDate}` : ""}</p>
      </div>
      <div class="directory-admin-controls">
        <select data-listing-status="${listing.id}" aria-label="Directory listing visibility">
          <option value="published" ${listing.status === "published" ? "selected" : ""}>Published</option>
          <option value="private" ${listing.status === "private" ? "selected" : ""}>Private draft</option>
        </select>
        <select data-surface-priority="${listing.id}" aria-label="Public priority">
          <option value="standard" ${listing.surfacePriority === "standard" ? "selected" : ""}>Standard</option>
          <option value="featured" ${listing.surfacePriority === "featured" ? "selected" : ""}>Featured</option>
          <option value="spotlight" ${listing.surfacePriority === "spotlight" ? "selected" : ""}>Spotlight</option>
        </select>
        <select data-claim-member="${listing.id}" aria-label="Connect listing to member">
          <option value="">Unclaimed</option>
          ${members.map((member) => `<option value="${member.id}" ${listing.claimedByMemberId === member.id ? "selected" : ""}>${member.name}</option>`).join("")}
        </select>
      </div>
    </div>
  `;
}

function renderListingTable(listings) {
  return `
    <div class="directory-table-wrap">
      <table class="directory-admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Location</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Affiliate</th>
            <th>Claim</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          ${listings.map(renderListingRow).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderListingRow(listing) {
  const members = getMembers();
  return `
    <tr>
      <td>
        <strong>${listing.name}</strong>
        ${renderTags((listing.tags || []).slice(0, 4))}
      </td>
      <td>${listing.category}</td>
      <td>${locationLine(listing)}</td>
      <td>
        <select data-listing-status="${listing.id}" aria-label="Directory listing visibility">
          <option value="published" ${listing.status === "published" ? "selected" : ""}>Published</option>
          <option value="private" ${listing.status === "private" ? "selected" : ""}>Private draft</option>
        </select>
      </td>
      <td>
        <select data-surface-priority="${listing.id}" aria-label="Public priority">
          <option value="standard" ${listing.surfacePriority === "standard" ? "selected" : ""}>Standard</option>
          <option value="featured" ${listing.surfacePriority === "featured" ? "selected" : ""}>Featured</option>
          <option value="spotlight" ${listing.surfacePriority === "spotlight" ? "selected" : ""}>Spotlight</option>
        </select>
      </td>
      <td>
        <select data-affiliate-status-quick="${listing.id}" aria-label="Affiliate status">
          <option value="not-started" ${listing.affiliateStatus === "not-started" ? "selected" : ""}>Not started</option>
          <option value="researching" ${listing.affiliateStatus === "researching" ? "selected" : ""}>Researching</option>
          <option value="applied" ${listing.affiliateStatus === "applied" ? "selected" : ""}>Applied</option>
          <option value="approved" ${listing.affiliateStatus === "approved" ? "selected" : ""}>Approved</option>
          <option value="rejected" ${listing.affiliateStatus === "rejected" ? "selected" : ""}>Rejected</option>
          <option value="not-available" ${listing.affiliateStatus === "not-available" ? "selected" : ""}>Not available</option>
        </select>
      </td>
      <td>
        <select data-claim-member="${listing.id}" aria-label="Connect listing to member">
          <option value="">Unclaimed</option>
          ${members.map((member) => `<option value="${member.id}" ${listing.claimedByMemberId === member.id ? "selected" : ""}>${member.name}</option>`).join("")}
        </select>
      </td>
      <td>
        <details class="compact-details">
          <summary>Open</summary>
          <div>
            <p>${listing.summary || "No summary recorded."}</p>
            <p><strong>Offerings:</strong> ${listing.offerings || "Not recorded"}</p>
            <p><strong>Website:</strong> ${listing.website || "Not recorded"}</p>
            <p><strong>Social:</strong> ${listing.social || "Not recorded"}</p>
            <p><strong>Affiliate link:</strong> ${listing.affiliateLink || "Not saved"}</p>
            <p><strong>Admin notes:</strong> ${listing.adminNotes || "None"}</p>
          </div>
        </details>
      </td>
    </tr>
  `;
}

function filterDirectoryListings(listings) {
  const query = directorySearch.value.trim().toLowerCase();
  const status = directoryStatusFilter.value;
  const category = directoryCategoryFilter.value;
  const tag = directoryTagFilter.value;
  return listings.filter((listing) => {
    const haystack = [
      listing.name,
      listing.category,
      listing.city,
      listing.state,
      listing.zip,
      listing.scope,
      listing.summary,
      listing.offerings,
      ...(listing.tags || [])
    ].join(" ").toLowerCase();
    return (!query || haystack.includes(query))
      && (status === "all" || listing.status === status)
      && (category === "all" || listing.category === category)
      && (tag === "all" || (listing.tags || []).includes(tag));
  });
}

function renderAffiliateOpportunities(listings) {
  const opportunities = listings.filter((listing) => isAffiliateCandidate(listing));
  affiliateOpportunityList.innerHTML = opportunities.length
    ? opportunities.map(renderAffiliateOpportunity).join("")
    : `<p class="empty-state">No affiliate-style directory listings yet. Add or approve listings tagged affiliate opportunity, summit, expo, platform, sponsor, or exhibitors.</p>`;
}

function renderAffiliateOpportunity(listing) {
  const applyUrl = listing.affiliateApplyUrl || listing.sourceUrl || listing.website || listing.social || "";
  return `
    <details class="affiliate-card compact-work-card">
      <summary>
        <span>
          <strong>${listing.name}</strong>
          <small>${listing.category} · ${listing.scope}</small>
        </span>
        <span class="member-status ${listing.affiliateStatus === "approved" ? "active" : "inactive"}">${listing.affiliateStatus || "not-started"}</span>
      </summary>
      <div class="compact-work-body">
        ${renderTags(listing.tags)}
        <p>${listing.summary || "No summary recorded."}</p>
        <form class="affiliate-form" data-affiliate-form="${listing.id}">
          <label>Status
            <select name="affiliateStatus">
              <option value="not-started" ${listing.affiliateStatus === "not-started" ? "selected" : ""}>Not started</option>
              <option value="researching" ${listing.affiliateStatus === "researching" ? "selected" : ""}>Researching</option>
              <option value="applied" ${listing.affiliateStatus === "applied" ? "selected" : ""}>Applied</option>
              <option value="approved" ${listing.affiliateStatus === "approved" ? "selected" : ""}>Approved</option>
              <option value="rejected" ${listing.affiliateStatus === "rejected" ? "selected" : ""}>Rejected</option>
              <option value="not-available" ${listing.affiliateStatus === "not-available" ? "selected" : ""}>Not available</option>
            </select>
          </label>
          <label>Signup / application URL
            <input name="affiliateApplyUrl" value="${listing.affiliateApplyUrl || ""}" placeholder="https://...">
          </label>
          <label class="full">Your affiliate link
            <input name="affiliateLink" value="${listing.affiliateLink || ""}" placeholder="Paste your approved affiliate link here">
          </label>
          <label>Commission / terms
            <input name="affiliateTerms" value="${listing.affiliateTerms || ""}" placeholder="Example: 30%, 50%, referral terms unknown">
          </label>
          <label class="full">Affiliate notes
            <textarea name="affiliateNotes" rows="3" placeholder="Login used, approval notes, promo rules, payout notes...">${listing.affiliateNotes || ""}</textarea>
          </label>
          <div class="affiliate-actions">
            ${applyUrl ? `<a class="button quiet" href="${applyUrl}" target="_blank" rel="noopener">Open signup</a>` : ""}
            <button class="button primary" type="submit">Save affiliate details</button>
          </div>
        </form>
        </div>
    </details>
  `;
}

function isAffiliateCandidate(listing) {
  const tags = listing.tags || [];
  const category = (listing.category || "").toLowerCase();
  return listing.affiliateLink
    || tags.some((tag) => ["affiliate opportunity", "summit", "expo", "sponsors", "exhibitors", "large creator platform", "multiple speakers"].includes(tag))
    || ["affiliate opportunity", "summit / conference", "festival / expo", "creator platform"].includes(category);
}

function renderTags(tags = []) {
  if (!tags.length) return "";
  return `<div class="tag-list">${tags.map((tag) => `<span>${tag}</span>`).join("")}</div>`;
}

function locationLine(listing) {
  return [listing.city, listing.state, listing.zip].filter(Boolean).join(", ") || "Location not recorded";
}

function renderZipPlanner(listings) {
  const zipCounts = listings.reduce((counts, listing) => {
    if (!listing.zip) return counts;
    counts[listing.zip] = (counts[listing.zip] || 0) + 1;
    return counts;
  }, {});
  const zips = Object.entries(zipCounts).sort((a, b) => b[1] - a[1]);

  directoryMapPlanner.innerHTML = zips.length
    ? zips.map(([zip, count]) => `<span class="zip-pin"><strong>${zip}</strong>${count} listing${count === 1 ? "" : "s"}</span>`).join("")
    : `<p class="empty-state">Add ZIP codes to listings to start building the map layer.</p>`;
}

directoryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(directoryForm).entries());
  createDirectoryListing(data);
  directoryForm.reset();
  directoryStatus.textContent = "Directory listing added.";
  renderDirectoryAdmin();
});

agentImportForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const rawJson = new FormData(agentImportForm).get("agentJson").trim();
  if (!rawJson) {
    agentImportStatus.textContent = "Paste OpenClaw research JSON first.";
    return;
  }

  try {
    const parsed = JSON.parse(rawJson);
    const items = Array.isArray(parsed) ? parsed : [parsed];
    const imported = addDirectoryResearchItems(items);
    agentImportForm.reset();
    agentImportStatus.textContent = `${imported.length} research item${imported.length === 1 ? "" : "s"} imported for review.`;
    renderDirectoryAdmin();
  } catch (error) {
    agentImportStatus.textContent = "That JSON could not be imported. Check the formatting and try again.";
  }
});

[directorySearch, directoryStatusFilter, directoryCategoryFilter, directoryTagFilter].forEach((control) => {
  control.addEventListener("input", renderDirectoryAdmin);
  control.addEventListener("change", renderDirectoryAdmin);
});

renderDirectoryAdmin();
