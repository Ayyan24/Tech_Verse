// ============================================================
//  TechVerse Market — Profile Page
//  js/profile.js  (ES Module — <script type="module">)
// ============================================================

import {
    onAuthChange,
    getUserProfile,
    updateUserProfile,
    changePassword
} from "../firebase/firebase.js";

document.addEventListener("DOMContentLoaded", function () {
    onAuthChange(async function (firebaseUser) {
        if (!firebaseUser) {
            Swal.fire({
                icon: "warning",
                title: "Authentication Required",
                text: "Please sign in to view your profile dashboard.",
                confirmButtonColor: "#132238"
            }).then(function () {
                window.location.href = "../login.html";
            });
            return;
        }

        const profile = await getUserProfile(firebaseUser.uid);
        if (!profile) return;

        populateUserInfo(profile, firebaseUser);
        setupMenuToggles();
        setupFormSubmissions(firebaseUser.uid);
    });
});

// ── Populate UI ───────────────────────────────────────────────────────────
function populateUserInfo(profile, firebaseUser) {
    var asideName    = document.getElementById("aside-username");
    var nameInput    = document.getElementById("profile-name");
    var emailInput   = document.getElementById("profile-email");
    var phoneInput   = document.getElementById("profile-phone");
    var cityInput    = document.getElementById("profile-city");
    var addressInput = document.getElementById("profile-address");

    if (asideName)    asideName.textContent  = profile.name || firebaseUser?.displayName || "User";
    if (nameInput)    nameInput.value        = profile.name    || "";
    if (emailInput)   emailInput.value       = profile.email || firebaseUser?.email || "";
    if (phoneInput)   phoneInput.value       = profile.phone   || "";
    if (cityInput)    cityInput.value        = profile.city    || "";
    if (addressInput) addressInput.value     = profile.address || "";
}

// ── Side Menu Toggles ────────────────────────────────────────────────────
function setupMenuToggles() {
    var infoBtn      = document.getElementById("menu-info-btn");
    var settingsBtn  = document.getElementById("menu-settings-btn");
    var infoPanel    = document.getElementById("panel-info");
    var settingsPanel = document.getElementById("panel-settings");

    if (!infoBtn || !settingsBtn) return;

    infoBtn.addEventListener("click", function () {
        infoBtn.className      = "flex items-center gap-2.5 w-full text-left p-3 rounded-xl bg-teal-50 text-teal-600 transition-all";
        settingsBtn.className  = "flex items-center gap-2.5 w-full text-left p-3 rounded-xl hover:bg-slate-50 text-slate-600 transition-all";
        if (infoPanel)    infoPanel.classList.remove("hidden");
        if (settingsPanel) settingsPanel.classList.add("hidden");
    });

    settingsBtn.addEventListener("click", function () {
        settingsBtn.className  = "flex items-center gap-2.5 w-full text-left p-3 rounded-xl bg-teal-50 text-teal-600 transition-all";
        infoBtn.className      = "flex items-center gap-2.5 w-full text-left p-3 rounded-xl hover:bg-slate-50 text-slate-600 transition-all";
        if (settingsPanel) settingsPanel.classList.remove("hidden");
        if (infoPanel)    infoPanel.classList.add("hidden");
    });
}

// ── Form Submissions ─────────────────────────────────────────────────────
function setupFormSubmissions(uid) {
    // ── Profile Info Form ─────────────────────────────────────────────────
    var infoForm = document.getElementById("profile-info-form");
    if (infoForm) {
        infoForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            var updates = {
                name:    document.getElementById("profile-name")?.value.trim() || "",
                phone:   document.getElementById("profile-phone")?.value.trim() || "",
                city:    document.getElementById("profile-city")?.value.trim() || "",
                address: document.getElementById("profile-address")?.value.trim() || ""
            };

            try {
                await updateUserProfile(uid, updates);

                var asideName = document.getElementById("aside-username");
                if (asideName) asideName.textContent = updates.name;

                Swal.fire({
                    icon: "success",
                    title: "Profile Updated",
                    text: "Your contact and delivery details were successfully saved.",
                    showConfirmButton: false,
                    timer: 1500
                });
            } catch (err) {
                Swal.fire({ icon: "error", title: "Update Failed", text: err.message, confirmButtonColor: "#132238" });
            }
        });
    }

    // ── Security / Change Password Form ───────────────────────────────────
    var securityForm = document.getElementById("profile-security-form");
    if (securityForm) {
        securityForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            var currPass    = document.getElementById("profile-curr-pass").value;
            var newPass     = document.getElementById("profile-new-pass").value;
            var newPassConf = document.getElementById("profile-new-pass-confirm").value;

            if (newPass !== newPassConf) {
                Swal.fire({ icon: "error", title: "Update Failed", text: "Confirm password does not match.", confirmButtonColor: "#132238" });
                return;
            }
            if (newPass.length < 6) {
                Swal.fire({ icon: "error", title: "Weak Password", text: "Password must be at least 6 characters.", confirmButtonColor: "#132238" });
                return;
            }

            try {
                await changePassword(currPass, newPass);

                Swal.fire({ icon: "success", title: "Password Updated", showConfirmButton: false, timer: 1500 });

                document.getElementById("profile-curr-pass").value     = "";
                document.getElementById("profile-new-pass").value      = "";
                document.getElementById("profile-new-pass-confirm").value = "";
            } catch (err) {
                var msg = err.code === "auth/wrong-password"
                    ? "The current password you entered is incorrect."
                    : err.message;
                Swal.fire({ icon: "error", title: "Update Failed", text: msg, confirmButtonColor: "#132238" });
            }
        });
    }
}
