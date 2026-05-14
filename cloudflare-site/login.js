import { signIn } from "./auth.js";
import { wireResponsiveNav } from "./nav.js";

const form = document.querySelector("#login-form");
const status = document.querySelector("#login-status");
const params = new URLSearchParams(window.location.search);
const next = params.get("next") || "member.html";
const primaryNav = document.querySelector("#primary-nav");
const menuToggle = document.querySelector(".menu-toggle");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  const member = signIn(data.email, data.password);

  if (!member) {
    status.textContent = "That email and password did not match a local member account.";
    return;
  }

  status.textContent = "Logged in. Opening your dashboard.";
  window.setTimeout(() => {
    window.location.href = next;
  }, 500);
});

wireResponsiveNav(primaryNav, menuToggle);
