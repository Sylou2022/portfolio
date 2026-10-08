(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- Barre de progression + lien actif ---------- */
  const bar = $(".progress");
  const links = $$(".nav nav a");
  const sections = links.map(a => $(a.getAttribute("href"))).filter(Boolean);

  function onScroll() {
    const h = document.documentElement;
    bar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100 + "%";
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
  $$(".reveal, .skills").forEach(el => io.observe(el));

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
  const scenarios = [
    {
      q: "Quels thèmes génèrent le plus d’insatisfaction ?",
      sql: "SELECT theme, COUNT(*) AS n\nFROM verbatims\nWHERE sentiment = 'négatif'\nGROUP BY theme ORDER BY n DESC;",
      out: "Insight : 2 thèmes concentrent l’essentiel des irritants."
    },
    {
      q: "Comment évolue la qualité d’un mois sur l’autre ?",
      sql: "SELECT mois, AVG(score_qualite)\nFROM evaluations\nGROUP BY mois ORDER BY mois;",
      out: "Insight : tendance haussière sur les derniers mois."
    }
  ];
  const wait = ms => new Promise(r => setTimeout(r, ms));
  async function type(el, text, speed) {
    el.textContent = "";
    for (const ch of text) { el.textContent += ch; await wait(speed); }
  }
  async function runDemo() {
    let i = 0;
    while (true) {
      const s = scenarios[i % scenarios.length];
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
  if (reduceMotion) {
    const s = scenarios[0];
    qEl.textContent = s.q; sqlEl.textContent = s.sql; outEl.textContent = s.out; chartEl.classList.add("on");
  } else {
    runDemo();
  }

  /* ---------- La donnée en entreprise : onglets ---------- */
  const steps = [
    {
      title: "Collecter",
      text: "La donnée naît partout dans l’entreprise : CRM, ERP, fichiers, outils métier, appels clients. Identifier les bonnes sources est le point de départ de toute analyse.",
      example: "Chez UGIPS Gestion, les appels clients retranscrits en texte sont devenus une source de données exploitable.",
      tags: ["Sources métier", "Appels retranscrits", "Fichiers"]
    },
    {
      title: "Structurer",
      text: "Nettoyer, dédoublonner, documenter, automatiser. Sans données fiables, aucun chiffre n’est défendable devant un manager ou un comité.",
      example: "Des traitements en Python et SQL fiabilisent les données et suppriment les tâches manuelles répétitives.",
      tags: ["Python", "SQL", "Databricks"]
    },
    {
      title: "Analyser",
      text: "Calculer des KPI, repérer des tendances, comprendre les causes. Le NLP et le machine learning permettent d’aller plus loin que les chiffres, jusque dans le texte.",
      example: "Plus de 10 000 verbatims analysés pour en extraire sentiments, émotions et thématiques.",
      tags: ["NLP", "Machine Learning", "TensorFlow"]
    },
    {
      title: "Décider",
      text: "Une analyse ne sert que si elle est comprise. Dashboards clairs et restitutions orientées métier transforment les résultats en actions concrètes.",
      example: "Des dashboards Power BI permettent à 20 managers de suivre la qualité de plus de 100 collaborateurs.",
      tags: ["Power BI", "DAX", "Restitution"]
    }
  ];
  const panel = $("#stepPanel");
  function showStep(i) {
    const s = steps[i];
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
  lb.addEventListener("click", e => { if (e.target === lb) lb.close(); });

  /* ---------- Vidéo de présentation ---------- */
  const frame = $("#videoFrame"), video = $("#demoVideo"), playBtn = $("#playBtn"), empty = $("#videoEmpty");
  playBtn.addEventListener("click", () => video.play());
  video.addEventListener("play", () => frame.classList.add("playing"));
  video.addEventListener("pause", () => { if (video.currentTime === 0 || video.ended) frame.classList.remove("playing"); });
  video.addEventListener("ended", () => frame.classList.remove("playing"));

  // Si le fichier vidéo n'existe pas : message d'aide au lieu d'un lecteur vide
  function videoMissing() { empty.hidden = false; playBtn.style.display = "none"; }
  const source = $("source", video);
  source.addEventListener("error", videoMissing);
  video.addEventListener("error", videoMissing);
})();