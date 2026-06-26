// ============================================================
//  TechVerse Market — Products Catalog Page
//  js/products.js  (ES Module — <script type="module">)
// ============================================================

import {
    getAllProducts,
    getProductsByCategory,
    searchProducts,
    getAllCategories
} from "../firebase/firebase.js";

// ── Shared state ──────────────────────────────────────────────────────────
var allProducts    = [];
var activeFilters  = { categories: [], brands: [], maxPrice: 600000, inStock: false, search: "", sort: "default" };

document.addEventListener("DOMContentLoaded", async function () {

    // Mobile filter panel
    var filterBtn     = document.getElementById("mobile-filter-btn");
    var filterOverlay = document.getElementById("mobile-filter-overlay");
    var closeFilterBtn = document.getElementById("close-filter-btn");

    if (filterBtn && filterOverlay)  filterBtn.addEventListener("click",  function () { filterOverlay.classList.remove("hidden"); });
    if (closeFilterBtn && filterOverlay) closeFilterBtn.addEventListener("click", function () { filterOverlay.classList.add("hidden"); });

    // Read URL params
    var params        = new URLSearchParams(window.location.search);
    var urlSearch     = params.get("search")   || "";
    var urlCategory   = params.get("category") || "";

    if (urlSearch)   activeFilters.search = urlSearch;
    if (urlCategory && urlCategory !== "all") activeFilters.categories = [urlCategory];

    // Populate sidebar
    await loadCategories();

    // Load products
    allProducts = await getAllProducts();
    renderProducts(applyFilters(allProducts));

    setupFilterListeners();
});

// ── Load categories into sidebar ──────────────────────────────────────────
async function loadCategories() {
    try {
        var cats = await getAllCategories();
        var list = document.getElementById("sidebar-categories");
        if (!list || cats.length === 0) return;

        list.innerHTML = cats.map(function (c) {
            return `<li>
                <label class="flex items-center gap-2 cursor-pointer text-sm text-slate-600 hover:text-indigo-700">
                    <input type="checkbox" class="category-checkbox" value="${c.slug || c.name}" ${activeFilters.categories.includes(c.slug || c.name) ? "checked" : ""}>
                    ${c.name}
                </label>
            </li>`;
        }).join("");
    } catch (err) {
        console.error("loadCategories:", err);
    }
}

// ── Apply all active filters ──────────────────────────────────────────────
function applyFilters(products) {
    var filtered = products.slice();

    // Search
    if (activeFilters.search) {
        var term = activeFilters.search.toLowerCase();
        filtered = filtered.filter(function (p) {
            return (p.title  && p.title.toLowerCase().includes(term)) ||
                   (p.brand  && p.brand.toLowerCase().includes(term));
        });
    }

    // Categories
    if (activeFilters.categories.length > 0) {
        filtered = filtered.filter(function (p) {
            return activeFilters.categories.includes(p.category);
        });
    }

    // Brands
    if (activeFilters.brands.length > 0) {
        filtered = filtered.filter(function (p) {
            return activeFilters.brands.includes(p.brand);
        });
    }

    // Max price
    filtered = filtered.filter(function (p) {
        return p.price <= activeFilters.maxPrice;
    });

    // In stock only
    if (activeFilters.inStock) {
        filtered = filtered.filter(function (p) { return p.stock > 0; });
    }

    // Sort
    if (activeFilters.sort === "price-asc")  filtered.sort(function (a, b) { return a.price - b.price; });
    if (activeFilters.sort === "price-desc") filtered.sort(function (a, b) { return b.price - a.price; });
    if (activeFilters.sort === "newest")     filtered.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });

    return filtered;
}

