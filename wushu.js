// ─────────────────────────────────────────────────────────────
// WUSHU VIDEO DATA — edit titles and order here.
// video files live in wushu/wushu/<file>.mov (QuickTime .mov).
// To switch to web .mp4 later, change EXT below (and provide
// matching .mp4 files plus optional <file>.jpg posters).
// ─────────────────────────────────────────────────────────────

const EXT = "mov"; // change to "mp4" once you export web versions
const POSTER_EXT = "jpg"; // posters are optional; leave as-is

const WUSHU = [
  { file: "Sword Comp",         title: "Sword Competition" },
  { file: "Sword Fight",        title: "Sword Fight" },
  { file: "Spear Comp",         title: "Spear Competition" },
  { file: "KungFu Panda",       title: "Kung Fu Panda" },
  { file: "Mission Impossible", title: "Mission Impossible" },
  { file: "CNY 1",              title: "Chinese New Year 1" },
  { file: "CNY 2",              title: "Chinese New Year 2" },
  { file: "Funny",              title: "Funny" },
];

const SRC = (f) => `wushu/wushu/${encodeURIComponent(f)}.${EXT}`;
const POSTER = (f) => `wushu/wushu/${encodeURIComponent(f)}.${POSTER_EXT}`;

/* ── Card markup ── */
function cardHTML(work) {
  return `
    <div class="card-media">
      <video src="${SRC(work.file)}" preload="metadata" muted playsinline></video>
      <span class="video-play" aria-hidden="true">▶</span>
    </div>
    <div class="card-caption">
      <span class="card-title">${work.title}<span class="video-tag">VIDEO</span></span>
    </div>
  `;
}

/* ── Build the gallery section ── */
(function buildGallery() {
  const main = document.getElementById("galleries");

  const section = document.createElement("section");
  section.className = "section";
  section.id = "wushu";
  section.innerHTML = `
    <div class="section-head reveal">
      <h2 class="section-title" id="wushu-title">Wushu Routines</h2>
    </div>
    <p class="section-blurb reveal">A collection of wushu performance and competition clips. Click any card to play in the viewer.</p>
    <div class="grid"></div>
  `;

  const grid = section.querySelector(".grid");

  WUSHU.forEach((work, i) => {
    const card = document.createElement("div");
    card.className = "card reveal";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", work.title);
    card.innerHTML = cardHTML(work);

    card.addEventListener("click", () => openLightbox(i));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openLightbox(i);
      }
    });

    grid.appendChild(card);
  });

  main.appendChild(section);
})();

/* ── Scroll reveal ── */
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

/* ── Lightbox ── */
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

function openLightbox(idx) {
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
  lbMedia.innerHTML = "";
  if (lastFocused && lastFocused.focus) lastFocused.focus();
}

function step(dir) {
  const n = WUSHU.length;
  currentIdx = (currentIdx + dir + n) % n;
  renderLightbox();
}

function renderLightbox() {
  const work = WUSHU[currentIdx];
  lbTitle.textContent = work.title;
  lbNote.textContent = `${currentIdx + 1}/${WUSHU.length}`;

  lbMedia.innerHTML = "";
  const v = document.createElement("video");
  v.src = SRC(work.file);
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
