# Member Portal And Onboarding Plan

## Current Member Flow

1. Public visitor clicks Join.
2. Visitor completes member account details.
3. Visitor reviews and signs the Members Association Agreement.
4. Visitor completes a private member activation step after agreement signature.
5. Visitor becomes a Basic Member.
6. The first completed member becomes the administrator.
7. Members can access the member dashboard.
8. The administrator can access the organization manager.

## Current Local Records

- Payment
- Membership coupons
- E-signature
- Password storage
- Member database
- Admin permissions

These records define the current local build and should be replaced with secure hosted services when the site is deployed.

## Hosted Launch Requirements

- Secure authentication
- Password hashing and account recovery
- Stripe, Square, PayPal, or another payment processor
- Signed agreement records with timestamps and version history
- Coupon or comp-code records for founder, offline-paid, scholarship, barter, or complimentary membership paths
- Member agreement reviewed by qualified counsel
- Privacy policy and terms
- Admin role management
- Member profile and directory approval workflow
- Vendor/practitioner upgrade application and payment
- Email confirmations and receipts
- Exportable member records

## Recommended Real Stack Later

For a fast launch:

- Website: WordPress + MemberPress, Ghost, or Webflow plus Memberstack
- Payment: Stripe
- Agreements: Dropbox Sign, DocuSign, Jotform Sign, or custom checkbox/signature with legal review
- Intake: Airtable or Notion
- Email: MailerLite or ConvertKit

For a custom app:

- Frontend: Next.js
- Database: Supabase or Postgres
- Auth: Supabase Auth, Clerk, or Auth.js
- Payments: Stripe
- Coupons: payment processor coupons, admin-issued comp codes, or internal approval records
- Agreement storage: PDF snapshots plus database records
- Admin dashboard: custom role-based portal
