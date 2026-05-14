import { getMembers, requireMember, signOut } from "./auth.js";
import { eligibleForChapter, getChapters } from "./chapters.js";
import { wireResponsiveNav } from "./nav.js";

const deliverablesKey = "motherEarthMemberDeliverables";
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

const profileShell = document.querySelector("#profile-shell");
const memberId = new URLSearchParams(window.location.search).get("id");

function getDeliverables() {
  return JSON.parse(localStorage.getItem(deliverablesKey) || "[]");
}

function saveDeliverables(deliverables) {
  localStorage.setItem(deliverablesKey, JSON.stringify(deliverables));
}

function renderProfile() {
  const member = getMembers().find((item) => item.id === memberId);
  if (!member) {
    profileShell.innerHTML = `
      <article class="member-admin-card">
        <h2>Member not found</h2>
        <p class="empty-state">Return to member management and choose a member profile from the current list.</p>
        <a class="button primary" href="admin-members.html">Back to members</a>
      </article>
    `;
    return;
  }

  const deliverables = getDeliverables().filter((item) => item.memberId === member.id);
  const openItems = deliverables.filter((item) => item.status !== "fulfilled").length;
  const fulfilledItems = deliverables.filter((item) => item.status === "fulfilled").length;
  const chapters = getChapters();
  const memberChapters = chapters.filter((chapter) => chapter.memberIds.includes(member.id));
  const eligibleChapters = chapters.filter((chapter) => eligibleForChapter(member, chapter));

  profileShell.innerHTML = `
    <div class="profile-admin-header">
      <div>
        <p class="section-kicker">Member profile</p>
        <h2>${member.name}</h2>
        <p>${member.profile?.offer || member.profile?.pathway || "Basic member record"}</p>
      </div>
      <div class="profile-admin-actions">
        <a class="button quiet" href="admin-members.html">Back to members</a>
        <a class="button quiet" href="admin-chapters.html">Back to chapters</a>
      </div>
    </div>

    <div class="member-ops-summary profile-summary">
      <article><span>Status</span><strong>${member.status}</strong></article>
      <article><span>Role</span><strong>${member.role}</strong></article>
      <article><span>Open items</span><strong>${openItems}</strong></article>
      <article><span>Fulfilled</span><strong>${fulfilledItems}</strong></article>
      <article><span>Chapters</span><strong>${memberChapters.length}</strong></article>
    </div>

    <div class="profile-admin-layout">
      <section class="member-admin-card">
        <h3>Member record</h3>
        <div class="member-admin-meta profile-detail-grid">
          <p><strong>Email:</strong> ${member.email}</p>
          <p><strong>Phone:</strong> ${member.phone || "Not provided"}</p>
          <p><strong>Location:</strong> ${member.location || "Not recorded"}</p>
          <p><strong>City:</strong> ${member.address?.city || "Not recorded"}</p>
          <p><strong>State:</strong> ${member.address?.state || "Not recorded"}</p>
          <p><strong>ZIP:</strong> ${member.address?.zip || "Not recorded"}</p>
          <p><strong>Membership:</strong> ${member.membershipLevel || "Basic Member"}</p>
          <p><strong>Joined:</strong> ${formatDate(member.joinedAt)}</p>
          <p><strong>Activation:</strong> ${formatActivation(member)}</p>
        </div>
      </section>

      <section class="member-admin-card">
        <h3>Agreement and access</h3>
        <div class="member-admin-meta profile-detail-grid">
          <p><strong>Agreement:</strong> ${member.agreement?.accepted ? "Signed" : "Not signed"}</p>
          <p><strong>Version:</strong> ${member.agreement?.version || "Not recorded"}</p>
          <p><strong>Signed:</strong> ${formatDate(member.agreement?.acceptedAt)}</p>
          <p><strong>Activation method:</strong> ${member.activation?.method || "Not active"}</p>
          <p><strong>Activated:</strong> ${formatDate(member.activation?.completedAt)}</p>
          <p><strong>Coupon:</strong> ${member.activation?.couponCode || "None recorded"}</p>
        </div>
      </section>

      <section class="member-admin-card">
        <h3>Offerings and connection points</h3>
        <div class="status-list">
          <p><strong>Display name:</strong> ${member.profile?.displayName || member.name}</p>
          <p><strong>What they offer:</strong> ${member.profile?.offer || "Not recorded yet"}</p>
          <p><strong>Pathway:</strong> ${member.profile?.pathway || member.interest || "Basic member"}</p>
          <p><strong>Notes:</strong> ${member.profile?.notes || "No profile notes recorded yet"}</p>
        </div>
      </section>

      <section class="member-admin-card">
        <h3>Chapter connection</h3>
        <div class="deliverable-list">
          ${chapters.map((chapter) => renderChapterConnection(member, chapter, memberChapters, eligibleChapters)).join("")}
        </div>
      </section>

      <form id="profile-deliverable-form" class="deliverable-form">
        <h3>Add fulfillment item</h3>
        <label>Type
          <select name="type">
            <option value="Directory listing">Directory listing</option>
            <option value="Newsletter feature">Newsletter feature</option>
            <option value="Facebook spotlight">Facebook spotlight</option>
            <option value="Event promotion">Event promotion</option>
            <option value="Ad placement">Ad placement</option>
            <option value="Sponsor placement">Sponsor placement</option>
            <option value="Practitioner profile">Practitioner profile</option>
            <option value="Workshop/class listing">Workshop/class listing</option>
            <option value="Other member support">Other member support</option>
          </select>
        </label>
        <label>Fulfillment title
          <input name="title" required placeholder="Example: July newsletter practitioner spotlight">
        </label>
        <label>Due date
          <input type="date" name="dueDate">
        </label>
        <label>Status
          <select name="status">
            <option value="needs-info">Needs info</option>
            <option value="pending">Pending</option>
            <option value="scheduled">Scheduled</option>
            <option value="fulfilled">Fulfilled</option>
          </select>
        </label>
        <label class="full">Notes / proof link
          <textarea name="notes" rows="4" placeholder="Needed bio, image received, post scheduled, event details, link after posted..."></textarea>
        </label>
        <button class="button primary" type="submit">Add item</button>
        <p id="profile-deliverable-status" role="status"></p>
      </form>

      <section class="member-admin-card">
        <h3>PMA fulfillment</h3>
        <div id="profile-deliverable-list" class="deliverable-list">
          ${deliverables.length ? deliverables.map(renderDeliverable).join("") : `<p class="empty-state">No fulfillment items assigned yet.</p>`}
        </div>
      </section>
    </div>
  `;

  bindProfileActions(member);
}

