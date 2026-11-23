/* =========================================================
   pages.js
   ---------------------------------------------------------
   One function per page. Each HTML file has a
   data-page="..." attribute on <body>, and the matching
   function below fills in that page.

   Class names used here:
     .wrap  the text column, centered, with page margins
     .cols  divides it into 12 columns (6 on tablets, 4 on phones)
   See section 3 of css/style.css.
   ========================================================= */

const Pages = {

  /* ---------- Works (index.html) ---------- */
  async works(s) {
    const main = document.querySelector("main");
    const words = s.rotatingWords || [""];

    // 1. The hero header
    const lines = (s.headline || []).map((line, i) => {
      const inner = line === "{rotate}"
        ? `<span class="hero__rotate"><span class="word">${esc(words[0])}</span></span>`
        : esc(line);
      return `<span class="hero__line"><span style="--i:${i}">${inner}</span></span>`;
    }).join("");
    const spoken = (s.headline || []).join(" ").replace("{rotate}", words[0]);

    main.innerHTML = `
      <section class="hero wrap cols">
        <h1 class="hero__headline" aria-label="${esc(spoken)}">${lines}</h1>
        <p class="hero__intro">${esc(tie(s.intro))}</p>
      </section>
      <section class="works wrap" id="works">
        <div class="works__bar cols">
          <span class="label">Selected work, ${(s.works || []).length} projects</span>
          ${s.portfolioPdf ? `<a class="action" href="${esc(s.portfolioPdf)}" target="_blank" rel="noopener">Download PDF portfolio</a>` : ""}
        </div>
        <div class="works__grid cols" id="grid"></div>
      </section>`;

    Pages.rotateWords(words);

    // 2. The project cards, in the order listed in settings.json
    const projects = await Pages.loadProjects(s.works);
    document.getElementById("grid").innerHTML = projects.map(({ slug, data: p }) => `
      <a class="card reveal" href="project.html?p=${encodeURIComponent(slug)}">
        ${p.cover
          ? `<div class="card__media"><img src="${esc(p.cover)}" alt="${esc(p.coverAlt)}" loading="lazy"></div>`
          : `<div class="card__media card__media--blank" style="--hue:${esc(p.color || "var(--line)")}"><span>Cover image</span></div>`}
        <h2 class="card__title">${esc(p.title)}</h2>
        <p class="card__meta">${esc(p.discipline)}</p>
      </a>`).join("");
    Site.reveal();
  },

  /* Swap the accent word in the headline every few seconds. */
  rotateWords(words) {
    const holder = document.querySelector(".hero__rotate");
    if (!holder || words.length < 2) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let i = 0;
    setTimeout(() => setInterval(() => {
      const current = holder.querySelector(".word");
      current.classList.add("is-out");
      setTimeout(() => {
        i = (i + 1) % words.length;
        current.textContent = words[i];
        current.classList.remove("is-out");
        current.classList.add("is-in");
        setTimeout(() => current.classList.remove("is-in"), 500);
      }, 340);
    }, 2400), 1600);
  },

  /* Load every project file listed in settings.json. */
  async loadProjects(slugs = []) {
    const results = [];
    for (const slug of slugs) {
      try {
        results.push({ slug, data: await Site.load(`content/projects/${slug}.json`) });
      } catch (err) {
        Site.showError(err);
      }
    }
    return results;
  },

  /* ---------- One project (project.html?p=slug) ---------- */
  async project(s) {
    const main = document.querySelector("main");
    // The project name comes from the address, project.html?p=tamara
    // (or project.html#tamara on hosts that drop the ?p= part).
    const slug = new URLSearchParams(location.search).get("p") || location.hash.slice(1) || (s.works || [])[0];
    const p = await Site.load(`content/projects/${slug}.json`);
    document.title = `${p.title}, ${s.name}`;

    // Discipline, Format, Tools and Role. Role is only for group
    // projects, to say what you did on the team.
    const facts = [["Discipline", p.discipline], ["Format", p.format], ["Tools", p.tools], ["Role", p.role]].filter(([, v]) => v);

    main.innerHTML = `
      <article${p.color ? ` class="has-hue" style="--hue:${esc(p.color)}"` : ""}>
        <header class="project-head wrap cols">
          <h1 class="page-title">${esc(p.title)}</h1>
          <p class="lead">${esc(p.summary)}</p>
          <dl class="facts cols" data-n="${facts.length}">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
        </header>
        ${p.cover
          ? `<div class="project-cover wrap"><img src="${esc(p.cover)}" alt="${esc(p.coverAlt)}"></div>`
          : `<div class="project-cover wrap"><div class="b-placeholder b-placeholder--cover"><span><strong>Cover image</strong>${esc(p.coverAlt || "Your strongest image of the finished work")}</span></div></div>`}
        <div class="blocks wrap">${Blocks.render(p.blocks)}</div>
        <div class="wrap" id="after"></div>
      </article>`;
    Site.reveal();

    // Previous and next links need the full list of projects.
    const all = await Pages.loadProjects(s.works);
    const index = all.findIndex(x => x.slug === slug);
    const prev = index > 0 ? all[index - 1] : null;
    const next = index > -1 && index < all.length - 1 ? all[index + 1] : all[0];
    const link = (x, label, cls) => x && x.slug !== slug
      ? `<a class="${cls}" href="project.html?p=${encodeURIComponent(x.slug)}"><small>${label}</small><strong>${esc(x.data.title)}</strong></a>`
      : "";
    document.getElementById("after").innerHTML = `
      <nav class="pager cols" aria-label="More projects">
        ${link(prev, "← Previous", "pager__prev")}
        ${link(next, "Next project →", "pager__next")}
      </nav>`;
  },

  /* ---------- Resume ----------
     Not linked in the menu. The menu opens the PDF, and this
     page is what the PDF is made from. The layout follows a
     classic CV: the name and main sections on the right,
     awards, clients and contact in a column on the left. */
  async resume(s) {
    const r = await Site.load("content/resume.json");
    const label = text => `<h2 class="cv__label">${esc(text)}</h2>`;
    const item = it => `
      <div class="cv-item">
        <div class="cv-item__head">
          <span class="cv-item__where">${esc(it.where)}</span>
          <span class="cv-item__place">${esc(it.place || "")}</span>
          <span class="cv-item__when">${esc(it.when || "")}</span>
        </div>
        ${it.what ? `<div class="cv-item__what">${esc(it.what)}</div>` : ""}
        ${(it.details || []).length ? `<ul class="dots cv-item__details">${it.details.map(d => `<li>${esc(d)}</li>`).join("")}</ul>` : ""}
      </div>`;
    const contact = [
      s.website, s.linkedin && s.linkedin.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""), s.email
    ].filter(Boolean);

    // Both columns share one set of rows. The side sections line up
    // with the last main sections, so Awards starts on the same line
    // as Activities and Contact on the same line as Skills.
    const main = [
      `<h1 class="cv__name">${esc(s.name)}</h1>`,
      r.expertise ? `<section>${label("Expertise")}<ul class="cv__expertise">${r.expertise.map(x => `<li>${esc(x)}</li>`).join("")}</ul></section>` : "",
      ...(r.sections || []).map(sec => `<section>${label(sec.title)}${(sec.items || []).map(item).join("")}</section>`),
      r.skills ? `<section>${label("Skills")}<dl class="cv__skills">${r.skills.map(k => `<div><dt>${esc(k.title)}</dt><dd>${esc(k.list)}</dd></div>`).join("")}</dl></section>` : ""
    ].filter(Boolean);
    const side = [
      r.awards ? `<section>${label("Awards")}<dl class="cv__awards">${r.awards.map(a => `<div><dt>${esc(a.name)}</dt><dd>${esc(a.note)}</dd><dd>${esc(a.when)}</dd></div>`).join("")}</dl></section>` : "",
      `<section>${label("Contact")}<ul class="cv__contact">${contact.map(c => `<li>${esc(c)}</li>`).join("")}</ul></section>`
    ].filter(Boolean);
    const first = Math.max(main.length - side.length, 1);

    document.querySelector("main").innerHTML = `
      <section class="page wrap">
        <div class="page__actions no-print" style="margin-top:0;margin-bottom:var(--s7)">
          ${s.resumePdf ? `<a class="action" href="${esc(s.resumePdf)}" target="_blank" rel="noopener">Download resume PDF</a>` : ""}
        </div>
        <article class="cv cols" style="--rows:${main.length}">
          ${main.map((m, i) => `<div class="cv__main" style="grid-row:${i + 1}">${m}</div>`).join("")}
          ${side.map((m, i) => `<div class="cv__side" style="grid-row:${first + i + 1}">${m}</div>`).join("")}
          ${r.motto ? `<p class="cv__motto">${esc(r.motto)}</p>` : ""}
        </article>
      </section>`;
  },

  /* ---------- About ---------- */
  async about(s) {
    const a = await Site.load("content/about.json");
    document.querySelector("main").innerHTML = `
      <section class="page about wrap${a.color ? " has-hue" : ""}"${a.color ? ` style="--hue:${esc(a.color)}"` : ""}>
        <h1 class="page-title">About</h1>
        <div class="about-head cols">
          <p class="lead">${esc(tie(a.lead))}</p>
        </div>
        <div class="blocks">
          ${Blocks.render(a.blocks)}
          <section class="b-text">
            <h2>Contact</h2>
            <div class="page__actions" style="margin-top:0">
              ${s.website ? `<span>${esc(s.website)}</span>` : ""}
              ${s.linkedin ? `<a class="action" href="${esc(s.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>` : ""}
              ${s.email ? `<span>${esc(s.email)}</span>` : ""}
              ${s.resumePdf ? `<a class="action" href="${esc(s.resumePdf)}" target="_blank" rel="noopener">Resume PDF</a>` : ""}
            </div>
          </section>
        </div>
      </section>`;
    Site.reveal();
  },

  /* ---------- PDF portfolio (print.html) ----------
     An 11 by 6.25 in landscape deck. A cover, then one page for every
     project, numbered, with its title, tools, a short
     description and four images. In Chrome choose File,
     Print, Save as PDF, and turn on background graphics. The
     page size is set by the stylesheet. */
  async print(s) {
    const projects = await Pages.loadProjects(s.works);
    const contact = [s.website, s.linkedin && s.linkedin.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""), s.email].filter(Boolean);

    // One image, or a colored box when the image isn't there yet.
    const picture = (item, p, isCover) => item.src
      ? `<img src="${esc(item.src)}" alt="${esc(item.label)}">`
      : `<div class="deck__box${isCover ? " deck__box--cover" : ""}" style="--hue:${esc(p.color || "#888")}"><span>${esc(item.label)}</span></div>`;

    // Every image in a project, in order: cover first, then the rest.
    const images = p => {
      const list = [{ src: p.cover, label: p.coverAlt || "Cover image" }];
      (p.blocks || []).forEach(b => {
        if (b.type === "image") list.push({ src: b.src, label: b.caption || b.alt || "Image", isImage: true });
        if (b.type === "placeholder") list.push({ src: "", label: b.label });
        if (b.type === "gallery") (b.images || []).forEach(im => list.push({ src: im.src, label: im.alt }));
      });
      return list;
    };

    // One page per project, split at the center. The left half
    // holds the title and tools above the cover. The right half
    // holds the description above the main image and two small
    // process images.
    const pages = projects.map(({ data: p }, n) => {
      const all = images(p);
      const cover = all[0];
      const rest = all.slice(1);
      const main = rest.find(x => x.isImage) || rest[0];
      const small = rest.filter(x => x !== main).slice(0, 2);
      const idea = (p.blocks || []).find(b => b.type === "text" && /idea/i.test(b.heading || ""));
      const text = [p.summary, idea ? idea.body.split(/\n\s*\n/)[0] : ""].filter(Boolean).join(" ");
      return `
        <section class="deck">
          <div class="deck__head">
            <h2 class="deck__title">${n + 1}. ${esc(p.title)}</h2>
            <dl class="deck__facts">${[["Discipline", p.discipline], ["Format", p.format], ["Tools", p.tools], ["Role", p.role]].filter(([, v]) => v).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
          </div>
          <p class="deck__text">${esc(text)}</p>
          <div class="deck__cover">${picture(cover, p, true)}</div>
          <div class="deck__right">
            <div class="deck__main">${main ? picture(main, p, false) : ""}</div>
            ${small.map(item => `<div>${picture(item, p, false)}</div>`).join("")}
          </div>
          <p class="deck__folio">${esc(s.name)} Portfolio</p>
          <p class="deck__folio">${esc(s.website || "")}</p>
        </section>`;
    }).join("");

    document.querySelector("main").innerHTML = `
      <div class="print-help wrap">
        <p><strong>This page becomes your PDF portfolio.</strong> In Chrome choose File, then Print, then Save as PDF, and turn on background graphics. The 11 × 6.25 in page size is set for you. Save the file into the <code>files</code> folder with the name set in settings.json.</p>
      </div>
      <section class="deck deck--cover">
        <div class="deck__name"><h1>${esc(s.name)}</h1><p>${esc(s.role)}</p></div>
        <ul class="deck__contact">${contact.map(c => `<li>${esc(c)}</li>`).join("")}</ul>
        <p class="deck__statement">${esc(tie(s.statement || s.intro))}</p>
        <p class="deck__label">Selected Work</p>
      </section>
      ${pages}`;
  }
};

/* When only the #name changes, the browser doesn't reload. Do it ourselves. */
addEventListener("hashchange", () => { if (document.body.dataset.page === "project") location.reload(); });

/* ---------- Start ---------- */
(async () => {
  const page = document.body.dataset.page;
  try {
    const settings = await Site.init();
    if (Pages[page]) await Pages[page](settings);
  } catch (err) {
    if (Site.settings) Site.showError(err);
    console.error(err);
  }
  Site.typeset();
  document.body.classList.add("is-ready");
  // Tell other scripts (like stars.js) that the page is built.
  document.dispatchEvent(new Event("site:ready"));
})();
