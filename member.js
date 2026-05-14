import { activateMember, getMembers, redeemCoupon, requireMember, saveMembers, signOut } from "./auth.js";
import { eligibleForChapter, getChapters } from "./chapters.js";
import { wireResponsiveNav } from "./nav.js";

const member = requireMember();
const primaryNav = document.querySelector("#primary-nav");
const menuToggle = document.querySelector(".menu-toggle");

if (member) {
  const isActive = member.status === "active";
  document.querySelector("#member-welcome").textContent = `Welcome, ${member.name}`;
  document.querySelector("#member-role-label").textContent = `${member.status} ${member.role}`;
  document.querySelector("#member-hero-copy").textContent = isActive
    ? "Your membership is active. You can update your profile and access member areas available to your role."
    : "Your member account is created and your agreement is recorded. Complete activation to unlock member areas.";
  document.querySelector("#admin-link").hidden = member.role !== "admin" || !isActive;
  document.querySelector("#admin-panel").hidden = member.role !== "admin" || !isActive;
  document.querySelector("#activation-section").hidden = isActive;
  document.querySelector("#profile").hidden = !isActive;
  document.querySelector("#chapters").hidden = !isActive;
  document.querySelector("#member-pathways-panel").hidden = !isActive;

  document.querySelector("#member-status-list").innerHTML = `
    <p><strong>Membership:</strong> ${member.membershipLevel}</p>
    <p><strong>Status:</strong> ${member.status}</p>
    <p><strong>Role:</strong> ${member.role}</p>
    <p><strong>Email:</strong> ${member.email}</p>
    <p><strong>Phone:</strong> ${member.phone || "Not provided"}</p>
    <p><strong>Location:</strong> ${member.location || "Not provided"}</p>
    <p><strong>Agreement:</strong> ${member.agreement?.accepted ? "Signed Members Association Agreement" : "Not signed"}</p>
    <p><strong>Activation:</strong> ${member.activation?.status ? formatActivation(member.activation) : "Pending"}</p>
    <p><strong>Joined:</strong> ${new Date(member.joinedAt).toLocaleDateString()}</p>
  `;

  document.querySelector("#profile-display-name").value = member.profile?.displayName || member.name;
  document.querySelector("#profile-offer").value = member.profile?.offer || "";
  document.querySelector("#profile-pathway").value = member.profile?.pathway || member.interest || "Basic member";
  document.querySelector("#profile-notes").value = member.profile?.notes || "";

  setupActivation(member);
  renderChapterAccess(member);

  document.querySelector("#save-profile").addEventListener("click", () => {
    const members = getMembers();
    const nextMembers = members.map((item) => {
      if (item.id !== member.id) return item;
      return {
        ...item,
        profile: {
          displayName: document.querySelector("#profile-display-name").value,
          offer: document.querySelector("#profile-offer").value,
          pathway: document.querySelector("#profile-pathway").value,
          notes: document.querySelector("#profile-notes").value,
          updatedAt: new Date().toISOString()
        }
      };
    });
    saveMembers(nextMembers);
    document.querySelector("#profile-status").textContent = "Profile saved locally.";
  });

  document.querySelector("#logout-button").addEventListener("click", () => {
    signOut();
    window.location.href = "login.html";
  });
}

function renderChapterAccess(member) {
  const chapters = getChapters();
  const list = document.querySelector("#member-chapter-list");
  list.innerHTML = chapters.map((chapter) => {
    const assigned = chapter.memberIds.includes(member.id);
    const eligible = eligibleForChapter(member, chapter);
    const status = assigned ? "Member of chapter" : eligible ? "Eligible by location" : "Not currently in area";
    return `
      <article class="member-panel">
        <span class="member-status ${assigned ? "active" : "inactive"}">${status}</span>
        <h3>${chapter.name}</h3>
        <p><strong>${chapter.region}</strong></p>
        <p>${assigned ? "You are assigned to this local chapter." : "This chapter is visible as the first local model. Ask an administrator about chapter access if you are local."}</p>
      </article>
    `;
  }).join("");
}

function setupActivation(member) {
  const form = document.querySelector("#activation-form");
  const cardFields = document.querySelector("#member-card-fields");
  const couponFields = document.querySelector("#member-coupon-fields");
  const status = document.querySelector("#activation-status");
  const methodInputs = document.querySelectorAll("[name='activationMethod']");

  function setActivationMethod(method) {
    cardFields.hidden = method !== "card";
    couponFields.hidden = method !== "coupon";
    cardFields.querySelectorAll("input").forEach((input) => {
      input.disabled = method !== "card";
    });
    couponFields.querySelectorAll("input").forEach((input) => {
      input.disabled = method !== "coupon";
    });
  }

  methodInputs.forEach((input) => {
    input.addEventListener("change", () => {
      setActivationMethod(input.value);
    });
  });

  setActivationMethod(form.activationMethod.value);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      let activation;
      if (data.activationMethod === "coupon") {
        const coupon = redeemCoupon(data.couponCode || "", member.email);
        activation = {
          status: "completed_by_coupon",
          method: "membership_coupon",
          couponCode: coupon.code,
          completedAt: new Date().toISOString()
        };
      } else {
        const requiredCardFields = ["cardNumber", "expiration", "cvc", "cardName"];
        const missing = requiredCardFields.some((field) => !data[field]?.trim());
        if (missing) throw new Error("Complete the member contribution fields or choose coupon activation.");
        activation = {
          status: "private_completion_recorded",
          method: "member_contribution",
          completedAt: new Date().toISOString()
        };
      }

      activateMember(member.id, activation);
      status.textContent = "Membership activated. Reloading your dashboard.";
      window.setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (error) {
      status.textContent = error.message;
  }
});

wireResponsiveNav(primaryNav, menuToggle);
}

function formatActivation(activation) {
  if (activation.method === "membership_coupon") {
    return `Completed with coupon ${activation.couponCode}`;
  }
  return "Private completion recorded";
}
