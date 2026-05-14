# Mystery School of Mother Earth Foundation

Website, member portal, and administration system for a private membership association and online-first community ecosystem.

## What This Includes

- A polished static website in `index.html`, `styles.css`, and `app.js`
- A private local launch dashboard in `manage.html` and `manage.js`
- An onboarding, login, and member dashboard flow in `join.html`, `login.html`, and `member.html`
- A project-bound hero image in `assets/mother-earth-hero.png`
- A starter content model in `data/content-model.json`
- Launch, Facebook, newsletter, outreach, intake, and event planning documents in `docs/`
- A project-specific Members Association Agreement in `docs/PMA_AGREEMENT_DRAFT.md`, with the onboarding signature text populated from `agreement.js`

## Why It Is Structured This Way

This first version keeps the technology simple so the foundation idea can be tested quickly. It is not locked into a membership platform, CRM, payment processor, or database yet. The public site functions as a grounded front door, while the content and docs frame offers and promotions as member opportunities inside the association.

The homepage is designed to show the full vision immediately:

- Earth stewardship and natural living first
- Spiritual growth, healing arts, and mystery-school learning woven in as part of the deeper vision
- Basic membership as the entry point
- Vendor/practitioner upgrade as a later member pathway
- Newsletter and directory as now-stage products
- Mother Earth Circles and Mother Earth Market as repeatable local models

## Run Locally

From this folder:

```bash
npm start
```

Then open:

```text
http://localhost:4173
```

Project management dashboard:

```text
http://localhost:4173/member.html
```

The organization manager is at `http://localhost:4173/manage.html`, but it redirects through member login and only allows a local admin account.

You can also open `index.html` directly in a browser, but the local server is closer to how it will behave when hosted.

## Form Behavior

The founding interest form saves test submissions into browser local storage only. It does not email anyone and does not send data to a server.

The launch dashboard checklists and notes also save into browser local storage only.

## Member Login

The onboarding flow creates a local member account. The first account created becomes the administrator and can access the organization manager.

Current local build note: passwords, private activation records, coupons, and agreement signatures are stored in browser local storage. A hosted launch should use secure authentication, a payment processor, durable agreement records, privacy policies, and administrator-controlled records.

Later, this should connect to one of these:

- ConvertKit, MailerLite, Flodesk, Beehiiv, or Mailchimp for email
- Airtable, Notion, Google Sheets, or a small database for intake tracking
- A membership system such as MemberPress, Ghost, Circle, Mighty Networks, or a custom app

## Important PMA Note

Keep membership terms, association agreements, liability language, vendor terms, event rules, privacy language, payment flow, tax treatment, and advertising claims aligned with counsel guidance.

## Suggested Next Development Steps

1. Replace sample directory entries with real founding applicants.
2. Connect the interest form to a real email and intake tool.
3. Add separate pages for membership, directory, newsletter, circles, and market once content volume grows.
4. Add private member login or gated content when the association is ready.
5. Add private member contribution/payment handling only after membership terms and PMA documents are reviewed.
6. Build an admin workflow for approving vendor/practitioner listings.
7. Create event pages for Chapter 001 around Peotone, Kankakee, Wilmington, and nearby south/southwest communities.
