// ============================================================
//  TechVerse Market — Vendor Dashboard & Shared Logic
//  js/vendor.js  (ES Module — <script type="module">)
// ============================================================

import {
    onAuthChange,
    getUserProfile,
    getVendorProfile,
    getProductsByVendor,
    addProduct,
    updateProduct,
    deleteProduct,
    getOrdersByVendor,
    getAllCategories
} from "../firebase/firebase.js";

var currentVendor  = null;
var currentProfile = null;

document.addEventListener("DOMContentLoaded", function () {
    onAuthChange(async function (firebaseUser) {
        if (!firebaseUser) { redirectToLogin(); return; }

        currentProfile = await getUserProfile(firebaseUser.uid);
        if (!currentProfile || currentProfile.role !== "vendor") {
            Swal.fire({ icon: "error", title: "Access Denied", text: "This area is for vendors only.", confirmButtonColor: "#1e1b4b" })
              .then(function () { window.location.href = "../index.html"; });
            return;
        }

        currentVendor = await getVendorProfile(firebaseUser.uid);
        if (currentVendor && currentVendor.approvalStatus !== "approved") {
            showPendingBanner(currentVendor.approvalStatus);
        }

        renderVendorLayout(currentProfile, currentVendor);
        populateVendorInfo(currentVendor, currentProfile);

        // Page-specific logic
        var page = window.location.pathname;
        if (page.includes("dashboard"))      await loadDashboardStats(firebaseUser.uid);
        if (page.includes("manage-products") || page.includes("inventory")) await loadVendorProducts(firebaseUser.uid);
        if (page.includes("add-product")) {
            await loadProductCategories();
            setupAddProductForm(firebaseUser.uid);
        }
        if (page.includes("orders"))         await loadVendorOrders(firebaseUser.uid);
        if (page.includes("reports"))        await loadVendorReports(firebaseUser.uid);
    });
});

function redirectToLogin() {
    Swal.fire({ icon: "warning", title: "Login Required", confirmButtonColor: "#1e1b4b" })
      .then(function () { window.location.href = "../login.html"; });
}

function showPendingBanner(status) {
    var msg = status === "pending"
        ? "Your vendor account is pending admin approval."
        : "Your vendor account has been rejected. Contact support.";
    var banner = document.createElement("div");
    banner.style.cssText = "position:fixed;top:0;left:0;right:0;background:" + (status === "pending" ? "#fef9c3" : "#fee2e2") + ";color:" + (status === "pending" ? "#92400e" : "#991b1b") + ";text-align:center;padding:10px;font-size:13px;font-weight:600;z-index:9999;";
    banner.textContent = "⚠ " + msg;
    document.body.prepend(banner);
}

function renderVendorLayout(profile, vendor) {
    var headerEl = document.getElementById("vendor-header");
    var sidebarEl = document.getElementById("vendor-sidebar");
    if (!headerEl && !sidebarEl) return;

    var page = window.location.pathname.split("/").pop() || "dashboard.html";
    var activeClass = "bg-blue-50 text-blue-700 border-blue-200";
    var inactiveClass = "text-slate-600 hover:bg-slate-50 hover:text-slate-900";

    if (headerEl) {
        headerEl.innerHTML = `
            <header class="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <a href="dashboard.html" class="flex items-center gap-2">
                        <div class="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center"><i class="fas fa-microchip"></i></div>
                        <div>
                            <p class="text-sm font-extrabold text-slate-900">TechVerse Vendor</p>
                            <p class="text-[11px] text-slate-400">${vendor?.shopname || "Your Shop"}</p>
                        </div>
                    </a>
                </div>
                <div class="flex items-center gap-3">
                    <span class="hidden md:inline text-xs font-semibold text-slate-500">${profile?.name || "Vendor"}</span>
                    <a href="add-product.html" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl">
                        <i class="fas fa-plus mr-1"></i> Add Product
                    </a>
                </div>
            </header>
        `;
    }

    if (sidebarEl) {
        sidebarEl.innerHTML = `
            <aside class="w-64 hidden lg:flex flex-col border-r border-slate-200 bg-white p-4 gap-2">
                <a href="dashboard.html" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${page === "dashboard.html" ? activeClass : inactiveClass}">
                    <i class="fas fa-chart-pie w-4"></i> Dashboard
                </a>
                <a href="manage-products.html" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${page === "manage-products.html" ? activeClass : inactiveClass}">
                    <i class="fas fa-boxes w-4"></i> Manage Products
                </a>
                <a href="add-product.html" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${page === "add-product.html" ? activeClass : inactiveClass}">
                    <i class="fas fa-plus-circle w-4"></i> Add Product
                </a>
                <a href="orders.html" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${page === "orders.html" ? activeClass : inactiveClass}">
                    <i class="fas fa-shopping-bag w-4"></i> Orders
                </a>
                <a href="reports.html" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${page === "reports.html" ? activeClass : inactiveClass}">
                    <i class="fas fa-chart-line w-4"></i> Reports
                </a>
            </aside>
        `;
    }
}

