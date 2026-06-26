// ============================================================
//  TechVerse Market — Authentication (Login, Signup, Google)
//  js/auth.js  (ES Module — <script type="module">)
// ============================================================

import {
    signUpUser,
    loginUser,
    googleSignIn,
    resetPassword,
    getUserProfile,
    ensureUserProfile
} from "../firebase/firebase.js";

document.addEventListener("DOMContentLoaded", function () {
    var path   = window.location.pathname;
    var isRoot = !path.includes("/buyer/") && !path.includes("/vendor/") && !path.includes("/admin/");
    var prefix = isRoot ? "" : "../";

    setupLogin(prefix);
    setupSignup(prefix);
    setupForgotPassword();
    setupGoogleButtons(prefix);
});

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showAuthError(message) {
    Swal.fire({
        icon: "error",
        title: "Invalid Input",
        text: message,
        confirmButtonColor: "#1e1b4b"
    });
}

// ── Role-based redirect helper ────────────────────────────────────────────
async function redirectByRole(uid, prefix) {
    try {
        const profile = await getUserProfile(uid);
        if (!profile) {
            window.location.href = prefix + "index.html";
            return;
        }
        switch (profile.role) {
            case "admin":  window.location.href = prefix + "admin/dashboard.html";  break;
            case "vendor": window.location.href = prefix + "vendor/dashboard.html"; break;
            default:       window.location.href = prefix + "index.html";            break;
        }
    } catch (err) {
        console.error("redirectByRole:", err);
        window.location.href = prefix + "index.html";
    }
}

// ──────────────────────────────────────────────────────────────────────────
//  LOGIN FORM
// ──────────────────────────────────────────────────────────────────────────
function setupLogin(prefix) {
    var form = document.getElementById("login-form");
    if (!form) return;

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        var email    = document.getElementById("email").value.trim().toLowerCase();
        var password = document.getElementById("password").value;
        var btn      = form.querySelector("button[type='submit']");

        if (!email || !isValidEmail(email)) {
            showAuthError("Please enter a valid email address.");
            btn.disabled    = false;
            btn.innerHTML   = 'Sign In <i class="fas fa-arrow-right ml-2"></i>';
            return;
        }

        btn.disabled    = true;
        btn.textContent = "Signing in…";

        try {
            const cred = await loginUser(email, password);
            await ensureUserProfile(cred.user, "buyer");
            await redirectByRole(cred.user.uid, prefix);
        } catch (err) {
            btn.disabled    = false;
            btn.innerHTML   = 'Sign In <i class="fas fa-arrow-right ml-2"></i>';

            var messages = {
                "auth/user-not-found":   "No account found with this email.",
                "auth/wrong-password":   "Incorrect password. Please try again.",
                "auth/invalid-email":    "Please enter a valid email address.",
                "auth/too-many-requests":"Too many failed attempts. Try again later.",
                "auth/invalid-credential": "Invalid email or password."
            };
            Swal.fire({
                icon: "error",
                title: "Login Failed",
                text: messages[err.code] || err.message,
                confirmButtonColor: "#1e1b4b"
            });
        }
    });
}

// ──────────────────────────────────────────────────────────────────────────
//  SIGNUP FORM
// ──────────────────────────────────────────────────────────────────────────
function setupSignup(prefix) {
    var form = document.getElementById("signup-form");
    if (!form) return;

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        var name     = document.getElementById("name").value.trim();
        var email    = document.getElementById("email").value.trim().toLowerCase();
        var role     = document.getElementById("role").value;
        var password = document.getElementById("password").value;
        var confirm  = document.getElementById("confirm-password").value;

        if (!email || !isValidEmail(email)) {
            Swal.fire({ icon: "error", title: "Invalid Email", text: "Please enter a valid email address.", confirmButtonColor: "#1e1b4b" });
            return;
        }

        if (password !== confirm) {
            Swal.fire({ icon: "error", title: "Passwords don't match", confirmButtonColor: "#1e1b4b" });
            return;
        }

        if (password.length < 6) {
            Swal.fire({ icon: "error", title: "Weak Password", text: "Password must be at least 6 characters.", confirmButtonColor: "#1e1b4b" });
            return;
        }

        var btn = form.querySelector("button[type='submit']");
        btn.disabled    = true;
        btn.textContent = "Creating account…";

        try {
            const cred = await signUpUser(email, password, name, role);

            Swal.fire({
                icon: "success",
                title: "Account Created!",
                text: "Welcome to TechVerse, " + name + "!",
                showConfirmButton: false,
                timer: 1800
            }).then(async () => {
                await redirectByRole(cred.user.uid, prefix);
            });
        } catch (err) {
            btn.disabled  = false;
            btn.innerHTML = 'Create Account <i class="fas fa-arrow-right ml-2"></i>';

            var messages = {
                "auth/email-already-in-use": "This email is already registered. Try logging in.",
                "auth/invalid-email":        "Please enter a valid email address.",
                "auth/weak-password":        "Password must be at least 6 characters."
            };
            Swal.fire({
                icon: "error",
                title: "Signup Failed",
                text: messages[err.code] || err.message,
                confirmButtonColor: "#1e1b4b"
            });
        }
    });
}

// ──────────────────────────────────────────────────────────────────────────
//  FORGOT PASSWORD
// ──────────────────────────────────────────────────────────────────────────
function setupForgotPassword() {
    var forgotLinks = document.querySelectorAll("a[href='#']");
    forgotLinks.forEach(function (link) {
        if (link.textContent.toLowerCase().includes("forgot")) {
            link.addEventListener("click", async function (e) {
                e.preventDefault();

                const { value: email } = await Swal.fire({
                    title:       "Reset Password",
                    input:       "email",
                    inputLabel:  "Enter your account email",
                    inputPlaceholder: "your@email.com",
                    showCancelButton: true,
                    confirmButtonText: "Send Reset Link",
                    confirmButtonColor: "#1e1b4b"
                });

                if (email) {
                    try {
                        await resetPassword(email);
                        Swal.fire({
                            icon: "success",
                            title: "Email Sent!",
                            text: "A password reset link has been sent to " + email,
                            confirmButtonColor: "#1e1b4b"
                        });
                    } catch (err) {
                        Swal.fire({
                            icon: "error",
                            title: "Error",
                            text: err.code === "auth/user-not-found"
                                ? "No account found with that email."
                                : err.message,
                            confirmButtonColor: "#1e1b4b"
                        });
                    }
                }
            });
        }
    });
}

// ──────────────────────────────────────────────────────────────────────────
//  GOOGLE SIGN-IN BUTTONS
// ──────────────────────────────────────────────────────────────────────────
function setupGoogleButtons(prefix) {
    var googleBtns = document.querySelectorAll("#google-signin-btn, #google-signup-btn, .google-auth-btn");
    googleBtns.forEach(function (btn) {
        btn.addEventListener("click", async function () {
            try {
                const cred = await googleSignIn();
                await ensureUserProfile(cred.user, "buyer");
                await redirectByRole(cred.user.uid, prefix);
            } catch (err) {
                if (err.code !== "auth/popup-closed-by-user") {
                    Swal.fire({
                        icon: "error",
                        title: "Google Sign-In Failed",
                        text: err.message,
                        confirmButtonColor: "#1e1b4b"
                    });
                }
            }
        });
    });
}