function bindProfileActions(member) {
  document.querySelector("#profile-deliverable-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const deliverables = getDeliverables();
    deliverables.push({
      id: crypto.randomUUID(),
      memberId: member.id,
      type: data.type,
      title: data.title,
      dueDate: data.dueDate,
      status: data.status,
      notes: data.notes,
      createdAt: new Date().toISOString(),
      fulfilledAt: data.status === "fulfilled" ? new Date().toISOString() : ""
    });
    saveDeliverables(deliverables);
    form.reset();
    renderProfile();
  });

  document.querySelectorAll("[data-deliverable-status]").forEach((select) => {
    select.addEventListener("change", () => {
      const nextDeliverables = getDeliverables().map((item) => {
        if (item.id !== select.dataset.deliverableStatus) return item;
        return {
          ...item,
          status: select.value,
          fulfilledAt: select.value === "fulfilled" ? new Date().toISOString() : item.fulfilledAt || ""
        };
      });
      saveDeliverables(nextDeliverables);
      renderProfile();
    });
  });
}

function renderChapterConnection(member, chapter) {
  const assigned = chapter.memberIds.includes(member.id);
  const eligible = eligibleForChapter(member, chapter);
  const status = assigned ? "assigned" : eligible ? "eligible" : "not assigned";
  return `
    <div class="deliverable-item ${assigned ? "fulfilled" : eligible ? "scheduled" : ""}">
      <div>
        <h4>${chapter.name}</h4>
        <p>${chapter.region}</p>
        <p>${status}${eligible ? " by location" : ""}</p>
      </div>
      <a class="button quiet" href="admin-chapters.html">Manage chapter</a>
    </div>
  `;
}

function renderDeliverable(item) {
  return `
    <div class="deliverable-item ${item.status}">
      <div>
        <h4>${item.title}</h4>
        <p>${item.type}${item.dueDate ? ` · Due ${item.dueDate}` : ""}</p>
        ${item.notes ? `<p>${item.notes}</p>` : ""}
      </div>
      <select data-deliverable-status="${item.id}" aria-label="Update fulfillment status">
        <option value="needs-info" ${item.status === "needs-info" ? "selected" : ""}>Needs info</option>
        <option value="pending" ${item.status === "pending" ? "selected" : ""}>Pending</option>
        <option value="scheduled" ${item.status === "scheduled" ? "selected" : ""}>Scheduled</option>
        <option value="fulfilled" ${item.status === "fulfilled" ? "selected" : ""}>Fulfilled</option>
      </select>
    </div>
  `;
}

function formatActivation(member) {
  if (member.status !== "active") return "Not active";
  if (member.activation?.method === "membership_coupon") return `Coupon: ${member.activation.couponCode}`;
  if (member.activation?.method === "member_contribution") return "Member contribution";
  return member.activation?.method || "Active";
}

function formatDate(value) {
  if (!value) return "Not recorded";
  return new Date(value).toLocaleDateString();
}

renderProfile();
