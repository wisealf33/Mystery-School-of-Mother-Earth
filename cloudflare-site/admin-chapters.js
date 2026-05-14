import { getMembers, requireMember, signOut } from "./auth.js";
import { assignMemberToChapter, eligibleForChapter, getChapters, removeMemberFromChapter } from "./chapters.js";
import { chapterLocationCandidates } from "./data/chapter-location-candidates.js";
import { wireResponsiveNav } from "./nav.js";

const adminMember = requireMember({ adminOnly: true });
const primaryNav = document.querySelector("#primary-nav");
const menuToggle = document.querySelector(".menu-toggle");

if (adminMember) {
  document.querySelector(".dashboard-header small").textContent = `admin: ${adminMember.name}`;
  document.querySelector("#admin-logout-button").addEventListener("click", () => {
    signOut();
    window.location.href = "login.html";
  });
}

wireResponsiveNav(primaryNav, menuToggle);

const chapterList = document.querySelector("#chapter-list");
const eventPlansKey = "motherEarthChapterEventPlans";
const chapterLocationsKey = "motherEarthChapterLocations";
const chapterLocationResearchKey = "motherEarthChapterLocationResearch";
const chapterEventForm = document.querySelector("#chapter-event-form");
const chapterEventStatus = document.querySelector("#chapter-event-status");
const eventMathPreview = document.querySelector("#event-math-preview");
const chapterEventList = document.querySelector("#chapter-event-list");
const chapterLocationForm = document.querySelector("#chapter-location-form");
const chapterLocationStatus = document.querySelector("#chapter-location-status");
const chapterLocationList = document.querySelector("#chapter-location-list");
const locationSummary = document.querySelector("#location-summary");
const chapterLocationResearchList = document.querySelector("#chapter-location-research-list");
const locationAreaFilter = document.querySelector("#location-area-filter");
const locationCapacityFilter = document.querySelector("#location-capacity-filter");
const locationFitFilter = document.querySelector("#location-fit-filter");

function getEventPlans() {
  return JSON.parse(localStorage.getItem(eventPlansKey) || "[]");
}

function saveEventPlans(plans) {
  localStorage.setItem(eventPlansKey, JSON.stringify(plans));
}

function getChapterLocations() {
  return JSON.parse(localStorage.getItem(chapterLocationsKey) || "[]");
}

function saveChapterLocations(locations) {
  localStorage.setItem(chapterLocationsKey, JSON.stringify(locations));
}

function getLocationResearch() {
  return JSON.parse(localStorage.getItem(chapterLocationResearchKey) || "[]");
}

function saveLocationResearch(items) {
  localStorage.setItem(chapterLocationResearchKey, JSON.stringify(items));
}

function locationKey(item) {
  return `${(item.name || "").toLowerCase()}|${item.sourceUrl || item.address || ""}`;
}

function addLocationResearchItems(items) {
  const existing = new Set([
    ...getLocationResearch().map(locationKey),
    ...getChapterLocations().map(locationKey)
  ]);
  const nextItems = items.filter((item) => !existing.has(locationKey(item))).map((item) => ({
    id: crypto.randomUUID(),
    ...item,
    reviewStatus: "needs-review",
    importedAt: new Date().toISOString()
  }));
  saveLocationResearch([...nextItems, ...getLocationResearch()]);
  return nextItems;
}

function approveLocationResearch(itemId) {
  const item = getLocationResearch().find((entry) => entry.id === itemId);
  if (!item) return;
  const locations = getChapterLocations();
  locations.unshift({
    id: crypto.randomUUID(),
    chapterId: "chapter-001",
    ...item,
    status: item.status || "lead",
    createdAt: new Date().toISOString()
  });
  saveChapterLocations(locations);
  dismissLocationResearch(itemId);
}

function dismissLocationResearch(itemId) {
  saveLocationResearch(getLocationResearch().filter((item) => item.id !== itemId));
}

addLocationResearchItems(chapterLocationCandidates);

function populateLocationAreaFilter() {
  const current = locationAreaFilter.value;
  const cities = [...new Set([
    ...getChapterLocations().map((item) => item.city).filter(Boolean),
    ...getLocationResearch().map((item) => item.city).filter(Boolean)
  ])].sort();
  locationAreaFilter.innerHTML = `<option value="">Choose area</option>${cities.map((city) => `<option value="${city}">${city}</option>`).join("")}`;
  locationAreaFilter.value = cities.includes(current) ? current : "";
}

