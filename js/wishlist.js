// ============================================================
//  TechVerse Market — Wishlist Page
//  js/wishlist.js  (ES Module — <script type="module">)
// ============================================================

import {
    onAuthChange,
    getWishlist,
    removeFromWishlist,
    addToCart
} from "../firebase/firebase.js";

var currentUserId = null;

document.addEventListener("DOMContentLoaded", function () {
    onAuthChange(async function (firebaseUser) {
        if (!firebaseUser) {
            renderEmpty("Please login to view your wishlist.");
            return;
        }
        currentUserId = firebaseUser.uid;
        var items = await getWishlist(firebaseUser.uid);
        renderWishlist(items);
    });
});

function renderWishlist(items) {
    var grid     = document.getElementById("wishlist-grid");
    var emptyMsg = document.getElementById("wishlist-empty-msg");
    if (!grid) return;

    if (!items || items.length === 0) {
        if (emptyMsg) emptyMsg.classList.remove("hidden");
        grid.innerHTML = "";
        return;
    }
    if (emptyMsg) emptyMsg.classList.add("hidden");

    grid.innerHTML = items.map(function (item) {
        return `
            <div style="border-radius:12px;overflow:hidden;background:white;box-shadow:0 2px 12px rgba(0,0,0,0.07);display:flex;flex-direction:column;">
                <img src="${item.image || 'https://placehold.co/280x200/e2e8f0/94a3b8?text=No+Image'}" alt="${item.title}" style="width:100%;height:180px;object-fit:cover;">
                <div style="padding:14px;flex:1;display:flex;flex-direction:column;gap:10px;">
                    <h3 style="font-size:14px;font-weight:700;color:#1e293b;margin:0;">${item.title}</h3>
                    <p style="font-size:15px;font-weight:800;color:#1e1b4b;margin:0;">Rs. ${Number(item.price).toLocaleString()}</p>
                    <div style="display:flex;gap:8px;margin-top:auto;">
                        <button onclick="moveToCart('${item.productid}')" style="flex:1;padding:9px;background:linear-gradient(135deg,#1e1b4b,#312e81);color:white;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;">
                            <i class="fas fa-cart-plus mr-1"></i> Add to Cart
                        </button>
                        <button onclick="removeWishlistItem('${item.productid}')" style="padding:9px 12px;border:1.5px solid #fecaca;border-radius:6px;background:white;cursor:pointer;color:#dc2626;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>`;
    }).join("");
}

function renderEmpty(msg) {
    var grid = document.getElementById("wishlist-grid");
    if (grid) grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:80px 20px;"><i class="far fa-heart" style="font-size:50px;color:#cbd5e1;display:block;margin-bottom:16px;"></i><p style="color:#94a3b8;">${msg}</p></div>`;
}

window.removeWishlistItem = async function (productId) {
    if (!currentUserId) return;
    try {
        await removeFromWishlist(currentUserId, productId);
        var items = await getWishlist(currentUserId);
        renderWishlist(items);
    } catch (err) {
        Swal.fire({ icon: "error", title: "Error", text: err.message, confirmButtonColor: "#1e1b4b" });
    }
};

window.moveToCart = async function (productId) {
    if (!currentUserId) return;
    try {
        var items = await getWishlist(currentUserId);
        var item  = items.find(function (i) { return i.productid === productId; });
        if (item) {
            await addToCart(currentUserId, { ...item, quantity: 1 });
            await removeFromWishlist(currentUserId, productId);
            var updated = await getWishlist(currentUserId);
            renderWishlist(updated);
            Swal.fire({ icon: "success", title: "Moved to Cart!", showConfirmButton: false, timer: 1200 });
        }
    } catch (err) {
        Swal.fire({ icon: "error", title: "Error", text: err.message, confirmButtonColor: "#1e1b4b" });
    }
};
