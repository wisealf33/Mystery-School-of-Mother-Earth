import { requireMember, signOut } from "./auth.js";
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

const tracks = [
  {
    id: "foundation",
    title: "Foundation Setup",
    purpose: "Clarify the public message and keep PMA-sensitive details in the member layer.",
    steps: [
      "Choose the founding public description and use it consistently.",
      "Create a short founder note explaining why this foundation is beginning now.",
      "List the first membership promise in plain language.",
      "Mark which details belong public and which belong inside membership.",
      "Schedule legal review for PMA terms, event rules, vendor language, privacy, and payments."
    ]
  },
  {
    id: "facebook",
    title: "Facebook Page + Group",
    purpose: "Create the public signal first, then the community conversation space.",
    steps: [
      "Create the public Facebook Page: Mystery School of Mother Earth Foundation.",
      "Add the public page description from the Facebook strategy document.",
      "Add profile and cover visuals that feel earth-centered, grounded, and welcoming.",
      "Publish the first introduction post.",
      "Create the Facebook Group: Mother Earth Community Circle.",
      "Pin a welcome post explaining the group as a bridge into the association.",
      "Post three conversation prompts in the first week."
    ]
  },
  {
    id: "newsletter",
    title: "Weekly Newsletter",
    purpose: "Make the online umbrella feel alive before a full member portal exists.",
    steps: [
      "Choose MailerLite or ConvertKit for the first newsletter tool.",
      "Create the Mother Earth Weekly list.",
      "Create a simple founding interest signup form.",
      "Write Issue 1: The Foundation Begins.",
      "Add member/vendor interest tags to the signup flow.",
      "Send the first issue to early supporters.",
      "Create a repeatable weekly newsletter template."
    ]
  },
  {
    id: "outreach",
    title: "Vendor / Practitioner Outreach",
    purpose: "Find the first aligned people who make the ecosystem feel real.",
    steps: [
      "Make a list of 25 local and online prospects.",
      "Send 5 personal invitations using the outreach guide.",
      "Follow up after 4 days with anyone who has not replied.",
      "Invite interested people to the founding list.",
      "Ask each aligned person for 1 or 2 referrals.",
      "Choose the first 5 people to feature in the newsletter or member discovery area."
    ]
  },
  {
    id: "future-roadmap",
    title: "Future Ideas To Keep Private For Now",
    purpose: "Hold the larger vision internally until each piece is ready to be shared.",
    steps: [
      "Keep the detailed membership pathway off the public homepage until the PMA process is legally reviewed.",
      "Keep vendor/practitioner promotion details inside the member/admin side until the offer is ready.",
      "Keep local circle and chapter language private until there is a real first-circle plan.",
      "Keep Mother Earth Market language private until venue, terms, and event rules are clear.",
      "Keep Spirit Bucks rules private until legal/event review confirms the structure.",
      "Review the public homepage monthly and remove anything that sounds like a future promise instead of a current invitation."
    ]
  }
];

const scripts = [
  {
    title: "Public intro post",
    body: "I am beginning to gather founding interest for Mystery School of Mother Earth Foundation, an emerging private membership community centered around earth stewardship, natural living, local resilience, gardening, green business, practical earth skills, healing arts, spiritual growth, mystery-school learning, and real community. The first step is online: a member community, weekly newsletter, directory, and pathways for vendors, practitioners, teachers, growers, makers, supporters, and circle-builders."
  },
  {
    title: "Vendor/practitioner invitation",
    body: "Hi [Name], I am gathering founding interest for Mystery School of Mother Earth Foundation, an emerging private membership community for earth stewardship, natural living, local resilience, green business, practical earth skills, healing arts, spiritual growth, and real community. I thought of you because of your work with [specific reason]. Would you like to be on the founding interest list or hear about the vendor/practitioner pathway when it opens?"
  },
  {
    title: "Facebook group welcome",
    body: "Welcome to Mother Earth Community Circle. This is a public-facing discussion space for people interested in natural living, earth stewardship, local resilience, gardening, green business, practical skills, healing arts, spiritual growth, and building real community. Member opportunities, vendor/practitioner promotion, market participation, and internal project details will be handled through the association."
  }
];

