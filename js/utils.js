// ============================================================
//  TechVerse Market — Shared Helper Functions
// ============================================================

(function () {
    function formatPrice(amount) {
        return "Rs. " + Number(amount).toLocaleString();
    }
    function renderStars(rating) {
        var stars = "";
        var full  = Math.floor(rating);
        for (var i = 1; i <= 5; i++) {
            stars += i <= full ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
        }
        return stars;
    }
    window.TechVerseUtils = {
        formatPrice: formatPrice,
        renderStars: renderStars
    };
})();
