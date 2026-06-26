// ============================================================
//  TechVerse Market — Admin Dashboard & Shared Logic
//  js/admin.js  (ES Module — <script type="module">)
// ============================================================

import {
    onAuthChange,
    getUserProfile,
    getAllUsers,
    getAllOrders,
    getAllProducts,
    getAllVendors,
    getPendingVendors,
    updateVendorApprovalStatus,
    updateOrderStatus,
    deleteUserDocument,
    deleteProduct,
    addCategory,
    deleteCategory,
    getAllCategories
} from "../firebase/firebase.js";

document.addEventListener("DOMContentLoaded", function () {
    onAuthChange(async function (firebaseUser) {
        if (!firebaseUser) { redirectToLogin(); return; }

        var profile = await getUserProfile(firebaseUser.uid);
        if (!profile || profile.role !== "admin") {
            Swal.fire({ icon: "error", title: "Access Denied", text: "Admin access required.", confirmButtonColor: "#1e1b4b" })
              .then(function () { window.location.href = "../index.html"; });
            return;
        }

        var adminNameEl = document.getElementById("admin-name");
        if (adminNameEl) adminNameEl.textContent = profile.name || "Admin";

        var page = window.location.pathname;
        if (page.includes("dashboard"))       await loadAdminDashboard();
        if (page.includes("vendor-approval")) await loadVendorApprovals();
        if (page.includes("orders"))          await loadAllOrders();
        if (page.includes("users"))           await loadAllUsers();
        if (page.includes("categories"))      await loadCategories();
        if (page.includes("reports"))         await loadAdminReports();
    });
});

function redirectToLogin() {
    window.location.href = "../login.html";
}

// ── Admin Dashboard Overview ──────────────────────────────────────────────
async function loadAdminDashboard() {
    try {
        var [users, orders, products, vendors] = await Promise.all([
            getAllUsers(),
            getAllOrders(),
            getAllProducts(),
            getAllVendors()
        ]);

        var revenue = orders.filter(function (o) { return o.status === "delivered"; })
            .reduce(function (s, o) { return s + (o.totalAmount || 0); }, 0);

        setStatEl("stat-total-users",     users.length);
        setStatEl("stat-total-orders",    orders.length);
        setStatEl("stat-total-products",  products.length);
        setStatEl("stat-total-vendors",   vendors.length);
        setStatEl("stat-total-revenue",   "Rs. " + revenue.toLocaleString());
        setStatEl("stat-pending-vendors", vendors.filter(function (v) { return v.approvalStatus === "pending"; }).length);

        // Recent orders table
        renderOrdersTable(orders.slice(0, 10), "admin-recent-orders-tbody");
    } catch (err) {
        console.error("loadAdminDashboard:", err);
    }
}

// ── Vendor Approvals ──────────────────────────────────────────────────────
async function loadVendorApprovals() {
    try {
        var vendors = await getPendingVendors();
        var tbody = document.getElementById("vendor-approval-tbody");
        var emptyState = document.getElementById("vendor-empty-state");
        if (!tbody) return;

        if (vendors.length === 0) {
            tbody.innerHTML = "";
            if (emptyState) emptyState.classList.remove("hidden");
            return;
        }

        if (emptyState) emptyState.classList.add("hidden");

        var STATUS_BADGE = {
            pending:  "background:#fef9c3;color:#92400e;",
            approved: "background:#dcfce7;color:#166534;",
            rejected: "background:#fee2e2;color:#991b1b;"
        };

        tbody.innerHTML = vendors.map(function (v) {
            var badge = STATUS_BADGE[v.approvalStatus] || STATUS_BADGE.pending;
            var statusText = (v.approvalStatus || "pending").toString();
            return `
                <tr class="border-b border-slate-100">
                    <td class="py-3 px-2 font-semibold text-slate-800">${v.name || v.shopname || "Unnamed Vendor"}</td>
                    <td class="py-3 px-2 text-slate-700">${v.shopname || "Unnamed Shop"}</td>
                    <td class="py-3 px-2 text-slate-600">${v.email || "—"}</td>
                    <td class="py-3 px-2 text-center">
                        <span style="font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;${badge}">${statusText}</span>
                    </td>
                    <td class="py-3 px-2 text-center">
                        <div class="flex justify-center gap-2">
                            ${v.approvalStatus !== "approved" ? `<button onclick="approveVendor('${v.id}')" style="padding:7px 12px;background:#16a34a;color:white;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;"><i class="fas fa-check mr-1"></i> Approve</button>` : ""}
                            ${v.approvalStatus !== "rejected" ? `<button onclick="rejectVendor('${v.id}')" style="padding:7px 12px;background:#dc2626;color:white;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;"><i class="fas fa-times mr-1"></i> Reject</button>` : ""}
                        </div>
                    </td>
                </tr>`;
        }).join("");
    } catch (err) {
        console.error("loadVendorApprovals:", err);
    }
}

