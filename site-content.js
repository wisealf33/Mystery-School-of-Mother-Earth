const STORAGE_KEY = "motherEarthSiteContentOverride";

export const defaultSiteContent = {
  home: {
    featuredDates: {
      kicker: "Find your people",
      title: "A few public events worth knowing about.",
      intro: "Start with a few broad, travel-friendly, or online gatherings. Open the directory if you want more.",
      items: [
        {
          tag: "Online / broader network",
          title: "Mindvalley Events",
          summary: "Personal growth summits and global speaker programming.",
          meta: "May 16, 2026 · Virtual and in-person",
          image: "assets/mystery-school-hero.png"
        },
        {
          tag: "National / expo",
          title: "Body Mind Spirit Fest",
          summary: "Holistic expo energy with exhibitors and wellness audiences.",
          meta: "June 5, 2026 · Regional travel event",
          image: "assets/mother-earth-hero.png"
        },
        {
          tag: "Travel-friendly",
          title: "Abraham-Hicks Workshops & Cruises",
          summary: "Workshops, cruises, and wider Law of Attraction programming.",
          meta: "May 16, 2026 · Online and travel-based",
          image: "assets/mystery-school-hero.png"
        }
      ],
      footer: {
        kicker: "More to discover",
        title: "Open the directory for a fuller range of people, places, and events.",
        body: "The public directory helps people find aligned practitioners, gatherings, and communities without needing to know the names first."
      }
    },
    journalPreview: {
      kicker: "Journal",
      title: "One short journal entry to explain the site.",
      intro: "The journal can hold short public notes, but the homepage only needs one sample entry to show the tone.",
      entry: {
        tag: "First entry",
        title: "Why this site exists",
        body: "A quick introduction to the directory, events, and private membership path.",
        primaryCta: "Read the journal",
        primaryHref: "journal.html",
        secondaryCta: "Browse the directory",
        secondaryHref: "directory.html",
        image: "assets/mystery-school-hero.png"
      }
    }
  },
  journal: {
    hero: {
      eyebrow: "Public guidance",
      title: "Journal",
      copy: "Helpful notes, answers, and stories for people looking to find aligned communities, events, practitioners, and places to connect.",
      image: "assets/journal-reading-nook-crop.png",
      primaryCta: { label: "Browse the directory", href: "directory.html" },
      secondaryCta: { label: "Request membership", href: "join.html" }
    },
    intro: {
      kicker: "What this page is for",
      title: "Questions, answers, and public pieces that help people discover the right next step.",
      copy: "These entries are written to be useful on their own and to point people back to the directory, the newsletter, or membership when they want more depth."
    },
    entries: [
      {
        tag: "How to find",
        title: "How to find aligned people without knowing the right name",
        body: "Start with what you care about, then look for teachers, healers, events, and communities that speak that language.",
        ctaLabel: "Use the directory",
        ctaHref: "directory.html"
      },
      {
        tag: "Why this exists",
        title: "Why the directory and journal work together",
        body: "The journal helps people understand the project. The directory helps them find the people, places, and events that match.",
        ctaLabel: "See public listings",
        ctaHref: "directory.html"
      },
      {
        tag: "Local and wider",
        title: "How local circles and broader events can both matter",
        body: "Some people want something near them. Others want bigger gatherings or online events. This site can point to both.",
        ctaLabel: "See the homepage overview",
        ctaHref: "index.html#events"
      },
      {
        tag: "Questions people ask",
        title: "What is this community actually trying to do?",
        body: "It is a private membership community and public discovery space for people interested in spiritual growth, healing arts, natural living, and meaningful connection.",
        ctaLabel: "Learn how membership works",
        ctaHref: "join.html"
      }
    ],
    faq: [
      {
        question: "Do I need to be local?",
        answer: "No. The project is designed to grow online first, with local circles and events added over time."
      },
      {
        question: "Can I browse without joining?",
        answer: "Yes. The public side exists so people can find useful events, resources, and aligned opportunities before joining."
      },
      {
        question: "How do I keep up?",
        answer: "Use the newsletter, the journal, and the directory. Together they create a simple path from discovery to deeper involvement."
      }
    ]
  }
};

function readOverride() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function deepMerge(base, override) {
  if (!override || typeof override !== "object") return base;
  if (Array.isArray(base) || Array.isArray(override)) {
    return Array.isArray(override) ? override : base;
  }

  const merged = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value && typeof value === "object" && !Array.isArray(value) && key in base) {
      merged[key] = deepMerge(base[key], value);
    } else {
      merged[key] = value;
    }
  }
  return merged;
}

export function getSiteContent() {
  const override = readOverride();
  return override ? deepMerge(defaultSiteContent, override) : defaultSiteContent;
}

export function saveSiteContent(content) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(content, null, 2));
}

