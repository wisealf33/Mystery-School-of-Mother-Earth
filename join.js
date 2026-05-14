import { createMember, getMembers } from "./auth.js";
import { agreementText, currentAgreement } from "./agreement.js";
import { wireResponsiveNav } from "./nav.js";

const form = document.querySelector("#onboarding-form");
const status = document.querySelector("#onboarding-status");
const agreementBox = document.querySelector("#agreement-box");
const agreementVersion = document.querySelector("#agreement-version");
const primaryNav = document.querySelector("#primary-nav");
const menuToggle = document.querySelector(".menu-toggle");

function renderAgreement() {
  agreementVersion.textContent = `Current agreement version ${currentAgreement.version} · updated ${currentAgreement.updatedAt}`;
  agreementBox.innerHTML = `
    <h3>${currentAgreement.title}</h3>
    <p><strong>${currentAgreement.subtitle}</strong></p>
    ${currentAgreement.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}
    <p><em>${currentAgreement.notice}</em></p>
  `;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());

  try {
    const required = ["firstName", "lastName", "email", "password", "signature"];
    const missing = required.some((field) => !data[field]?.trim());
    if (missing || !data.agreementAccepted) {
      throw new Error("Complete the member details, accept the agreement, and type your signature first.");
    }

    const emailExists = getMembers().some((member) => member.email.toLowerCase() === data.email.toLowerCase());
    if (emailExists) throw new Error("A member account with this email already exists.");

    const member = createMember({
      status: "inactive",
      firstName: data.firstName,
      lastName: data.lastName,
      name: `${data.firstName} ${data.lastName}`.trim(),
      email: data.email,
      phone: data.phone,
      password: data.password,
      location: [data.city, data.state, data.zip].filter(Boolean).join(", "),
      address: {
        city: data.city,
        state: data.state,
        zip: data.zip
      },
      interest: "Basic membership",
      agreement: {
        accepted: true,
        signature: data.signature,
        signedAt: new Date().toISOString(),
        id: currentAgreement.id,
        version: currentAgreement.version,
        title: currentAgreement.title,
        text: agreementText(currentAgreement)
      }
    });

    status.textContent = member.role === "admin"
      ? "Member account created. You are the first member and have admin permissions. Complete activation from your dashboard."
      : "Member account created. Complete activation from your dashboard.";

    window.setTimeout(() => {
      window.location.href = "member.html";
    }, 900);
  } catch (error) {
    status.textContent = error.message;
  }
});

renderAgreement();
wireResponsiveNav(primaryNav, menuToggle);
