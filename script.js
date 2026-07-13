const header = document.querySelector(".site-header");
const menuPage = document.querySelector(".menu-page");
const menuSourceUrl = menuPage ? menuPage.dataset.menuSource || "data/menu.json" : "data/menu.json";

function fixedOffset() {
  const headerHeight = header ? header.getBoundingClientRect().height : 0;
  return headerHeight + 8;
}

function scrollToSection(section) {
  const targetTop = window.scrollY + section.getBoundingClientRect().top - fixedOffset();
  window.scrollTo({ top: Math.max(targetTop, 0), behavior: "smooth" });
}

function setupSectionNav() {
  const nav = document.querySelector(".section-nav");
  if (!nav) return;

  nav.querySelectorAll('a[href^="#"]').forEach((link) => {
    if (link.dataset.navReady === "true") return;
    link.dataset.navReady = "true";

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

function isVisibleInDineIn(item) {
  return item && item.visibleInDineIn !== false;
}

function orderedItems(items) {
  return [...items].sort((first, second) => {
    const firstOrder = Number.isFinite(Number(first.order)) ? Number(first.order) : 0;
    const secondOrder = Number.isFinite(Number(second.order)) ? Number(second.order) : 0;
    return firstOrder - secondOrder;
  });
}

function productPriceText(product) {
  if (product.priceText !== undefined && product.priceText !== null) return String(product.priceText);
  if (Number.isFinite(Number(product.price))) return Number(product.price).toFixed(2);
  return "";
}

function validateMenuData(menuData) {
  if (!menuData || !Array.isArray(menuData.categories)) {
    throw new Error("Menu data is missing categories.");
  }

  const categories = orderedItems(menuData.categories).filter(isVisibleInDineIn);
  if (categories.length === 0) {
    throw new Error("Menu data has no visible dine-in categories.");
  }

  categories.forEach((category) => {
    if (!category.sectionId || !category.name || !category.icon || !Array.isArray(category.products)) {
      throw new Error(`Menu category '${category.id || category.name || "unknown"}' is incomplete.`);
    }

    const products = orderedItems(category.products).filter(isVisibleInDineIn);
    if (products.length === 0) {
      throw new Error(`Menu category '${category.id || category.name}' has no visible products.`);
    }

    products.forEach((product) => {
      if (!product.name || !productPriceText(product)) {
        throw new Error(`Menu product '${product.id || product.name || "unknown"}' is incomplete.`);
      }
    });
  });

  return categories;
}

function createMenuIcon(src) {
  const icon = document.createElement("img");
  icon.src = src;
  icon.alt = "";
  icon.setAttribute("aria-hidden", "true");
  return icon;
}

function createSectionNav(categories) {
  const nav = document.createElement("nav");
  nav.className = "section-nav";
  nav.setAttribute("aria-label", "أقسام المنيو");

  categories.forEach((category) => {
    const link = document.createElement("a");
    link.href = `#${category.sectionId}`;
    link.appendChild(createMenuIcon(category.icon));

    const label = document.createElement("span");
    label.className = "nav-label";
    label.textContent = category.name;
    link.appendChild(label);
    nav.appendChild(link);
  });

  return nav;
}

function createProductItem(product) {
  const item = document.createElement("li");
  if (product.id) item.dataset.productId = product.id;
  if (product.image) item.dataset.image = product.image;
  if (product.ingredients) item.dataset.ingredients = product.ingredients;

  const name = document.createElement("span");
  name.textContent = product.name;

  const price = document.createElement("span");
  price.className = "price-slot";
  price.textContent = productPriceText(product);

  item.append(name, price);
  return item;
}

function createMenuSection(category) {
  const section = document.createElement("article");
  section.className = "menu-section";
  section.id = category.sectionId;

  const heading = document.createElement("h3");
  const iconWrap = document.createElement("span");
  iconWrap.className = "section-icon";
  iconWrap.appendChild(createMenuIcon(category.icon));

  const title = document.createElement("span");
  title.textContent = category.name;
  heading.append(iconWrap, title);

  const productList = document.createElement("ul");
  productList.className = "product-list";
  orderedItems(category.products).filter(isVisibleInDineIn).forEach((product) => {
    productList.appendChild(createProductItem(product));
  });

  section.append(heading, productList);
  return section;
}

function renderMenu(menuData) {
  if (!menuPage) return;

  const categories = validateMenuData(menuData);
  const fragment = document.createDocumentFragment();
  fragment.appendChild(createSectionNav(categories));
  categories.forEach((category) => {
    fragment.appendChild(createMenuSection(category));
  });

  menuPage.replaceChildren(fragment);
  setupSectionNav();
  setupProductItems();
}

async function loadMenuData() {
  if (!menuPage || !("fetch" in window)) return;

  try {
    const response = await fetch(menuSourceUrl, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Menu data request failed with ${response.status}.`);

    const menuData = await response.json();
    renderMenu(menuData);
  } catch (error) {
    console.warn("Could not load menu data. Using fallback HTML.", error);
  }
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
    if (product.dataset.productReady === "true") return;
    product.dataset.productReady = "true";

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

setupSectionNav();

if (productModal) {
  setupProductItems();
  productModalCloseButtons.forEach((button) => {
    button.addEventListener("click", closeProductModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeProductModal();
  });
}

loadMenuData();

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
