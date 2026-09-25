/* Doctorine website v2: navigation, reveal motion and the sample product UI. */
(function () {
  var d = document, root = d.documentElement;
  root.classList.remove("nojs"); root.classList.add("js");
  var nl = (root.lang || "en").slice(0, 2) === "nl";
  var T = function (en, n) { return nl ? n : en; };
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* header */
  var hdr = $(".hdr");
  var onScroll = function () { if (hdr) hdr.classList.toggle("scrolled", window.scrollY > 8); };
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* dropdown */
  $$(".dd").forEach(function (dd) {
    var b = $("button", dd);
    b.addEventListener("click", function (e) { e.stopPropagation(); var o = !dd.classList.contains("open"); $$(".dd.open").forEach(function (x) { x.classList.remove("open"); $("button", x).setAttribute("aria-expanded", "false"); }); dd.classList.toggle("open", o); b.setAttribute("aria-expanded", String(o)); });
  });
  d.addEventListener("click", function (e) { if (!e.target.closest(".dd")) $$(".dd.open").forEach(function (x) { x.classList.remove("open"); $("button", x).setAttribute("aria-expanded", "false"); }); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") { $$(".dd.open").forEach(function (x) { x.classList.remove("open"); $("button", x).setAttribute("aria-expanded", "false"); }); closeMenu(); } });

  /* mobile menu */
  var mb = $(".menu-btn");
  function closeMenu() { root.classList.remove("menu-open"); if (mb) { mb.setAttribute("aria-expanded", "false"); mb.setAttribute("aria-label", T("Open menu", "Menu openen")); } }
  if (mb) mb.addEventListener("click", function () { var o = !root.classList.contains("menu-open"); root.classList.toggle("menu-open", o); mb.setAttribute("aria-expanded", String(o)); mb.setAttribute("aria-label", o ? T("Close menu", "Menu sluiten") : T("Open menu", "Menu openen")); });
  window.addEventListener("resize", function () { if (window.innerWidth > 1020) closeMenu(); });

  /* reveal */
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); if (e.target.dataset.play !== undefined) e.target.classList.add("play"); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }) : null;
  $$(".rv,.bars,[data-play]").forEach(function (el) { if (io && !reduce) io.observe(el); else { el.classList.add("in"); el.classList.add("play"); } });
  setTimeout(function () { $$(".rv,.bars,[data-play]").forEach(function (el) { el.classList.add("in"); el.classList.add("play"); }); }, 4000);

  /* staggered rows and cells */
  $$(".gate .row").forEach(function (r, i) { r.style.transitionDelay = (0.15 + i * 0.09) + "s"; });
  $$(".grid-t .cell i").forEach(function (c, i) { c.style.transitionDelay = (0.1 + i * 0.045) + "s"; });

  var ICON = {
    p: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.4 5 8.8l4.6-5.3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    f: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3.5 3.5l5 5m0-5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
  };
  var BIG = {
    f: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 3v3.6M6 8.6v.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    p: ICON.p
  };

  /* release gate panel: apply the one-line fix, re-run, publish */
  $$(".gate").forEach(function (g) {
    var row = $(".row[data-held]", g), why = $(".why", g), fix = $("[data-fix]", g), pub = $("[data-pub]", g);
    var gh = $(".gate-h", g), gt = $(".gate-h b", g), gs = $(".gate-h small", g), ic = $(".gate-h .ic", g), mp = $(".merge p", g);
    var n = g.dataset.n || "7", rel = g.dataset.rel || "4.13.0";
    if (!row || !fix || !pub) return;
    var dot = $(".dot", row), det = $(".d", row), tm = $(".t", row);
    var orig = { det: det.textContent, why: why.innerHTML, tm: tm.textContent };
    var state = "f";
    function set(s) {
      state = s;
      if (s === "f") {
        row.className = "row fail"; dot.className = "dot f"; dot.innerHTML = ICON.f; det.textContent = orig.det; tm.textContent = orig.tm;
        why.className = "why"; why.innerHTML = orig.why; why.hidden = false;
        gh.classList.remove("ok"); ic.innerHTML = BIG.f;
        gt.textContent = T("Doctorine release gate: " + (n - 1) + " of " + n + " surfaces passed", "Doctorine release gate: " + (n - 1) + " van " + n + " interfaces geslaagd");
        gs.textContent = T("Python SDK held back. Everything else can ship.", "Python SDK tegengehouden. De rest kan live.");
        mp.innerHTML = T("<b>Held back:</b> Python SDK. The fix is one line in your spec.", "<b>Tegengehouden:</b> Python SDK. De oplossing is één regel in je spec.");
        fix.disabled = false; fix.textContent = T("Apply fix and re-run", "Fix toepassen en opnieuw draaien"); fix.classList.remove("alt");
        pub.disabled = true; pub.classList.add("alt"); pub.textContent = T("Publish " + n + " surfaces", "Publiceer " + n + " interfaces");
      } else if (s === "run") {
        row.className = "row"; dot.className = "dot run"; dot.innerHTML = ""; det.textContent = T("Re-running the contract test on the fixed spec", "Contracttest draait opnieuw op de verbeterde spec"); tm.textContent = "";
        why.hidden = true; fix.disabled = true;
        gt.textContent = T("Doctorine release gate: re-running 1 surface", "Doctorine release gate: 1 interface draait opnieuw");
        gs.textContent = T("Unchanged surfaces keep their verdict.", "Ongewijzigde interfaces houden hun oordeel.");
        mp.innerHTML = T("<b>Checking.</b> Only the affected surface re-runs.", "<b>Bezig.</b> Alleen de geraakte interface draait opnieuw.");
      } else if (s === "p") {
        row.className = "row fixed"; dot.className = "dot p"; dot.innerHTML = ICON.p; det.textContent = T("Contract test: refund with reason, 201 created", "Contracttest: terugbetaling met reden, 201 created"); tm.textContent = "6s";
        why.hidden = false; why.className = "why ok"; why.innerHTML = T("Fixed in the spec. The SDK was rebuilt from the corrected example and passed on the first run.", "Opgelost in de spec. De SDK is opnieuw gebouwd vanuit het verbeterde voorbeeld en slaagde meteen.");
        gh.classList.add("ok"); ic.innerHTML = BIG.p;
        gt.textContent = T("Doctorine release gate: " + n + " of " + n + " surfaces passed", "Doctorine release gate: " + n + " van " + n + " interfaces geslaagd");
        gs.textContent = T("Ready to publish together.", "Klaar om samen te publiceren.");
        mp.innerHTML = T("<b>All green.</b> Publishing ships every surface at once.", "<b>Alles groen.</b> Publiceren zet alle interfaces tegelijk live.");
        pub.disabled = false; pub.classList.remove("alt");
      } else if (s === "done") {
        gt.textContent = T("Published " + rel + " to every surface", "Versie " + rel + " gepubliceerd op elke interface");
        gs.textContent = T("Docs, CLI, MCP server, three SDKs and the skill point at one release.", "Docs, CLI, MCP-server, drie SDK's en de skill wijzen naar één release.");
        mp.innerHTML = T("<b>Receipt written.</b> Every surface, one release, one file.", "<b>Bewijs vastgelegd.</b> Elke interface, één release, één bestand.");
        pub.disabled = true; pub.textContent = T("Published", "Gepubliceerd");
        fix.disabled = false; fix.textContent = T("Replay", "Opnieuw afspelen"); fix.classList.add("alt");
      }
    }
    fix.addEventListener("click", function () { if (state === "done") { set("f"); return; } set("run"); setTimeout(function () { set("p"); }, reduce ? 200 : 1600); });
    pub.addEventListener("click", function () { if (state === "p") set("done"); });
    ic.innerHTML = BIG.f;
  });

  /* agent trace: replay with the fix */
  $$(".trace").forEach(function (t) {
    var b = $("[data-replay]", t); if (!b) return;
    var s1 = b.textContent, s2 = b.dataset.alt;
    b.addEventListener("click", function () { var f = !t.classList.contains("fixed"); t.classList.toggle("fixed", f); b.textContent = f ? s2 : s1; b.setAttribute("aria-pressed", String(f)); });
  });

  /* eval report: pick a task */
  $$(".evalui").forEach(function (ev) {
    var cells = $$(".cell", ev), panels = $$(".panel", ev);
    function pick(c) {
      cells.forEach(function (x) { x.setAttribute("aria-pressed", String(x === c)); });
      var id = c.dataset.task; panels.forEach(function (p) { p.classList.toggle("on", p.dataset.task === id); });
    }
    cells.forEach(function (c) { c.addEventListener("click", function () { pick(c); if (window.innerWidth < 1180) { var on = $(".panel.on", ev); if (on) on.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" }); } }); });
    var start = $(".cell[data-start]", ev); if (start) pick(start);
  });

  /* spec repair: choose fixes, see the diff */
  $$(".repair").forEach(function (rp) {
    var base = +rp.dataset.base, items = $$(".fnd[data-w]", rp), views = $$(".fixview", rp), aft = $(".aft b", rp), cnt = $$("[data-count]", rp);
    function sum() {
      var s = base, n = 0;
      items.forEach(function (it) { var c = $("input", it); if (c.checked) { s += +it.dataset.w; n++; } });
      if (aft) aft.textContent = s;
      cnt.forEach(function (x) { x.textContent = n; });
    }
    items.forEach(function (it) {
      var c = $("input", it);
      c.addEventListener("change", sum);
      it.addEventListener("click", function (e) {
        if (e.target === c) return;
        items.forEach(function (x) { x.classList.toggle("on", x === it); });
        views.forEach(function (v) { v.hidden = v.dataset.id !== it.dataset.id; });
      });
    });
    sum();
  });

  /* decisions */
  $$(".dec").forEach(function (dc) {
    var st = dc.parentNode.querySelector(".skipbar .st"), items = $$(".item", dc);
    function upd() {
      var left = items.filter(function (it) { return !it.classList.contains("done"); }).length;
      if (!st) return;
      st.textContent = left ? T(left + (left > 1 ? " decisions left" : " decision left"), left + (left > 1 ? " beslissingen over" : " beslissing over")) : T("Review done. Ready to publish.", "Review klaar. Klaar om te publiceren.");
      st.classList.toggle("ok", !left);
    }
    items.forEach(function (it) {
      var lab = $(".label", it), l0 = lab.textContent;
      $$(".opt", it).forEach(function (o) {
        o.addEventListener("click", function () {
          $$(".opt", it).forEach(function (x) { x.setAttribute("aria-pressed", String(x === o)); });
          it.classList.add("done"); lab.textContent = T("Decided, recorded in the receipt", "Besloten, vastgelegd in het bewijs"); upd();
        });
      });
      lab.dataset.l0 = l0;
    });
    upd();
  });

  /* tabs */
  $$("[role=tablist]").forEach(function (tl) {
    var tabs = $$("[role=tab]", tl);
    tabs.forEach(function (tb, i) {
      tb.addEventListener("click", function () { sel(i); });
      tb.addEventListener("keydown", function (e) { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); var j = (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length; sel(j); tabs[j].focus(); } });
    });
    function sel(i) { tabs.forEach(function (t, k) { t.setAttribute("aria-selected", String(k === i)); t.tabIndex = k === i ? 0 : -1; var p = d.getElementById(t.getAttribute("aria-controls")); if (p) p.classList.toggle("on", k === i); }); }
  });

  /* marquee copy for the mobile surface strip */
  if (window.matchMedia && window.matchMedia("(max-width: 760px)").matches) $$(".strip ul").forEach(function (ul) { $$("li", ul).forEach(function (li) { var c = li.cloneNode(true); c.setAttribute("aria-hidden", "true"); ul.appendChild(c); }); });
})();
