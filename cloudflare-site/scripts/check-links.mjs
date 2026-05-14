import { existsSync, readFileSync } from "node:fs";

const files = ["index.html", "manage.html", "admin-members.html", "admin-member-profile.html", "admin-directory.html", "admin-coupons.html", "admin-chapters.html", "join.html", "login.html", "member.html"];
const broken = [];
let checked = 0;

for (const file of files) {
  const html = readFileSync(file, "utf8");
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
  const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map((match) => `#${match[1]}`));
  checked += hrefs.length;

  hrefs.forEach((href) => {
    if (href.startsWith("#") && !ids.has(href)) {
      broken.push(`${file}: ${href}`);
    }

    const localHref = href.split("?")[0].split("#")[0];
    if (localHref.endsWith(".html") && !existsSync(localHref)) {
      broken.push(`${file}: ${href}`);
    }
  });
}

if (broken.length) {
  console.error(`Broken links: ${broken.join(", ")}`);
  process.exit(1);
}

console.log(`Checked ${checked} links. All local links resolve.`);
