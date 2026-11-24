/* =========================================================
   site.js
   ---------------------------------------------------------
   The shared engine. Every page loads this file. It:
     1. reads content/settings.json
     2. applies your colors and typeface
     3. builds the menu and the footer
     4. knows how to turn "blocks" into HTML

   You should not need to edit this file to change content.
   Content lives in the /content folder.
   ========================================================= */

const Site = {
  settings: null,

  /* Load a JSON file. If it is missing or has a typo, show a
     clear message on the page instead of a blank screen. */
  async load(path) {
    let response;
    try {
      response = await fetch(path, { cache: "no-cache" });
    } catch (err) {
      throw new Error(
        location.protocol === "file:"
          ? "This site reads its content with fetch(), which browsers block when you open the file directly. Preview it with a local server (see “Preview locally” in the README)."
          : `Could not reach ${path}.`
      );
    }
    if (!response.ok) throw new Error(`Could not find <code>${path}</code>. Check the file name and the folder.`);
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (err) {
      // Find the line number so the student knows where to look.
      const pos = Number((err.message.match(/position (\d+)/) || [])[1]);
      const line = pos ? text.slice(0, pos).split("\n").length : null;
      throw new Error(
        `There is a typo in <code>${path}</code>${line ? ` near line ${line}` : ""}. ` +
        "Look for a missing comma, a missing quote mark, or a comma after the last item in a list."
      );
    }
  },

  /* Run once on every page. */
  async init() {
    try {
      this.settings = await this.load("content/settings.json");
    } catch (err) {
      this.showError(err);
      throw err;
    }
    this.applyTheme();
    if (this.settings.showGrid) document.documentElement.classList.add("show-grid");
    await this.gate();
    this.buildNav();
    this.buildFooter();
    return this.settings;
  },

  /* A simple password screen. Set "passwordHash" in settings.json
     to turn it on, or remove it to turn it off.

     This only keeps casual visitors and search engines out. The
     files themselves are still public, so never use it to hide
     anything private. The hash is the SHA-256 of the password, so
     the password itself is not written in any file. */
  async gate() {
    const hash = this.settings.passwordHash;
    if (!hash) return document.documentElement.classList.remove("is-locked");
    // Unlocking is remembered in this browser, so the password is
    // asked once. Changing the password (a new hash) asks again.
    let open = false;
    try { open = localStorage.getItem("unlocked") === hash; } catch (e) {}
    if (open) return document.documentElement.classList.remove("is-locked");

    document.documentElement.classList.add("is-locked");
    const gate = document.createElement("form");
    gate.className = "gate";
    gate.innerHTML = `
      <label for="gate-input">${esc(this.settings.name)}</label>
      <input id="gate-input" type="password" placeholder="Password" autocomplete="current-password" autofocus>
      <p class="gate__error" aria-live="polite"></p>`;
    document.body.appendChild(gate);

    const sha = async text => {
      const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, "0")).join("");
    };

    await new Promise(resolve => {
      gate.addEventListener("submit", async event => {
        event.preventDefault();
        const input = gate.querySelector("input");
        if (await sha(input.value.trim().toLowerCase()) === hash) {
          try { localStorage.setItem("unlocked", hash); } catch (e) {}
          gate.remove();
          document.documentElement.classList.remove("is-locked");
          resolve();
        } else {
          gate.querySelector(".gate__error").textContent = "Try again.";
          input.select();
        }
      });
    });
  },

  /* Copy the theme colors from settings.json into the CSS variables. */
  applyTheme() {
    const t = this.settings.theme || {};
    const root = document.documentElement.style;
    const map = { background: "--bg", text: "--fg", muted: "--muted", line: "--line", accent: "--accent", gridLine: "--grid-line" };
    for (const key in map) if (t[key]) root.setProperty(map[key], t[key]);

    if (t.font) {
      // Any Google Font works: set "googleFont": true and type its exact name.
      if (t.googleFont) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(t.font)}:ital,wght@0,300..800;1,300..800&display=swap`;
        document.head.appendChild(link);
      }
      root.setProperty("--font", `"${t.font}", -apple-system, "Helvetica Neue", Arial, sans-serif`);
    }
  },

  /* Build the menu from the "menu" list in settings.json. */
  buildNav() {
    const s = this.settings;
    const here = location.pathname.split("/").pop() || "index.html";
    const nav = document.createElement("header");
    nav.className = "site-nav";
    nav.innerHTML = `
      <div class="wrap cols">
        <a class="site-nav__name" href="index.html">${esc(s.name)}</a>
        <ul class="site-nav__menu" aria-label="Main">
          ${(s.menu || []).map(item => {
            const current = item.link === here || (here === "project.html" && item.link === "index.html");
            const tab = item.newTab ? ' target="_blank" rel="noopener"' : "";
            const badge = item.badge ? ' class="badge"' : "";
            // A short label like "in" needs a full name for screen readers.
            const name = item.fullName ? ` aria-label="${esc(item.fullName)}"` : "";
            return `<li><a href="${esc(item.link)}"${tab}${badge}${name}${current ? ' aria-current="page"' : ""}>${esc(item.label)}</a></li>`;
          }).join("")}
        </ul>
      </div>`;
    document.body.prepend(nav);
  },

  buildFooter() {
    const s = this.settings;
    const footer = document.createElement("footer");
    footer.className = "site-footer";
    const links = [];
    if (s.email) links.push(`<span>${esc(s.email)}</span>`);
    if (s.portfolioPdf) links.push(`<a href="${esc(s.portfolioPdf)}" target="_blank" rel="noopener">PDF portfolio</a>`);
    if (s.showGuideLink) links.push(`<a href="guide.html">Portfolio guide</a>`);
    footer.innerHTML = `
      <div class="wrap"><div class="cols">
        <p>${s.colophon ? `<a href="${esc(s.colophon)}">` : ""}&copy; ${new Date().getFullYear()} ${esc(s.name)}${s.colophon ? "</a>" : ""}</p>
        <nav aria-label="Footer">${links.join("")}</nav>
      </div></div>`;
    document.body.appendChild(footer);
  },

  showError(err) {
    const box = document.createElement("div");
    box.className = "load-error";
    box.innerHTML = `<h2>Something in the content needs a fix</h2><p>${err.message}</p>`;
    (document.querySelector("main") || document.body).prepend(box);
  },

  /* Typesetting, the way it is done by hand.
       1. Names never break or hyphenate.
       2. “a,” “an,” and “I” stay with the next word.
       3. A number stays with what it counts (24 × 36 in, 8 projects).
       4. The last two words of a paragraph stay together. From
          480px up, the last three (see .tie3 in style.css).
     Add a name to the list below and it is protected everywhere. */
  names: ["Gromit Forger", "Loid Forger", "Henry Hongmin Kim", "alter ego",
          "Imperial Scholar", "Where is Stella?", "Thorn Princess", "Top Bun",
          "Operation Strix", "The Wrong Trousers", "Stella Stars",
          "Cracking Cheese", "Anti-Pesto", "Feathers McGraw", "Eden Academy"],

  typeset(root = document.querySelector("main")) {
    if (!root) return;
    const NB = "\u00a0";
    const nameRe = new RegExp("(" + this.names
      .map(n => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+")).join("|") + ")", "g");
    const blocks = root.querySelectorAll("p, li, blockquote, figcaption, dd");

    const walk = el => {
      const out = [];
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode: n => n.parentElement.closest("code, pre, script, style, button, input, textarea, svg")
          ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
      });
      while (w.nextNode()) out.push(w.currentNode);
      return out;
    };

    // Guard. In a flex or grid row, every loose piece of text becomes
    // its own column. Gather the text of such a row into one span
    // first, so the ties below can never split it apart.
    const holdRuns = el => {
      [el, ...el.querySelectorAll("*")].forEach(box => {
        if (!/flex|grid/.test(getComputedStyle(box).display)) return;
        let run = [];
        const flush = () => {
          if (run.some(n => n.nodeType !== 3 || n.nodeValue.trim())) {
            const span = document.createElement("span");
            run[0].before(span);
            run.forEach(n => span.append(n));
          }
          run = [];
        };
        [...box.childNodes].forEach(n => {
          const inline = n.nodeType === 3 || (n.nodeType === 1
            && getComputedStyle(n).display.startsWith("inline")
            && !n.matches("input, button, select, textarea, svg, img"));
          if (inline) run.push(n); else flush();
        });
        flush();
      });
    };

    blocks.forEach(el => {
      if (el.dataset.typeset) return;
      el.dataset.typeset = "1";
      holdRuns(el);
      const nodes = walk(el);

      // Rules 1 to 3, on every piece of text.
      nodes.forEach(node => {
        let t = node.nodeValue;
        t = t.replace(/(^|[\s(“"])(a|an|A|An|I)\s+/g, "$1$2" + NB)
             .replace(/(\d)\s+×\s+(\d)/g, "$1" + NB + "×" + NB + "$2")
             .replace(/(\d)\s+(?=[\p{L}×])/gu, "$1" + NB);
        if (!nameRe.test(t)) { node.nodeValue = t; return; }
        nameRe.lastIndex = 0;
        const frag = document.createDocumentFragment();
        let last = 0;
        t.replace(nameRe, (m, _n, i) => {
          frag.append(t.slice(last, i));
          const span = document.createElement("span");
          span.className = "nohy";
          span.textContent = m.replace(/\s+/g, NB);
          frag.append(span);
          last = i + m.length;
        });
        frag.append(t.slice(last));
        node.replaceWith(frag);
      });

      // Rule 4, on the last words.
      const tail = walk(el).filter(n => n.nodeValue.trim()).pop();
      if (!tail) return;
      const m = tail.nodeValue.match(/^([\s\S]*?)(\S+)( +)(\S+)( +)(\S+)(\s*)$/);
      if (m) {
        const span = document.createElement("span");
        span.className = "tie3";
        span.textContent = m[2] + " " + m[4] + NB + m[6];
        tail.replaceWith(m[1], span, m[7]);
      } else {
        tail.nodeValue = tail.nodeValue.replace(/ +(\S+\s*)$/, NB + "$1");
      }
    });
  },

  /* Fade elements in as they scroll into view. */
  reveal(root = document) {
    const items = root.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) return items.forEach(el => el.classList.add("is-visible"));
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach(el => io.observe(el));
  }
};

/* ---------------------------------------------------------
   Small helpers
   --------------------------------------------------------- */

/* Escape text so a stray < or & in your content can't break the page. */
function esc(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* Tie one-letter words like “a” and “I” to the word after them
   with a non-breaking space, so a line never ends on one. An old
   typesetting rule. */
function tie(value = "") {
  return String(value).replace(/(^|[\s(“"])(a|an|A|An|I)\s+/g, "$1$2\u00a0");
}

/* A tiny bit of formatting for text blocks:
     *italic*   **bold**   [link text](https://...)
   A blank line starts a new paragraph. */
function richText(value = "") {
  return value
    .split(/\n\s*\n/)
    .map(paragraph => {
      let html = esc(tie(paragraph.trim()))
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
        .replace(/\n/g, "<br>");
      return `<p>${html}</p>`;
    })
    .join("");
}

/* ---------------------------------------------------------
   Blocks
   ---------------------------------------------------------
   A project page is a list of blocks. Each block has a
   "type". The function with the same name below turns it
   into HTML. To invent a new block type, add a function
   here and a matching style in style.css.
   --------------------------------------------------------- */

const Blocks = {
  render(list = []) {
    return list.map(block => {
      const make = Blocks[block.type];
      if (!make) return `<div class="b-placeholder"><span><strong>Unknown block</strong>There is no block type called “${esc(block.type)}”. Check the spelling.</span></div>`;
      return `<div class="reveal">${make(block)}</div>`;
    }).join("");
  },

  text(b) {
    const heading = b.heading ? `<h2>${esc(b.heading)}</h2>` : "";
    return `
      <section class="b-text">
        ${heading}
        <div class="b-text__body">${richText(b.body)}</div>
      </section>`;
  },

  image(b) {
    const width = ["full", "wide", "narrow"].includes(b.width) ? b.width : "narrow";
    if (!b.src) return `<figure class="b-figure b-figure--${width}">${Blocks.placeholder({ label: b.caption || b.alt || "Image", ratio: b.ratio })}</figure>`;
    return `
      <figure class="b-figure b-figure--${width}">
        <img src="${esc(b.src)}" alt="${esc(b.alt)}" loading="lazy">
        ${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ""}
      </figure>`;
  },

  gallery(b) {
    const cols = [2, 3, 4].includes(Number(b.columns)) ? Number(b.columns) : 2;
    const ratio = b.ratio ? `--ratio:${esc(b.ratio)};` : "";
    const items = (b.images || []).map(img =>
      img.src
        ? `<img src="${esc(img.src)}" alt="${esc(img.alt)}" loading="lazy">`
        : `<div class="b-placeholder" style="--ratio:${esc(b.ratio || "4/5")}"><span><strong>Placeholder</strong>${esc(img.alt || "Image")}</span></div>`
    ).join("");
    // Equal shares of the 12 columns: 2 images span 6 each, 3 span 4, 4 span 3.
    return `
      <figure class="b-gallery">
        <div class="b-gallery__grid cols" style="--span:${12 / cols};${ratio}">${items}</div>
        ${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ""}
      </figure>`;
  },

  video(b) {
    const url = b.url || "";
    const ratio = `--ratio:${esc(b.ratio || "16/9")}`;
    let player;
    const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    const youtube = url.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
    if (vimeo) {
      player = `<iframe src="https://player.vimeo.com/video/${vimeo[1]}?dnt=1&title=0&byline=0&portrait=0" allow="autoplay; fullscreen; picture-in-picture" loading="lazy" title="${esc(b.caption || "Video")}"></iframe>`;
    } else if (youtube) {
      player = `<iframe src="https://www.youtube-nocookie.com/embed/${youtube[1]}" allow="autoplay; fullscreen; picture-in-picture" loading="lazy" title="${esc(b.caption || "Video")}"></iframe>`;
    } else if (url) {
      // A video file in your own images folder (.mp4).
      player = `<video src="${esc(url)}" controls></video>`;
    } else {
      return Blocks.placeholder({ label: b.caption || "Video", ratio: b.ratio });
    }
    return `
      <figure class="b-figure b-figure--${b.width === "full" ? "full" : "wide"} b-video">
        <div class="b-video__frame" style="${ratio}">${player}</div>
        ${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ""}
      </figure>`;
  },

  quote(b) {
    return `<blockquote class="b-quote">${esc(b.text)}${b.cite ? `<cite>${esc(b.cite)}</cite>` : ""}</blockquote>`;
  },

  /* A box that marks where an image still needs to go. */
  placeholder(b) {
    return `<div class="b-placeholder" style="--ratio:${esc(b.ratio || "16/9")}"><span><strong>Placeholder</strong>${esc(b.label || "Add an image here")}</span></div>`;
  }
};
