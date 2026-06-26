// ============================================================
//  TechVerse Market — Homepage
//  js/homepage.js  (ES Module — <script type="module">)
// ============================================================

import {
    getFeaturedProducts,
    getAllProducts,
    getAllCategories
} from "../firebase/firebase.js";

document.addEventListener("DOMContentLoaded", async function () {

    // AOS scroll animations
    if (typeof AOS !== "undefined") AOS.init({ duration: 550, once: true, offset: 30 });

    // Swiper hero
    if (typeof Swiper !== "undefined") {
        new Swiper(".hero-swiper", {
            loop: true,
            autoplay: { delay: 4500, disableOnInteraction: false },
            speed: 600,
            pagination: { el: ".swiper-pagination", clickable: true },
            navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" }
        });
    }

    startFlashSaleTimer();
    setupTrendingTabs();
    setupNewsletter();

    // ── Load Firebase data in parallel ──────────────────────────────────
    try {
        var [featured, allProds, categories] = await Promise.all([
            getFeaturedProducts(8),
            getAllProducts(),
            getAllCategories()
        ]);

        renderProductGrid("featured-products-grid",  featured.length  ? featured : allProds.slice(0, 8));
        renderProductGrid("new-arrivals-grid",        allProds.slice(0, 8));
        renderProductGrid("best-sellers-grid",        allProds.slice(0, 8));
        renderProductGrid("trending-products-grid",   allProds.slice(0, 8));
        renderProductGrid("flash-sale-products",      allProds.filter(function (p) { return p.salePrice; }).slice(0, 6));
        renderCategorySlider("categories-slider-container", categories);
        renderSidebarCategories("sidebar-cat-list",   categories);

    } catch (err) {
        console.error("[TechVerse] Homepage data load error:", err);
    }
});

// ──────────────────────────────────────────────────────────────────────────
//  Render Helpers
// ──────────────────────────────────────────────────────────────────────────
function renderStars(rating) {
    var stars = "";
    var full  = Math.floor(rating || 0);
    for (var i = 1; i <= 5; i++) {
        stars += i <= full ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
    }
    return stars;
}

function renderProductGrid(containerId, products) {
    var grid = document.getElementById(containerId);
    if (!grid || !products || products.length === 0) return;

    grid.innerHTML = products.map(function (p) {
        var imgSrc   = p.image || "https://placehold.co/280x200/e2e8f0/94a3b8?text=No+Image";
        var inStock  = p.stock > 0;
        var discount = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;

        return `
            <div style="border-radius:12px;overflow:hidden;background:white;box-shadow:0 2px 12px rgba(0,0,0,0.07);display:flex;flex-direction:column;transition:transform 0.2s,box-shadow 0.2s;" onmouseenter="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 40px rgba(30,27,75,0.13)'" onmouseleave="this.style.transform='';this.style.boxShadow=''">
                <a href="buyer/product-details.html?id=${p.id}" style="display:block;overflow:hidden;">
                    <img src="${imgSrc}" alt="${p.title}" style="width:100%;height:190px;object-fit:cover;transition:transform 0.3s;" loading="lazy">
                </a>
                <div style="padding:14px;flex:1;display:flex;flex-direction:column;">
                    <p style="font-size:11px;color:#f97316;font-weight:600;text-transform:uppercase;margin:0 0 4px;">${p.brand || "TechVerse"}</p>
                    <h3 style="font-size:13px;font-weight:700;color:#1e293b;margin:0 0 6px;line-height:1.4;flex:1;">
                        <a href="buyer/product-details.html?id=${p.id}" style="color:inherit;text-decoration:none;">${p.title}</a>
                    </h3>
                    <div style="font-size:11px;color:#f59e0b;margin-bottom:8px;">${renderStars(p.rating)}</div>
                    <div style="display:flex;align-items:baseline;gap:6px;margin-bottom:12px;">
                        <span style="font-size:15px;font-weight:800;color:#1e1b4b;">Rs. ${Number(p.price).toLocaleString()}</span>
                        ${p.originalPrice ? `<span style="font-size:11px;color:#94a3b8;text-decoration:line-through;">Rs. ${Number(p.originalPrice).toLocaleString()}</span>` : ""}
                        ${discount > 0 ? `<span style="font-size:10px;font-weight:700;color:white;background:#ef4444;padding:2px 6px;border-radius:3px;">-${discount}%</span>` : ""}
                    </div>
                    <button onclick="CartActions.addToCart('${p.id}', 1, ${JSON.stringify({ title: p.title, price: p.price, image: p.image || "" }).replace(/"/g, '&quot;')})" ${!inStock ? "disabled" : ""} style="width:100%;padding:9px;background:linear-gradient(135deg,#1e1b4b,#312e81);color:white;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:${inStock ? "pointer" : "not-allowed"};opacity:${inStock ? 1 : 0.5};">
                        ${inStock ? '<i class="fas fa-cart-plus mr-1"></i> Add to Cart' : "Out of Stock"}
                    </button>
                </div>
            </div>`;
    }).join("");
}

