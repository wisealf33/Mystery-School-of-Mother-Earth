import { createCoupon, getCoupons, requireMember, signOut } from "./auth.js";
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

const couponForm = document.querySelector("#coupon-form");
const couponList = document.querySelector("#coupon-list");
const couponStatus = document.querySelector("#coupon-status");

function renderCoupons() {
  const coupons = getCoupons();
  couponList.innerHTML = coupons.map((coupon) => `
    <article class="coupon-card">
      <div>
        <h3>${coupon.code}</h3>
        <p>${coupon.label}</p>
      </div>
      <p><strong>Member:</strong> ${coupon.memberName || "Not assigned"}</p>
      <p><strong>Email:</strong> ${coupon.memberEmail || "Not recorded"}</p>
      <p><strong>Uses:</strong> ${coupon.usedBy.length} / ${coupon.maxUses}</p>
      <p><strong>Status:</strong> ${coupon.status}</p>
      <button class="button quiet coupon-copy" data-coupon-code="${coupon.code}" type="button">Copy code</button>
    </article>
  `).join("");

  document.querySelectorAll("[data-coupon-code]").forEach((button) => {
    button.addEventListener("click", async () => {
      await navigator.clipboard.writeText(button.dataset.couponCode);
      button.textContent = "Copied";
      window.setTimeout(() => {
        button.textContent = "Copy code";
      }, 1400);
    });
  });
}

couponForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(couponForm).entries());
  try {
    const coupon = createCoupon(data);
    couponStatus.textContent = `Issued one-use coupon ${coupon.code}.`;
    couponForm.reset();
    renderCoupons();
  } catch (error) {
    couponStatus.textContent = error.message;
  }
});

renderCoupons();
