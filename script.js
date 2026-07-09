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

const productModal = document.querySelector("[data-product-modal]");
const productModalPanel = document.querySelector(".product-modal-panel");
const productModalTitle = document.querySelector("[data-modal-title]");
const productModalPrice = document.querySelector("[data-modal-price]");
const productModalIngredients = document.querySelector("[data-modal-ingredients]");
const productModalImage = document.querySelector("[data-modal-image]");
const productModalImagePlaceholder = document.querySelector("[data-modal-image-placeholder]");
const productModalCloseButtons = document.querySelectorAll("[data-modal-close]");
const productModalImageText = productModalImagePlaceholder ? productModalImagePlaceholder.querySelector("span") : null;
let lastFocusedProduct = null;

function productName(product) {
  const nameElement = product.querySelector("span:first-child");
  return nameElement ? nameElement.textContent.trim() : "";
}

function productPrice(product) {
  const priceElement = product.querySelector(".price-slot");
  return priceElement ? priceElement.textContent.trim() : "";
}
function showImagePlaceholder(text = "صورة المنتج") {
  if (productModalImageText) productModalImageText.textContent = text;
  if (productModalImagePlaceholder) productModalImagePlaceholder.hidden = false;
}

function resetProductImage(placeholderText = "صورة المنتج") {
  if (!productModalImage) return;

  productModalImage.onload = null;
  productModalImage.onerror = null;
  productModalImage.hidden = true;
  productModalImage.alt = "";
  delete productModalImage.dataset.loadingSrc;
  productModalImage.removeAttribute("src");
  showImagePlaceholder(placeholderText);
}

function loadProductImage(image, name) {
  if (!productModalImage || !productModalImagePlaceholder) return;

  if (!image) {
    resetProductImage();
    return;
  }

  resetProductImage("جاري تحميل الصورة...");
  productModalImage.alt = name;
  productModalImage.dataset.loadingSrc = image;

  productModalImage.onload = () => {
    if (productModalImage.dataset.loadingSrc !== image) return;
    productModalImage.hidden = false;
    productModalImagePlaceholder.hidden = true;
  };

  productModalImage.onerror = () => {
    if (productModalImage.dataset.loadingSrc !== image) return;
    resetProductImage("الصورة غير متوفرة");
  };

  productModalImage.src = image;
}

function openProductModal(product) {
  if (!productModal) return;

  lastFocusedProduct = product;
  const name = productName(product);
  const price = productPrice(product);
  const image = product.dataset.image || "";
  const ingredients = product.dataset.ingredients || "سيتم إضافة المكونات لاحقا.";

  if (productModalTitle) productModalTitle.textContent = name;
  if (productModalPrice) productModalPrice.textContent = price;
  if (productModalIngredients) productModalIngredients.textContent = ingredients;

  loadProductImage(image, name);

  productModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  if (productModalPanel) productModalPanel.focus();
}

function closeProductModal() {
  if (!productModal || productModal.getAttribute("aria-hidden") === "true") return;

  productModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");

  if (lastFocusedProduct) {
    lastFocusedProduct.focus();
    lastFocusedProduct = null;
  }
}

function setupProductItems() {
  document.querySelectorAll(".product-list li").forEach((product) => {
    product.setAttribute("tabindex", "0");
    product.setAttribute("role", "button");
    product.setAttribute("aria-label", `عرض تفاصيل ${productName(product)}`);

    product.addEventListener("click", () => openProductModal(product));
    product.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openProductModal(product);
    });
  });
}

if (productModal) {
  setupProductItems();
  productModalCloseButtons.forEach((button) => {
    button.addEventListener("click", closeProductModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeProductModal();
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