function renderCategorySlider(containerId, categories) {
    var container = document.getElementById(containerId);
    if (!container || !categories || categories.length === 0) return;

    container.innerHTML = categories.map(function (c) {
        return `
            <a href="buyer/products.html?category=${encodeURIComponent(c.slug || c.name)}" style="display:flex;flex-direction:column;align-items:center;gap:10px;text-decoration:none;min-width:100px;">
                <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#1e1b4b,#312e81);display:flex;align-items:center;justify-content:center;color:white;font-size:26px;transition:transform 0.2s;" onmouseenter="this.style.transform='scale(1.08)'" onmouseleave="this.style.transform=''">
                    <i class="${c.icon || "fas fa-tag"}"></i>
                </div>
                <span style="font-size:12px;font-weight:600;color:#374151;text-align:center;">${c.name}</span>
            </a>`;
    }).join("");
}

function renderSidebarCategories(containerId, categories) {
    var list = document.getElementById(containerId);
    if (!list || !categories || categories.length === 0) return;

    list.innerHTML = categories.map(function (c) {
        return `
            <li>
                <a href="buyer/products.html?category=${encodeURIComponent(c.slug || c.name)}" style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;text-decoration:none;color:#374151;font-size:13px;font-weight:500;transition:background 0.15s;" onmouseenter="this.style.background='#f1f5f9'" onmouseleave="this.style.background=''">
                    <i class="${c.icon || "fas fa-tag"}" style="color:#f97316;width:16px;"></i>
                    ${c.name}
                </a>
            </li>`;
    }).join("");
}

// ──────────────────────────────────────────────────────────────────────────
//  Flash sale timer
// ──────────────────────────────────────────────────────────────────────────
function startFlashSaleTimer() {
    var totalSeconds = 36000;
    setInterval(function () {
        if (totalSeconds <= 0) return;
        totalSeconds--;
        var h  = Math.floor(totalSeconds / 3600);
        var m  = Math.floor((totalSeconds % 3600) / 60);
        var s  = totalSeconds % 60;
        var hE = document.getElementById("timer-hours");
        var mE = document.getElementById("timer-mins");
        var sE = document.getElementById("timer-secs");
        if (hE) hE.textContent = String(h).padStart(2, "0");
        if (mE) mE.textContent = String(m).padStart(2, "0");
        if (sE) sE.textContent = String(s).padStart(2, "0");
    }, 1000);
}

// ──────────────────────────────────────────────────────────────────────────
//  Trending tabs
// ──────────────────────────────────────────────────────────────────────────
function setupTrendingTabs() {
    var tabs = document.querySelectorAll(".trending-tab-btn");
    tabs.forEach(function (btn) {
        btn.addEventListener("click", async function () {
            tabs.forEach(function (b) {
                b.classList.remove("active-tab");
                b.style.background = "#f5f5f5";
                b.style.color      = "#333";
            });
            btn.classList.add("active-tab");
            btn.style.background = "";
            btn.style.color      = "";

            var cat = btn.dataset.category;
            if (cat) {
                try {
                    var { getProductsByCategory } = await import("../firebase/firebase.js");
                    var prods = await getProductsByCategory(cat);
                    renderProductGrid("trending-products-grid", prods.slice(0, 8));
                } catch (err) {
                    console.error("Trending tab:", err);
                }
            }
        });
    });
}

// ──────────────────────────────────────────────────────────────────────────
//  Newsletter
// ──────────────────────────────────────────────────────────────────────────
function setupNewsletter() {
    var form = document.getElementById("newsletter-form");
    if (!form) return;

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        Swal.fire({
            icon: "success",
            title: "Subscribed!",
            text: "Thank you! You will now receive our latest deals.",
            confirmButtonColor: "#1e1b4b"
        });
        var emailInput = form.querySelector("input[type='email']");
        if (emailInput) emailInput.value = "";
    });
}
