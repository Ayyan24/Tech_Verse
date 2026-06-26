// ============================================================
//  TechVerse Market — Firebase Configuration & Services
//  firebase/firebase.js  (ES Module — import via <script type="module">)
//  CDN: Firebase v10 modular SDK
// ============================================================

// ── Core SDK ──────────────────────────────────────────────────────────────
  import { initializeApp }            from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

// ── Auth SDK ──────────────────────────────────────────────────────────────
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ── Firestore SDK ──────────────────────────────────────────────────────────
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    arrayUnion,
    arrayRemove,
    increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ============================================================
//  YOUR FIREBASE PROJECT CONFIGURATION
//  → Replace the values below with your actual Firebase config
//    from: Firebase Console → Project Settings → Your Apps → SDK setup
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyDT-6oSx4Dbx3fg-zSMvS5NzxOf8VDVjmE",
  authDomain: "tech-verse-123.firebaseapp.com",
  projectId: "tech-verse-123",
  storageBucket: "tech-verse-123.firebasestorage.app",
  messagingSenderId: "817222260746",
  appId: "1:817222260746:web:e3dfae188b1fad817667f3",
  measurementId: "G-SSCHKETDHK"
};

// ── Initialize Firebase ────────────────────────────────────────────────────
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ============================================================
//  COLLECTION REFERENCES  (central constants)
// ============================================================
const COLLECTIONS = {
    USERS:    "users",
    PRODUCTS: "products",
    ORDERS:   "orders",
    VENDORS:  "vendors",
    REVIEWS:  "reviews",
    CART:     "cart",
    WISHLIST: "wishlist",
    CATEGORIES: "categories"
};

// ============================================================
//  ──────────────────────────────────────────────────────────
//  AUTH FUNCTIONS
//  ──────────────────────────────────────────────────────────
// ============================================================

// ── Ensure Firestore User Profile Exists ────────────────────────────────
/**
 * Creates a Firestore profile for an authenticated user if it does not already exist.
 * @param {import("firebase/auth").User} user
 * @param {string} [role] - "buyer" | "vendor" | "admin"
 * @param {string} [name] - Display name fallback
 * @param {string} [email] - Email fallback
 * @returns {Promise<object>}
 */
export async function ensureUserProfile(user, role = "buyer", name = "", email = "") {
    try {
        const userRef = doc(db, COLLECTIONS.USERS, user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return { id: userSnap.id, ...userSnap.data() };
        }

        const profile = {
            userid: user.uid,
            name: name || user.displayName || "",
            email: email || user.email || "",
            role: role,
            phone: "",
            city: "",
            address: "",
            createdAt: serverTimestamp()
        };

        await setDoc(userRef, profile);
        return profile;
    } catch (error) {
        console.error("[TechVerse] ensureUserProfile:", error.code, error.message);
        throw error;
    }
}

// ── Sign Up with Email & Password ─────────────────────────────────────────
/**
 * Creates a new Firebase Auth user and saves a profile document in Firestore.
 * @param {string} email
 * @param {string} password
 * @param {string} name        - Display name
 * @param {string} role        - "buyer" | "vendor" | "admin"
 * @param {string} [shopName]  - Required only when role === "vendor"
 * @returns {Promise<import("firebase/auth").UserCredential>}
 */
export async function signUpUser(email, password, name, role = "buyer", shopName = "") {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user           = userCredential.user;

        await ensureUserProfile(user, role, name, email);

        // If vendor, also create vendor profile
        if (role === "vendor") {
            const vendorDoc = {
                vendorid:       user.uid,
                userid:         user.uid,
                shopname:       shopName || name + "'s Shop",
                approvalStatus: "pending",   // pending | approved | rejected
                email:          email,
                createdAt:      serverTimestamp()
            };
            await setDoc(doc(db, COLLECTIONS.VENDORS, user.uid), vendorDoc);
        }

        return userCredential;
    } catch (error) {
        console.error("[TechVerse] signUpUser:", error.code, error.message);
        throw error;
    }
}

// ── Login with Email & Password ────────────────────────────────────────────
/**
 * Authenticates an existing user.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import("firebase/auth").UserCredential>}
 */
export async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential;
    } catch (error) {
        console.error("[TechVerse] loginUser:", error.code, error.message);
        throw error;
    }
}

// ── Google Sign-In ─────────────────────────────────────────────────────────
/**
 * Opens Google OAuth popup. Creates Firestore user doc on first sign-in.
 * @returns {Promise<import("firebase/auth").UserCredential>}
 */
