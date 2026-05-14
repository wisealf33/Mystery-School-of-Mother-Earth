export const currentAgreement = {
  id: "members-association-agreement",
  version: "0.2",
  title: "Mystery School of Mother Earth Foundation Members Association Agreement",
  subtitle: "A Private Agreement Members Association",
  updatedAt: "2026-05-03",
  source: "Adapted from uploaded Members Association Agreement.docx outline",
  paragraphs: [
    "I hereby accept the terms in the Mystery School of Mother Earth Foundation Members Association, hereinafter called the Association, a private membership association available by invitation, request, and application approval. With the signing of this members agreement, I accept the invitation to become a member of the Association.",
    "By signing this agreement, I agree to act in accordance with the Association mission: to gather a private community centered around earth stewardship, natural living, spiritual healing, inner transformation, practical wisdom, mystery-school learning, and real community among aligned members.",
    "The Association declares its purpose as a private society of members seeking to live in peace, mutual respect, self-responsibility, natural law, spiritual integrity, and freedom of conscience. Members gather privately to share education, fellowship, healing arts, natural living wisdom, practical earth-centered skills, member discovery, and other lawful private association activities.",
    "I understand that my participation is in private relation with the Association and its members. Member opportunities, member discovery, internal communications, private gatherings, contribution details, and association planning are for members and are not public services offered to nonmembers.",
    "I affirm that I am responsible for my own choices, beliefs, body, mind, spirit, health, legal condition, participation, and wellbeing. Nothing in this Association replaces professional medical, legal, financial, tax, or therapeutic advice unless separately and privately agreed with a properly qualified professional.",
    "I agree to respect the privacy and confidence of the Association and fellow members. I will not disclose private member information, internal association matters, or confidential member communications to the public or nonmembers without permission.",
    "I agree that concerns, complaints, or grievances should first be brought privately to the Association in good faith, with the intention of peaceful resolution and, if needed, independent mediation before adversarial action.",
    "I certify that I am of sound mind, competent to sign, and that I have carefully read and understood the plain language of this agreement. I voluntarily accept the private terms of membership and intend this agreement to guide my participation as a member."
  ],
  notice: ""
};

export function agreementText(agreement = currentAgreement) {
  return [
    agreement.title,
    agreement.subtitle,
    ...agreement.paragraphs,
    agreement.notice
  ].filter(Boolean).join("\n\n");
}
