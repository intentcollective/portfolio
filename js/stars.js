/* =========================================================
   stars.js, the “Where is Stella?” hunt
   ---------------------------------------------------------
   Eight numbered stars are hidden across the site and its
   two PDFs, numbered by difficulty. The rules for students
   are at the end of guide.html.

   Found stars are saved in the visitor’s own browser with
   localStorage, so there are no accounts and nothing is sent
   anywhere. A different browser starts empty.

   Where each star lives
     1  Works page, beside the project count
     2  End of the last case study (Thorn Princess)
     3  End of the About page text
     4  Resume PDF, with a code word
     5  Portfolio PDF, page of the sixth project, with a code word
     6  Hidden ink in the Operation Strix process text
     7  Catch the eyes on story.html, then a question
     8  The @ in the footer email, then a question
   ========================================================= */

const Stars = {
  key: "stella",
  total: 8,

  // Code words printed beside the PDF stars.
  codes: { biscuit: 4, teapot: 5 },

  // Answers are forgiving about capitals, spaces and spelling.
  quizzes: {
    7: {
      question: "You caught me. What book was Gromit reading in prison?",
      check: a => a.includes("crime") && a.includes("punish")
    },
    8: {
      question: "Prove it, Agent. What was the last ingredient Loid needed for the meremere?",
      check: a => a.includes("cherr")
    }
  },

  /* ---------- Saving ---------- */
  found() {
    try { return (localStorage.getItem(this.key) || "").split(",").filter(Boolean).map(Number); }
    catch (e) { return []; }
  },
  save(list) {
    try { localStorage.setItem(this.key, [...new Set(list)].sort().join(",")); } catch (e) {}
  },
  hunting() {
    try { return this.found().length > 0 || localStorage.getItem(this.key + "-on") === "1"; }
    catch (e) { return false; }
  },
  start() {
    try { localStorage.setItem(this.key + "-on", "1"); } catch (e) {}
    this.drawCase();
  },
  claim(n) {
    const list = this.found();
    const fresh = !list.includes(n);
    if (fresh) this.save([...list, n]);
    this.drawCase(fresh ? n : 0);
    this.success(n, fresh);
  },

  /* A short rising chime, made in the browser with the Web
     Audio API, so there is no sound file to load. It only
     plays right after a click, as browsers require. */
  chime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;
      [1046.5, 1318.5, 1568, 2093].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        const t = now + i * 0.07;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.12, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.65);
      });
      setTimeout(() => ctx.close(), 1200);
    } catch (e) {}
  },

  /* ---------- Drawing ---------- */
  // One flat star with its number. dark = dark star on gold.
  svg(n, size = 24, dark = false) {
    const fill = dark ? "#1a1408" : "var(--gold)";
    const ink = dark ? "var(--gold)" : "#1a1408";
    return `<svg class="star" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">
      <polygon points="50,5 61.2,34.6 92.8,36.1 68.1,55.9 76.5,86.4 50,69 23.5,86.4 31.9,55.9 7.2,36.1 38.8,34.6" fill="${fill}"/>
      ${n ? `<text x="50" y="62" text-anchor="middle" font-size="30" font-weight="700" fill="${ink}">${n}</text>` : ""}
    </svg>`;
  },
  outline(size = 16) {
    return `<svg class="star" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">
      <polygon points="50,5 61.2,34.6 92.8,36.1 68.1,55.9 76.5,86.4 50,69 23.5,86.4 31.9,55.9 7.2,36.1 38.8,34.6" fill="none" stroke="#555" stroke-width="5"/>
    </svg>`;
  },
  // A star you can click to claim.
  button(n, size = 22) {
    return `<button class="star-btn" type="button" data-star="${n}" aria-label="Stella ${n}">${this.svg(n, size)}</button>`;
  },

  /* ---------- The gold box ---------- */
  box(html) {
    let dialog = document.querySelector(".stella-box");
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.className = "stella-box";
      document.body.appendChild(dialog);
      dialog.addEventListener("click", e => { if (e.target === dialog || e.target.closest("[data-close]")) dialog.close(); });
    }
    dialog.innerHTML = html + `<button class="stella-box__close" type="button" data-close>Close</button>`;
    if (!dialog.open) dialog.showModal();
    return dialog;
  },

  success(n, fresh = false) {
    const all = this.found().length === this.total;
    // A new find gets a glint and a chime. A star found before just shows.
    if (fresh) this.chime();
    const dialog = this.box(`
      <div class="stella-box__win${fresh ? " is-new" : ""}">
        <span class="stella-box__badge">${this.svg(n, 64, true)}<span class="glint" aria-hidden="true"></span></span>
        <div>
          <p class="stella-box__q">Stella ${n} of ${this.total}.</p>
          <p class="stella-box__note">${all ? "All eight. Imperial Scholar." : "Take a screenshot to claim it."}</p>
        </div>
      </div>`);
    // Closing the box on the eighth star opens the finale.
    if (fresh && all) dialog.addEventListener("close", () => this.finale(), { once: true });
  },

  /* The finale, once, when the eighth star is claimed. */
  finale() {
    const row = Array.from({ length: this.total }, () => this.svg(0, 14, true)).join("");
    const dialog = this.box(`
      <div class="stella-final__star">
        <svg class="stella-final__bg" viewBox="0 0 100 95" aria-hidden="true"><polygon points="50,0 61.8,34.3 97.6,34.5 68.9,55.9 79.4,90.5 50,69.7 20.6,90.5 31.1,55.9 2.4,34.5 38.2,34.3"/></svg>
        <div class="stella-final__in">
          <p class="stella-final__cheer">Elegant!</p>
          <p class="stella-final__title">Imperial Scholar.</p>
          <p class="stella-final__row">${row}</p>
        </div>
      </div>
      <p class="stella-final__msg">All eight Stellas, found. You read to the end, looked closely, got curious, and got in touch. That’s what reviewers notice. Take a screenshot and show it to Henry.</p>`);
    dialog.classList.add("stella-final");
    dialog.addEventListener("close", () => dialog.classList.remove("stella-final"), { once: true });
    // A rising scale, one note for each star.
    [1046.5, 1174.7, 1318.5, 1396.9, 1568, 1760, 1975.5, 2093].forEach((f, i) => setTimeout(() => this.tick(f), 300 + i * 120));
  },

  tick(freq = 2093) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.32);
      setTimeout(() => ctx.close(), 600);
    } catch (e) {}
  },

  quiz(n, header = "") {
    if (this.found().includes(n)) return this.success(n);
    const q = this.quizzes[n];
    const dialog = this.box(`
      ${header}
      <form class="stella-box__form">
        <label class="stella-box__q" for="stella-answer">${q.question}</label>
        <div class="stella-box__row">
          <input id="stella-answer" type="text" autocomplete="off" placeholder="Your answer">
          <button type="submit">Answer</button>
        </div>
        <p class="stella-box__error" aria-live="polite"></p>
      </form>`);
    const form = dialog.querySelector("form");
    form.addEventListener("submit", e => {
      e.preventDefault();
      const answer = form.querySelector("input").value.toLowerCase().replace(/[^a-z]+/g, " ");
      if (q.check(answer)) this.claim(n);
      else {
        form.querySelector(".stella-box__error").textContent = "Not quite. Try again.";
        form.querySelector("input").select();
      }
    });
    form.querySelector("input").focus();
  },

  /* ---------- The collection in the footer ---------- */
  drawCase(latest = 0) {
    const footer = document.querySelector(".site-footer .cols");
    if (!footer || !this.hunting()) return;
    let el = footer.querySelector(".stella-case");
    if (!el) {
      el = document.createElement("div");
      el.className = "stella-case";
      footer.appendChild(el);
    }
    const list = this.found();
    const all = list.length === this.total;
    el.classList.toggle("is-complete", all);
    el.innerHTML = `
      <div class="stella-case__row">
        ${all ? `<span class="stella-case__title">Imperial Scholar</span>` : ""}
        <span class="stella-case__stars" aria-label="${list.length} of ${this.total} Stellas found">
          ${Array.from({ length: this.total }, (_, i) => list.includes(i + 1)
            ? (i + 1 === latest ? `<span class="is-pop">${this.svg(0, 16)}</span>` : this.svg(0, 16))
            : this.outline(16)).join("")}
        </span>
      </div>
      ${all ? "" : `
      <form class="stella-case__code">
        <input type="text" autocomplete="off" placeholder="Have a code word? Enter it here" aria-label="Code word">
        <button type="submit">Add</button>
      </form>`}`;
    const form = el.querySelector("form");
    if (form) form.addEventListener("submit", e => {
      e.preventDefault();
      const input = form.querySelector("input");
      const n = this.codes[input.value.trim().toLowerCase()];
      if (n) this.claim(n);
      else { input.value = ""; input.placeholder = "That code isn’t one of them."; }
    });
  },

  /* ---------- Hiding the stars ---------- */
  place() {
    const page = document.body.dataset.page;
    const slug = new URLSearchParams(location.search).get("p") || location.hash.slice(1);

    // 1. Works page, in place of the last period of the intro.
    // The last word and the Stella are held together so it never
    // wraps alone onto a new line.
    if (page === "works") {
      const intro = document.querySelector(".hero__intro");
      const w = intro && document.createTreeWalker(intro, NodeFilter.SHOW_TEXT);
      let last = null;
      while (w && w.nextNode()) if (w.currentNode.nodeValue.trim()) last = w.currentNode;
      const m = last && last.nodeValue.match(/^([\s\S]*?)(\S+?)\.?(\s*)$/);
      if (m) {
        const hold = document.createElement("span");
        hold.style.whiteSpace = "nowrap";
        hold.innerHTML = esc(m[2]) + this.button(1, 18);
        last.replaceWith(m[1], hold, m[3]);
      }
    }

    if (page === "project") {
      // 2. After the last block of the last case study
      if (slug === "thorn-princess") {
        const blocks = document.querySelector(".blocks");
        if (blocks) blocks.insertAdjacentHTML("beforeend", `<p class="star-end">${this.button(2, 22)}</p>`);
      }
      // 6. Hidden ink in the Operation Strix process text.
      // Selecting the faint line reveals it, like the book’s red lens.
      if (slug === "operation-strix") {
        const heads = [...document.querySelectorAll(".b-text h2")];
        const process = heads.find(h => /process/i.test(h.textContent));
        const body = process && process.parentElement.querySelector(".b-text__body");
        if (body) {
          body.insertAdjacentHTML("beforeend", `<p class="ink">${this.button(6, 22)} Agent, the secret is in the margins.</p>`);
          const ink = body.querySelector(".ink");
          document.addEventListener("selectionchange", () => {
            const sel = document.getSelection();
            if (sel && !sel.isCollapsed && sel.containsNode(ink, true)) ink.classList.add("is-revealed");
          });
        }
      }
    }

    // 3. End of the About text
    if (page === "about") {
      const texts = document.querySelectorAll(".about .b-text__body");
      const last = texts[texts.length - 1];
      const p = last && last.querySelector("p:last-child");
      if (p) p.insertAdjacentHTML("beforeend", ` ${this.button(3, 20)}`);
    }

    // 4. Resume PDF, printed only
    if (page === "resume") {
      const cv = document.querySelector(".cv");
      if (cv) cv.insertAdjacentHTML("beforeend", `<p class="print-star">${this.svg(4, 22)}<span>Code BISCUIT</span></p>`);
    }

    // 5. Portfolio PDF, on the sixth project’s page, printed only
    if (page === "print") {
      const decks = document.querySelectorAll(".deck:not(.deck--cover)");
      if (decks[5]) decks[5].insertAdjacentHTML("beforeend", `<p class="print-star print-star--deck">${this.svg(5, 20)}<span>Code TEAPOT</span></p>`);
    }

    // 7. The eyes on story.html (see peek.js)
    document.addEventListener("peek:caught", () => this.quiz(7));

    // 8. The @ in the footer email
    const mail = [...document.querySelectorAll(".site-footer nav span")].find(s => s.textContent.includes("@"));
    if (mail) {
      const [user, domain] = mail.textContent.split("@");
      mail.innerHTML = `${esc(user)}<button class="at" type="button" aria-label="@">@</button>${esc(domain)}`;
      mail.querySelector(".at").addEventListener("click", () => {
        const address = `${user}@${domain}`;
        this.quiz(8, `<div class="stella-box__head"><span>To ${esc(address)}</span></div>`);
      });
    }

    // Reading the rules in the guide starts the hunt.
    const rules = document.getElementById("stella");
    if (rules && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(entries => {
        if (entries.some(e => e.isIntersecting)) { this.start(); io.disconnect(); }
      });
      io.observe(rules);
    }

    document.addEventListener("click", e => {
      const btn = e.target.closest(".star-btn");
      if (btn) this.claim(Number(btn.dataset.star));
    });

    this.drawCase();
  }
};

document.addEventListener("site:ready", () => Stars.place());