// ── Render product cards ──────────────────────────────────────────────────
function renderProducts(products) {
    var grid  = document.getElementById("products-catalog-grid");
    var count = document.getElementById("product-count");
    if (!grid) return;

    if (count) count.textContent = products.length + " Products";

    if (products.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:80px 20px;">
                <i class="fas fa-search" style="font-size:48px;color:#cbd5e1;margin-bottom:16px;display:block;"></i>
                <p style="color:#94a3b8;font-size:18px;font-weight:600;">No products found</p>
                <p style="color:#cbd5e1;font-size:14px;margin-top:8px;">Try adjusting your filters or search term.</p>
                <button onclick="resetFilters()" style="margin-top:20px;padding:10px 24px;background:#1e1b4b;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;">Clear Filters</button>
            </div>`;
        return;
    }

    grid.innerHTML = products.map(function (p) {
        var inStock   = p.stock > 0;
        var discount  = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
        var stars     = renderStars(p.rating || 0);
        var imgSrc    = p.image || "https://placehold.co/300x220/e2e8f0/94a3b8?text=No+Image";

        return `
            <div class="product-card surface-panel overflow-hidden" style="display:flex;flex-direction:column;transition:transform 0.2s,box-shadow 0.2s;" onmouseenter="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 40px rgba(30,27,75,0.12)'" onmouseleave="this.style.transform='';this.style.boxShadow=''">
                <div style="position:relative;overflow:hidden;">
                    <img src="${imgSrc}" alt="${p.title}" style="width:100%;height:200px;object-fit:cover;" loading="lazy">
                    ${discount > 0 ? `<span style="position:absolute;top:10px;left:10px;background:#ef4444;color:white;font-size:11px;font-weight:700;padding:3px 8px;border-radius:4px;">-${discount}%</span>` : ""}
                    ${!inStock ? `<div style="position:absolute;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;"><span style="background:rgba(0,0,0,0.7);color:white;padding:6px 14px;border-radius:4px;font-size:13px;font-weight:700;">Out of Stock</span></div>` : ""}
                </div>
                <div style="padding:16px;display:flex;flex-direction:column;flex:1;">
                    <p style="font-size:11px;color:#f97316;font-weight:600;text-transform:uppercase;margin-bottom:4px;">${p.brand || "TechVerse"}</p>
                    <h3 style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:8px;line-height:1.4;flex:1;">
                        <a href="../buyer/product-details.html?id=${p.id}" style="color:inherit;text-decoration:none;">${p.title}</a>
                    </h3>
                    <div style="margin-bottom:8px;font-size:12px;color:#f59e0b;">${stars}</div>
                    <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:12px;">
                        <span style="font-size:16px;font-weight:800;color:#1e1b4b;">Rs. ${Number(p.price).toLocaleString()}</span>
                        ${p.originalPrice ? `<span style="font-size:12px;color:#94a3b8;text-decoration:line-through;">Rs. ${Number(p.originalPrice).toLocaleString()}</span>` : ""}
                    </div>
                    <div style="display:flex;gap:8px;">
                        <button onclick="CartActions.addToCart('${p.id}', 1, ${JSON.stringify({ title: p.title, price: p.price, image: p.image || "", vendorid: p.vendorid || "" }).replace(/"/g, '&quot;')})" ${!inStock ? "disabled" : ""} style="flex:1;padding:9px;background:linear-gradient(135deg,#1e1b4b,#312e81);color:white;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:${inStock ? "pointer" : "not-allowed"};opacity:${inStock ? 1 : 0.5};">
                            <i class="fas fa-cart-plus mr-1"></i> Add to Cart
                        </button>
                        <button onclick="CartActions.addToWishlist('${p.id}', ${JSON.stringify({ title: p.title, price: p.price, image: p.image || "" }).replace(/"/g, '&quot;')})" style="padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:6px;background:white;cursor:pointer;color:#6b7280;transition:all 0.2s;" onmouseenter="this.style.borderColor='#f97316';this.style.color='#f97316'" onmouseleave="this.style.borderColor='#e2e8f0';this.style.color='#6b7280'">
                            <i class="far fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>`;
    }).join("");
}

function renderStars(rating) {
    var stars = "";
    var full  = Math.floor(rating);
    for (var i = 1; i <= 5; i++) {
        stars += i <= full ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
    }
    return stars;
}

// ── Filter listeners ──────────────────────────────────────────────────────
function setupFilterListeners() {
    // Price slider
    var priceSlider = document.getElementById("price-slider");
    var priceLabel  = document.getElementById("price-slider-value");
    if (priceSlider && priceLabel) {
        priceSlider.addEventListener("input", function () {
            activeFilters.maxPrice = parseInt(priceSlider.value, 10);
            priceLabel.textContent = "Max: " + activeFilters.maxPrice.toLocaleString();
            renderProducts(applyFilters(allProducts));
        });
    }

    // Sort dropdown
    var sortDropdown = document.getElementById("catalog-sort");
    if (sortDropdown) {
        sortDropdown.addEventListener("change", function () {
            activeFilters.sort = sortDropdown.value;
            renderProducts(applyFilters(allProducts));
        });
    }

    // Stock toggle
    var stockToggle = document.getElementById("stock-toggle");
    if (stockToggle) {
        stockToggle.addEventListener("change", function () {
            activeFilters.inStock = stockToggle.checked;
            renderProducts(applyFilters(allProducts));
        });
    }

    // Catalog search input
    var catalogSearch = document.getElementById("catalog-search-input");
    if (catalogSearch) {
        catalogSearch.addEventListener("input", function () {
            activeFilters.search = catalogSearch.value.trim();
            renderProducts(applyFilters(allProducts));
        });
    }

    // Clear/reset buttons
    var clearBtn = document.getElementById("clear-filters-btn");
    var resetBtn = document.getElementById("reset-catalog-btn");
    if (clearBtn) clearBtn.addEventListener("click", resetFilters);
    if (resetBtn) resetBtn.addEventListener("click", resetFilters);

    // Category checkboxes (delegated — sidebar may not be fully populated yet)
    document.addEventListener("change", function (e) {
        if (e.target.classList.contains("category-checkbox")) {
            activeFilters.categories = Array.from(document.querySelectorAll(".category-checkbox:checked")).map(function (el) { return el.value; });
            renderProducts(applyFilters(allProducts));
        }
        if (e.target.classList.contains("brand-checkbox")) {
            activeFilters.brands = Array.from(document.querySelectorAll(".brand-checkbox:checked")).map(function (el) { return el.value; });
            renderProducts(applyFilters(allProducts));
        }
    });
}

// ── Reset all filters ─────────────────────────────────────────────────────
window.resetFilters = function () {
    activeFilters = { categories: [], brands: [], maxPrice: 600000, inStock: false, search: "", sort: "default" };

    document.querySelectorAll(".category-checkbox, .brand-checkbox").forEach(function (el) { el.checked = false; });

    var priceSlider  = document.getElementById("price-slider");
    var priceLabel   = document.getElementById("price-slider-value");
    var stockToggle  = document.getElementById("stock-toggle");
    var searchInput  = document.getElementById("catalog-search-input");
    var sortDropdown = document.getElementById("catalog-sort");

    if (priceSlider && priceLabel) { priceSlider.value = 600000; priceLabel.textContent = "Max: 600,000"; }
    if (stockToggle)  stockToggle.checked = false;
    if (searchInput)  searchInput.value   = "";
    if (sortDropdown) sortDropdown.value  = "default";

    renderProducts(applyFilters(allProducts));
};