function renderChapters() {
  const chapters = getChapters();
  const members = getMembers();

  chapterList.innerHTML = chapters.map((chapter) => {
    const chapterMembers = members.filter((member) => chapter.memberIds.includes(member.id));
    const eligibleMembers = members.filter((member) => {
      return member.status === "active" && eligibleForChapter(member, chapter) && !chapter.memberIds.includes(member.id);
    });
    const nonEligibleMembers = members.filter((member) => {
      return member.status === "active" && !eligibleForChapter(member, chapter) && !chapter.memberIds.includes(member.id);
    });

    return `
      <article class="chapter-card">
        <div class="chapter-top">
          <div>
            <span class="member-status ${chapter.status}">${chapter.status}</span>
            <h3>${chapter.name}</h3>
            <p>${chapter.region}</p>
          </div>
          <strong>${chapterMembers.length}</strong>
        </div>
        <div class="chapter-meta">
          <p><strong>Chapter number:</strong> ${chapter.number}</p>
          <p><strong>ZIP codes:</strong> ${chapter.zipCodes.join(", ")}</p>
          <p><strong>Focus area:</strong> ${chapter.cityFocus}</p>
        </div>
        <p>${chapter.description}</p>
        <div class="chapter-actions">
          <label>Add eligible local member
            <select data-chapter-add="${chapter.id}">
              <option value="">Select member</option>
              ${eligibleMembers.map((member) => `<option value="${member.id}">${member.name} · ${member.location || "No location"}</option>`).join("")}
            </select>
          </label>
          <label>Manual assignment
            <select data-chapter-manual="${chapter.id}">
              <option value="">Select active member</option>
              ${nonEligibleMembers.map((member) => `<option value="${member.id}">${member.name} · ${member.location || "No location"}</option>`).join("")}
            </select>
          </label>
        </div>
        <div class="deliverable-list">
          ${chapterMembers.length ? chapterMembers.map((member) => `
            <div class="deliverable-item fulfilled">
              <div>
                <h4><a class="text-link" href="admin-member-profile.html?id=${member.id}">${member.name}</a></h4>
                <p>${member.email} · ${member.location || "Location not recorded"}</p>
              </div>
              <div class="inline-actions">
                <a class="button quiet" href="admin-member-profile.html?id=${member.id}">Open profile</a>
                <button class="button quiet" data-chapter-remove="${chapter.id}" data-member-id="${member.id}" type="button">Remove</button>
              </div>
            </div>
          `).join("") : `<p class="empty-state">No members assigned to this chapter yet.</p>`}
        </div>
      </article>
    `;
  }).join("");

  document.querySelectorAll("[data-chapter-add], [data-chapter-manual]").forEach((select) => {
    select.addEventListener("change", () => {
      if (!select.value) return;
      const chapterId = select.dataset.chapterAdd || select.dataset.chapterManual;
      assignMemberToChapter(select.value, chapterId);
      renderChapters();
    });
  });

  document.querySelectorAll("[data-chapter-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      removeMemberFromChapter(button.dataset.memberId, button.dataset.chapterRemove);
      renderChapters();
    });
  });
}

renderChapters();

function eventMath(data) {
  const attendees = Number(data.attendees || 0);
  const ticketPrice = Number(data.ticketPrice || 0);
  const booths = Number(data.booths || 0);
  const boothPrice = Number(data.boothPrice || 0);
  const speakerSlots = Number(data.speakerSlots || 0);
  const speakerPrice = Number(data.speakerPrice || 0);
  const venueCost = Number(data.venueCost || 0);
  const marketingCost = Number(data.marketingCost || 0);
  const otherCost = Number(data.otherCost || 0);
  const ticketRevenue = attendees * ticketPrice;
  const boothRevenue = booths * boothPrice;
  const speakerRevenue = speakerSlots * speakerPrice;
  const grossRevenue = ticketRevenue + boothRevenue + speakerRevenue;
  const expenses = venueCost + marketingCost + otherCost;
  return { ticketRevenue, boothRevenue, speakerRevenue, grossRevenue, expenses, net: grossRevenue - expenses };
}

function applyVenueToPlan(plan, venue = {}) {
  return {
    ...plan,
    attendees: venue.capacity || plan.attendees,
    booths: venue.booths || plan.booths,
    venueCost: venue.cost || plan.venueCost || 0,
    otherCost: Number(plan.otherCost || 0) + Number(venue.requiredExtras || 0)
  };
}