const storageKey = "motherEarthLaunchDashboard";
const notesKey = "motherEarthLaunchNotes";
const trackList = document.querySelector("#track-list");
const weeklyActions = document.querySelector("#weekly-actions");
const scriptList = document.querySelector("#script-list");
const overallProgress = document.querySelector("#overall-progress");
const overallProgressBar = document.querySelector("#overall-progress-bar");
const progressNote = document.querySelector("#progress-note");

function loadProgress() {
  return JSON.parse(localStorage.getItem(storageKey) || "{}");
}

function saveProgress(progress) {
  localStorage.setItem(storageKey, JSON.stringify(progress));
}

function stepId(trackId, index) {
  return `${trackId}-${index}`;
}

function renderTracks() {
  const progress = loadProgress();
  trackList.innerHTML = tracks.map((track) => {
    const completed = track.steps.filter((_, index) => progress[stepId(track.id, index)]).length;
    const percent = Math.round((completed / track.steps.length) * 100);
    return `
      <article class="track-card">
        <div class="track-card-top">
          <div>
            <h3>${track.title}</h3>
            <p>${track.purpose}</p>
          </div>
          <strong>${percent}%</strong>
        </div>
        <div class="mini-progress"><span style="width: ${percent}%"></span></div>
        <ul class="step-list">
          ${track.steps.map((step, index) => {
            const id = stepId(track.id, index);
            return `
              <li>
                <label class="check-row">
                  <input type="checkbox" data-step="${id}" ${progress[id] ? "checked" : ""}>
                  <span>${step}</span>
                </label>
              </li>
            `;
          }).join("")}
        </ul>
      </article>
    `;
  }).join("");

  document.querySelectorAll("[data-step]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const nextProgress = loadProgress();
      nextProgress[checkbox.dataset.step] = checkbox.checked;
      saveProgress(nextProgress);
      renderTracks();
      renderWeeklyActions();
      renderProgress();
    });
  });
}

function renderWeeklyActions() {
  const progress = loadProgress();
  const nextSteps = [];

  tracks.forEach((track) => {
    const nextIndex = track.steps.findIndex((_, index) => !progress[stepId(track.id, index)]);
    if (nextIndex >= 0 && nextSteps.length < 6) {
      nextSteps.push({ track: track.title, step: track.steps[nextIndex] });
    }
  });

  weeklyActions.innerHTML = nextSteps.map((item) => `
    <article>
      <span>${item.track}</span>
      <p>${item.step}</p>
    </article>
  `).join("");
}

function renderScripts() {
  scriptList.innerHTML = scripts.map((script, index) => `
    <article class="script-card">
      <div>
        <h3>${script.title}</h3>
        <p>${script.body}</p>
      </div>
      <button class="button secondary copy-button" data-script="${index}" type="button">Copy</button>
    </article>
  `).join("");

  document.querySelectorAll("[data-script]").forEach((button) => {
    button.addEventListener("click", async () => {
      await navigator.clipboard.writeText(scripts[Number(button.dataset.script)].body);
      button.textContent = "Copied";
      window.setTimeout(() => {
        button.textContent = "Copy";
      }, 1400);
    });
  });
}

function renderProgress() {
  const progress = loadProgress();
  const total = tracks.reduce((sum, track) => sum + track.steps.length, 0);
  const completed = tracks.reduce((sum, track) => {
    return sum + track.steps.filter((_, index) => progress[stepId(track.id, index)]).length;
  }, 0);
  const percent = Math.round((completed / total) * 100);
  overallProgress.textContent = `${percent}%`;
  overallProgressBar.style.width = `${percent}%`;
  progressNote.textContent = completed === 0
    ? "Start with Foundation Setup and Facebook."
    : `${completed} of ${total} launch steps completed.`;
}

function setupNotes() {
  const notes = JSON.parse(localStorage.getItem(notesKey) || "{}");
  document.querySelector("#focus-note").value = notes.focus || "";
  document.querySelector("#question-note").value = notes.questions || "";
  document.querySelector("#contact-note").value = notes.contacts || "";

  document.querySelector("#save-notes").addEventListener("click", () => {
    localStorage.setItem(notesKey, JSON.stringify({
      focus: document.querySelector("#focus-note").value,
      questions: document.querySelector("#question-note").value,
      contacts: document.querySelector("#contact-note").value
    }));
    document.querySelector("#notes-status").textContent = "Saved.";
  });
}

renderTracks();
renderWeeklyActions();
renderScripts();
renderProgress();
setupNotes();
