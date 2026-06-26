// ============================================================
//  TechVerse Market — Cart Page
//  js/cart.js  (ES Module — <script type="module">)
// ============================================================

import {
    onAuthChange,
    getCart,
    removeFromCart,
    updateCartItemQty,
    clearCart
} from "../firebase/firebase.js";

var currentUserId = null;
var cartItems     = [];

document.addEventListener("DOMContentLoaded", function () {
    onAuthChange(async function (firebaseUser) {
        if (!firebaseUser) {
            renderEmptyCart("Please login to view your cart.");
            return;
        }
        currentUserId = firebaseUser.uid;
        cartItems = await getCart(firebaseUser.uid);
        renderCart(cartItems);
    });
});

// ── Render cart ──────────────────────────────────────────────────────────
function renderCart(items) {
    var container = document.getElementById("cart-items-tbody") || document.getElementById("cart-items-container");
    var summary   = document.getElementById("cart-summary");
    var emptyState = document.getElementById("cart-empty-state") || document.getElementById("cart-empty-msg");
    var wrapper   = document.getElementById("cart-content-wrapper");
    var subtotalEl = document.getElementById("summary-subtotal") || document.getElementById("cart-total");
    var shippingEl = document.getElementById("summary-shipping") || document.getElementById("cart-shipping");
    var taxEl = document.getElementById("summary-tax");
    var grandEl = document.getElementById("summary-total") || document.getElementById("cart-grand-total");

    if (!container && !emptyState) return;

    if (!items || items.length === 0) {
        if (emptyState) {
            emptyState.classList.remove("hidden");
            emptyState.innerHTML = `<div style="text-align:center;padding:60px 20px;"><i class="fas fa-shopping-cart" style="font-size:50px;color:#cbd5e1;margin-bottom:16px;display:block;"></i><p style="color:#94a3b8;font-size:16px;">Your cart is empty.</p></div>`;
        }
        if (wrapper) wrapper.classList.add("hidden");
        if (summary) summary.classList.add("hidden");
        if (container) container.innerHTML = "";
        return;
    }

    if (emptyState) emptyState.classList.add("hidden");
    if (wrapper) wrapper.classList.remove("hidden");
    if (summary) summary.classList.remove("hidden");

    var subtotal = items.reduce(function (sum, item) { return sum + item.price * item.quantity; }, 0);
    var shipping = subtotal >= 50000 ? 0 : 500;
    var tax = subtotal * 0.05;
    var grandTotal = subtotal + shipping + tax;

    if (container) {
        if (container.tagName === "TBODY") {
            container.innerHTML = items.map(function (item) {
                return `
                    <tr class="align-middle" data-productid="${item.productid}">
                        <td class="py-4">
                            <div class="flex items-center gap-3">
                                <img src="${item.image || 'https://placehold.co/80x80/e2e8f0/94a3b8?text=IMG'}" alt="${item.title}" style="width:64px;height:64px;object-fit:cover;border-radius:10px;">
                                <div>
                                    <p class="font-bold text-slate-800 text-sm">${item.title}</p>
                                    <p class="text-xs text-slate-500 mt-1">${item.category || "Product"}</p>
                                </div>
                            </div>
                        </td>
                        <td class="py-4 text-center">
                            <div class="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-2 py-1">
                                <button onclick="changeQty('${item.productid}', ${item.quantity - 1})" class="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold">−</button>
                                <span class="min-w-6 text-center font-bold text-slate-800">${item.quantity}</span>
                                <button onclick="changeQty('${item.productid}', ${item.quantity + 1})" class="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold">+</button>
                            </div>
                        </td>
                        <td class="py-4 text-right font-bold text-slate-700">PKR ${Number(item.price).toLocaleString()}</td>
                        <td class="py-4 text-right font-extrabold text-slate-900">PKR ${Number(item.price * item.quantity).toLocaleString()}</td>
                        <td class="py-4 text-center">
                            <button onclick="removeItem('${item.productid}')" class="text-red-500 hover:text-red-600 font-semibold text-sm"><i class="fas fa-trash mr-1"></i>Remove</button>
                        </td>
                    </tr>`;
            }).join("");
        } else {
            container.innerHTML = items.map(function (item) {
                return `
                    <div class="cart-item surface-panel" style="display:flex;align-items:center;gap:16px;padding:16px;border-radius:12px;" data-productid="${item.productid}">
                        <img src="${item.image || 'https://placehold.co/80x80/e2e8f0/94a3b8?text=IMG'}" alt="${item.title}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;flex-shrink:0;">
                        <div style="flex:1;">
                            <h3 style="font-size:14px;font-weight:700;color:#1e293b;margin:0 0 4px;">${item.title}</h3>
                            <p style="font-size:13px;color:#1e1b4b;font-weight:700;">Rs. ${Number(item.price).toLocaleString()}</p>
                        </div>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <button onclick="changeQty('${item.productid}', ${item.quantity - 1})" style="width:30px;height:30px;border:1.5px solid #e2e8f0;border-radius:6px;background:white;cursor:pointer;font-weight:700;font-size:16px;display:flex;align-items:center;justify-content:center;">−</button>
                            <span style="min-width:28px;text-align:center;font-weight:700;">${item.quantity}</span>
                            <button onclick="changeQty('${item.productid}', ${item.quantity + 1})" style="width:30px;height:30px;border:1.5px solid #e2e8f0;border-radius:6px;background:white;cursor:pointer;font-weight:700;font-size:16px;display:flex;align-items:center;justify-content:center;">+</button>
                        </div>
                        <p style="min-width:100px;text-align:right;font-weight:800;color:#1e1b4b;">Rs. ${Number(item.price * item.quantity).toLocaleString()}</p>
                        <button onclick="removeItem('${item.productid}')" style="padding:6px 10px;color:#dc2626;background:transparent;border:1.5px solid #fecaca;border-radius:6px;cursor:pointer;font-size:13px;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>`;
            }).join("");
        }
    }

    if (subtotalEl) subtotalEl.textContent = "PKR " + subtotal.toLocaleString();
    if (shippingEl) shippingEl.textContent = shipping === 0 ? "Free" : "PKR " + shipping.toLocaleString();
    if (taxEl) taxEl.textContent = "PKR " + tax.toLocaleString();
    if (grandEl) grandEl.textContent = "PKR " + grandTotal.toLocaleString();
}