function renderEventMathPreview() {
  const data = Object.fromEntries(new FormData(chapterEventForm).entries());
  const math = eventMath(data);
  eventMathPreview.innerHTML = `
    <article><span>Ticket revenue</span><strong>${formatMoney(math.ticketRevenue)}</strong></article>
    <article><span>Booth revenue</span><strong>${formatMoney(math.boothRevenue)}</strong></article>
    <article><span>Speaker/session</span><strong>${formatMoney(math.speakerRevenue)}</strong></article>
    <article><span>Expenses</span><strong>${formatMoney(math.expenses)}</strong></article>
    <article><span>Projected net</span><strong>${formatMoney(math.net)}</strong></article>
  `;
}

function renderEventPlans() {
  const plans = getEventPlans();
  const locations = getChapterLocations();
  chapterEventList.innerHTML = plans.length ? plans.map((plan) => {
    const selectedVenue = getSelectedVenue(plan);
    const math = eventMath(applyVenueToPlan(plan, selectedVenue));
    const readiness = eventReadiness(plan);
    return `
      <details class="compact-work-card event-plan-item">
        <summary>
          <span>
            <strong>${plan.name}</strong>
            <small>${plan.type}${plan.targetDate ? ` · ${plan.targetDate}` : ""} · ${selectedVenue?.name || "Venue scouting"}</small>
          </span>
          <span class="member-status ${readiness.ready ? "active" : "inactive"}">${plan.stage || "idea"} · ${formatMoney(math.net)} net</span>
        </summary>
        <div class="compact-work-body">
          <div class="event-math-preview mini">
            <article><span>Gross</span><strong>${formatMoney(math.grossRevenue)}</strong></article>
            <article><span>Expenses</span><strong>${formatMoney(math.expenses)}</strong></article>
            <article><span>Net</span><strong>${formatMoney(math.net)}</strong></article>
          </div>
          <div class="event-launch-panel">
            <label>Planning stage
              <select data-event-stage="${plan.id}">
                ${["idea", "scouting", "ready-to-launch", "promoting", "complete"].map((stage) => `<option value="${stage}" ${plan.stage === stage ? "selected" : ""}>${stage}</option>`).join("")}
              </select>
            </label>
            <p><strong>Launch readiness:</strong> ${readiness.ready ? "Ready to promote" : readiness.missing.join(", ")}</p>
          </div>
          <div class="venue-option-list">
            <h4>Venue options</h4>
            ${plan.venues?.length ? plan.venues.map((venue) => renderVenueOption(plan, venue)).join("") : `<p class="empty-state">No venue options added yet.</p>`}
          </div>
          <form class="venue-option-form" data-venue-form="${plan.id}">
            ${locations.length ? `
              <label class="full">Load saved location
                <select data-location-to-event="${plan.id}">
                  <option value="">Choose saved location</option>
                  ${locations.map((location) => `<option value="${location.id}">${location.name} · ${location.city || "City TBD"} · ${location.capacity || 0} capacity</option>`).join("")}
                </select>
              </label>
            ` : ""}
            <label>Location name
              <input name="name" required placeholder="Example: Frankfort Park District">
            </label>
            <label>City
              <input name="city" placeholder="Frankfort">
            </label>
            <label>Capacity
              <input type="number" name="capacity" min="0" value="${plan.attendees || 50}">
            </label>
            <label>Booth spaces
              <input type="number" name="booths" min="0" value="${plan.booths || 12}">
            </label>
            <label>Venue cost
              <input type="number" name="cost" min="0" value="0">
            </label>
            <label>Required extras
              <input type="number" name="requiredExtras" min="0" value="0">
            </label>
            <label class="full">Venue notes
              <textarea name="notes" rows="3" placeholder="Parking, tables, kitchen, insurance, deposit, contact person, availability..."></textarea>
            </label>
            <button class="button quiet" type="submit">Add venue option</button>
          </form>
          <p><strong>People to invite:</strong> ${plan.people || "Not listed yet"}</p>
          <p><strong>Notes:</strong> ${plan.notes || "No notes yet"}</p>
          <div class="inline-actions">
            <button class="button quiet" data-event-copy="${plan.id}" type="button">Load into form</button>
            ${readiness.ready ? `<button class="button primary" data-event-launch="${plan.id}" type="button">Mark promoting</button>` : ""}
            <button class="button quiet" data-event-delete="${plan.id}" type="button">Delete</button>
          </div>
        </div>
      </details>
    `;
  }).join("") : `<p class="empty-state">No event plans saved yet.</p>`;

  document.querySelectorAll("[data-event-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      saveEventPlans(getEventPlans().filter((plan) => plan.id !== button.dataset.eventDelete));
      renderEventPlans();
    });
  });

  document.querySelectorAll("[data-event-copy]").forEach((button) => {
    button.addEventListener("click", () => {
      const plan = getEventPlans().find((item) => item.id === button.dataset.eventCopy);
      if (!plan) return;
      Object.entries(plan).forEach(([key, value]) => {
        if (chapterEventForm.elements[key]) chapterEventForm.elements[key].value = value;
      });
      renderEventMathPreview();
    });
  });

  document.querySelectorAll("[data-event-stage]").forEach((select) => {
    select.addEventListener("change", () => {
      updateEventPlan(select.dataset.eventStage, { stage: select.value });
      renderEventPlans();
    });
  });

  document.querySelectorAll("[data-event-launch]").forEach((button) => {
    button.addEventListener("click", () => {
      updateEventPlan(button.dataset.eventLaunch, { stage: "promoting", launchedAt: new Date().toISOString() });
      renderEventPlans();
    });
  });

  document.querySelectorAll("[data-venue-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const plans = getEventPlans().map((plan) => {
        if (plan.id !== form.dataset.venueForm) return plan;
        return {
          ...plan,
          venues: [
            ...(plan.venues || []),
            {
              id: crypto.randomUUID(),
              ...data,
              selected: !(plan.venues || []).length,
              createdAt: new Date().toISOString()
            }
          ]
        };
      });
      saveEventPlans(plans);
      renderEventPlans();
    });
  });

  document.querySelectorAll("[data-location-to-event]").forEach((select) => {
    select.addEventListener("change", () => {
      if (!select.value) return;
      const location = getChapterLocations().find((item) => item.id === select.value);
      if (!location) return;
      addVenueToEvent(select.dataset.locationToEvent, {
        name: location.name,
        city: location.city,
        capacity: location.capacity,
        booths: location.booths,
        cost: location.cost,
        requiredExtras: location.requiredExtras,
        notes: `${location.fits || ""}${location.notes ? ` | ${location.notes}` : ""}`,
        locationId: location.id
      });
      renderEventPlans();
    });
  });

  document.querySelectorAll("[data-select-venue]").forEach((button) => {
    button.addEventListener("click", () => {
      const [eventId, venueId] = button.dataset.selectVenue.split("|");
      const plans = getEventPlans().map((plan) => {
        if (plan.id !== eventId) return plan;
        return {
          ...plan,
          venues: (plan.venues || []).map((venue) => ({ ...venue, selected: venue.id === venueId }))
        };
      });
      saveEventPlans(plans);
      renderEventPlans();
    });
  });

  document.querySelectorAll("[data-delete-venue]").forEach((button) => {
    button.addEventListener("click", () => {
      const [eventId, venueId] = button.dataset.deleteVenue.split("|");
      const plans = getEventPlans().map((plan) => {
        if (plan.id !== eventId) return plan;
        const venues = (plan.venues || []).filter((venue) => venue.id !== venueId);
        return { ...plan, venues };
      });
      saveEventPlans(plans);
      renderEventPlans();
    });
  });
}

