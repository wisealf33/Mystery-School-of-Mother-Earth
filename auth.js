const membersKey = "motherEarthMembers";
const sessionKey = "motherEarthSession";
const couponsKey = "motherEarthCoupons";

export function getMembers() {
  return JSON.parse(localStorage.getItem(membersKey) || "[]");
}

export function saveMembers(members) {
  localStorage.setItem(membersKey, JSON.stringify(members));
}

export function getCurrentMember() {
  const session = JSON.parse(localStorage.getItem(sessionKey) || "null");
  if (!session) return null;
  return getMembers().find((member) => member.id === session.memberId) || null;
}

export function signIn(email, password) {
  const member = getMembers().find((item) => {
    return item.email.toLowerCase() === email.toLowerCase() && item.password === password;
  });
  if (!member) return null;
  localStorage.setItem(sessionKey, JSON.stringify({ memberId: member.id, signedInAt: new Date().toISOString() }));
  return member;
}

export function signOut() {
  localStorage.removeItem(sessionKey);
}

export function createMember(payload) {
  const members = getMembers();
  const emailExists = members.some((member) => member.email.toLowerCase() === payload.email.toLowerCase());
  if (emailExists) {
    throw new Error("A member account with this email already exists.");
  }

  const member = {
    id: crypto.randomUUID(),
    role: members.length === 0 ? "admin" : "member",
    status: payload.status || "inactive",
    membershipLevel: "Basic Member",
    joinedAt: new Date().toISOString(),
    ...payload
  };

  members.push(member);
  saveMembers(members);
  localStorage.setItem(sessionKey, JSON.stringify({ memberId: member.id, signedInAt: new Date().toISOString() }));
  return member;
}

export function getCoupons() {
  const stored = JSON.parse(localStorage.getItem(couponsKey) || "null");
  if (stored) return stored;

  const defaults = [
    {
      id: crypto.randomUUID(),
      code: "FOUNDER-COMP",
      label: "Founder complimentary membership",
      status: "active",
      type: "membership_completion",
      maxUses: 1,
      usedBy: [],
      createdAt: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      code: "OFFLINE-PAID",
      label: "Offline payment recorded by administrator",
      status: "active",
      type: "membership_completion",
      maxUses: 1,
      memberName: "",
      memberEmail: "",
      paymentType: "offline",
      notes: "Legacy administrator coupon. Issue person-specific coupons from the admin dashboard going forward.",
      usedBy: [],
      createdAt: new Date().toISOString()
    }
  ];
  localStorage.setItem(couponsKey, JSON.stringify(defaults));
  return defaults;
}

export function saveCoupons(coupons) {
  localStorage.setItem(couponsKey, JSON.stringify(coupons));
}

export function redeemCoupon(code, email) {
  const normalized = code.trim().toUpperCase();
  const coupons = getCoupons();
  const coupon = coupons.find((item) => item.code === normalized);

  if (!coupon || coupon.status !== "active") {
    throw new Error("That coupon is not active.");
  }

  if (coupon.maxUses && coupon.usedBy.length >= coupon.maxUses) {
    throw new Error("That coupon has already been used.");
  }

  if (coupon.usedBy.some((item) => item.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("That coupon has already been used by this email.");
  }

  coupon.usedBy.push({ email, usedAt: new Date().toISOString() });
  saveCoupons(coupons);
  return coupon;
}

export function createCoupon(payload) {
  const coupons = getCoupons();
  const code = (payload.code || generateCouponCode(payload.memberName)).trim().toUpperCase().replace(/\s+/g, "-");
  if (!code) throw new Error("Coupon code is required.");
  if (coupons.some((coupon) => coupon.code === code)) {
    throw new Error("A coupon with that code already exists.");
  }

  const coupon = {
    id: crypto.randomUUID(),
    code,
    label: payload.label || couponLabel(payload),
    status: "active",
    type: "membership_completion",
    maxUses: 1,
    memberName: payload.memberName || "",
    memberEmail: payload.memberEmail || "",
    paymentType: payload.paymentType || "administrator_approved",
    notes: payload.notes || "",
    usedBy: [],
    createdAt: new Date().toISOString()
  };

  coupons.push(coupon);
  saveCoupons(coupons);
  return coupon;
}

function generateCouponCode(memberName = "") {
  const namePart = memberName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 16) || "MEMBER";
  const suffix = crypto.randomUUID().split("-")[0].toUpperCase();
  return `MEMBER-${namePart}-${suffix}`;
}

function couponLabel(payload) {
  const paymentLabels = {
    cash: "Cash payment",
    zelle: "Zelle payment",
    venmo: "Venmo payment",
    paypal: "PayPal payment",
    check: "Check payment",
    barter: "Barter / trade",
    scholarship: "Scholarship",
    complimentary: "Complimentary access",
    founder: "Founder access",
    offline: "Other offline payment",
    administrator_approved: "Administrator approved"
  };
  const typeLabel = paymentLabels[payload.paymentType] || "Administrator approved";
  return `${payload.memberName || "Member"} · ${typeLabel}`;
}

export function activateMember(memberId, activation) {
  const members = getMembers();
  const nextMembers = members.map((member) => {
    if (member.id !== memberId) return member;
    return {
      ...member,
      status: "active",
      activation: {
        ...activation,
        completedAt: activation.completedAt || new Date().toISOString()
      }
    };
  });
  saveMembers(nextMembers);
  return nextMembers.find((member) => member.id === memberId);
}

export function requireMember({ adminOnly = false } = {}) {
  const member = getCurrentMember();
  if (!member) {
    window.location.href = `login.html?next=${encodeURIComponent(window.location.pathname.split("/").pop() || "member.html")}`;
    return null;
  }

  if (adminOnly && (member.role !== "admin" || member.status !== "active")) {
    window.location.href = "member.html";
    return null;
  }

  return member;
}
