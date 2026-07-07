const header = document.querySelector(".site-header");
const nav = document.querySelector(".section-nav");

function fixedOffset() {
  const headerHeight = header ? header.getBoundingClientRect().height : 0;
  return headerHeight + 8;
}

function scrollToSection(section) {
  const targetTop = window.scrollY + section.getBoundingClientRect().top - fixedOffset();
  window.scrollTo({ top: Math.max(targetTop, 0), behavior: "smooth" });
}

if (nav) {
  nav.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href");
      const section = id ? document.querySelector(id) : null;
      if (!section) return;

      event.preventDefault();
      scrollToSection(section);
      history.replaceState(null, "", id);
    });
  });
}

const backToTop = document.querySelector(".back-to-top");

function updateBackToTop() {
  if (!backToTop) return;
  backToTop.classList.toggle("is-visible", window.scrollY > 240);
}

if (backToTop) {
  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  updateBackToTop();
  window.addEventListener("scroll", updateBackToTop, { passive: true });
}
