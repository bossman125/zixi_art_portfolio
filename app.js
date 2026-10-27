/* Build highlights mosaic + category sections from data.js */

/* ── Masonry engine: row-span grid with natural card heights ── */
function relayoutGrid(grid) { /* CSS columns handle natural media heights. */ }

const allGrids = [];
function layoutAll() {
  allGrids.forEach(relayoutGrid);
}

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(layoutAll, 150);
});
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(layoutAll);
}

function aspectOf(work) {
  const id = work.img || work.video;
  return ASPECTS[id] || 0.75;
}

/* ── Card markup (shared by grids and highlights) ── */
function cardHTML(work, cat) {
  const ar = aspectOf(work);
  if (work.video) {
    return `
      <div class="card-media">
        <video src="videos/${work.video}.mp4" poster="videos/${work.video}.jpg"
          muted loop playsinline preload="metadata" style="--ar:${ar}"></video>
      </div>
      <div class="card-caption">
        <span class="card-title">${work.title}<span class="video-tag">VIDEO</span></span>
        <span class="card-note">${work.note || cat.medium}</span>
      </div>
    `;
  }
  return `
    <div class="card-media">
      <img src="images/${work.img}__thumb.jpg" alt="${work.title}"
        loading="lazy" decoding="async" style="--ar:${ar}" />
    </div>
    <div class="card-caption">
      <span class="card-title">${work.title}</span>
      <span class="card-note">${work.note || cat.medium}</span>
    </div>
  `;
}

/* ── Selected Works (opening mosaic) ── */
const hlWorks = [];
const HIGHLIGHT_CAT = {
  id: "highlights",
  name: "Selected Works",
  medium: "Portfolio view",
  works: hlWorks,
};

(function buildHighlights() {
  const grid = document.getElementById("hlGrid");
  if (!grid) return;

  HIGHLIGHTS.forEach((h, i) => {
    const cat = CATEGORIES.find((c) => c.id === h.cat);
    const idx = cat.works.findIndex(
      (w) => (w.img || w.video) === (h.img || h.video)
    );
    const work = cat.works[idx];
    // resolved copy with a note for the lightbox
    hlWorks.push(Object.assign({}, work, { note: work.note || cat.medium }));

    const tile = document.createElement("div");
    tile.className =
      "card hl-tile reveal" +
      (h.size === "lg" ? " hl-lg" : "") +
      (h.size === "wide" ? " hl-wide" : "");
    tile.tabIndex = 0;
    tile.setAttribute("role", "button");
    tile.setAttribute("aria-label", work.title);
    tile.innerHTML =
      cardHTML(work, cat) +
      `<span class="hl-cat cat-${cat.color}">${cat.name}</span>`;

    tile.addEventListener("click", () => openLightbox(HIGHLIGHT_CAT, i));
    tile.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openLightbox(HIGHLIGHT_CAT, i);
      }
    });
    grid.appendChild(tile);
  });

  allGrids.push(grid);
  relayoutGrid(grid);
})();

/* ── Category sections ── */
(function buildSections() {
  const main = document.getElementById("galleries");

  [...CATEGORIES].sort((a,b) => ["sneakers","fiber","garments","canvas","face","body"].indexOf(a.id)-["sneakers","fiber","garments","canvas","face","body"].indexOf(b.id)).forEach((cat) => {
    const section = document.createElement("section");
    section.className = "section";
    section.id = cat.id;
    section.dataset.color = cat.color;
    section.setAttribute("aria-labelledby", `${cat.id}-title`);

    const total = cat.works.length;

    section.innerHTML = `
      <div class="section-head reveal">
        <h2 class="section-title" id="${cat.id}-title">${cat.name}</h2>
      </div>
      <p class="section-blurb reveal">${cat.blurb}</p>
      <div class="grid"></div>
    `;

    const grid = section.querySelector(".grid");

    cat.works.forEach((work, i) => {
      const card = document.createElement("div");
      card.className = "card reveal" + (work.wide ? " card-wide" : "");
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", work.title);
      card.innerHTML = cardHTML(work, cat);

      // open lightbox
      card.addEventListener("click", () => openLightbox(cat, i));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openLightbox(cat, i);
        }
      });

      grid.appendChild(card);
    });

    allGrids.push(grid);
    relayoutGrid(grid);
    main.appendChild(section);
  });
})();

