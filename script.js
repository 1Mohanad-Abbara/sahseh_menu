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
const footer = document.querySelector(".site-footer");
let isFooterVisible = false;

function footerInView() {
  if (!footer) return false;

  const footerBox = footer.getBoundingClientRect();
  return footerBox.top < window.innerHeight && footerBox.bottom > 0;
}

function updateBackToTop() {
  if (!backToTop) return;

  if (footer && !("IntersectionObserver" in window)) {
    isFooterVisible = footerInView();
  }

  backToTop.classList.toggle("is-visible", window.scrollY > 240 && !isFooterVisible);
}

if (backToTop) {
  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  if (footer && "IntersectionObserver" in window) {
    const footerObserver = new IntersectionObserver(
      ([entry]) => {
        isFooterVisible = entry.isIntersecting;
        updateBackToTop();
      },
      { threshold: 0.01 }
    );

    footerObserver.observe(footer);
  }

  updateBackToTop();
  window.addEventListener("scroll", updateBackToTop, { passive: true });
  window.addEventListener("resize", updateBackToTop);
}
