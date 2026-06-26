// ============================================================
//  TechVerse Market — Common: Navbar, Footer, Cart/Wishlist
//  js/common.js  (ES Module — <script type="module">)
// ============================================================

import {
    onAuthChange,
    logoutUser,
    getUserProfile,
    addToCart,
    addToWishlist
} from "../firebase/firebase.js";

document.addEventListener("DOMContentLoaded", function () {
    var path   = window.location.pathname;
    var isRoot = !path.includes("/buyer/") && !path.includes("/vendor/") && !path.includes("/admin/");
    var prefix = isRoot ? "" : "../";

    // Observe auth state; build navbar once we know login status
    onAuthChange(async function (firebaseUser) {
        var userProfile = null;
        if (firebaseUser) {
            userProfile = await getUserProfile(firebaseUser.uid);
        }
        buildNavbar(prefix, firebaseUser, userProfile);
        buildFooter(prefix);
        setupNavControls(prefix);
    });
});

// ──────────────────────────────────────────────────────────────────────────
//  Wire up logout, mobile menu, search
// ──────────────────────────────────────────────────────────────────────────
function setupNavControls(prefix) {
    // Desktop logout
    var logoutBtn = document.getElementById("nav-logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async function (e) {
            e.preventDefault();
            try {
                await logoutUser();
                window.location.href = prefix + "login.html";
            } catch (err) {
                console.error("Logout error:", err);
            }
        });
    }

    // Mobile logout
    var mobileLogoutBtn = document.getElementById("nav-logout-btn-mobile");
    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener("click", async function (e) {
            e.preventDefault();
            try {
                await logoutUser();
                window.location.href = prefix + "login.html";
            } catch (err) {
                console.error("Logout error:", err);
            }
        });
    }

    // Mobile menu toggle
    var mobileMenuBtn = document.getElementById("mobile-menu-btn");
    var mobileMenu    = document.getElementById("mobile-menu");
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener("click", function () {
            mobileMenu.classList.toggle("hidden");
        });
    }

    // Desktop search form
    var searchForm = document.getElementById("nav-search-form");
    if (searchForm) {
        searchForm.addEventListener("submit", function (e) {
            e.preventDefault();
            var q   = document.getElementById("nav-search-input").value.trim();
            var cat = document.getElementById("nav-search-category").value;
            window.location.href = prefix + "buyer/products.html?search=" + encodeURIComponent(q) + "&category=" + encodeURIComponent(cat);
        });
    }
}

