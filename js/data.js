// TechVerse Market — Data storage (localStorage)

(function () {
    var DB_VERSION = "4";
    var IMG = "https://static.webx.pk/files/87161/Images";

    var DEFAULT_CATEGORIES = [
        { id: "laptops", name: "Laptops", icon: "fa-laptop", image: IMG + "/laptops-87161-101125021226_w_240_h_240.avif" },
        { id: "monitors", name: "Monitors", icon: "fa-desktop", image: IMG + "/Copy-of-Monitors-87161-180426080712_w_1090_h_600.avif" },
        { id: "components", name: "Components", icon: "fa-microchip", image: IMG + "/processors-87161-101125030606_w_250_h_250.avif" },
        { id: "gaming", name: "Gaming", icon: "fa-gamepad", image: IMG + "/consoles-87161-101125031020_w_300_h_300.avif" },
        { id: "accessories", name: "Accessories", icon: "fa-headphones", image: IMG + "/headphones-87161-101125021940_w_300_h_300.avif" },
        { id: "storage", name: "Storage", icon: "fa-hdd", image: IMG + "/cooling-solutions-87161-101125020656_w_300_h_300.avif" },
        { id: "smartphones", name: "Tablets & iPads", icon: "fa-tablet-alt", image: IMG + "/tablets-87161-101125030315_w_250_h_250.avif" },
        { id: "printers", name: "Printers", icon: "fa-print", image: IMG + "/keyboards-87161-101125031453_w_300_h_300.avif" }
    ];

    var DEFAULT_PRODUCTS = [
        {
            id: "p_mac_mini",
            name: "Apple Mac mini | Apple M4 10-Core Chip, 16GB Unified RAM, 256GB SSD, 10-Core GPU | MU9D3",
            brand: "Apple",
            category: "components",
            price: 243000,
            discountPrice: null,
            rating: 4.9,
            reviewsCount: 12,
            stock: 5,
            vendorId: "system",
            status: "approved",
            featured: true,
            flashSale: false,
            newArrival: true,
            bestSeller: true,
            image: IMG + "/Thumbnails-Large/1-czone.com.pk-1-1540-17286-111124105416-87161-2459642-011025032708.webp",
            description: "The incredibly compact Apple Mac mini with M4 chip delivers outstanding performance for work and creativity.",
            specifications: { "Processor": "Apple M4 10-Core", "RAM": "16GB Unified", "Storage": "256GB SSD", "GPU": "10-Core GPU" }
        },
        {
            id: "p_legion_monitor",
            name: "Lenovo Legion R34w-30 Gaming Monitor, 34-inch VA Curved, 3440 x 1440 WQHD, 180Hz, 0.5ms MPRT, AMD FreeSync Premium, HDR10, 1500R, 2x3W Speakers, Black",
            brand: "Lenovo",
            category: "monitors",
            price: 115000,
            discountPrice: null,
            rating: 4.7,
            reviewsCount: 8,
            stock: 6,
            vendorId: "system",
            status: "approved",
            featured: true,
            flashSale: true,
            newArrival: false,
            bestSeller: true,
            image: IMG + "/Thumbnails-Large/czone.com.pk-30-1540-19801-271125120949-87161-2509044-231225054716.webp",
            description: "Ultra-wide curved gaming monitor with 180Hz refresh rate and HDR10 support.",
            specifications: { "Size": "34-inch Curved", "Resolution": "3440 x 1440 WQHD", "Refresh Rate": "180Hz", "Response": "0.5ms MPRT" }
        },
        {
            id: "p_sony_xm6",
            name: "Sony WH-1000XM6 Wireless Headphones | Noise Canceling | HD NC Processor QN3 | 12 Microphones | 30H Battery | Midnight Blue (Official Warranty)",
            brand: "Sony",
            category: "accessories",
            price: 120000,
            discountPrice: 109890,
            rating: 4.9,
            reviewsCount: 15,
            stock: 10,
            vendorId: "system",
            status: "approved",
            featured: true,
            flashSale: true,
            newArrival: true,
            bestSeller: true,
            image: IMG + "/Thumbnails-Large/czone.com.pk-52-1540-19453-311025104033-87161-2509299-231225070409.webp",
            description: "Industry-leading noise canceling with 30-hour battery life and premium comfort.",
            specifications: { "Battery": "30 Hours", "Noise Canceling": "HD NC Processor QN3", "Microphones": "12", "Warranty": "Official" }
        },
        {
            id: "p_logitech_brio",
            name: "Logitech BRIO 4K Ultra HD Webcam, 4K 30fps, 1080p 60fps, 13MP Sensor, 5x Digital Zoom, Autofocus, RightLight 3, Windows Hello, Privacy Shutter, 960-001723",
            brand: "Logitech",
            category: "accessories",
            price: 46500,
            discountPrice: null,
            rating: 4.6,
            reviewsCount: 22,
            stock: 14,
            vendorId: "system",
            status: "approved",
            featured: true,
            flashSale: false,
            newArrival: false,
            bestSeller: true,
            image: IMG + "/Thumbnails-Large/czone-20260612064116-87161-0-120626064139449.webp",
            description: "Premium 4K webcam with HDR and Windows Hello support.",
            specifications: { "Resolution": "4K 30fps / 1080p 60fps", "Sensor": "13MP", "Zoom": "5x Digital", "Features": "Windows Hello, Privacy Shutter" }
        },
        {
            id: "p_hp_omen",
            name: "HP Omen 16-AN0075CL Gaming Laptop, Intel Core Ultra 9 285H, GeForce RTX 5070 8GB, 32GB DDR5, 1TB SSD, 16.0\" WUXGA 144Hz, Windows 11 Home",
            brand: "HP",
            category: "laptops",
            price: 550000,
            discountPrice: 482900,
            rating: 4.8,
            reviewsCount: 6,
            stock: 3,
            vendorId: "system",
            status: "approved",
            featured: true,
            flashSale: true,
            newArrival: true,
            bestSeller: true,
            image: IMG + "/Thumbnails-Large/czone-20260418083444-87161-0-180426083452254.webp",
            description: "Ultimate gaming laptop with Intel Core Ultra 9 and RTX 5070 graphics.",
            specifications: { "Processor": "Intel Core Ultra 9 285H", "RAM": "32GB DDR5", "Storage": "1TB SSD", "Graphics": "RTX 5070 8GB", "Display": "16\" WUXGA 144Hz" }
        },
        {
            id: "p_rx9070",
            name: "Gigabyte Radeon RX 9070 GAMING OC 16G Video Graphics Card, 16GB GDDR6 256bit, Boost Up To 2700MHz, PCI-E 5.0, DisplayPort 2.1a x2, HDMI 2.1b x2, GV-R9070GAMING OC-16GD",
            brand: "Gigabyte",
            category: "components",
            price: 215000,
            discountPrice: null,
            rating: 4.7,
            reviewsCount: 4,
            stock: 2,
            vendorId: "system",
            status: "approved",
            featured: true,
            flashSale: false,
            newArrival: true,
            bestSeller: false,
            image: IMG + "/Thumbnails-Large/czone-20260428120412-87161-0-280426120429090.webp",
            description: "Next-gen gaming graphics card with 16GB GDDR6 and PCI-E 5.0.",
            specifications: { "Memory": "16GB GDDR6", "Boost Clock": "Up to 2700MHz", "Interface": "PCI-E 5.0", "Outputs": "DP 2.1a x2, HDMI 2.1b x2" }
        },
        {
            id: "p_jbl_charge6",
            name: "JBL Charge 6 Bluetooth Speaker Sand JBLCHARGE6SAND, AI Sound Boost, 30W Woofer, 15W Tweeter, Up To 28 Hours Playtime, Auracast Multi-Speaker",
            brand: "JBL",
            category: "accessories",
            price: 50000,
            discountPrice: 48000,
            rating: 4.5,
            reviewsCount: 18,
            stock: 8,
            vendorId: "system",
            status: "approved",
            featured: false,
            flashSale: true,
            newArrival: false,
            bestSeller: true,
            image: IMG + "/Thumbnails-Large/czone.com.pk-42-1540-19547-131125103259-87161-2508974-231225052605.webp",
            description: "Portable Bluetooth speaker with AI Sound Boost and 28-hour battery.",
            specifications: { "Power": "30W Woofer + 15W Tweeter", "Battery": "Up to 28 Hours", "Feature": "Auracast Multi-Speaker" }
        },
        {
            id: "p_thermaltake",
            name: "Thermaltake Tower 600 Mid Tower ATX Case, 3 Tempered Glass Panels, Hidden-Connector Motherboard Support, Rotational PCIe Slots, Black, CA-1Z1-00M1WN-00",
            brand: "Thermaltake",
            category: "components",
            price: 39990,
            discountPrice: null,
            rating: 4.4,
            reviewsCount: 7,
            stock: 5,
            vendorId: "system",
            status: "approved",
            featured: false,
            flashSale: false,
            newArrival: false,
            bestSeller: false,
            image: IMG + "/Thumbnails-Large/czone.com.pk-43-1540-19741-241125105754-87161-2509224-231225064212.webp",
            description: "Premium mid-tower case with triple tempered glass and hidden-connector support.",
            specifications: { "Form Factor": "Mid Tower ATX", "Panels": "3 Tempered Glass", "Feature": "Rotational PCIe Slots" }
        },
        {
            id: "p_kingston_ssd",
            name: "Kingston XS2000 2TB External SSD, USB 3.2 Gen 2x2 USB-C, Up To 2000MB/s Read, 3D NAND, SXS2000/2000G",
            brand: "Kingston",
            category: "storage",
            price: 65990,
            discountPrice: null,
            rating: 4.8,
            reviewsCount: 11,
            stock: 9,
            vendorId: "system",
            status: "approved",
            featured: false,
            flashSale: false,
            newArrival: true,
            bestSeller: true,
            image: IMG + "/Thumbnails-Large/czone-20260615094634-87161-0-150626094649502.webp",
            description: "Ultra-fast portable SSD with up to 2000MB/s read speeds.",
            specifications: { "Capacity": "2TB", "Interface": "USB 3.2 Gen 2x2", "Read Speed": "Up to 2000MB/s" }
        },
        {
            id: "p_asus_monitor",
            name: "Asus TUF Gaming VG27AQ3A 27 Inch QHD 2560x1440 180Hz Fast IPS 1ms HDR 130% sRGB ELMB Sync FreeSync Premium G-Sync Compatible, Speakers, HDMI and DisplayPort",
            brand: "ASUS",
            category: "monitors",
            price: 65500,
            discountPrice: null,
            rating: 4.6,
            reviewsCount: 9,
            stock: 0,
            vendorId: "system",
            status: "approved",
            featured: false,
            flashSale: false,
            newArrival: true,
            bestSeller: false,
            image: IMG + "/Thumbnails-Large/czone.com.pk-33-1540-19801-271125120949-87161-2509044-231225054721.webp",
            description: "27-inch QHD gaming monitor with 180Hz Fast IPS panel.",
            specifications: { "Size": "27-inch", "Resolution": "2560x1440 QHD", "Refresh Rate": "180Hz", "Panel": "Fast IPS 1ms" }
        },
        {
            id: "p_aula_keyboard",
            name: "AULA F75 Gaming Wireless Mechanical Keyboard, 2.4G Bluetooth and USB Wired, RGB Lighting, REAPER Linear Switches, White-Green",
            brand: "AULA",
            category: "accessories",
            price: 12500,
            discountPrice: null,
            rating: 4.3,
            reviewsCount: 14,
            stock: 20,
            vendorId: "system",
            status: "approved",
            featured: false,
            flashSale: false,
            newArrival: true,
            bestSeller: false,
            image: IMG + "/Thumbnails-Large/czone-20260612112036-87161-0-120626112044044.webp",
            description: "Tri-mode wireless mechanical keyboard with RGB and REAPER linear switches.",
            specifications: { "Connectivity": "2.4G / Bluetooth / USB", "Switches": "REAPER Linear", "Lighting": "RGB" }
        },
        {
            id: "p_cooler_master",
            name: "Cooler Master MasterFrame 500 Mesh ARGB ATX Mid-Tower PC Case, Premium Aluminum Chassis, Dual 200mm ARGB Intake Fans, Modular Open-Frame, 360mm Radiator Support, USB-C, Black, MF500M-KHNN-S01",
            brand: "Cooler Master",
            category: "components",
            price: 43990,
            discountPrice: null,
            rating: 4.5,
            reviewsCount: 5,
            stock: 4,
            vendorId: "system",
            status: "approved",
            featured: false,
            flashSale: false,
            newArrival: false,
            bestSeller: false,
            image: IMG + "/Thumbnails-Large/czone-20260113134435-87161-0-130126014436364.webp",
            description: "Premium open-frame ATX case with dual 200mm ARGB fans.",
            specifications: { "Form Factor": "ATX Mid-Tower", "Fans": "Dual 200mm ARGB", "Radiator": "360mm Support" }
        },
        {
            id: "p_pending_1",
            name: "MSI B850 Gaming Plus WIFI6E Motherboard, ATX, AM5, Supports AMD Ryzen 9000/8000/7000, DDR5 8200+MT/s OC, PCIe 4.0 x16, M.2 Gen5, Wi-Fi 6E, 2.5G LAN",
            brand: "MSI",
            category: "components",
            price: 64990,
            discountPrice: null,
            rating: 0,
            reviewsCount: 0,
            stock: 2,
            vendorId: "system",
            status: "pending",
            featured: false,
            flashSale: false,
            newArrival: false,
            bestSeller: false,
            image: IMG + "/Thumbnails-Large/czone-20260602094833-87161-0-020626094850381.webp",
            description: "High-performance AM5 motherboard with Wi-Fi 6E and DDR5 OC support.",
            specifications: { "Socket": "AM5", "Chipset": "B850", "RAM": "DDR5 8200+MT/s", "Network": "Wi-Fi 6E, 2.5G LAN" }
        }
    ];

    function resetIfOutdated() {
        if (localStorage.getItem("tv_db_version") !== DB_VERSION) {
            Object.keys(localStorage).forEach(function (key) {
                if (key.indexOf("tv_") === 0) localStorage.removeItem(key);
            });
            localStorage.setItem("tv_db_version", DB_VERSION);
        }
    }

    function ensureAdminAccount() {
        var users = JSON.parse(localStorage.getItem("tv_users")) || [];
        var adminIndex = users.findIndex(function (user) {
            return user.role === "admin" ||
                user.username === "techverseadmin" ||
                user.email === "admin@techverse.com";
        });

        var adminUser = {
            id: "u_admin_techverse",
            username: "techverseadmin",
            name: "TechVerse Admin",
            email: "admin@techverse.com",
            password: "password123",
            role: "admin",
            address: "",
            city: "",
            phone: ""
        };

        if (adminIndex === -1) {
            users.unshift(adminUser);
        } else {
            users[adminIndex] = Object.assign({}, users[adminIndex], adminUser);
        }

        localStorage.setItem("tv_users", JSON.stringify(users));
    }

    function initDB() {
        resetIfOutdated();

        if (!localStorage.getItem("tv_users")) {
            localStorage.setItem("tv_users", JSON.stringify([]));
        }
        if (!localStorage.getItem("tv_categories")) {
            localStorage.setItem("tv_categories", JSON.stringify(DEFAULT_CATEGORIES));
        }
        if (!localStorage.getItem("tv_products")) {
            localStorage.setItem("tv_products", JSON.stringify(DEFAULT_PRODUCTS));
        }
        if (!localStorage.getItem("tv_orders")) {
            localStorage.setItem("tv_orders", JSON.stringify([]));
        }
        if (!localStorage.getItem("tv_applications")) {
            localStorage.setItem("tv_applications", JSON.stringify([]));
        }
        if (!localStorage.getItem("tv_cart")) {
            localStorage.setItem("tv_cart", JSON.stringify({}));
        }
        if (!localStorage.getItem("tv_wishlist")) {
            localStorage.setItem("tv_wishlist", JSON.stringify({}));
        }

        ensureAdminAccount();
    }

    initDB();

    window.TechVerseDB = {
        getUsers: function () { return JSON.parse(localStorage.getItem("tv_users")); },
        saveUsers: function (users) { localStorage.setItem("tv_users", JSON.stringify(users)); },

        getCategories: function () { return JSON.parse(localStorage.getItem("tv_categories")); },
        saveCategories: function (cats) { localStorage.setItem("tv_categories", JSON.stringify(cats)); },

        getProducts: function () { return JSON.parse(localStorage.getItem("tv_products")); },
        saveProducts: function (products) { localStorage.setItem("tv_products", JSON.stringify(products)); },

        getOrders: function () { return JSON.parse(localStorage.getItem("tv_orders")); },
        saveOrders: function (orders) { localStorage.setItem("tv_orders", JSON.stringify(orders)); },

        getApplications: function () { return JSON.parse(localStorage.getItem("tv_applications")); },
        saveApplications: function (apps) { localStorage.setItem("tv_applications", JSON.stringify(apps)); },

        getTestimonials: function () { return []; },

        getCurrentUser: function () { return JSON.parse(localStorage.getItem("tv_current_user")); },
        setCurrentUser: function (user) { localStorage.setItem("tv_current_user", JSON.stringify(user)); },
        logout: function () { localStorage.removeItem("tv_current_user"); },

        getCart: function (userId) {
            var carts = JSON.parse(localStorage.getItem("tv_cart"));
            return carts[userId] || [];
        },
        saveCart: function (userId, items) {
            var carts = JSON.parse(localStorage.getItem("tv_cart"));
            carts[userId] = items;
            localStorage.setItem("tv_cart", JSON.stringify(carts));
        },
        addToCart: function (userId, product, qty) {
            qty = qty || 1;
            var carts = JSON.parse(localStorage.getItem("tv_cart"));
            if (!carts[userId]) carts[userId] = [];
            var found = carts[userId].find(function (item) { return item.id === product.id; });
            if (found) {
                found.quantity += qty;
            } else {
                carts[userId].push({
                    id: product.id,
                    name: product.name,
                    price: product.discountPrice || product.price,
                    image: product.image,
                    quantity: qty,
                    stock: product.stock
                });
            }
            localStorage.setItem("tv_cart", JSON.stringify(carts));
            window.dispatchEvent(new Event("cart-updated"));
        },

        getWishlist: function (userId) {
            var lists = JSON.parse(localStorage.getItem("tv_wishlist"));
            return lists[userId] || [];
        },
        saveWishlist: function (userId, items) {
            var lists = JSON.parse(localStorage.getItem("tv_wishlist"));
            lists[userId] = items;
            localStorage.setItem("tv_wishlist", JSON.stringify(lists));
        },
        addToWishlist: function (userId, product) {
            var lists = JSON.parse(localStorage.getItem("tv_wishlist"));
            if (!lists[userId]) lists[userId] = [];
            var exists = lists[userId].some(function (item) { return item.id === product.id; });
            if (exists) return false;
            lists[userId].push({
                id: product.id,
                name: product.name,
                price: product.discountPrice || product.price,
                image: product.image
            });
            localStorage.setItem("tv_wishlist", JSON.stringify(lists));
            window.dispatchEvent(new Event("wishlist-updated"));
            return true;
        }
    };
})();