function populateVendorInfo(vendor, profile) {
    var shopNameEl = document.getElementById("vendor-shop-name");
    var nameEl     = document.getElementById("vendor-name");
    if (shopNameEl && vendor) shopNameEl.textContent = vendor.shopname || "Your Shop";
    if (nameEl     && profile) nameEl.textContent    = profile.name    || "";
}

async function loadProductCategories() {
    try {
        var categories = await getAllCategories();
        var selects = [
            document.getElementById("prod-category"),
            document.getElementById("product-category")
        ];

        var options = [
            { value: "", label: "Choose category" },
            { value: "laptops", label: "Laptops" },
            { value: "components", label: "Components" },
            { value: "accessories", label: "Accessories" },
            { value: "gaming", label: "Gaming" }
        ];

        if (Array.isArray(categories) && categories.length > 0) {
            options = [{ value: "", label: "Choose category" }].concat(categories.map(function (c) {
                return { value: c.slug || c.name, label: c.name };
            }));
        }

        selects.forEach(function (select) {
            if (!select) return;
            select.innerHTML = "";
            options.forEach(function (opt) {
                var optionEl = document.createElement("option");
                optionEl.value = opt.value;
                optionEl.textContent = opt.label;
                select.appendChild(optionEl);
            });

            if (!select.value && options.length > 1) {
                select.value = options[1].value;
            }
        });
    } catch (err) {
        console.error("loadProductCategories:", err);
    }
}

// ── Dashboard Stats ────────────────────────────────────────────────────────
async function loadDashboardStats(vendorId) {
    try {
        var [products, orders] = await Promise.all([
            getProductsByVendor(vendorId),
            getOrdersByVendor(vendorId)
        ]);

        var totalRevenue  = orders
            .filter(function (o) { return o.status !== "cancelled"; })
            .reduce(function (sum, o) {
                return sum + (o.products || []).filter(function (p) { return p.vendorid === vendorId; }).reduce(function (s, p) { return s + p.price * p.quantity; }, 0);
            }, 0);

        setStatEl("stat-total-products",  products.length);
        setStatEl("stat-total-orders",    orders.length);
        setStatEl("stat-total-revenue",   "Rs. " + totalRevenue.toLocaleString());
        setStatEl("stat-low-stock",       products.filter(function (p) { return p.stock < 5; }).length);
    } catch (err) {
        console.error("loadDashboardStats:", err);
    }
}

function setStatEl(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
}

