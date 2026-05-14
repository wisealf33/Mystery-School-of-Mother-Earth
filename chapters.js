const chaptersKey = "motherEarthChapters";

const chapterDefaults = [
  {
    id: "chapter-001",
    number: "001",
    name: "Chapter 001",
    status: "forming",
    region: "South Chicagoland Southlands",
    cityFocus: "Peotone, Beecher, Monee, Manhattan, Manteno, Bourbonnais, Bradley, Kankakee, Wilmington, Braidwood, Momence, Crete, Frankfort, Mokena, New Lenox, Tinley Park, Orland Park",
    zipCodes: ["60468", "60401", "60449", "60442", "60950", "60914", "60915", "60901", "60481", "60408", "60954", "60417", "60423", "60448", "60451", "60477", "60462"],
    description: "The first local chapter for members in the southern South Chicagoland area, centered around Peotone and reaching toward Kankakee, Wilmington, and nearby south/southwest communities.",
    visibility: "limited",
    memberIds: [],
    leads: [],
    notes: "Umbrella PMA membership remains global. Chapter 001 is for local organizing, local teachers, local events, and regional income-building opportunities."
  }
];

export function getChapters() {
  const stored = JSON.parse(localStorage.getItem(chaptersKey) || "null");
  if (stored) {
    const migrated = mergeChapterDefaults(stored);
    localStorage.setItem(chaptersKey, JSON.stringify(migrated));
    return migrated;
  }

  localStorage.setItem(chaptersKey, JSON.stringify(chapterDefaults));
  return chapterDefaults;
}

export function saveChapters(chapters) {
  localStorage.setItem(chaptersKey, JSON.stringify(chapters));
}

export function getChapterById(chapterId) {
  return getChapters().find((chapter) => chapter.id === chapterId) || null;
}

export function eligibleForChapter(member, chapter) {
  if (!member || !chapter) return false;
  const memberZip = member.address?.zip || "";
  const memberCity = (member.address?.city || "").toLowerCase();
  const cityFocus = (chapter.cityFocus || "").toLowerCase();
  return chapter.zipCodes.includes(memberZip) || (memberCity && cityFocus.includes(memberCity));
}

export function assignMemberToChapter(memberId, chapterId) {
  const chapters = getChapters().map((chapter) => {
    if (chapter.id !== chapterId) return chapter;
    const memberIds = chapter.memberIds.includes(memberId)
      ? chapter.memberIds
      : [...chapter.memberIds, memberId];
    return { ...chapter, memberIds };
  });
  saveChapters(chapters);
  return getChapterById(chapterId);
}

export function removeMemberFromChapter(memberId, chapterId) {
  const chapters = getChapters().map((chapter) => {
    if (chapter.id !== chapterId) return chapter;
    return { ...chapter, memberIds: chapter.memberIds.filter((id) => id !== memberId) };
  });
  saveChapters(chapters);
  return getChapterById(chapterId);
}

function mergeChapterDefaults(storedChapters) {
  const storedById = new Map(storedChapters.map((chapter) => [chapter.id, chapter]));
  const mergedDefaults = chapterDefaults.map((defaults) => {
    const stored = storedById.get(defaults.id);
    if (!stored) return defaults;
    return {
      ...stored,
      ...defaults,
      memberIds: stored.memberIds || [],
      leads: stored.leads || []
    };
  });
  const customChapters = storedChapters.filter((chapter) => {
    return !chapterDefaults.some((defaults) => defaults.id === chapter.id);
  });
  return [...mergedDefaults, ...customChapters];
}