export function resetSiteContent() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function siteContentJson(content) {
  return JSON.stringify(content, null, 2);
}

export function parseSiteContentJson(text) {
  const parsed = JSON.parse(text);
  return deepMerge(defaultSiteContent, parsed);
}

function cardMarkup(card) {
  return `
    <article class="member-card featured-date-card">
      <img class="card-image" src="${card.image}" alt="">
      <span class="tag">${card.tag}</span>
      <h3>${card.title}</h3>
      <p>${card.summary}</p>
      <p><strong>${card.meta}</strong></p>
    </article>
  `;
}

export function renderHomepageContent(content = getSiteContent()) {
  const featuredSection = document.querySelector(".featured-dates-section");
  if (featuredSection) {
    featuredSection.innerHTML = `
      <div class="section-heading">
        <p class="section-kicker">${content.home.featuredDates.kicker}</p>
        <h2>${content.home.featuredDates.title}</h2>
        <p>${content.home.featuredDates.intro}</p>
      </div>
      <div class="featured-date-grid">
        ${content.home.featuredDates.items.map(cardMarkup).join("")}
      </div>
      <div class="map-preview featured-date-footer">
        <div>
          <p class="section-kicker">${content.home.featuredDates.footer.kicker}</p>
          <h3>${content.home.featuredDates.footer.title}</h3>
          <p>${content.home.featuredDates.footer.body}</p>
        </div>
        <a class="button quiet" href="directory.html">Open directory</a>
      </div>
    `;
  }

  const journalPreviewSection = document.querySelector(".journal-preview-section");
  if (journalPreviewSection) {
    const entry = content.home.journalPreview.entry;
    journalPreviewSection.innerHTML = `
      <div class="section-heading">
        <p class="section-kicker">${content.home.journalPreview.kicker}</p>
        <h2>${content.home.journalPreview.title}</h2>
        <p>${content.home.journalPreview.intro}</p>
      </div>
      <article class="member-card journal-card journal-feature-card">
        <img class="card-image" src="${entry.image}" alt="">
        <span class="tag">${entry.tag}</span>
        <h3>${entry.title}</h3>
        <p>${entry.body}</p>
        <div class="journal-card-footer">
          <a class="button quiet" href="${entry.primaryHref}">${entry.primaryCta}</a>
          <a class="text-link" href="${entry.secondaryHref}">${entry.secondaryCta}</a>
        </div>
      </article>
    `;
  }
}

export function renderJournalContent(content = getSiteContent()) {
  const hero = document.querySelector(".journal-hero");
  if (hero) {
    hero.innerHTML = `
      <div class="hero-media journal-hero-media" aria-hidden="true"></div>
      <div class="hero-content journal-hero-content">
        <p class="eyebrow">${content.journal.hero.eyebrow}</p>
        <h1>${content.journal.hero.title}</h1>
        <p class="hero-copy">${content.journal.hero.copy}</p>
        <div class="hero-actions">
          <a class="button primary" href="${content.journal.hero.primaryCta.href}">${content.journal.hero.primaryCta.label}</a>
          <a class="button secondary" href="${content.journal.hero.secondaryCta.href}">${content.journal.hero.secondaryCta.label}</a>
        </div>
      </div>
    `;
    const media = hero.querySelector(".journal-hero-media");
    if (media) {
      media.style.backgroundImage = `linear-gradient(90deg, rgba(255, 248, 232, 0.42), rgba(255, 248, 232, 0.18) 42%, rgba(255, 248, 232, 0.06)), url(\"${content.journal.hero.image}\")`;
    }
  }

  const journalSection = document.querySelector(".journal-section");
  if (journalSection) {
    journalSection.innerHTML = `
      <div class="section-heading">
        <p class="section-kicker">${content.journal.intro.kicker}</p>
        <h2>${content.journal.intro.title}</h2>
        <p>${content.journal.intro.copy}</p>
      </div>
      <div class="journal-grid">
        ${content.journal.entries.map((entry) => `
          <article class="member-card journal-card">
            <span class="tag">${entry.tag}</span>
            <h3>${entry.title}</h3>
            <p>${entry.body}</p>
            <a class="button quiet" href="${entry.ctaHref}">${entry.ctaLabel}</a>
          </article>
        `).join("")}
      </div>
    `;
  }

  const faqSection = document.querySelector(".journal-faq");
  if (faqSection) {
    faqSection.innerHTML = `
      <div class="section-heading">
        <p class="section-kicker">Quick answers</p>
        <h2>Simple questions people might ask before they join.</h2>
      </div>
      <div class="journal-faq-grid">
        ${content.journal.faq.map((item) => `
          <article class="member-card">
            <h3>${item.question}</h3>
            <p>${item.answer}</p>
          </article>
        `).join("")}
      </div>
    `;
  }
}