function renderEmptyCart(msg) {
    var container = document.getElementById("cart-items-tbody") || document.getElementById("cart-items-container");
    var emptyState = document.getElementById("cart-empty-state") || document.getElementById("cart-empty-msg");
    var wrapper = document.getElementById("cart-content-wrapper");
    if (emptyState) {
        emptyState.classList.remove("hidden");
        emptyState.innerHTML = `<div style="text-align:center;padding:60px 20px;"><i class="fas fa-shopping-cart" style="font-size:50px;color:#cbd5e1;margin-bottom:16px;display:block;"></i><p style="color:#94a3b8;font-size:16px;">${msg || "Your cart is empty."}</p></div>`;
    }
    if (wrapper) wrapper.classList.add("hidden");
    if (container) container.innerHTML = "";
}

// ── Global helpers (called from inline onclick) ──────────────────────────
window.changeQty = async function (productId, newQty) {
    if (!currentUserId) return;
    if (newQty < 1) {
        return window.removeItem(productId);
    }
    try {
        await updateCartItemQty(currentUserId, productId, newQty);
        cartItems = await getCart(currentUserId);
        renderCart(cartItems);
    } catch (err) {
        Swal.fire({ icon: "error", title: "Error", text: err.message, confirmButtonColor: "#1e1b4b" });
    }
};

window.removeItem = async function (productId) {
    if (!currentUserId) return;
    try {
        await removeFromCart(currentUserId, productId);
        cartItems = await getCart(currentUserId);
        renderCart(cartItems);
        Swal.fire({ icon: "success", title: "Removed", showConfirmButton: false, timer: 900 });
    } catch (err) {
        Swal.fire({ icon: "error", title: "Error", text: err.message, confirmButtonColor: "#1e1b4b" });
    }
};

// Clear cart button
document.addEventListener("DOMContentLoaded", function () {
    var clearBtn = document.getElementById("clear-cart-btn");
    if (clearBtn) {
        clearBtn.addEventListener("click", async function () {
            if (!currentUserId) return;
            var result = await Swal.fire({ title: "Clear cart?", text: "Remove all items from your cart?", icon: "warning", showCancelButton: true, confirmButtonColor: "#dc2626", confirmButtonText: "Yes, clear it" });
            if (result.isConfirmed) {
                await clearCart(currentUserId);
                cartItems = [];
                renderCart([]);
            }
        });
    }
});