// ──────────────────────────────────────────────────────────────────────────
//  Build navbar HTML — aware of login state
// ──────────────────────────────────────────────────────────────────────────
function buildNavbar(prefix, firebaseUser, userProfile) {
    var container = document.getElementById("navbar-container");
    if (!container) return;

    var userMenu;
    if (firebaseUser && userProfile) {
        var dashboardHref = prefix + "buyer/profile.html";
        if (userProfile.role === "admin")  dashboardHref = prefix + "admin/dashboard.html";
        if (userProfile.role === "vendor") dashboardHref = prefix + "vendor/dashboard.html";

        userMenu = `
            <div style="position:relative;display:inline-block;" id="user-dropdown-wrapper">
                <button id="user-dropdown-btn" style="display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);border-radius:6px;padding:6px 12px;color:white;cursor:pointer;font-size:13px;font-weight:600;">
                    <i class="fas fa-user-circle" style="font-size:18px;color:#f97316;"></i>
                    <span>${userProfile.name.split(" ")[0]}</span>
                    <i class="fas fa-chevron-down" style="font-size:10px;"></i>
                </button>
                <div id="user-dropdown-menu" style="display:none;position:absolute;right:0;top:110%;background:white;border-radius:8px;box-shadow:0 8px 30px rgba(0,0,0,0.15);min-width:180px;z-index:999;overflow:hidden;">
                    <a href="${dashboardHref}" style="display:flex;align-items:center;gap:10px;padding:11px 16px;color:#1e1b4b;font-size:13px;font-weight:600;text-decoration:none;border-bottom:1px solid #f1f5f9;">
                        <i class="fas fa-tachometer-alt" style="color:#f97316;width:16px;"></i> Dashboard
                    </a>
                    <a href="${prefix}buyer/profile.html" style="display:flex;align-items:center;gap:10px;padding:11px 16px;color:#374151;font-size:13px;text-decoration:none;border-bottom:1px solid #f1f5f9;">
                        <i class="fas fa-user" style="color:#6b7280;width:16px;"></i> Profile
                    </a>
                    <a href="${prefix}buyer/orders.html" style="display:flex;align-items:center;gap:10px;padding:11px 16px;color:#374151;font-size:13px;text-decoration:none;border-bottom:1px solid #f1f5f9;">
                        <i class="fas fa-box" style="color:#6b7280;width:16px;"></i> My Orders
                    </a>
                    <a href="#" id="nav-logout-btn" style="display:flex;align-items:center;gap:10px;padding:11px 16px;color:#dc2626;font-size:13px;text-decoration:none;">
                        <i class="fas fa-sign-out-alt" style="width:16px;"></i> Logout
                    </a>
                </div>
            </div>`;
    } else {
        userMenu = `
            <a href="${prefix}login.html" class="brand-btn-primary px-4 py-2.5 rounded text-sm font-semibold">
                <i class="fas fa-sign-in-alt mr-1"></i>Login
            </a>`;
    }

    container.innerHTML = `
        <!-- Top info bar -->
        <div class="czone-topbar py-2 px-4">
            <div class="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-1 text-xs">
                <div class="flex items-center gap-5">
                    <span><i class="fas fa-phone-alt mr-1"></i>+92 21 3481 7355</span>
                    <span><i class="fas fa-envelope mr-1"></i>support@techverse.com</span>
                </div>
                <span>🚚 Free delivery across Pakistan on orders above Rs. 50,000</span>
            </div>
        </div>

        <!-- Main header -->
        <header class="czone-header sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">

                <!-- Logo -->
                <a href="${prefix}index.html" class="flex items-center gap-2 shrink-0">
                    <div class="brand-btn-primary p-2 rounded text-white">
                        <i class="fas fa-microchip text-lg"></i>
                    </div>
                    <span class="font-extrabold text-xl brand-text-primary">
                        TechVerse<span class="brand-text-accent text-sm font-bold">.pk</span>
                    </span>
                </a>

                <!-- Search bar -->
                <form id="nav-search-form" class="hidden md:flex flex-grow max-w-2xl border border-slate-200 rounded overflow-hidden bg-white shadow-sm">
                    <select id="nav-search-category" class="bg-slate-50 text-slate-600 px-3 text-xs font-semibold border-r border-slate-200 focus:outline-none min-w-[110px]">
                        <option value="all">All Categories</option>
                        <option value="laptops">Laptops</option>
                        <option value="components">Components</option>
                        <option value="accessories">Accessories</option>
                    </select>
                    <input id="nav-search-input" type="text" placeholder="Search for laptops, GPUs, monitors..." class="text-sm px-4 py-2.5 flex-grow focus:outline-none text-slate-700">
                    <button type="submit" class="brand-btn-primary px-5 flex items-center justify-center" style="border-radius:0;">
                        <i class="fas fa-search"></i>
                    </button>
                </form>

                <!-- Right icons -->
                <div class="flex items-center gap-4 text-slate-600">
                    <a href="${prefix}buyer/wishlist.html" class="relative hover:text-orange-500 py-2 transition-colors">
                        <i class="far fa-heart text-xl"></i>
                    </a>
                    <a href="${prefix}buyer/cart.html" class="relative hover:text-orange-500 py-2 transition-colors">
                        <i class="fas fa-shopping-cart text-xl"></i>
                    </a>
                    ${userMenu}
                    <button id="mobile-menu-btn" class="md:hidden hover:text-orange-500 transition-colors">
                        <i class="fas fa-bars text-xl"></i>
                    </button>
                </div>
            </div>

            <!-- Navigation bar -->
            <nav class="czone-nav-bar hidden md:block">
                <div class="max-w-7xl mx-auto px-4 flex items-center gap-1">
                    <a href="${prefix}index.html" class="text-white/85 hover:text-white px-4 py-2.5 text-sm font-medium transition-colors">Home</a>
                    <a href="${prefix}buyer/products.html" class="text-white/85 hover:text-white px-4 py-2.5 text-sm font-medium transition-colors">Products</a>
                    <a href="${prefix}buyer/products.html?category=laptops" class="text-white/85 hover:text-white px-4 py-2.5 text-sm font-medium transition-colors">Laptops</a>
                    <a href="${prefix}buyer/products.html?category=components" class="text-white/85 hover:text-white px-4 py-2.5 text-sm font-medium transition-colors">GPU</a>
                    <a href="${prefix}buyer/products.html?category=monitors" class="text-white/85 hover:text-white px-4 py-2.5 text-sm font-medium transition-colors">Monitors</a>
                    <a href="${prefix}buyer/products.html?category=gaming" class="text-white/85 hover:text-white px-4 py-2.5 text-sm font-medium transition-colors">Gaming</a>
                </div>
            </nav>

            <!-- Mobile menu -->
            <div id="mobile-menu" class="hidden md:hidden bg-white border-t border-slate-100 px-4 py-4">
                <form class="flex border border-slate-200 rounded overflow-hidden mb-3" onsubmit="event.preventDefault(); window.location.href='${prefix}buyer/products.html?search='+encodeURIComponent(document.getElementById('mobile-search').value);">
                    <input id="mobile-search" type="text" placeholder="Search..." class="text-sm px-4 py-2 flex-grow focus:outline-none">
                    <button type="submit" class="brand-btn-primary text-white px-4" style="border-radius:0;"><i class="fas fa-search"></i></button>
                </form>
                <div class="flex flex-col gap-2 text-sm font-medium text-slate-700">
                    <a href="${prefix}index.html" class="py-2 border-b">Home</a>
                    <a href="${prefix}buyer/products.html" class="py-2 border-b">Products</a>
                    <a href="${prefix}buyer/cart.html" class="py-2 border-b">Cart</a>
                    ${firebaseUser
                        ? `<a href="#" id="nav-logout-btn-mobile" class="py-2 text-red-600 font-semibold">Logout</a>`
                        : `<a href="${prefix}login.html" class="py-2 text-indigo-700 font-semibold">Login</a>`}
                </div>
            </div>
        </header>
    `;

    // Wire dropdown toggle
    var dropBtn  = document.getElementById("user-dropdown-btn");
    var dropMenu = document.getElementById("user-dropdown-menu");
    if (dropBtn && dropMenu) {
        dropBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            dropMenu.style.display = dropMenu.style.display === "none" ? "block" : "none";
        });
        document.addEventListener("click", function () {
            if (dropMenu) dropMenu.style.display = "none";
        });
    }

    setupNavControls(prefix);
}

