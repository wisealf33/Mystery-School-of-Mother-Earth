import { getMembers, requireMember, signOut } from "./auth.js";
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

const deliverablesKey = "motherEarthMemberDeliverables";
const deliverableForm = document.querySelector("#deliverable-form");
const deliverableMember = document.querySelector("#deliverable-member");
const deliverableStatus = document.querySelector("#deliverable-status");
const memberAdminList = document.querySelector("#member-admin-list");
const memberOpsSummary = document.querySelector("#member-ops-summary");

function getDeliverables() {
  return JSON.parse(localStorage.getItem(deliverablesKey) || "[]");
}

function saveDeliverables(deliverables) {
  localStorage.setItem(deliverablesKey, JSON.stringify(deliverables));
}

function renderMemberManagement() {
  const members = getMembers();
  const deliverables = getDeliverables();
  const openDeliverables = deliverables.filter((item) => item.status !== "fulfilled");
  const fulfilledDeliverables = deliverables.filter((item) => item.status === "fulfilled");
  const activeMembers = members.filter((member) => member.status === "active");
  const inactiveMembers = members.filter((member) => member.status !== "active");

  memberOpsSummary.innerHTML = `
    <article><span>Total members</span><strong>${members.length}</strong></article>
    <article><span>Active</span><strong>${activeMembers.length}</strong></article>
    <article><span>Inactive</span><strong>${inactiveMembers.length}</strong></article>
    <article><span>Needs action</span><strong>${openDeliverables.length}</strong></article>
    <article><span>Fulfilled</span><strong>${fulfilledDeliverables.length}</strong></article>
  `;

  deliverableMember.innerHTML = members.length
    ? members.map((member) => `<option value="${member.id}">${member.name} · ${member.status}</option>`).join("")
    : `<option value="">No members yet</option>`;
  deliverableForm.querySelector("button").disabled = members.length === 0;

  memberAdminList.innerHTML = members.length ? members.map((member) => {
    const memberDeliverables = deliverables.filter((item) => item.memberId === member.id);
    const fulfilled = memberDeliverables.filter((item) => item.status === "fulfilled").length;
    const percent = memberDeliverables.length ? Math.round((fulfilled / memberDeliverables.length) * 100) : 0;
    const needsAction = memberDeliverables.filter((item) => item.status !== "fulfilled").length;

    return `
      <article class="member-admin-card">
        <div class="member-admin-top">
          <div>
            <span class="member-status ${member.status}">${member.status}</span>
            <h3><a class="text-link" href="admin-member-profile.html?id=${member.id}">${member.name}</a></h3>
            <p>${member.email} ${member.phone ? `· ${member.phone}` : ""}</p>
            <p>${member.location || "Location not recorded"}</p>
          </div>
          <div class="member-card-actions">
            <strong>${percent}%</strong>
            <a class="button quiet" href="admin-member-profile.html?id=${member.id}">Open profile</a>
          </div>
        </div>
        <div class="mini-progress"><span style="width: ${percent}%"></span></div>
        <div class="member-admin-meta">
          <p><strong>Agreement:</strong> ${member.agreement?.accepted ? `Signed v${member.agreement.version}` : "Not signed"}</p>
          <p><strong>Activation:</strong> ${member.activation?.method || "Not active"}</p>
          <p><strong>Open items:</strong> ${needsAction}</p>
        </div>
        <div class="deliverable-list">
          ${memberDeliverables.length ? memberDeliverables.map(renderDeliverable).join("") : `<p class="empty-state">No deliverables assigned yet.</p>`}
        </div>
      </article>
    `;
  }).join("") : `<article class="member-admin-card"><p class="empty-state">No member accounts yet.</p></article>`;

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
      renderMemberManagement();
    });
  });
}

function renderDeliverable(item) {
  return `
    <div class="deliverable-item ${item.status}">
      <div>
        <h4>${item.title}</h4>
        <p>${item.type}${item.dueDate ? ` · Due ${item.dueDate}` : ""}</p>
        ${item.notes ? `<p>${item.notes}</p>` : ""}
      </div>
      <select data-deliverable-status="${item.id}" aria-label="Update deliverable status">
        <option value="needs-info" ${item.status === "needs-info" ? "selected" : ""}>Needs info</option>
        <option value="pending" ${item.status === "pending" ? "selected" : ""}>Pending</option>
        <option value="scheduled" ${item.status === "scheduled" ? "selected" : ""}>Scheduled</option>
        <option value="fulfilled" ${item.status === "fulfilled" ? "selected" : ""}>Fulfilled</option>
      </select>
    </div>
  `;
}

deliverableForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(deliverableForm).entries());
  if (!data.memberId) {
    deliverableStatus.textContent = "Create or select a member first.";
    return;
  }

  const deliverables = getDeliverables();
  deliverables.push({
    id: crypto.randomUUID(),
    memberId: data.memberId,
    type: data.type,
    title: data.title,
    dueDate: data.dueDate,
    status: data.status,
    notes: data.notes,
    createdAt: new Date().toISOString(),
    fulfilledAt: ""
  });
  saveDeliverables(deliverables);
  deliverableStatus.textContent = "Deliverable added.";
  deliverableForm.reset();
  renderMemberManagement();
});

renderMemberManagement();