// ── Vendor Products List ──────────────────────────────────────────────────
async function loadVendorProducts(vendorId) {
    try {
        var products  = await getProductsByVendor(vendorId);
        var tableBody = document.getElementById("vendor-products-tbody") || document.getElementById("manage-products-tbody");
        var grid      = document.getElementById("vendor-products-grid");
        var emptyState = document.getElementById("manage-empty-state");

        if (tableBody) {
            tableBody.innerHTML = products.length === 0
                ? `<tr><td colspan="6" style="text-align:center;padding:40px;color:#94a3b8;">No products yet. <a href="add-product.html" style="color:#1e1b4b;font-weight:600;">Add your first product</a>.</td></tr>`
                : products.map(function (p) {
                    var stockColor = p.stock <= 0 ? "#dc2626" : p.stock < 5 ? "#d97706" : "#16a34a";
                    var statusText = p.approvalStatus || "pending";
                    return `
                        <tr style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:14px 16px;"><img src="${p.image || 'https://placehold.co/50x50/e2e8f0/94a3b8?text=IMG'}" alt="${p.title}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;"></td>
                            <td style="padding:14px 16px;font-size:13px;font-weight:600;color:#1e293b;">${p.title}</td>
                            <td style="padding:14px 16px;font-size:13px;color:#374151;">${p.category || "—"}</td>
                            <td style="padding:14px 16px;font-size:13px;font-weight:700;color:#1e1b4b;">Rs. ${Number(p.price).toLocaleString()}</td>
                            <td style="padding:14px 16px;font-size:12px;font-weight:700;color:${statusText === "approved" ? "#16a34a" : statusText === "rejected" ? "#dc2626" : "#d97706"};text-transform:capitalize;">${statusText}</td>
                            <td style="padding:14px 16px;display:flex;gap:8px;">
                                <button onclick="editProduct('${p.id}')" style="padding:6px 12px;background:#1e1b4b;color:white;border:none;border-radius:6px;font-size:12px;cursor:pointer;font-weight:600;"><i class="fas fa-edit"></i> Edit</button>
                                <button onclick="confirmDeleteProduct('${p.id}')" style="padding:6px 12px;background:#dc2626;color:white;border:none;border-radius:6px;font-size:12px;cursor:pointer;font-weight:600;"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>`;
                }).join("");
        }

        if (emptyState) {
            emptyState.classList.toggle("hidden", products.length !== 0);
        }

        if (grid) {
            grid.innerHTML = products.map(function (p) {
                var stockColor = p.stock <= 0 ? "#dc2626" : p.stock < 5 ? "#d97706" : "#16a34a";
                return `
                    <div style="background:white;border-radius:10px;padding:16px;box-shadow:0 2px 10px rgba(0,0,0,0.07);">
                        <img src="${p.image || 'https://placehold.co/200x120/e2e8f0/94a3b8?text=No+Image'}" alt="${p.title}" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:10px;">
                        <h3 style="font-size:13px;font-weight:700;color:#1e293b;margin:0 0 6px;">${p.title}</h3>
                        <p style="font-size:13px;font-weight:800;color:#1e1b4b;margin:0 0 4px;">Rs. ${Number(p.price).toLocaleString()}</p>
                        <p style="font-size:12px;color:${stockColor};font-weight:600;margin:0 0 12px;">Stock: ${p.stock}</p>
                        <div style="display:flex;gap:6px;">
                            <button onclick="editProduct('${p.id}')" style="flex:1;padding:7px;background:#1e1b4b;color:white;border:none;border-radius:6px;font-size:12px;cursor:pointer;font-weight:600;">Edit</button>
                            <button onclick="confirmDeleteProduct('${p.id}')" style="padding:7px 10px;background:#dc2626;color:white;border:none;border-radius:6px;font-size:12px;cursor:pointer;">Delete</button>
                        </div>
                    </div>`;
            }).join("");
        }
    } catch (err) {
        console.error("loadVendorProducts:", err);
    }
}