export async function googleSignIn() {
    try {
        const provider      = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        const user           = userCredential.user;

        // Check if user document already exists
        const userRef  = doc(db, COLLECTIONS.USERS, user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            // First-time Google sign-in → create document
            await setDoc(userRef, {
                userid:    user.uid,
                name:      user.displayName || "Google User",
                email:     user.email,
                role:      "buyer",
                phone:     "",
                city:      "",
                address:   "",
                createdAt: serverTimestamp()
            });
        }

        return userCredential;
    } catch (error) {
        console.error("[TechVerse] googleSignIn:", error.code, error.message);
        throw error;
    }
}

// ── Logout ────────────────────────────────────────────────────────────────
/**
 * Signs the current user out of Firebase.
 * @returns {Promise<void>}
 */
export async function logoutUser() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("[TechVerse] logoutUser:", error.code, error.message);
        throw error;
    }
}

// ── Forgot / Reset Password ───────────────────────────────────────────────
/**
 * Sends a password-reset email to the specified address.
 * @param {string} email
 * @returns {Promise<void>}
 */
export async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error) {
        console.error("[TechVerse] resetPassword:", error.code, error.message);
        throw error;
    }
}

// ── Change Password (reauthenticate first) ────────────────────────────────
/**
 * Re-authenticates the user with their current password, then sets a new one.
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
export async function changePassword(currentPassword, newPassword) {
    try {
        const user = auth.currentUser;
        if (!user || !user.email) {
            throw new Error("Please sign in again before changing your password.");
        }
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
    } catch (error) {
        console.error("[TechVerse] changePassword:", error.code, error.message);
        throw error;
    }
}

// ── Auth State Listener ───────────────────────────────────────────────────
/**
 * Calls callback with the current user (or null) whenever auth state changes.
 * @param {function} callback
 * @returns {import("firebase/auth").Unsubscribe}
 */
export function onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
}

// ── Get Current Auth User ─────────────────────────────────────────────────
/**
 * Returns the currently authenticated Firebase user object (or null).
 * @returns {import("firebase/auth").User|null}
 */
export function getCurrentAuthUser() {
    return auth.currentUser;
}

// ============================================================
//  ──────────────────────────────────────────────────────────
//  FIRESTORE — USERS COLLECTION
//  ──────────────────────────────────────────────────────────
// ============================================================

// ── Get User Profile from Firestore ──────────────────────────────────────
/**
 * Fetches the Firestore profile document for the given uid.
 * @param {string} uid
 * @returns {Promise<object|null>}
 */
export async function getUserProfile(uid) {
    try {
        const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
        return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    } catch (error) {
        console.error("[TechVerse] getUserProfile:", error);
        throw error;
    }
}

// ── Update User Profile ───────────────────────────────────────────────────
/**
 * Partially updates a user's Firestore document.
 * @param {string} uid
 * @param {object} updates  - Fields to update
 * @returns {Promise<void>}
 */
export async function updateUserProfile(uid, updates) {
    try {
        await setDoc(doc(db, COLLECTIONS.USERS, uid), updates, { merge: true });
    } catch (error) {
        console.error("[TechVerse] updateUserProfile:", error);
        throw error;
    }
}

// ── Get All Users (Admin) ─────────────────────────────────────────────────
/**
 * Retrieves all user documents. Admin-only.
 * @returns {Promise<object[]>}
 */
export async function getAllUsers() {
    try {
        const snap = await getDocs(collection(db, COLLECTIONS.USERS));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error("[TechVerse] getAllUsers:", error);
        throw error;
    }
}

// ── Delete User Document (Admin) ──────────────────────────────────────────
/**
 * Deletes a user's Firestore document. Admin-only.
 * Note: Deleting the Auth account itself requires Admin SDK (server-side).
 * @param {string} uid
 * @returns {Promise<void>}
 */
export async function deleteUserDocument(uid) {
    try {
        await deleteDoc(doc(db, COLLECTIONS.USERS, uid));
    } catch (error) {
        console.error("[TechVerse] deleteUserDocument:", error);
        throw error;
    }
}

// ============================================================
//  ──────────────────────────────────────────────────────────
//  FIRESTORE — PRODUCTS COLLECTION
//  ──────────────────────────────────────────────────────────
// ============================================================

// ── Add Product (Vendor) ──────────────────────────────────────────────────
/**
 * Adds a new product document.
 * @param {object} productData
 * @returns {Promise<string>} - The new document ID (productid)
 */