function addVenueToEvent(eventId, venueData) {
  const plans = getEventPlans().map((plan) => {
    if (plan.id !== eventId) return plan;
    return {
      ...plan,
      venues: [
        ...(plan.venues || []),
        {
          id: crypto.randomUUID(),
          ...venueData,
          selected: !(plan.venues || []).length,
          createdAt: new Date().toISOString()
        }
      ]
    };
  });
  saveEventPlans(plans);
}

function renderLocations() {
  populateLocationAreaFilter();
  const hasActiveLocationFilter = locationFiltersActive();
  const locations = filterLocations(getChapterLocations());
  const research = filterLocations(getLocationResearch());
  const allLocations = getChapterLocations();
  const allResearch = getLocationResearch();
  const activeSet = hasActiveLocationFilter ? locations : allLocations;
  const available = activeSet.filter((location) => location.status === "available").length;
  const contacted = activeSet.filter((location) => ["contacted", "pricing-needed", "available"].includes(location.status)).length;
  const averageCost = activeSet.length
    ? activeSet.reduce((sum, location) => sum + Number(location.cost || 0) + Number(location.requiredExtras || 0), 0) / activeSet.length
    : 0;

  locationSummary.innerHTML = `
    <article><span>Locations</span><strong>${hasActiveLocationFilter ? locations.length : allLocations.length}</strong></article>
    <article><span>Research</span><strong>${hasActiveLocationFilter ? research.length : allResearch.length}</strong></article>
    <article><span>Contacted</span><strong>${contacted}</strong></article>
    <article><span>Available</span><strong>${available}</strong></article>
    <article><span>Avg cost</span><strong>${formatMoney(averageCost)}</strong></article>
  `;

  if (!hasActiveLocationFilter) {
    chapterLocationResearchList.innerHTML = `<p class="empty-state">Choose an area, size, or gathering fit to show location research.</p>`;
    chapterLocationList.innerHTML = `<p class="empty-state">Choose an area, size, or gathering fit to show saved locations.</p>`;
    return;
  }

  chapterLocationResearchList.innerHTML = research.length ? research.map((item) => `
    <details class="compact-work-card event-plan-item">
      <summary>
        <span>
          <strong>${item.name}</strong>
          <small>${item.city || "City TBD"} · ${item.capacity || 0} capacity · ${item.booths || 0} booths · ${fitLabel(item.gatheringFit)} · ${formatMoney(Number(item.cost || 0) + Number(item.requiredExtras || 0))}</small>
        </span>
        <span class="member-status inactive">research</span>
      </summary>
      <div class="compact-work-body">
        <p><strong>Address:</strong> ${item.address || "Not found yet"}</p>
        <p><strong>Contact:</strong> ${item.contactName || "Not found yet"} ${item.contactInfo ? `· ${item.contactInfo}` : ""}</p>
        <p><strong>Gathering fit:</strong> ${fitLabel(item.gatheringFit)}</p>
        <p><strong>Best fits:</strong> ${item.fits || "Needs review"}</p>
        <p><strong>Source:</strong> ${item.sourceUrl || "No source saved"}</p>
        <p><strong>Research notes:</strong> ${item.notes || "No notes yet"}</p>
        <div class="inline-actions">
          <button class="button primary" data-location-approve="${item.id}" type="button">Save as location</button>
          <button class="button quiet" data-location-dismiss="${item.id}" type="button">Dismiss</button>
        </div>
      </div>
    </details>
  `).join("") : `<p class="empty-state">No location research waiting. New venue research can be loaded here for review.</p>`;

  chapterLocationList.innerHTML = locations.length ? locations.map((location) => `
    <details class="compact-work-card event-plan-item">
      <summary>
        <span>
          <strong>${location.name}</strong>
          <small>${location.city || "City TBD"} · ${location.capacity || 0} capacity · ${location.booths || 0} booths · ${fitLabel(location.gatheringFit)} · ${formatMoney(Number(location.cost || 0) + Number(location.requiredExtras || 0))}</small>
        </span>
        <span class="member-status ${location.status === "available" ? "active" : "inactive"}">${location.status}</span>
      </summary>
      <div class="compact-work-body">
        <p><strong>Address:</strong> ${location.address || "Not recorded"}</p>
        <p><strong>Contact:</strong> ${location.contactName || "Not recorded"} ${location.contactInfo ? `· ${location.contactInfo}` : ""}</p>
        <p><strong>Gathering fit:</strong> ${fitLabel(location.gatheringFit)}</p>
        <p><strong>Best fits:</strong> ${location.fits || "Not recorded"}</p>
        <p><strong>Notes:</strong> ${location.notes || "No notes yet"}</p>
        <div class="inline-actions">
          <button class="button quiet" data-location-copy="${location.id}" type="button">Load into form</button>
          <button class="button quiet" data-location-delete="${location.id}" type="button">Delete</button>
        </div>
      </div>
    </details>
  `).join("") : `<p class="empty-state">No locations saved yet. Start by saving possible venues, halls, markets, farms, parks, studios, churches, or retreat spaces.</p>`;

  document.querySelectorAll("[data-location-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      saveChapterLocations(getChapterLocations().filter((location) => location.id !== button.dataset.locationDelete));
      renderLocations();
      renderEventPlans();
    });
  });

  document.querySelectorAll("[data-location-approve]").forEach((button) => {
    button.addEventListener("click", () => {
      approveLocationResearch(button.dataset.locationApprove);
      renderLocations();
      renderEventPlans();
    });
  });

  document.querySelectorAll("[data-location-dismiss]").forEach((button) => {
    button.addEventListener("click", () => {
      dismissLocationResearch(button.dataset.locationDismiss);
      renderLocations();
    });
  });

  document.querySelectorAll("[data-location-copy]").forEach((button) => {
    button.addEventListener("click", () => {
      const location = getChapterLocations().find((item) => item.id === button.dataset.locationCopy);
      if (!location) return;
      Object.entries(location).forEach(([key, value]) => {
        if (chapterLocationForm.elements[key]) chapterLocationForm.elements[key].value = value;
      });
    });
  });
}