/* ── Scroll reveal ─────────────────────── */
(function () {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    },
    { threshold: 0.08 }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
})();

/* ── Lightbox ──────────────────────────── */
let currentCat = null;
let currentIdx = 0;
let lastFocused = null;

const lb = document.getElementById("lightbox");
const lbMedia = document.getElementById("lbMedia");
const lbTitle = document.getElementById("lbTitle");
const lbNote = document.getElementById("lbNote");
const lbFocusables = () =>
  [...lb.querySelectorAll("button, video")].filter(
    (el) => el.offsetParent !== null
  );

function openLightbox(cat, idx) {
  currentCat = cat;
  currentIdx = idx;
  lastFocused = document.activeElement;
  renderLightbox();
  lb.classList.add("open");
  document.body.style.overflow = "hidden";
  document.getElementById("lbClose").focus();
}

function closeLightbox() {
  lb.classList.remove("open");
  document.body.style.overflow = "";
  // stop any playing video
  lbMedia.innerHTML = "";
  // return focus to the card that opened the viewer
  if (lastFocused && lastFocused.focus) lastFocused.focus();
}

function step(dir) {
  const n = currentCat.works.length;
  currentIdx = (currentIdx + dir + n) % n;
  renderLightbox();
}

function renderLightbox() {
  const work = currentCat.works[currentIdx];
  lbTitle.textContent = work.title;
  lbNote.textContent = `${work.note || currentCat.medium}${currentCat.works.length > 1 ? ` · ${currentIdx + 1}/${currentCat.works.length}` : ""}`;

  if (work.video) {
    lbMedia.innerHTML = "";
    const v = document.createElement("video");
    v.src = `videos/${work.video}.mp4`;
    v.poster = `videos/${work.video}.jpg`;
    v.controls = true;
    v.autoplay = true;
    v.playsInline = true;
    v.setAttribute("aria-label", work.title);
    v.addEventListener("error", () => {
      const fallback = document.createElement("div");
      fallback.className = "media-fallback media-fallback-large";
      fallback.setAttribute("aria-label", `Video unavailable for ${work.title}`);
      fallback.innerHTML = `<span>VIDEO UNAVAILABLE</span>`;
      lbMedia.innerHTML = "";
      lbMedia.appendChild(fallback);
    });
    lbMedia.appendChild(v);
  } else {
    lbMedia.innerHTML = "";
    const img = document.createElement("img");
    img.src = `images/${work.img}__full.jpg`;
    img.alt = work.title;
    lbMedia.appendChild(img);
  }
}

document.getElementById("lbClose").addEventListener("click", closeLightbox);
document.getElementById("lbPrev").addEventListener("click", () => step(-1));
document.getElementById("lbNext").addEventListener("click", () => step(1));

lb.addEventListener("click", (e) => {
  if (e.target === lb) closeLightbox();
});

document.addEventListener("keydown", (e) => {
  if (!lb.classList.contains("open")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") step(-1);
  if (e.key === "ArrowRight") step(1);
  // focus trap: keep Tab inside the viewer
  if (e.key === "Tab") {
    const items = lbFocusables();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});

// Surface missing media rather than leaving an unexplained blank.
document.querySelectorAll('.grid img').forEach(img => {
  img.addEventListener('error', () => {
    const box = document.createElement('div');
    box.className = 'media-error';
    box.textContent = 'Image unavailable: ' + img.getAttribute('src');
    img.replaceWith(box);
  });
});
