// ============================================================
//  TechVerse Market — Product Details Page
//  js/product-details.js  (ES Module — <script type="module">)
// ============================================================

import {
    getProduct,
    getProductReviews,
    addReview,
    onAuthChange,
    getCurrentAuthUser
} from "../firebase/firebase.js";

var currentProduct = null;
var currentUser    = null;

document.addEventListener("DOMContentLoaded", async function () {
    // Observe auth
    onAuthChange(function (user) { currentUser = user; });

    var productId = new URLSearchParams(window.location.search).get("id");
    if (!productId) {
        showError("Product not found.");
        return;
    }

    try {
        currentProduct = await getProduct(productId);
        if (!currentProduct) { showError("Product not found."); return; }

        renderProductDetails(currentProduct);
        var reviews = await getProductReviews(productId);
        renderReviews(reviews);
        setupReviewForm(productId);
        setupQtyControls();
    } catch (err) {
        showError("Failed to load product: " + err.message);
        console.error("product-details:", err);
    }
});

// ── Render product details ────────────────────────────────────────────────
function renderProductDetails(p) {
    var titleEl    = document.getElementById("detail-title") || document.getElementById("product-title");
    var priceEl    = document.getElementById("detail-price") || document.getElementById("product-price");
    var oldPriceEl = document.getElementById("detail-old-price") || document.getElementById("product-old-price");
    var descEl     = document.getElementById("detail-desc") || document.getElementById("product-description");
    var stockEl    = document.getElementById("detail-stock-badge") || document.getElementById("product-stock");
    var brandEl    = document.getElementById("detail-brand") || document.getElementById("product-brand");
    var imgEl      = document.getElementById("detail-main-img") || document.getElementById("product-main-image");
    var ratingEl   = document.getElementById("detail-stars") || document.getElementById("product-rating-stars");
    var ratingTextEl = document.getElementById("detail-rating-text");

    document.title = p.title + " — TechVerse Market";

    if (titleEl)    titleEl.textContent    = p.title;
    if (priceEl)    priceEl.textContent    = "PKR " + Number(p.price).toLocaleString();
    if (oldPriceEl && p.originalPrice) oldPriceEl.textContent = "PKR " + Number(p.originalPrice).toLocaleString();
    if (descEl)     descEl.textContent     = p.description || "No description available.";
    if (brandEl)    brandEl.textContent    = p.brand || "";
    if (stockEl) {
        stockEl.textContent = p.stock > 0 ? "In Stock (" + p.stock + " available)" : "Out of Stock";
        stockEl.style.color = p.stock > 0 ? "#16a34a" : "#dc2626";
    }
    if (imgEl && p.image) imgEl.src = p.image;
    if (ratingEl) ratingEl.innerHTML = renderStars(p.rating || 0);
    if (ratingTextEl) ratingTextEl.textContent = (p.rating || 0).toFixed(1) + " • " + (p.reviews || 0) + " reviews";
}

// ── Render reviews ────────────────────────────────────────────────────────
function renderReviews(reviews) {
    var container = document.getElementById("reviews-list") || document.getElementById("reviews-container");
    if (!container) return;

    if (!reviews || reviews.length === 0) {
        container.innerHTML = `<p style="color:#94a3b8;font-size:14px;">No reviews yet. Be the first to review!</p>`;
        return;
    }

    container.innerHTML = reviews.map(function (r) {
        var date = r.createdAt && r.createdAt.toDate
            ? r.createdAt.toDate().toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })
            : "";

        return `
            <div style="border-bottom:1px solid #f1f5f9;padding:16px 0;">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
                    <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#1e1b4b,#312e81);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:14px;">${(r.username || "U")[0].toUpperCase()}</div>
                    <div>
                        <p style="font-size:13px;font-weight:700;color:#1e293b;margin:0;">${r.username || "Anonymous"}</p>
                        <p style="font-size:11px;color:#94a3b8;margin:0;">${date}</p>
                    </div>
                    <div style="margin-left:auto;font-size:12px;color:#f59e0b;">${renderStars(r.rating)}</div>
                </div>
                <p style="font-size:13px;color:#374151;margin:0;line-height:1.6;">${r.comment}</p>
            </div>`;
    }).join("");
}

// ── Review form ────────────────────────────────────────────────────────────
function setupReviewForm(productId) {
    var form = document.getElementById("review-form");
    if (!form) return;

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        var user = getCurrentAuthUser();
        if (!user) {
            Swal.fire({ icon: "warning", title: "Login Required", text: "Please sign in to leave a review.", confirmButtonColor: "#1e1b4b" });
            return;
        }

        var rating  = parseInt(document.getElementById("review-rating")?.value || "5", 10);
        var comment = document.getElementById("review-comment")?.value.trim();

        if (!comment) {
            Swal.fire({ icon: "error", title: "Empty Review", text: "Please write something before submitting.", confirmButtonColor: "#1e1b4b" });
            return;
        }

        try {
            var { getUserProfile } = await import("../firebase/firebase.js");
            var profile = await getUserProfile(user.uid);
            await addReview(productId, user.uid, profile?.name || user.email, rating, comment);

            Swal.fire({ icon: "success", title: "Review Submitted!", showConfirmButton: false, timer: 1400 });

            form.reset();

            var reviews = await getProductReviews(productId);
            renderReviews(reviews);
        } catch (err) {
            Swal.fire({ icon: "error", title: "Error", text: err.message, confirmButtonColor: "#1e1b4b" });
        }
    });
}

// ── Quantity controls ─────────────────────────────────────────────────────
function setupQtyControls() {
    var minusBtn = document.getElementById("qty-minus");
    var plusBtn  = document.getElementById("qty-plus");
    var qtyEl    = document.getElementById("qty-val") || document.getElementById("qty-input");
    if (!minusBtn || !plusBtn || !qtyEl) return;

    var qtyValue = 1;
    function updateQtyDisplay() {
        if (qtyEl.tagName === "INPUT") {
            qtyEl.value = qtyValue;
        } else {
            qtyEl.textContent = qtyValue;
        }
    }

    minusBtn.addEventListener("click", function () {
        if (qtyValue > 1) qtyValue -= 1;
        updateQtyDisplay();
    });
    plusBtn.addEventListener("click", function () {
        if (!currentProduct || qtyValue < currentProduct.stock) qtyValue += 1;
        updateQtyDisplay();
    });

    // Add to cart button on details page
    var addBtn = document.getElementById("detail-add-cart-btn") || document.getElementById("add-to-cart-btn");
    if (addBtn) {
        addBtn.addEventListener("click", function () {
            if (!currentProduct) return;
            CartActions.addToCart(currentProduct.id, qtyValue, {
                title:    currentProduct.title,
                price:    currentProduct.price,
                image:    currentProduct.image || "",
                vendorid: currentProduct.vendorid || ""
            });
        });
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────
function renderStars(rating) {
    var stars = "";
    var full  = Math.floor(rating || 0);
    for (var i = 1; i <= 5; i++) {
        stars += i <= full ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
    }
    return stars;
}

function showError(msg) {
    var main = document.querySelector("main");
    if (main) main.innerHTML = `<div style="text-align:center;padding:100px 20px;"><i class="fas fa-exclamation-circle" style="font-size:50px;color:#f97316;display:block;margin-bottom:16px;"></i><p style="font-size:18px;font-weight:700;color:#1e293b;">${msg}</p><a href="../buyer/products.html" style="margin-top:16px;display:inline-block;padding:10px 24px;background:#1e1b4b;color:white;border-radius:6px;text-decoration:none;font-weight:600;">Back to Products</a></div>`;
}