function filterLocations(items) {
  const area = locationAreaFilter.value;
  const capacity = locationCapacityFilter.value;
  const fit = locationFitFilter.value;
  if (!locationFiltersActive()) return [];
  return items.filter((item) => {
    const itemCapacity = Number(item.capacity || 0);
    const capacityMatches = !capacity
      || (capacity === "small" && itemCapacity <= 85)
      || (capacity === "medium" && itemCapacity > 85 && itemCapacity <= 200)
      || (capacity === "large" && itemCapacity > 200);
    return (!area || item.city === area)
      && capacityMatches
      && (!fit || (item.gatheringFit || "unclear") === fit);
  });
}

function locationFiltersActive() {
  return Boolean(locationAreaFilter.value || locationCapacityFilter.value || locationFitFilter.value);
}

function fitLabel(value = "unclear") {
  const labels = {
    "conversation-friendly": "conversation-friendly",
    "quiet-class": "quiet class / lecture",
    "market-friendly": "market / booth friendly",
    "large-scale": "large-scale future venue",
    unclear: "needs research"
  };
  return labels[value] || labels.unclear;
}

function renderVenueOption(plan, venue) {
  const math = eventMath(applyVenueToPlan(plan, venue));
  return `
    <div class="venue-option ${venue.selected ? "selected" : ""}">
      <div>
        <h5>${venue.name}${venue.selected ? " · selected" : ""}</h5>
        <p>${venue.city || "City TBD"} · Capacity ${venue.capacity || 0} · ${venue.booths || 0} booths · Cost ${formatMoney(Number(venue.cost || 0) + Number(venue.requiredExtras || 0))}</p>
        <p><strong>Projected net here:</strong> ${formatMoney(math.net)}</p>
        ${venue.notes ? `<p>${venue.notes}</p>` : ""}
      </div>
      <div class="inline-actions">
        <button class="button quiet" data-select-venue="${plan.id}|${venue.id}" type="button">Select</button>
        <button class="button quiet" data-delete-venue="${plan.id}|${venue.id}" type="button">Remove</button>
      </div>
    </div>
  `;
}