// ── Add Product Form ──────────────────────────────────────────────────────
function setupAddProductForm(vendorId) {
    var form = document.getElementById("add-product-form");
    if (!form) return;

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        function getField(ids) {
            for (var i = 0; i < ids.length; i++) {
                var el = document.getElementById(ids[i]) || form.querySelector('[name="' + ids[i] + '"]');
                if (el) return el;
            }
            return null;
        }

        var titleEl = getField(["prod-name", "product-title", "title"]);
        var priceEl = getField(["prod-price", "product-price", "price"]);
        var stockEl = getField(["prod-stock", "product-stock", "stock"]);
        var categoryEl = getField(["prod-category", "product-category", "category"]);
        var brandEl = getField(["prod-brand", "product-brand", "brand"]);
        var descriptionEl = getField(["prod-desc", "product-description", "description"]);
        var imageEl = getField(["prod-image", "product-image-url", "image"]);
        var featuredEl = getField(["product-featured", "featured"]);

        var titleValue = (titleEl?.value || "").trim();
        var rawPriceValue = (priceEl?.value || "").trim();
        var priceValue = parseFloat(rawPriceValue.replace(/,/g, ""));
        var stockValue = parseInt((stockEl?.value || "").trim()) || 0;
        var categoryValue = (categoryEl?.value || "").trim();
        var brandValue = (brandEl?.value || "").trim();
        var descriptionValue = (descriptionEl?.value || "").trim();
        var imageValue = (imageEl?.value || "").trim();

        if (!titleValue) {
            Swal.fire({ icon: "error", title: "Missing Title", text: "Please provide a product title.", confirmButtonColor: "#1e1b4b" });
            return;
        }

        if (!Number.isFinite(priceValue) || priceValue <= 0) {
            Swal.fire({ icon: "error", title: "Invalid Price", text: "Please enter a valid product price greater than 0.", confirmButtonColor: "#1e1b4b" });
            return;
        }

        if (!categoryValue) {
            Swal.fire({ icon: "error", title: "Missing Category", text: "Please choose a product category.", confirmButtonColor: "#1e1b4b" });
            return;
        }

        var productData = {
            title: titleValue,
            price: priceValue,
            stock: stockValue,
            category: categoryValue,
            brand: brandValue,
            description: descriptionValue,
            image: imageValue,
            featured: featuredEl?.checked || false,
            vendorid: vendorId,
            approvalStatus: "pending",
            rating: 0
        };

        var btn = form.querySelector("button[type='submit']");
        if (btn) {
            btn.disabled = true;
            btn.textContent = "Saving…";
        }

        try {
            await addProduct(productData);
            form.reset();
            Swal.fire({
                icon: "success",
                title: "Product Added!",
                text: "Your product has been listed successfully.",
                confirmButtonColor: "#1e1b4b",
                confirmButtonText: "Manage Products"
            }).then(function () { window.location.href = "manage-products.html"; });
        } catch (err) {
            if (btn) {
                btn.disabled = false;
                btn.textContent = "Save Product";
            }
            Swal.fire({ icon: "error", title: "Error", text: err.message, confirmButtonColor: "#1e1b4b" });
        }
    });
}

// ── Edit Product ──────────────────────────────────────────────────────────
window.editProduct = async function (productId) {
    var { getProduct } = await import("../firebase/firebase.js");
    var p              = await getProduct(productId);
    if (!p) return;

    var { value: formValues } = await Swal.fire({
        title:  "Edit Product",
        width:  600,
        html: `
            <input id="swal-title"       class="swal2-input" placeholder="Product Title"       value="${p.title || ""}">
            <input id="swal-price"       class="swal2-input" placeholder="Price (Rs.)"  type="number" value="${p.price || 0}">
            <input id="swal-stock"       class="swal2-input" placeholder="Stock"        type="number" value="${p.stock || 0}">
            <input id="swal-brand"       class="swal2-input" placeholder="Brand"               value="${p.brand || ""}">
            <input id="swal-image"       class="swal2-input" placeholder="Image URL"           value="${p.image || ""}">
        `,
        showCancelButton: true,
        confirmButtonText: "Save Changes",
        confirmButtonColor: "#1e1b4b",
        preConfirm: function () {
            return {
                title: document.getElementById("swal-title").value.trim(),
                price: parseFloat(document.getElementById("swal-price").value) || 0,
                stock: parseInt(document.getElementById("swal-stock").value)   || 0,
                brand: document.getElementById("swal-brand").value.trim(),
                image: document.getElementById("swal-image").value.trim()
            };
        }
    });

    if (formValues) {
        try {
            await updateProduct(productId, formValues);
            Swal.fire({ icon: "success", title: "Updated!", showConfirmButton: false, timer: 1200 });
            if (currentProfile) await loadVendorProducts(currentProfile.userid);
        } catch (err) {
            Swal.fire({ icon: "error", title: "Error", text: err.message, confirmButtonColor: "#1e1b4b" });
        }
    }
};