// ──────────────────────────────────────────────────────────────────────────
//  Build footer
// ──────────────────────────────────────────────────────────────────────────
function buildFooter(prefix) {
    var container = document.getElementById("footer-container");
    if (!container) return;

    container.innerHTML = `
        <footer class="brand-footer text-slate-300 pt-12 pb-6">
            <div class="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
                <!-- About -->
                <div>
                    <div class="flex items-center gap-2 mb-4">
                        <div class="brand-btn-accent p-2 rounded text-white"><i class="fas fa-microchip"></i></div>
                        <span class="font-extrabold text-xl text-white">TechVerse</span>
                    </div>
                    <p class="text-sm leading-relaxed mb-4 text-slate-400">
                        Pakistan's leading multi-vendor IT &amp; gaming store.
                    </p>
                </div>
                <!-- Support -->
                <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wider mb-4" style="border-left:3px solid #f97316;padding-left:10px;">Support</h4>
                    <ul class="space-y-2.5 text-sm">
                        <li><a href="#" class="hover:text-orange-400 transition-colors">Track Your Order</a></li>
                        <li><a href="#" class="hover:text-orange-400 transition-colors">Contact Us</a></li>
                    </ul>
                </div>
            </div>
            <div class="max-w-7xl mx-auto px-4 border-t border-slate-700 pt-6 text-xs text-slate-500 text-center">
                © 2025 TechVerse Market. All rights reserved.
            </div>
        </footer>
    `;
}

// ──────────────────────────────────────────────────────────────────────────
//  Global Cart & Wishlist Actions (called from product cards via onclick)
// ──────────────────────────────────────────────────────────────────────────
window.CartActions = {
    addToCart: async function (productId, qty, productData) {
        var { getCurrentAuthUser } = await import("../firebase/firebase.js");
        var user = getCurrentAuthUser();
        if (!user) {
            Swal.fire({ icon: "warning", title: "Please Login", text: "You need to be logged in to add items to cart.", confirmButtonColor: "#1e1b4b" });
            return;
        }
        try {
            await addToCart(user.uid, { productid: productId, quantity: qty || 1, ...productData });
            Swal.fire({ icon: "success", title: "Added to Cart!", showConfirmButton: false, timer: 1200 });
        } catch (err) {
            Swal.fire({ icon: "error", title: "Error", text: err.message, confirmButtonColor: "#1e1b4b" });
        }
    },
    addToWishlist: async function (productId, productData) {
        var { getCurrentAuthUser } = await import("../firebase/firebase.js");
        var user = getCurrentAuthUser();
        if (!user) {
            Swal.fire({ icon: "warning", title: "Please Login", text: "You need to be logged in to save to wishlist.", confirmButtonColor: "#1e1b4b" });
            return;
        }
        try {
            await addToWishlist(user.uid, { productid: productId, ...productData });
            Swal.fire({ icon: "success", title: "Added to Wishlist!", showConfirmButton: false, timer: 1200 });
        } catch (err) {
            Swal.fire({ icon: "error", title: "Error", text: err.message, confirmButtonColor: "#1e1b4b" });
        }
    }
};