window.approveVendor = async function (vendorId) {
    try {
        await updateVendorApprovalStatus(vendorId, "approved");
        Swal.fire({ icon: "success", title: "Vendor Approved!", showConfirmButton: false, timer: 1200 });
        await loadVendorApprovals();
    } catch (err) {
        Swal.fire({ icon: "error", title: "Error", text: err.message, confirmButtonColor: "#1e1b4b" });
    }
};

window.rejectVendor = async function (vendorId) {
    var result = await Swal.fire({ title: "Reject Vendor?", icon: "warning", showCancelButton: true, confirmButtonColor: "#dc2626", confirmButtonText: "Reject" });
    if (result.isConfirmed) {
        try {
            await updateVendorApprovalStatus(vendorId, "rejected");
            Swal.fire({ icon: "success", title: "Vendor Rejected", showConfirmButton: false, timer: 1200 });
            await loadVendorApprovals();
        } catch (err) {
            Swal.fire({ icon: "error", title: "Error", text: err.message, confirmButtonColor: "#1e1b4b" });
        }
    }
};

// ── All Orders (Admin) ────────────────────────────────────────────────────
async function loadAllOrders() {
    try {
        var orders = await getAllOrders();
        renderOrdersTable(orders, "admin-orders-tbody");
    } catch (err) {
        console.error("loadAllOrders:", err);
    }
}

function renderOrdersTable(orders, tbodyId) {
    var tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    var STATUS_STYLES = {
        pending:   "background:#fef9c3;color:#92400e;",
        confirmed: "background:#dbeafe;color:#1e40af;",
        shipped:   "background:#e0f2fe;color:#0369a1;",
        delivered: "background:#dcfce7;color:#166534;",
        cancelled: "background:#fee2e2;color:#991b1b;"
    };

    tbody.innerHTML = orders.length === 0
        ? `<tr><td colspan="5" style="text-align:center;padding:40px;color:#94a3b8;">No orders found.</td></tr>`
        : orders.map(function (order) {
            var ss   = STATUS_STYLES[order.status] || STATUS_STYLES.pending;
            var date = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString("en-PK") : "—";
            return `
                <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:14px 16px;font-size:13px;font-weight:700;">#${order.id.slice(0,8).toUpperCase()}</td>
                    <td style="padding:14px 16px;font-size:13px;">${date}</td>
                    <td style="padding:14px 16px;font-size:13px;font-weight:700;color:#1e1b4b;">Rs. ${Number(order.totalAmount || 0).toLocaleString()}</td>
                    <td style="padding:14px 16px;">
                        <select onchange="changeOrderStatus('${order.id}', this.value)" style="padding:5px 10px;border:1.5px solid #e2e8f0;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;">
                            ${["pending","confirmed","shipped","delivered","cancelled"].map(function (s) {
                                return `<option value="${s}" ${order.status === s ? "selected" : ""}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`;
                            }).join("")}
                        </select>
                    </td>
                </tr>`;
        }).join("");
}

window.changeOrderStatus = async function (orderId, status) {
    try {
        await updateOrderStatus(orderId, status);
        Swal.fire({ icon: "success", title: "Status Updated!", showConfirmButton: false, timer: 900 });
    } catch (err) {
        Swal.fire({ icon: "error", title: "Error", text: err.message, confirmButtonColor: "#1e1b4b" });
    }
};

// ── All Users (Admin) ─────────────────────────────────────────────────────
async function loadAllUsers() {
    try {
        var users  = await getAllUsers();
        var tbody  = document.getElementById("admin-users-tbody");
        if (!tbody) return;

        tbody.innerHTML = users.length === 0
            ? `<tr><td colspan="5" style="text-align:center;padding:40px;color:#94a3b8;">No users found.</td></tr>`
            : users.map(function (u) {
                var roleColors = { admin: "#4f46e5", vendor: "#f97316", buyer: "#10b981" };
                return `
                    <tr style="border-bottom:1px solid #f1f5f9;">
                        <td style="padding:14px 16px;font-size:13px;font-weight:600;color:#1e293b;">${u.name || "—"}</td>
                        <td style="padding:14px 16px;font-size:13px;color:#374151;">${u.email || "—"}</td>
                        <td style="padding:14px 16px;"><span style="background:${roleColors[u.role] || "#6b7280"}20;color:${roleColors[u.role] || "#6b7280"};font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;">${u.role || "buyer"}</span></td>
                        <td style="padding:14px 16px;">
                            <button onclick="adminDeleteUser('${u.id}')" style="padding:6px 12px;background:#dc2626;color:white;border:none;border-radius:6px;font-size:12px;cursor:pointer;font-weight:600;"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>`;
            }).join("");
    } catch (err) {
        console.error("loadAllUsers:", err);
    }
}

