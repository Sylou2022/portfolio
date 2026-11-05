(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const DICT = window.I18N || { en: {}, dynamic: {} };
  let lang = document.documentElement.lang === "en" ? "en" : "fr";
  const dyn = () => DICT.dynamic[lang] || DICT.dynamic.fr;

  /* ---------- Barre de progression + lien actif ---------- */
  const bar = $(".progress");
  const links = $$(".nav nav a");
  const sections = links.map(a => $(a.getAttribute("href"))).filter(Boolean);

  function onScroll() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    const y = window.scrollY + 140;
    let current = null;
    sections.forEach(s => { if (s.offsetTop <= y) current = s.id; });
    links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + current));
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Menu mobile ---------- */
  const burger = $(".burger");
  const menu = $("#menu");
  burger.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    burger.setAttribute("aria-expanded", open);
  });
  links.forEach(a => a.addEventListener("click", () => {
    menu.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
  }));

  /* ---------- Apparition au scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
    });
  }, { threshold: 0.15 });
  $$(".reveal").forEach(el => io.observe(el));

  /* Soulignement doré du titre « Un parcours orienté résultats » */
  const expIo = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in-view"); expIo.unobserve(e.target); }
    });
  }, { threshold: 0.2 });
  $$(".experience").forEach(el => expIo.observe(el));

  /* ---------- Cartes projets : halo doré qui suit la souris ---------- */
  $$(".project").forEach(card => {
    card.addEventListener("pointermove", e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  /* ---------- Fond : réseau pointillé doré ---------- */
  const cvs = $("#bgNetwork");
  const ctx = cvs.getContext("2d");
  let W = 0, H = 0, nodes = [], rafId = null;
  const mouse = { x: -9999, y: -9999 };
  const LINK = 150;

  function resizeNetwork() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cvs.width = W * dpr; cvs.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(85, Math.max(30, (W * H) / 17000)));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3,
      r: 1 + Math.random() * 1.6
    }));
  }

  function drawNetwork() {
    const dark = document.documentElement.dataset.theme === "dark";
    const rgb = dark ? "232, 190, 90" : "190, 140, 15";
    const lineA = dark ? .42 : .38;
    const dotA = dark ? .8 : .6;
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 5]);
    const pts = nodes.concat([{ x: mouse.x, y: mouse.y, mouse: true }]);
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
        const max = pts[j].mouse ? LINK * 1.4 : LINK;
        const d = Math.hypot(dx, dy);
        if (d < max) {
          ctx.strokeStyle = `rgba(${rgb}, ${lineA * (1 - d / max)})`;
          ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
        }
      }
    }
    ctx.setLineDash([]);
    nodes.forEach(n => {
      ctx.fillStyle = `rgba(${rgb}, ${dotA * .18})`;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(${rgb}, ${dotA})`;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
    });
  }

  function stepNetwork() {
    nodes.forEach(n => {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
    });
    drawNetwork();
    rafId = requestAnimationFrame(stepNetwork);
  }

  resizeNetwork();
  if (reduceMotion) {
    drawNetwork();
  } else {
    rafId = requestAnimationFrame(stepNetwork);
    window.addEventListener("pointermove", e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    document.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { cancelAnimationFrame(rafId); rafId = null; }
      else if (!rafId) rafId = requestAnimationFrame(stepNetwork);
    });
  }
  let resizeT;
  window.addEventListener("resize", () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => { resizeNetwork(); if (reduceMotion) drawNetwork(); }, 150);
  });

  /* ---------- Compteurs ---------- */
  function countUp(el) {
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || "";
    if (reduceMotion) { el.textContent = target + suffix; return; }
    const start = performance.now();
    const dur = 1400;
    (function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }
  $$("[data-count]").forEach(el => countUp(el));

  /* ---------- Démo hero : question → SQL → insight ---------- */
  const qEl = $("#demoQ"), sqlEl = $("#demoSql"), chartEl = $("#demoChart"), outEl = $("#demoOut");
  const wait = ms => new Promise(r => setTimeout(r, ms));
  async function type(el, text, speed) {
    el.textContent = "";
    for (const ch of text) { el.textContent += ch; await wait(speed); }
  }
  async function runDemo() {
    let i = 0;
    while (true) {
      const list = dyn().scenarios;
      const s = list[i % list.length];
      chartEl.classList.remove("on"); outEl.textContent = ""; sqlEl.textContent = "";
      await type(qEl, s.q, 28);
      await wait(350);
      await type(sqlEl, s.sql, 14);
      await wait(250);
      chartEl.classList.add("on");
      await wait(500);
      await type(outEl, s.out, 18);
      await wait(3200);
      i++;
    }
  }
  function staticDemo() {
    const s = dyn().scenarios[0];
    qEl.textContent = s.q; sqlEl.textContent = s.sql; outEl.textContent = s.out; chartEl.classList.add("on");
  }
  if (reduceMotion) staticDemo(); else runDemo();

  /* ---------- La donnée en entreprise : onglets ---------- */
  const panel = $("#stepPanel");
  let currentStep = 0;
  function showStep(i) {
    currentStep = i;
    const s = dyn().steps[i];
    $("#stepTitle").textContent = s.title;
    $("#stepText").textContent = s.text;
    $("#stepExample").textContent = s.example;
    $("#stepTags").innerHTML = s.tags.map(t => `<span>${t}</span>`).join("");
    panel.classList.remove("swap"); void panel.offsetWidth; panel.classList.add("swap");
    $$(".step").forEach((b, k) => {
      b.classList.toggle("active", k === i);
      b.setAttribute("aria-selected", k === i);
    });
  }
  $$(".step").forEach((b, i) => b.addEventListener("click", () => showStep(i)));
  showStep(0);

  /* ---------- Images : repli propre si le fichier est absent ---------- */
  function markMissing(img) { img.closest(".shot")?.classList.add("missing"); }
  $$(".shot img").forEach(img => {
    img.addEventListener("error", () => markMissing(img));
    if (img.complete && img.naturalWidth === 0) markMissing(img);
  });

  /* Photo de profil : repli simple */
  const photo = $(".photo img");
  photo.addEventListener("error", () => { photo.style.display = "none"; });

  /* ---------- Galerie : filtres ---------- */
  $$(".chip").forEach(chip => chip.addEventListener("click", () => {
    $$(".chip").forEach(c => c.classList.toggle("active", c === chip));
    const f = chip.dataset.filter;
    $$(".gallery-grid .shot").forEach(s => s.classList.toggle("hide", f !== "all" && s.dataset.cat !== f));
  }));

  /* ---------- Lightbox ---------- */
  const lb = $("#lightbox");
  const lbImg = $("img", lb), lbCap = $("p", lb);
  $$(".shot.zoomable").forEach(s => s.addEventListener("click", () => {
    if (s.classList.contains("missing")) return;
    const img = $("img", s);
    lbImg.src = img.src; lbImg.alt = img.alt;
    lbCap.textContent = $("figcaption", s)?.textContent || "";
    lb.showModal();
  }));
  $(".lb-close", lb).addEventListener("click", () => lb.close());

  /* ---------- Aperçu du CV (PDF) dans une fenêtre ---------- */
  const cvModal = $("#cvModal");
  const cvFrame = $("iframe", cvModal);
  $$(".js-open-cv").forEach(b => b.addEventListener("click", () => {
    if (!cvFrame.getAttribute("src")) cvFrame.src = cvFrame.dataset.src;
    cvModal.showModal();
  }));
  $(".cv-close", cvModal).addEventListener("click", () => cvModal.close());
  cvModal.addEventListener("click", e => { if (e.target === cvModal) cvModal.close(); });

  /* ---------- Compteur de vues GoatCounter ---------- */
  const gcScript = $("script[data-goatcounter]");
  const viewsEl = $("#viewCount");
  if (gcScript && viewsEl && location.protocol.startsWith("http")) {
    const base = gcScript.dataset.goatcounter.replace(/\/count$/, "");
    fetch(base + "/counter/TOTAL.json")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { $("b", viewsEl).textContent = d.count; viewsEl.hidden = false; })
      .catch(() => {});
  }
  lb.addEventListener("click", e => { if (e.target === lb) lb.close(); });

  /* ---------- Vidéos de présentation (projets 2 et 4) ---------- */
  $$(".video-frame").forEach(frame => {
    const video = $("video", frame), playBtn = $(".play", frame), empty = $(".video-empty", frame);
    if (!video || !playBtn) return;
    playBtn.addEventListener("click", () => video.play());
    video.addEventListener("play", () => frame.classList.add("playing"));
    video.addEventListener("pause", () => { if (video.currentTime === 0 || video.ended) frame.classList.remove("playing"); });
    video.addEventListener("ended", () => frame.classList.remove("playing"));
    // Fichier absent : message d'aide au lieu d'un lecteur vide
    const videoMissing = () => { if (empty) empty.hidden = false; playBtn.style.display = "none"; };
    $("source", video)?.addEventListener("error", videoMissing);
    video.addEventListener("error", videoMissing);
  });

  /* ---------- Mode clair / sombre ---------- */
  const themeBtn = $("#themeToggle");
  const root = document.documentElement;
  function applyTheme(t) {
    root.dataset.theme = t;
    themeBtn.setAttribute("aria-checked", t === "dark");
    themeBtn.setAttribute("aria-label", t === "dark" ? dyn().themeToLight : dyn().themeToDark);
    try { localStorage.setItem("theme", t); } catch (e) {}
    if (reduceMotion) drawNetwork();
  }
  applyTheme(root.dataset.theme === "dark" ? "dark" : "light");
  themeBtn.addEventListener("click", () => {
    applyTheme(root.dataset.theme === "dark" ? "light" : "dark");
  });

  /* ---------- Méthode : projet de bout en bout (animation en boucle) ---------- */
  // Une scène illustrée par étape (SVG inline, animée en CSS)
  const SCENES = [
    // 1. Besoin : une question métier + post-it KPI
    `<svg viewBox="0 0 300 190"><rect class="sc-card" x="28" y="26" width="160" height="82" rx="18"/>
      <path class="sc-card" d="M66 106 l-12 26 l34-26z"/>
      <text class="sc-q" x="108" y="84">?</text>
      <g class="sc-pop" style="--d:.2s"><rect class="sc-note" x="182" y="78" width="88" height="40" rx="9"/><text class="sc-t" x="226" y="104">KPI</text></g>
      <g class="sc-pop" style="--d:.45s"><rect class="sc-note b" x="150" y="128" width="96" height="40" rx="9"/><text class="sc-t" x="198" y="154">ROI</text></g>
      <g class="sc-pop" style="--d:.7s"><rect class="sc-note c" x="40" y="142" width="92" height="34" rx="9"/><text class="sc-t" x="86" y="165">Objectifs</text></g></svg>`,
    // 2. Collecte : trois sources qui convergent vers une base
    `<svg viewBox="0 0 300 190"><g class="sc-src"><rect x="16" y="20" width="76" height="40" rx="10"/><text class="sc-t" x="54" y="45">CRM</text></g>
      <g class="sc-src"><rect x="16" y="76" width="76" height="40" rx="10"/><text class="sc-t" x="54" y="101">SQL</text></g>
      <g class="sc-src"><rect x="16" y="132" width="76" height="40" rx="10"/><text class="sc-t" x="54" y="157">Excel</text></g>
      <path class="sc-wire" d="M92 40 C150 40 160 95 214 95"/><path class="sc-wire" d="M92 96 L214 96"/><path class="sc-wire" d="M92 152 C150 152 160 97 214 97"/>
      <circle class="sc-dot" r="5" opacity="0"><animateMotion dur="1.6s" begin="0s" repeatCount="indefinite" path="M92 40 C150 40 160 95 214 95"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.6s" begin="0s" repeatCount="indefinite"/></circle>
      <circle class="sc-dot" r="5" opacity="0"><animateMotion dur="1.6s" begin=".4s" repeatCount="indefinite" path="M92 96 L214 96"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.6s" begin=".4s" repeatCount="indefinite"/></circle>
      <circle class="sc-dot" r="5" opacity="0"><animateMotion dur="1.6s" begin=".8s" repeatCount="indefinite" path="M92 152 C150 152 160 97 214 97"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.6s" begin=".8s" repeatCount="indefinite"/></circle>
      <g class="sc-db"><ellipse cx="250" cy="70" rx="34" ry="11"/><path d="M216 70 v52 a34 11 0 0 0 68 0 v-52"/><ellipse class="sc-db-top" cx="250" cy="70" rx="34" ry="11"/></g></svg>`,
    // 3. Préparation : des lignes en erreur qui deviennent valides
    `<svg viewBox="0 0 300 190"><rect class="sc-card" x="30" y="18" width="240" height="156" rx="14"/>
      ${[0, 1, 2, 3, 4].map(i => `<g class="sc-row ${i % 2 ? "bad" : ""}" style="--d:${.25 + i * .22}s">
        <rect x="46" y="${34 + i * 27}" width="150" height="16" rx="5"/><circle cx="236" cy="${42 + i * 27}" r="9"/>
        <path d="M231 ${42 + i * 27} l4 4 l7-8"/></g>`).join("")}</svg>`,
    // 4. Analyse : une courbe de tendance qui se dessine + point d'insight
    `<svg viewBox="0 0 300 190"><rect class="sc-card" x="20" y="14" width="260" height="162" rx="14"/>
      ${[0, 1, 2, 3].map(i => `<line class="sc-grid" x1="40" x2="262" y1="${40 + i * 34}" y2="${40 + i * 34}"/>`).join("")}
      <path class="sc-area" d="M40 150 L80 128 L120 136 L160 102 L200 90 L240 58 L262 50 L262 150 Z"/>
      <path class="sc-draw" d="M40 150 L80 128 L120 136 L160 102 L200 90 L240 58 L262 50"/>
      <g class="sc-pop" style="--d:1.1s"><circle class="sc-insight" cx="240" cy="58" r="8"/><rect class="sc-note" x="168" y="22" width="64" height="24" rx="7"/><text class="sc-t s" x="200" y="39">+18 %</text></g></svg>`,
    // 5. Dashboard : cartes KPI + barres qui montent + anneau
    `<svg viewBox="0 0 300 190"><rect class="sc-card" x="14" y="12" width="272" height="166" rx="14"/>
      ${[0, 1, 2].map(i => `<g class="sc-pop" style="--d:${.1 + i * .15}s"><rect class="sc-kpi" x="${28 + i * 84}" y="26" width="72" height="34" rx="8"/><rect class="sc-kpi-v" x="${36 + i * 84}" y="36" width="${30 + i * 8}" height="7" rx="3"/><rect class="sc-kpi-l" x="${36 + i * 84}" y="48" width="44" height="5" rx="2"/></g>`).join("")}
      ${[44, 70, 56, 92, 78, 104].map((h, i) => `<rect class="sc-bar" x="${32 + i * 26}" y="${166 - h}" width="16" height="${h}" rx="4" style="--d:${.3 + i * .1}s"/>`).join("")}
      <circle class="sc-ring-bg" cx="240" cy="122" r="28"/><circle class="sc-ring" cx="240" cy="122" r="28"/></svg>`,
    // 6. Restitution : présentation + validation de la décision
    `<svg viewBox="0 0 300 190"><rect class="sc-card" x="48" y="14" width="204" height="116" rx="12"/>
      <path class="sc-stand" d="M150 130 v22 M120 170 l30 -18 l30 18"/>
      ${[0, 1, 2].map(i => `<rect class="sc-bar" x="${76 + i * 34}" y="${110 - (30 + i * 22)}" width="22" height="${30 + i * 22}" rx="4" style="--d:${.15 + i * .15}s"/>`).join("")}
      <g class="sc-pop" style="--d:.8s"><circle class="sc-ok" cx="214" cy="52" r="22"/><path class="sc-ok-check" d="M203 52 l8 8 l14-16"/></g>
      <g class="sc-pop" style="--d:1.1s"><rect class="sc-note" x="190" y="146" width="96" height="32" rx="9"/><text class="sc-t" x="238" y="167">Décision</text></g></svg>`
  ];
  const pipe = $("#pipeline");
  const pipeSteps = $$(".pipe-step");
  const PIPE_MS = 3200;
  let pipeIndex = 0, pipeTimer = null, pipeInView = false;

  function renderPipe(i) {
    pipeIndex = i;
    const s = dyn().method[i];
    $("#pipeNum").textContent = String(i + 1).padStart(2, "0");
    $("#pipeTitle").textContent = s.title;
    $("#pipeText").textContent = s.text;
    $("#pipeDeliv").textContent = s.deliv;
    $("#pipeTags").innerHTML = s.tags.map(t => `<span>${t}</span>`).join("");
    const scene = $("#pipeScene");
    scene.innerHTML = SCENES[i].replace(">Décision<", lang === "en" ? ">Decision<" : ">Décision<")
                               .replace(">Objectifs<", lang === "en" ? ">Goals<" : ">Objectifs<");
    pipeSteps.forEach((b, k) => {
      b.classList.toggle("active", k === i);
      b.classList.toggle("done", k < i);
      b.setAttribute("aria-current", k === i ? "step" : "false");
    });
    pipe.style.setProperty("--progress", i / (pipeSteps.length - 1));
    // relance l'animation du panneau et de la minuterie
    const panel = $(".pipe-panel", pipe);
    panel.classList.remove("run"); void panel.offsetWidth; panel.classList.add("run");
  }
  function schedulePipe() {
    clearTimeout(pipeTimer);
    if (!pipeInView) return;
    pipeTimer = setTimeout(() => { renderPipe((pipeIndex + 1) % pipeSteps.length); schedulePipe(); }, PIPE_MS);
    const timer = $("#pipeTimer");
    timer.classList.remove("run"); void timer.offsetWidth; timer.classList.add("run");
  }
  pipeSteps.forEach(b => b.addEventListener("click", () => { renderPipe(+b.dataset.i); schedulePipe(); }));
  // Défilement automatique continu : pas de pause au survol
  document.addEventListener("visibilitychange", () => { if (document.hidden) clearTimeout(pipeTimer); else schedulePipe(); });
  new IntersectionObserver(([e]) => { pipeInView = e.isIntersecting; schedulePipe(); }, { threshold: 0.25 }).observe(pipe);
  renderPipe(0);

  /* ---------- Langue FR / EN ---------- */
  // Le français est lu une seule fois dans le HTML, l'anglais vient de i18n.js
  const frText = new Map(), frAttr = new Map();
  $$("[data-i18n]").forEach(el => frText.set(el, el.innerHTML));
  const parseAttr = el => el.dataset.i18nAttr.split(";").map(p => p.split(":").map(x => x.trim()));
  $$("[data-i18n-attr]").forEach(el => {
    const saved = {};
    parseAttr(el).forEach(([attr]) => { saved[attr] = el.getAttribute(attr); });
    frAttr.set(el, saved);
  });
  const langBtns = $$(".lang-switch button");

  function applyLang(l) {
    lang = l === "en" ? "en" : "fr";
    const en = DICT.en || {};
    root.lang = lang;
    frText.forEach((fr, el) => {
      const key = el.dataset.i18n;
      el.innerHTML = lang === "en" && en[key] != null ? en[key] : fr;
    });
    frAttr.forEach((saved, el) => {
      parseAttr(el).forEach(([attr, key]) => {
        el.setAttribute(attr, lang === "en" && en[key] != null ? en[key] : saved[attr]);
      });
    });
    langBtns.forEach(b => b.setAttribute("aria-pressed", b.dataset.lang === lang));
    themeBtn.setAttribute("aria-label", root.dataset.theme === "dark" ? dyn().themeToLight : dyn().themeToDark);
    showStep(currentStep);
    renderPipe(pipeIndex);
    if (reduceMotion) staticDemo();
    try { localStorage.setItem("lang", lang); } catch (e) {}
  }
  langBtns.forEach(b => b.addEventListener("click", () => { if (b.dataset.lang !== lang) applyLang(b.dataset.lang); }));
  if (lang === "en") applyLang("en");
})();
