import { getCurrentMember, signOut } from "./auth.js";
import { getSiteContent, renderHomepageContent, renderJournalContent } from "./site-content.js";

const form = document.querySelector("#interest-form");
const status = document.querySelector("#form-status");
const primaryNav = document.querySelector("#primary-nav");
const menuToggle = document.querySelector(".menu-toggle");

function renderSessionNav() {
  const member = getCurrentMember();
  if (!member) return;

  primaryNav.innerHTML = `
    <a href="index.html">Home</a>
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

if (form) {
  form.addEventListener("submit", (event) => {
  event.preventDefault();
  const submission = Object.fromEntries(new FormData(form).entries());
  const submissions = JSON.parse(localStorage.getItem("motherEarthInterest") || "[]");
  submissions.push({ ...submission, createdAt: new Date().toISOString() });
  localStorage.setItem("motherEarthInterest", JSON.stringify(submissions));
  form.reset();
  status.textContent = "Your request has been saved.";
  });
}

renderSessionNav();
wireMenu();

const siteContent = getSiteContent();
renderHomepageContent(siteContent);
renderJournalContent(siteContent);
