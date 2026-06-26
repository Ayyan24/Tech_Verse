// ============================================================
//  TechVerse Market — Buyer Orders Page
//  js/orders.js  (ES Module — <script type="module">)
// ============================================================

import {
    onAuthChange,
    getOrdersByUser
} from "../firebase/firebase.js";

document.addEventListener("DOMContentLoaded", function () {
    setupOrderModal();

    onAuthChange(async function (firebaseUser) {
        if (!firebaseUser) {
            Swal.fire({ icon: "warning", title: "Login Required", text: "Please sign in to view your orders.", confirmButtonColor: "#1e1b4b" })
              .then(function () { window.location.href = "../login.html"; });
            return;
        }
        try {
            var orders = await getOrdersByUser(firebaseUser.uid);
            renderOrders(orders);
        } catch (err) {
            console.error("orders:", err);
        }
    });
});

var STATUS_STYLES = {
    pending:   { bg: "#fef9c3", color: "#92400e", label: "Pending" },
    confirmed: { bg: "#dbeafe", color: "#1e40af", label: "Confirmed" },
    shipped:   { bg: "#e0f2fe", color: "#0369a1", label: "Shipped" },
    delivered: { bg: "#dcfce7", color: "#166534", label: "Delivered" },
    cancelled: { bg: "#fee2e2", color: "#991b1b", label: "Cancelled" }
};

function renderOrders(orders) {
    var container = document.getElementById("orders-items-tbody") || document.getElementById("orders-container");
    var emptyState = document.getElementById("orders-empty-state");
    if (!container && !emptyState) return;

    window.orderDetails = {};

    if (!orders || orders.length === 0) {
        if (emptyState) {
            emptyState.classList.remove("hidden");
        }
        if (container) container.innerHTML = "";
        return;
    }

    if (emptyState) emptyState.classList.add("hidden");

    if (container && container.tagName === "TBODY") {
        container.innerHTML = orders.map(function (order) {
            var s = STATUS_STYLES[order.status] || STATUS_STYLES.pending;
            var date = order.createdAt && order.createdAt.toDate
                ? order.createdAt.toDate().toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })
                : "—";
            window.orderDetails[order.id] = order;

            return `
                <tr class="border-b border-slate-100">
                    <td class="py-4 font-bold text-slate-800">#${order.id.slice(0, 8).toUpperCase()}</td>
                    <td class="py-4 text-sm text-slate-600">${date}</td>
                    <td class="py-4 font-bold text-slate-900">PKR ${Number(order.totalAmount).toLocaleString()}</td>
                    <td class="py-4"><span style="background:${s.bg};color:${s.color};font-size:12px;font-weight:700;padding:4px 10px;border-radius:20px;">${s.label}</span></td>
                    <td class="py-4 text-center">
                        <button onclick="window.openOrderDetails('${order.id}')" class="text-sm font-semibold text-teal-600 hover:text-teal-700">View</button>
                    </td>
                </tr>`;
        }).join("");
    } else if (container) {
        container.innerHTML = orders.map(function (order) {
            var s = STATUS_STYLES[order.status] || STATUS_STYLES.pending;
            var date = order.createdAt && order.createdAt.toDate
                ? order.createdAt.toDate().toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })
                : "—";
            window.orderDetails[order.id] = order;

            return `
                <div style="border-radius:12px;background:white;box-shadow:0 2px 12px rgba(0,0,0,0.07);overflow:hidden;margin-bottom:16px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #f1f5f9;flex-wrap:wrap;gap:10px;">
                        <div>
                            <p style="font-size:12px;color:#94a3b8;margin:0;">Order ID</p>
                            <p style="font-size:13px;font-weight:700;color:#1e293b;margin:0;">#${order.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                        <div>
                            <p style="font-size:12px;color:#94a3b8;margin:0;">Date</p>
                            <p style="font-size:13px;font-weight:600;color:#374151;margin:0;">${date}</p>
                        </div>
                        <div>
                            <p style="font-size:12px;color:#94a3b8;margin:0;">Total</p>
                            <p style="font-size:14px;font-weight:800;color:#1e1b4b;margin:0;">Rs. ${Number(order.totalAmount).toLocaleString()}</p>
                        </div>
                        <span style="background:${s.bg};color:${s.color};font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;">${s.label}</span>
                    </div>
                    <div style="padding:16px 20px;">
                        <button onclick="window.openOrderDetails('${order.id}')" style="padding:8px 14px;background:#1e1b4b;color:white;border-radius:8px;font-size:13px;font-weight:600;">View Details</button>
                    </div>
                </div>`;
        }).join("");
    }
}

function setupOrderModal() {
    var modal = document.getElementById("order-details-modal");
    var closeBtn = document.getElementById("modal-close-btn");
    if (!modal) return;

    if (closeBtn) {
        closeBtn.addEventListener("click", function () {
            modal.classList.add("hidden");
        });
    }

    modal.addEventListener("click", function (e) {
        if (e.target === modal) {
            modal.classList.add("hidden");
        }
    });
}

window.openOrderDetails = function (orderId) {
    var modal = document.getElementById("order-details-modal");
    var order = window.orderDetails && window.orderDetails[orderId];
    if (!modal || !order) return;

    var titleEl = document.getElementById("modal-order-id");
    var dateEl = document.getElementById("modal-date");
    var paymentEl = document.getElementById("modal-payment");
    var itemsEl = document.getElementById("modal-items-container");
    var totalEl = document.getElementById("modal-total");

    if (titleEl) titleEl.textContent = "Order Details — #" + order.id.slice(0, 8).toUpperCase();
    if (dateEl) dateEl.textContent = order.createdAt && order.createdAt.toDate
        ? order.createdAt.toDate().toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })
        : "—";
    if (paymentEl) paymentEl.textContent = order.paymentMethod || "Cash On Delivery";
    if (itemsEl) {
        var products = (order.products || []).map(function (p) {
            return `<div class="flex justify-between items-center py-2 text-sm text-slate-600"><span>${p.title} × ${p.quantity}</span><span class="font-bold text-slate-800">PKR ${Number(p.price * p.quantity).toLocaleString()}</span></div>`;
        }).join("");
        itemsEl.innerHTML = products || '<p class="text-sm text-slate-500">No items listed.</p>';
    }
    if (totalEl) totalEl.textContent = "PKR " + Number(order.totalAmount || 0).toLocaleString();

    modal.classList.remove("hidden");
};