function getSelectedVenue(plan) {
  return (plan.venues || []).find((venue) => venue.selected) || (plan.venues || [])[0] || null;
}

function updateEventPlan(planId, updates) {
  saveEventPlans(getEventPlans().map((plan) => {
    if (plan.id !== planId) return plan;
    return { ...plan, ...updates, updatedAt: new Date().toISOString() };
  }));
}

function eventReadiness(plan) {
  const selectedVenue = getSelectedVenue(plan);
  const missing = [];
  if (!plan.name) missing.push("event name");
  if (!plan.targetDate) missing.push("date");
  if (!selectedVenue) missing.push("selected venue");
  if (!plan.people) missing.push("invite list");
  if (!plan.notes) missing.push("planning notes");
  return { ready: missing.length === 0, missing };
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

chapterEventForm.addEventListener("input", renderEventMathPreview);
chapterEventForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(chapterEventForm).entries());
  const plans = getEventPlans();
  plans.unshift({
    id: crypto.randomUUID(),
    chapterId: "chapter-001",
    stage: "idea",
    venues: [],
    ...data,
    createdAt: new Date().toISOString()
  });
  saveEventPlans(plans);
  chapterEventForm.reset();
  chapterEventStatus.textContent = "Event plan saved.";
  renderEventMathPreview();
  renderEventPlans();
});

chapterLocationForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(chapterLocationForm).entries());
  const locations = getChapterLocations();
  locations.unshift({
    id: crypto.randomUUID(),
    chapterId: "chapter-001",
    ...data,
    createdAt: new Date().toISOString()
  });
  saveChapterLocations(locations);
  chapterLocationForm.reset();
  chapterLocationStatus.textContent = "Location saved.";
  renderLocations();
  renderEventPlans();
});

renderEventMathPreview();
renderLocations();
renderEventPlans();

[locationAreaFilter, locationCapacityFilter, locationFitFilter].forEach((filter) => {
  filter.addEventListener("change", renderLocations);
});