window.confirmDeleteProduct = async function (productId) {
    var result = await Swal.fire({
        icon: "warning",
        title: "Delete Product?",
        text: "This action cannot be undone.",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        confirmButtonText: "Delete"
    });
    if (result.isConfirmed) {
        try {
            await deleteProduct(productId);
            Swal.fire({ icon: "success", title: "Deleted", showConfirmButton: false, timer: 1000 });
            if (currentProfile) await loadVendorProducts(currentProfile.userid);
        } catch (err) {
            Swal.fire({ icon: "error", title: "Error", text: err.message, confirmButtonColor: "#1e1b4b" });
        }
    }
};

// ── Vendor Orders ────────────────────────────────────────────────────────
async function loadVendorOrders(vendorId) {
    try {
        var orders    = await getOrdersByVendor(vendorId);
        var container = document.getElementById("vendor-orders-container");
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = `<div style="text-align:center;padding:60px;color:#94a3b8;"><i class="fas fa-box-open" style="font-size:40px;display:block;margin-bottom:12px;"></i>No orders yet.</div>`;
            return;
        }

        var STATUS_STYLES = { pending: "#fef9c3:#92400e", confirmed: "#dbeafe:#1e40af", shipped: "#e0f2fe:#0369a1", delivered: "#dcfce7:#166534", cancelled: "#fee2e2:#991b1b" };

        container.innerHTML = orders.map(function (order) {
            var ss   = (STATUS_STYLES[order.status] || "#f1f5f9:#374151").split(":");
            var date = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString("en-PK") : "—";
            return `
                <div style="background:white;border-radius:10px;padding:16px;box-shadow:0 2px 10px rgba(0,0,0,0.07);margin-bottom:12px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                        <div>
                            <p style="font-size:12px;color:#94a3b8;margin:0;">Order #${order.id.slice(0,8).toUpperCase()}</p>
                            <p style="font-size:13px;color:#374151;margin:0;">${date}</p>
                        </div>
                        <p style="font-size:14px;font-weight:800;color:#1e1b4b;margin:0;">Rs. ${Number(order.totalAmount).toLocaleString()}</p>
                        <span style="background:${ss[0]};color:${ss[1]};font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;">${order.status}</span>
                    </div>
                </div>`;
        }).join("");
    } catch (err) {
        console.error("loadVendorOrders:", err);
    }
}

// ── Vendor Reports ────────────────────────────────────────────────────────
async function loadVendorReports(vendorId) {
    try {
        var [products, orders] = await Promise.all([
            getProductsByVendor(vendorId),
            getOrdersByVendor(vendorId)
        ]);

        var delivered = orders.filter(function (o) { return o.status === "delivered"; });
        var revenue   = delivered.reduce(function (sum, o) {
            return sum + (o.products || []).filter(function (p) { return p.vendorid === vendorId; })
                .reduce(function (s, p) { return s + p.price * p.quantity; }, 0);
        }, 0);

        setStatEl("report-total-revenue",    "Rs. " + revenue.toLocaleString());
        setStatEl("report-total-orders",     orders.length);
        setStatEl("report-delivered-orders", delivered.length);
        setStatEl("report-total-products",   products.length);
    } catch (err) {
        console.error("loadVendorReports:", err);
    }
}