export async function addProduct(productData) {
    try {
        const docRef = await addDoc(collection(db, COLLECTIONS.PRODUCTS), {
            ...productData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        // Store the generated ID back into the document
        await updateDoc(docRef, { productid: docRef.id });
        return docRef.id;
    } catch (error) {
        console.error("[TechVerse] addProduct:", error);
        throw error;
    }
}

// ── Update Product (Vendor) ───────────────────────────────────────────────
/**
 * Updates fields on an existing product.
 * @param {string} productId
 * @param {object} updates
 * @returns {Promise<void>}
 */
export async function updateProduct(productId, updates) {
    try {
        await updateDoc(doc(db, COLLECTIONS.PRODUCTS, productId), {
            ...updates,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("[TechVerse] updateProduct:", error);
        throw error;
    }
}

// ── Delete Product (Vendor / Admin) ──────────────────────────────────────
/**
 * @param {string} productId
 * @returns {Promise<void>}
 */
export async function deleteProduct(productId) {
    try {
        await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, productId));
    } catch (error) {
        console.error("[TechVerse] deleteProduct:", error);
        throw error;
    }
}

// ── Get Single Product ────────────────────────────────────────────────────
/**
 * @param {string} productId
 * @returns {Promise<object|null>}
 */
export async function getProduct(productId) {
    try {
        const snap = await getDoc(doc(db, COLLECTIONS.PRODUCTS, productId));
        return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    } catch (error) {
        console.error("[TechVerse] getProduct:", error);
        throw error;
    }
}

// ── Get All Products ──────────────────────────────────────────────────────
/**
 * @returns {Promise<object[]>}
 */
export async function getAllProducts() {
    try {
        const snap = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error("[TechVerse] getAllProducts:", error);
        throw error;
    }
}

// ── Get Products by Category ──────────────────────────────────────────────
/**
 * @param {string} category
 * @returns {Promise<object[]>}
 */
export async function getProductsByCategory(category) {
    try {
        const q    = query(collection(db, COLLECTIONS.PRODUCTS), where("category", "==", category));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error("[TechVerse] getProductsByCategory:", error);
        throw error;
    }
}

// ── Get Products by Vendor ────────────────────────────────────────────────
/**
 * @param {string} vendorId
 * @returns {Promise<object[]>}
 */
export async function getProductsByVendor(vendorId) {
    try {
        const q    = query(collection(db, COLLECTIONS.PRODUCTS), where("vendorid", "==", vendorId));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error("[TechVerse] getProductsByVendor:", error);
        throw error;
    }
}

// ── Update Inventory / Stock ──────────────────────────────────────────────
/**
 * Decrements stock by the purchased quantity using Firestore atomic increment.
 * @param {string} productId
 * @param {number} quantity  - Positive number to deduct
 * @returns {Promise<void>}
 */
export async function decrementStock(productId, quantity) {
    try {
        await updateDoc(doc(db, COLLECTIONS.PRODUCTS, productId), {
            stock:     increment(-quantity),
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("[TechVerse] decrementStock:", error);
        throw error;
    }
}

// ── Search Products ────────────────────────────────────────────────────────
/**
 * Simple keyword search on product titles (client-side filter).
 * For production, use Algolia or Firestore full-text index.
 * @param {string} keyword
 * @returns {Promise<object[]>}
 */
export async function searchProducts(keyword) {
    try {
        const all  = await getAllProducts();
        const term = keyword.toLowerCase();
        return all.filter(p =>
            (p.title  && p.title.toLowerCase().includes(term)) ||
            (p.brand  && p.brand.toLowerCase().includes(term)) ||
            (p.category && p.category.toLowerCase().includes(term))
        );
    } catch (error) {
        console.error("[TechVerse] searchProducts:", error);
        throw error;
    }
}

// ── Get Featured / Sale Products ───────────────────────────────────────────
/**
 * @param {number} [maxResults=8]
 * @returns {Promise<object[]>}
 */
export async function getFeaturedProducts(maxResults = 8) {
    try {
        const q    = query(
            collection(db, COLLECTIONS.PRODUCTS),
            where("featured", "==", true),
            limit(maxResults)
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error("[TechVerse] getFeaturedProducts:", error);
        throw error;
    }
}

// ============================================================
//  ──────────────────────────────────────────────────────────
//  FIRESTORE — ORDERS COLLECTION
//  ──────────────────────────────────────────────────────────
// ============================================================

// ── Create Order ──────────────────────────────────────────────────────────
/**
 * Places a new order. Each element in the products array should be:
 * { productid, title, price, quantity }
 * @param {string}   userId
 * @param {object[]} products
 * @param {number}   totalAmount
 * @param {object}   [shippingInfo]  - { name, address, city, phone }
 * @returns {Promise<string>} - The new order ID
 */
export async function createOrder(userId, products, totalAmount, shippingInfo = {}) {
    try {
        const docRef = await addDoc(collection(db, COLLECTIONS.ORDERS), {
            userid:       userId,
            products:     products,
            totalAmount:  totalAmount,
            status:       "pending",   // pending | confirmed | shipped | delivered | cancelled
            shippingInfo: shippingInfo,
            createdAt:    serverTimestamp(),
            updatedAt:    serverTimestamp()
        });
        await updateDoc(docRef, { orderid: docRef.id });
        return docRef.id;
    } catch (error) {
        console.error("[TechVerse] createOrder:", error);
        throw error;
    }
}

// ── Get Orders by User ────────────────────────────────────────────────────
/**
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
export async function getOrdersByUser(userId) {
    try {
        const q    = query(
            collection(db, COLLECTIONS.ORDERS),
            where("userid", "==", userId),
            orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error("[TechVerse] getOrdersByUser:", error);
        throw error;
    }
}

// ── Get All Orders (Admin) ────────────────────────────────────────────────
/**
 * @returns {Promise<object[]>}
 */
export async function getAllOrders() {
    try {
        const q    = query(collection(db, COLLECTIONS.ORDERS), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error("[TechVerse] getAllOrders:", error);
        throw error;
    }
}

// ── Get Orders for Vendor ─────────────────────────────────────────────────
/**
 * Returns orders that contain at least one product from this vendor.
 * Firestore array-contains can check for a specific vendorid field.
 * @param {string} vendorId
 * @returns {Promise<object[]>}
 */
export async function getOrdersByVendor(vendorId) {
    try {
        const all = await getAllOrders();
        return all.filter(order =>
            order.products && order.products.some(p => p.vendorid === vendorId)
        );
    } catch (error) {
        console.error("[TechVerse] getOrdersByVendor:", error);
        throw error;
    }
}

// ── Update Order Status (Admin / Vendor) ──────────────────────────────────
/**
 * @param {string} orderId
 * @param {string} status  - "pending"|"confirmed"|"shipped"|"delivered"|"cancelled"
 * @returns {Promise<void>}
 */
export async function updateOrderStatus(orderId, status) {
    try {
        await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), {
            status:    status,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("[TechVerse] updateOrderStatus:", error);
        throw error;
    }
}

// ── Get Single Order ──────────────────────────────────────────────────────
/**
 * @param {string} orderId
 * @returns {Promise<object|null>}
 */
export async function getOrder(orderId) {
    try {
        const snap = await getDoc(doc(db, COLLECTIONS.ORDERS, orderId));
        return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    } catch (error) {
        console.error("[TechVerse] getOrder:", error);
        throw error;
    }
}

// ============================================================
//  ──────────────────────────────────────────────────────────
//  FIRESTORE — VENDORS COLLECTION
//  ──────────────────────────────────────────────────────────
// ============================================================

// ── Get Vendor Profile ────────────────────────────────────────────────────
/**
 * @param {string} vendorId
 * @returns {Promise<object|null>}
 */
export async function getVendorProfile(vendorId) {
    try {
        const snap = await getDoc(doc(db, COLLECTIONS.VENDORS, vendorId));
        return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    } catch (error) {
        console.error("[TechVerse] getVendorProfile:", error);
        throw error;
    }
}

// ── Update Vendor Profile ─────────────────────────────────────────────────
/**
 * @param {string} vendorId
 * @param {object} updates
 * @returns {Promise<void>}
 */
export async function updateVendorProfile(vendorId, updates) {
    try {
        await updateDoc(doc(db, COLLECTIONS.VENDORS, vendorId), updates);
    } catch (error) {
        console.error("[TechVerse] updateVendorProfile:", error);
        throw error;
    }
}

// ── Get All Vendors (Admin) ───────────────────────────────────────────────
/**
 * @returns {Promise<object[]>}
 */
export async function getAllVendors() {
    try {
        const snap = await getDocs(collection(db, COLLECTIONS.VENDORS));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error("[TechVerse] getAllVendors:", error);
        throw error;
    }
}

// ── Get Pending Vendors (Admin) ───────────────────────────────────────────
/**
 * @returns {Promise<object[]>}
 */
export async function getPendingVendors() {
    try {
        const q    = query(collection(db, COLLECTIONS.VENDORS), where("approvalStatus", "==", "pending"));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error("[TechVerse] getPendingVendors:", error);
        throw error;
    }
}

// ── Update Vendor Approval Status (Admin) ─────────────────────────────────
/**
 * @param {string} vendorId
 * @param {string} status  - "approved" | "rejected" | "pending"
 * @returns {Promise<void>}
 */
export async function updateVendorApprovalStatus(vendorId, status) {
    try {
        await updateDoc(doc(db, COLLECTIONS.VENDORS, vendorId), {
            approvalStatus: status,
            updatedAt:      serverTimestamp()
        });
    } catch (error) {
        console.error("[TechVerse] updateVendorApprovalStatus:", error);
        throw error;
    }
}

// ============================================================
//  ──────────────────────────────────────────────────────────
//  FIRESTORE — CART  (per-user sub-document)
//  Stored at: /cart/{userId}  → field: items (array)
//  ──────────────────────────────────────────────────────────
// ============================================================

// ── Add Item to Cart ──────────────────────────────────────────────────────
/**
 * @param {string} userId
 * @param {object} item  - { productid, title, price, image, quantity, vendorid }
 * @returns {Promise<void>}
 */
export async function addToCart(userId, item) {
    try {
        const cartRef  = doc(db, COLLECTIONS.CART, userId);
        const cartSnap = await getDoc(cartRef);

        if (cartSnap.exists()) {
            const existing = cartSnap.data().items || [];
            const idx      = existing.findIndex(i => i.productid === item.productid);
            if (idx > -1) {
                // Already in cart → increment quantity
                existing[idx].quantity += item.quantity || 1;
                await updateDoc(cartRef, { items: existing });
            } else {
                await updateDoc(cartRef, { items: arrayUnion(item) });
            }
        } else {
            await setDoc(cartRef, { userid: userId, items: [item] });
        }
    } catch (error) {
        console.error("[TechVerse] addToCart:", error);
        throw error;
    }
}

// ── Remove Item from Cart ─────────────────────────────────────────────────
/**
 * @param {string} userId
 * @param {string} productId
 * @returns {Promise<void>}
 */
export async function removeFromCart(userId, productId) {
    try {
        const cartRef  = doc(db, COLLECTIONS.CART, userId);
        const cartSnap = await getDoc(cartRef);
        if (!cartSnap.exists()) return;

        const items    = (cartSnap.data().items || []).filter(i => i.productid !== productId);
        await updateDoc(cartRef, { items });
    } catch (error) {
        console.error("[TechVerse] removeFromCart:", error);
        throw error;
    }
}

// ── Get Cart ──────────────────────────────────────────────────────────────
/**
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
export async function getCart(userId) {
    try {
        const snap = await getDoc(doc(db, COLLECTIONS.CART, userId));
        return snap.exists() ? snap.data().items || [] : [];
    } catch (error) {
        console.error("[TechVerse] getCart:", error);
        throw error;
    }
}

// ── Clear Cart ─────────────────────────────────────────────────────────────
/**
 * @param {string} userId
 * @returns {Promise<void>}
 */
export async function clearCart(userId) {
    try {
        await updateDoc(doc(db, COLLECTIONS.CART, userId), { items: [] });
    } catch (error) {
        console.error("[TechVerse] clearCart:", error);
        throw error;
    }
}

// ── Update Cart Item Quantity ─────────────────────────────────────────────
/**
 * @param {string} userId
 * @param {string} productId
 * @param {number} newQty
 * @returns {Promise<void>}
 */
export async function updateCartItemQty(userId, productId, newQty) {
    try {
        const cartRef  = doc(db, COLLECTIONS.CART, userId);
        const cartSnap = await getDoc(cartRef);
        if (!cartSnap.exists()) return;

        const items = cartSnap.data().items || [];
        const idx   = items.findIndex(i => i.productid === productId);
        if (idx > -1) {
            items[idx].quantity = newQty;
            await updateDoc(cartRef, { items });
        }
    } catch (error) {
        console.error("[TechVerse] updateCartItemQty:", error);
        throw error;
    }
}

// ============================================================
//  ──────────────────────────────────────────────────────────
//  FIRESTORE — WISHLIST  (per-user sub-document)
//  Stored at: /wishlist/{userId}  → field: items (array)
//  ──────────────────────────────────────────────────────────
// ============================================================

// ── Add to Wishlist ────────────────────────────────────────────────────────
/**
 * @param {string} userId
 * @param {object} item  - { productid, title, price, image }
 * @returns {Promise<void>}
 */
export async function addToWishlist(userId, item) {
    try {
        const ref  = doc(db, COLLECTIONS.WISHLIST, userId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
            const exists = (snap.data().items || []).some(i => i.productid === item.productid);
            if (!exists) {
                await updateDoc(ref, { items: arrayUnion(item) });
            }
        } else {
            await setDoc(ref, { userid: userId, items: [item] });
        }
    } catch (error) {
        console.error("[TechVerse] addToWishlist:", error);
        throw error;
    }
}

// ── Remove from Wishlist ──────────────────────────────────────────────────
/**
 * @param {string} userId
 * @param {string} productId
 * @returns {Promise<void>}
 */
export async function removeFromWishlist(userId, productId) {
    try {
        const ref  = doc(db, COLLECTIONS.WISHLIST, userId);
        const snap = await getDoc(ref);
        if (!snap.exists()) return;

        const items = (snap.data().items || []).filter(i => i.productid !== productId);
        await updateDoc(ref, { items });
    } catch (error) {
        console.error("[TechVerse] removeFromWishlist:", error);
        throw error;
    }
}

// ── Get Wishlist ───────────────────────────────────────────────────────────
/**
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
export async function getWishlist(userId) {
    try {
        const snap = await getDoc(doc(db, COLLECTIONS.WISHLIST, userId));
        return snap.exists() ? snap.data().items || [] : [];
    } catch (error) {
        console.error("[TechVerse] getWishlist:", error);
        throw error;
    }
}

// ============================================================
//  ──────────────────────────────────────────────────────────
//  FIRESTORE — REVIEWS COLLECTION
//  ──────────────────────────────────────────────────────────
// ============================================================

// ── Add Review ────────────────────────────────────────────────────────────
/**
 * @param {string} productId
 * @param {string} userId
 * @param {string} userName
 * @param {number} rating     - 1 to 5
 * @param {string} comment
 * @returns {Promise<string>}  - Review doc ID
 */
export async function addReview(productId, userId, userName, rating, comment) {
    try {
        const docRef = await addDoc(collection(db, COLLECTIONS.REVIEWS), {
            productid:  productId,
            userid:     userId,
            username:   userName,
            rating:     rating,
            comment:    comment,
            createdAt:  serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("[TechVerse] addReview:", error);
        throw error;
    }
}

// ── Get Reviews for a Product ─────────────────────────────────────────────
/**
 * @param {string} productId
 * @returns {Promise<object[]>}
 */
export async function getProductReviews(productId) {
    try {
        const q    = query(
            collection(db, COLLECTIONS.REVIEWS),
            where("productid", "==", productId),
            orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error("[TechVerse] getProductReviews:", error);
        throw error;
    }
}

// ============================================================
//  ──────────────────────────────────────────────────────────
//  FIRESTORE — CATEGORIES COLLECTION  (Admin manages)
//  ──────────────────────────────────────────────────────────
// ============================================================

// ── Get All Categories ────────────────────────────────────────────────────
/**
 * @returns {Promise<object[]>}
 */
export async function getAllCategories() {
    try {
        const snap = await getDocs(collection(db, COLLECTIONS.CATEGORIES));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error("[TechVerse] getAllCategories:", error);
        throw error;
    }
}

// ── Add Category (Admin) ──────────────────────────────────────────────────
/**
 * @param {object} categoryData  - { name, slug, icon }
 * @returns {Promise<string>}
 */
export async function addCategory(categoryData) {
    try {
        const docRef = await addDoc(collection(db, COLLECTIONS.CATEGORIES), {
            ...categoryData,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("[TechVerse] addCategory:", error);
        throw error;
    }
}

// ── Delete Category (Admin) ───────────────────────────────────────────────
/**
 * @param {string} categoryId
 * @returns {Promise<void>}
 */
export async function deleteCategory(categoryId) {
    try {
        await deleteDoc(doc(db, COLLECTIONS.CATEGORIES, categoryId));
    } catch (error) {
        console.error("[TechVerse] deleteCategory:", error);
        throw error;
    }
}

// ============================================================
//  ──────────────────────────────────────────────────────────
//  EXPORTS  —  Raw Firebase instances (for advanced use)
//  ──────────────────────────────────────────────────────────
// ============================================================
export { auth, db, COLLECTIONS };
