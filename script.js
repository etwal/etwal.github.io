document.getElementById("year").textContent = new Date().getFullYear();

const nav = document.getElementById("nav");
window.addEventListener("scroll", () => {
  nav.classList.toggle("scrolled", window.scrollY > 10);
});

const navToggle = document.getElementById("nav-toggle");
const navLinks = document.getElementById("nav-links");
navToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", open);
});
navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

const revealTargets = document.querySelectorAll(
  ".section-tag, .section-title, .about-grid, .role, .skill-card, .project-card, .contact-inner > *"
);
revealTargets.forEach((el) => el.classList.add("reveal"));

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
revealTargets.forEach((el) => observer.observe(el));

/* Side by side video pairs: one set of controls drives both clips in sync. */
document.querySelectorAll(".video-duo").forEach((duo) => {
  const videos = Array.from(duo.querySelectorAll("video"));
  if (!videos.length) return;

  const btn = duo.querySelector(".video-duo-btn");
  const scrub = duo.querySelector(".video-duo-scrub");
  const time = duo.querySelector(".video-duo-time");
  const label = btn && btn.querySelector("span");

  // The clips differ in length, so the pair is driven by the longer one.
  let lead = videos[0];
  const pickLead = () => {
    lead = videos.reduce((a, b) => ((b.duration || 0) > (a.duration || 0) ? b : a), videos[0]);
    if (scrub) scrub.max = lead.duration || 0;
    render();
  };
  videos.forEach((v) => v.addEventListener("loadedmetadata", pickLead));

  const fmt = (s) =>
    !isFinite(s) ? "0:00" : Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");

  const render = () => {
    if (scrub) scrub.value = lead.currentTime;
    if (time) time.textContent = fmt(lead.currentTime) + " / " + fmt(lead.duration);
  };

  const playing = () => videos.some((v) => !v.paused);
  const setLabel = () => {
    if (label) label.textContent = playing() ? "Pause both" : "Play both";
  };

  const playAll = () => {
    videos.forEach((v) => {
      const p = v.play();
      if (p) p.catch(() => {});
    });
    setLabel();
  };
  const pauseAll = () => {
    videos.forEach((v) => v.pause());
    setLabel();
  };
  const seekAll = (t) => {
    videos.forEach((v) => {
      v.currentTime = Math.min(t, v.duration || t);
    });
    render();
  };

  if (btn) btn.addEventListener("click", () => (playing() ? pauseAll() : playAll()));
  videos.forEach((v) => v.addEventListener("click", () => (playing() ? pauseAll() : playAll())));
  if (scrub) scrub.addEventListener("input", () => seekAll(Number(scrub.value)));

  lead.addEventListener("timeupdate", render);

  // Restart the pair together so they never drift apart across loops.
  lead.addEventListener("ended", () => {
    seekAll(0);
    playAll();
  });
  // The shorter clip holds on its last frame until the pair restarts.
  videos.forEach((v) => {
    v.addEventListener("ended", () => {
      if (v !== lead) v.pause();
    });
  });

  pickLead();
  setLabel();
});
