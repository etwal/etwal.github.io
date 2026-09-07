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

  // Listeners go on every clip and check against the current lead, because
  // which clip leads is only known once durations load.
  videos.forEach((v) => {
    v.addEventListener("timeupdate", () => {
      if (v === lead) render();
    });
    v.addEventListener("ended", () => {
      if (v === lead) {
        // Restart the pair together so they never drift apart across loops.
        seekAll(0);
        playAll();
      } else {
        // The shorter clip holds on its last frame until the pair restarts.
        v.pause();
      }
    });
  });

  // Optional sound toggle. Clips marked data-silent have no audio track and
  // stay muted regardless, so the button only ever affects the clip with sound.
  const sound = duo.querySelector(".video-duo-sound");
  if (sound) {
    const soundLabel = sound.querySelector("span");
    const audible = videos.filter((v) => v.dataset.silent !== "true");
    const syncSound = () => {
      const on = audible.some((v) => !v.muted);
      if (soundLabel) soundLabel.textContent = on ? "Mute" : "Unmute";
      sound.setAttribute("aria-pressed", String(on));
    };
    sound.addEventListener("click", () => {
      const on = audible.some((v) => !v.muted);
      audible.forEach((v) => {
        v.muted = on;
      });
      syncSound();
    });
    syncSound();
  }

  pickLead();
  setLabel();
});

/* Image figures link straight to the raw file. Open them in an in-page
   lightbox instead, with a back button, so clicking never strands the
   user on a bare image with no way back except the browser button. */
const imageLinks = document.querySelectorAll("figure.image > a[href]");
if (imageLinks.length) {
  let lightbox = null;

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.remove();
    lightbox = null;
    document.removeEventListener("keydown", onKeydown);
  };
  const onKeydown = (e) => {
    if (e.key === "Escape") closeLightbox();
  };

  const openLightbox = (href, alt) => {
    lightbox = document.createElement("div");
    lightbox.className = "lightbox";

    const back = document.createElement("button");
    back.type = "button";
    back.className = "lightbox-back";
    back.innerHTML = "&larr; Back";
    back.addEventListener("click", closeLightbox);

    const img = document.createElement("img");
    img.src = href;
    img.alt = alt;

    lightbox.append(back, img);
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.body.appendChild(lightbox);
    document.addEventListener("keydown", onKeydown);
  };

  imageLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const img = link.querySelector("img");
      openLightbox(link.getAttribute("href"), img ? img.alt : "");
    });
  });
}