window.adminDeleteUser = async function (uid) {
    var result = await Swal.fire({ title: "Delete User?", text: "This will remove their Firestore data.", icon: "warning", showCancelButton: true, confirmButtonColor: "#dc2626", confirmButtonText: "Delete" });
    if (result.isConfirmed) {
        try {
            await deleteUserDocument(uid);
            Swal.fire({ icon: "success", title: "User Deleted", showConfirmButton: false, timer: 1000 });
            await loadAllUsers();
        } catch (err) {
            Swal.fire({ icon: "error", title: "Error", text: err.message, confirmButtonColor: "#1e1b4b" });
        }
    }
};

// ── Categories (Admin) ────────────────────────────────────────────────────
async function loadCategories() {
    try {
        var cats      = await getAllCategories();
        var container = document.getElementById("categories-container");
        var addForm   = document.getElementById("add-category-form");

        if (container) {
            container.innerHTML = cats.length === 0
                ? `<p style="color:#94a3b8;text-align:center;padding:30px;">No categories yet. Add one below.</p>`
                : cats.map(function (c) {
                    return `
                        <div style="display:flex;align-items:center;justify-content:space-between;background:white;padding:14px 16px;border-radius:8px;box-shadow:0 1px 6px rgba(0,0,0,0.06);margin-bottom:8px;">
                            <div style="display:flex;align-items:center;gap:12px;">
                                <i class="${c.icon || "fas fa-tag"}" style="color:#f97316;font-size:18px;width:20px;text-align:center;"></i>
                                <div>
                                    <p style="font-size:14px;font-weight:700;color:#1e293b;margin:0;">${c.name}</p>
                                    <p style="font-size:12px;color:#94a3b8;margin:0;">${c.slug || ""}</p>
                                </div>
                            </div>
                            <button onclick="adminDeleteCategory('${c.id}')" style="padding:6px 12px;background:transparent;border:1.5px solid #fecaca;color:#dc2626;border-radius:6px;font-size:12px;cursor:pointer;"><i class="fas fa-trash"></i></button>
                        </div>`;
                }).join("");
        }

        if (addForm) {
            addForm.addEventListener("submit", async function (e) {
                e.preventDefault();
                var nameEl = document.getElementById("category-name");
                var slugEl = document.getElementById("category-slug");
                var iconEl = document.getElementById("category-icon");
                var name   = nameEl?.value.trim();
                if (!name) return;
                try {
                    await addCategory({ name: name, slug: slugEl?.value.trim() || name.toLowerCase().replace(/\s+/g,"-"), icon: iconEl?.value.trim() || "fas fa-tag" });
                    addForm.reset();
                    await loadCategories();
                    Swal.fire({ icon: "success", title: "Category Added!", showConfirmButton: false, timer: 1000 });
                } catch (err) {
                    Swal.fire({ icon: "error", title: "Error", text: err.message, confirmButtonColor: "#1e1b4b" });
                }
            });
        }
    } catch (err) {
        console.error("loadCategories:", err);
    }
}

window.adminDeleteCategory = async function (categoryId) {
    var result = await Swal.fire({ title: "Delete Category?", icon: "warning", showCancelButton: true, confirmButtonColor: "#dc2626", confirmButtonText: "Delete" });
    if (result.isConfirmed) {
        try {
            await deleteCategory(categoryId);
            await loadCategories();
        } catch (err) {
            Swal.fire({ icon: "error", title: "Error", text: err.message, confirmButtonColor: "#1e1b4b" });
        }
    }
};

// ── Admin Reports ─────────────────────────────────────────────────────────
async function loadAdminReports() {
    try {
        var [orders, users, products, vendors] = await Promise.all([
            getAllOrders(),
            getAllUsers(),
            getAllProducts(),
            getAllVendors()
        ]);

        var delivered = orders.filter(function (o) { return o.status === "delivered"; });
        var revenue   = delivered.reduce(function (s, o) { return s + (o.totalAmount || 0); }, 0);

        setStatEl("report-total-revenue",  "Rs. " + revenue.toLocaleString());
        setStatEl("report-total-orders",   orders.length);
        setStatEl("report-total-users",    users.length);
        setStatEl("report-total-vendors",  vendors.filter(function (v) { return v.approvalStatus === "approved"; }).length);
        setStatEl("report-total-products", products.length);
    } catch (err) {
        console.error("loadAdminReports:", err);
    }
}

// ── Utility ───────────────────────────────────────────────────────────────
function setStatEl(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
}
