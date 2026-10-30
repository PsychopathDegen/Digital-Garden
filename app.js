
const STORAGE_KEY = "vaultplay-account-v1";

// ===================================
// ACCOUNT STATE
// ===================================

const state = {
    balance: 0,
    favorites: [],
    history: []
};

const $ = (selector) => document.querySelector(selector);

const $$ = (selector) => [
    ...document.querySelectorAll(selector)
];


// ===================================
// LOCAL STORAGE
// ===================================

function loadAccount() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) return;

        const data = JSON.parse(saved);

        state.balance = Math.max(
            0,
            Number(data.balance) || 0
        );

        state.favorites = Array.isArray(data.favorites)
            ? data.favorites
            : [];

        state.history = Array.isArray(data.history)
            ? data.history
            : [];

    } catch (error) {
        console.error("Account loading error:", error);
    }
}


function saveAccount() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(state)
        );
    } catch (error) {
        console.error("Account saving error:", error);
        showToast("Could not save account data.");
    }
}


// ===================================
// BALANCE DISPLAY
// ===================================

function formatUSDT(amount) {
    return Number(amount).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


function updateBalance() {
    $("#balance").textContent =
        formatUSDT(state.balance);
}


// ===================================
// NOTIFICATIONS
// ===================================

let toastTimer;

function showToast(message) {
    const toast = $("#toast");

    toast.textContent = message;
    toast.classList.remove("hidden");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.add("hidden");
    }, 2800);
}


// ===================================
// DEPOSIT SYSTEM
// ===================================

function openDeposit() {
    $("#depositModal").classList.remove("hidden");
    $("#depositAmount").focus();
}


function closeDeposit() {
    $("#depositModal").classList.add("hidden");
    $("#depositError").classList.add("hidden");
}


function virtualDeposit() {

    const input = $("#depositAmount");

    const amount = Number(input.value);

    // Validate amount

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        $("#depositError").classList.remove("hidden");
        input.focus();
        return;
    }

    // Add virtual USDT

    state.balance += amount;

    // Record transaction

    state.history.unshift({
        type: "deposit",
        amount: amount,
        date: new Date().toISOString()
    });

    // Save account

    saveAccount();

    // Update interface

    updateBalance();

    input.value = "";

    closeDeposit();

    showToast(
        `${formatUSDT(amount)} virtual USDT added successfully`
    );
}


function initializeDeposit() {

    $("#depositButton").addEventListener(
        "click",
        openDeposit
    );

    $("#sidebarDeposit").addEventListener(
        "click",
        openDeposit
    );

    $("#closeModal").addEventListener(
        "click",
        closeDeposit
    );

    $("#confirmDeposit").addEventListener(
        "click",
        virtualDeposit
    );

    // Close modal by clicking outside

    $("#depositModal").addEventListener(
        "click",
        (event) => {
            if (event.target === $("#depositModal")) {
                closeDeposit();
            }
        }
    );

    // Enter key confirms deposit

    $("#depositAmount").addEventListener(
        "keydown",
        (event) => {
            if (event.key === "Enter") {
                virtualDeposit();
            }

            if (event.key === "Escape") {
                closeDeposit();
            }
        }
    );

    // Quick deposit buttons

    $$(".quick-amounts button").forEach(button => {

        button.addEventListener("click", () => {

            $("#depositAmount").value =
                button.dataset.amount;

            $("#depositError").classList.add("hidden");

        });

    });

}


// ===================================
// FAVORITES
// ===================================

function initializeFavorites() {

    $$(".favorite-btn").forEach(button => {

        const card = button.closest(".game-card");

        const gameName = card.dataset.name;

        function updateFavoriteButton() {

            const favorite =
                state.favorites.includes(gameName);

            button.classList.toggle(
                "is-favorite",
                favorite
            );

            button.textContent =
                favorite ? "♥" : "♡";

        }

        updateFavoriteButton();

        button.addEventListener("click", () => {

            const index =
                state.favorites.indexOf(gameName);

            if (index !== -1) {

                state.favorites.splice(index, 1);

            } else {

                state.favorites.push(gameName);

            }

            saveAccount();

            updateFavoriteButton();

            applyFilters();

        });

    });

}


// ===================================
// GAME SEARCH AND FILTERING
// ===================================

let activeCategory = "all";


function applyFilters() {

    const searchTerm =
        $("#gameSearch").value
            .trim()
            .toLowerCase();

    let visibleGames = 0;

    $$(".game-card").forEach(card => {

        const name =
            card.dataset.name.toLowerCase();

        const category =
            card.dataset.category;

        const matchesSearch =
            name.includes(searchTerm);

        let matchesCategory = true;

        if (activeCategory === "originals") {

            matchesCategory =
                category === "originals";

        } else if (activeCategory === "table") {

            matchesCategory =
                category === "table";

        } else if (activeCategory === "favorites") {

            matchesCategory =
                state.favorites.includes(card.dataset.name);

        }

        const visible =
            matchesSearch && matchesCategory;

        card.classList.toggle(
            "hidden",
            !visible
        );

        if (visible) {
            visibleGames++;
        }

    });

    $("#emptyState").classList.toggle(
        "hidden",
        visibleGames > 0
    );

}


function initializeFilters() {

    $("#gameSearch").addEventListener(
        "input",
        applyFilters
    );

    $$(".category").forEach(button => {

        button.addEventListener("click", () => {

            activeCategory =
                button.dataset.category;

            $$(".category").forEach(category => {

                category.classList.toggle(
                    "active",
                    category === button
                );

            });

            applyFilters();

        });

    });

}


// ===================================
// SIDEBAR NAVIGATION
// ===================================

function initializeNavigation() {

    $$(".nav-item[data-view]").forEach(button => {

        button.addEventListener("click", () => {

            const view = button.dataset.view;

            $$(".nav-item[data-view]").forEach(item => {

                item.classList.toggle(
                    "active",
                    item === button
                );

            });

            if (view === "originals") {

                activeCategory = "originals";
                $("#pageTitle").textContent = "Originals";

            } else if (view === "favorites") {

                activeCategory = "favorites";
                $("#pageTitle").textContent = "Favorites";

            } else {

                activeCategory = "all";
                $("#pageTitle").textContent = "Casino";

            }

            $$(".category").forEach(category => {

                category.classList.toggle(
                    "active",
                    category.dataset.category === activeCategory
                );

            });

            applyFilters();

            $("#sidebar").classList.remove("open");

        });

    });

    // Mobile menu

    $("#mobileMenu").addEventListener("click", () => {

        $("#sidebar").classList.toggle("open");

    });

}


// ===================================
// APPLICATION INITIALIZATION
// ===================================

function initializeApp() {

    loadAccount();

    updateBalance();

    initializeDeposit();

    initializeFavorites();

    initializeFilters();

    initializeNavigation();

    applyFilters();

    console.log("VaultPlay initialized successfully.");

}


// Start application

document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);
