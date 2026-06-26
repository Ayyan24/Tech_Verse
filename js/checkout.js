// ============================================================
//  TechVerse Market — Checkout Page
//  js/checkout.js  (ES Module — <script type="module">)
// ============================================================

import {
    onAuthChange,
    getCart,
    createOrder,
    clearCart,
    decrementStock,
    getUserProfile
} from "../firebase/firebase.js";

var currentUser   = null;
var cartItems     = [];

document.addEventListener("DOMContentLoaded", function () {
    onAuthChange(async function (firebaseUser) {
        if (!firebaseUser) {
            Swal.fire({ icon: "warning", title: "Login Required", text: "Please sign in to proceed to checkout.", confirmButtonColor: "#1e1b4b" })
              .then(function () { window.location.href = "../login.html"; });
            return;
        }
        currentUser = firebaseUser;

        // Pre-fill shipping info from profile
        var profile = await getUserProfile(firebaseUser.uid);
        if (profile) prefillForm(profile);

        cartItems = await getCart(firebaseUser.uid);
        if (cartItems.length === 0) {
            Swal.fire({ icon: "info", title: "Cart Empty", text: "Add some items before checking out.", confirmButtonColor: "#1e1b4b" })
              .then(function () { window.location.href = "../buyer/cart.html"; });
            return;
        }

        renderOrderSummary(cartItems);
        setupCheckoutForm();
    });
});

function prefillForm(profile) {
    var nameEl    = document.getElementById("checkout-name");
    var phoneEl   = document.getElementById("checkout-phone");
    var cityEl    = document.getElementById("checkout-city");
    var addressEl = document.getElementById("checkout-address");

    if (nameEl    && profile.name)    nameEl.value    = profile.name;
    if (phoneEl   && profile.phone)   phoneEl.value   = profile.phone;
    if (cityEl    && profile.city)    cityEl.value    = profile.city;
    if (addressEl && profile.address) addressEl.value = profile.address;
}

function renderOrderSummary(items) {
    var listEl  = document.getElementById("checkout-items-list");
    var totalEl = document.getElementById("checkout-total");
    if (!listEl) return;

    var total = items.reduce(function (sum, i) { return sum + i.price * i.quantity; }, 0);
    var shipping = total >= 50000 ? 0 : 500;

    listEl.innerHTML = items.map(function (i) {
        return `<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #f1f5f9;">
            <img src="${i.image || 'https://placehold.co/50x50/e2e8f0/94a3b8?text=IMG'}" alt="${i.title}" style="width:50px;height:50px;object-fit:cover;border-radius:6px;">
            <div style="flex:1;"><p style="font-size:13px;font-weight:600;color:#1e293b;margin:0;">${i.title}</p><p style="font-size:12px;color:#6b7280;margin:0;">Qty: ${i.quantity}</p></div>
            <p style="font-size:13px;font-weight:700;color:#1e1b4b;">Rs. ${Number(i.price * i.quantity).toLocaleString()}</p>
        </div>`;
    }).join("");

    var grandTotal = total + shipping;
    if (totalEl) totalEl.innerHTML = `
        <div style="display:flex;justify-content:space-between;font-size:13px;color:#6b7280;margin-bottom:6px;"><span>Subtotal</span><span>Rs. ${total.toLocaleString()}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:13px;color:#6b7280;margin-bottom:10px;"><span>Shipping</span><span>${shipping === 0 ? "Free" : "Rs. " + shipping.toLocaleString()}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:800;color:#1e1b4b;"><span>Total</span><span>Rs. ${grandTotal.toLocaleString()}</span></div>`;
}

function setupCheckoutForm() {
    var form = document.getElementById("checkout-form");
    if (!form) return;

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        var shippingInfo = {
            name:    document.getElementById("checkout-name")?.value.trim()    || "",
            phone:   document.getElementById("checkout-phone")?.value.trim()   || "",
            city:    document.getElementById("checkout-city")?.value.trim()    || "",
            address: document.getElementById("checkout-address")?.value.trim() || ""
        };

        if (!shippingInfo.name || !shippingInfo.phone || !shippingInfo.city || !shippingInfo.address) {
            Swal.fire({ icon: "error", title: "Incomplete Details", text: "Please fill in all shipping fields.", confirmButtonColor: "#1e1b4b" });
            return;
        }

        var btn = form.querySelector("button[type='submit']");
        btn.disabled    = true;
        btn.textContent = "Placing Order…";

        try {
            var total     = cartItems.reduce(function (s, i) { return s + i.price * i.quantity; }, 0);
            var shipping  = total >= 50000 ? 0 : 500;
            var orderId   = await createOrder(currentUser.uid, cartItems, total + shipping, shippingInfo);

            // Decrement stock for each product
            await Promise.all(cartItems.map(function (item) {
                return decrementStock(item.productid, item.quantity);
            }));

            await clearCart(currentUser.uid);

            Swal.fire({
                icon: "success",
                title: "Order Placed!",
                html: `Your order <strong>#${orderId.slice(0, 8).toUpperCase()}</strong> has been placed successfully.`,
                confirmButtonColor: "#1e1b4b",
                confirmButtonText: "View My Orders"
            }).then(function () {
                window.location.href = "../buyer/orders.html";
            });
        } catch (err) {
            btn.disabled    = false;
            btn.textContent = "Place Order";
            Swal.fire({ icon: "error", title: "Order Failed", text: err.message, confirmButtonColor: "#1e1b4b" });
        }
    });
}
