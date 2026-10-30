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
const $$ = (selector) => [...document.querySelectorAll(selector)];


// ===================================
// SHARED ACCOUNT STORAGE
// ===================================

function normalizeAccount(data = {}) {
    return {
        balance: Math.max(0, Number(data.balance) || 0),
        favorites: Array.isArray(data.favorites) ? data.favorites : [],
        history: Array.isArray(data.history) ? data.history : []
    };
}

function loadAccount() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;

        Object.assign(state, normalizeAccount(JSON.parse(saved)));
    } catch (error) {
        console.error("Account loading error:", error);
    }
}

function saveAccount() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                balance: state.balance,
                favorites: state.favorites,
                history: state.history
            })
        );
    } catch (error) {
        console.error("Account saving error:", error);
        showToast("Could not save account data.");
    }
}

// Public interface for individual games.
// Games should use these methods instead of creating another wallet key.
window.VaultPlayAccount = {
    storageKey: STORAGE_KEY,

    get() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return normalizeAccount(saved ? JSON.parse(saved) : {});
        } catch (error) {
            console.error("Could not read shared account:", error);
            return normalizeAccount();
        }
    },

    updateBalance(newBalance, historyEntry = null) {
        const account = this.get();

        account.balance = Math.max(0, Number(newBalance) || 0);

        if (historyEntry) {
            account.history.unshift(historyEntry);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(account));

        Object.assign(state, account);
        updateBalance();

        return account;
    },

    addHistory(historyEntry) {
        const account = this.get();

        account.history.unshift(historyEntry);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(account));

        Object.assign(state, account);
        return account;
    }
};


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
    const balanceElement = $("#balance");

    if (balanceElement) {
        balanceElement.textContent = formatUSDT(state.balance);
    }
}


// Keep the lobby updated if a game changes the wallet in another tab.
window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;

    try {
        Object.assign(state, normalizeAccount(JSON.parse(event.newValue)));
        updateBalance();
        applyFilters();
    } catch (error) {
        console.error("Account synchronization error:", error);
    }
});


// ===================================
// NOTIFICATIONS
// ===================================

let toastTimer;

function showToast(message) {
    const toast = $("#toast");
    if (!toast) return;

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
    $("#depositModal")?.classList.remove("hidden");
    $("#depositAmount")?.focus();
}

function closeDeposit() {
    $("#depositModal")?.classList.add("hidden");
    $("#depositError")?.classList.add("hidden");
}

function virtualDeposit() {
    const input = $("#depositAmount");
    if (!input) return;

    const amount = Number(input.value);

    if (!Number.isFinite(amount) || amount <= 0) {
        $("#depositError")?.classList.remove("hidden");
        input.focus();
        return;
    }

    state.balance += amount;

    state.history.unshift({
        type: "deposit",
        amount,
        date: new Date().toISOString()
    });

    saveAccount();
    updateBalance();

    input.value = "";
    closeDeposit();

    showToast(`${formatUSDT(amount)} virtual USDT added successfully`);
}

function initializeDeposit() {
    $("#depositButton")?.addEventListener("click", openDeposit);
    $("#sidebarDeposit")?.addEventListener("click", openDeposit);
    $("#closeModal")?.addEventListener("click", closeDeposit);
    $("#confirmDeposit")?.addEventListener("click", virtualDeposit);

    $("#depositModal")?.addEventListener("click", (event) => {
        if (event.target === $("#depositModal")) {
            closeDeposit();
        }
    });

    $("#depositAmount")?.addEventListener("keydown", (event) => {
        if (event.key === "Enter") virtualDeposit();
        if (event.key === "Escape") closeDeposit();
    });

    $$(".quick-amounts button").forEach(button => {
        button.addEventListener("click", () => {
            $("#depositAmount").value = button.dataset.amount;
            $("#depositError")?.classList.add("hidden");
        });
    });
}


// ===================================
// FAVORITES
// ===================================

function initializeFavorites() {
    $$(".favorite-btn").forEach(button => {
        const card = button.closest(".game-card");
        if (!card) return;

        const gameName = card.dataset.name;

        function updateFavoriteButton() {
            const favorite = state.favorites.includes(gameName);

            button.classList.toggle("is-favorite", favorite);
            button.textContent = favorite ? "♥" : "♡";
        }

        updateFavoriteButton();

        button.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();

            const index = state.favorites.indexOf(gameName);

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
    const searchInput = $("#gameSearch");
    const emptyState = $("#emptyState");

    if (!searchInput) return;

    const searchTerm = searchInput.value.trim().toLowerCase();
    let visibleGames = 0;

    $$(".game-card").forEach(card => {
        const name = (card.dataset.name || "").toLowerCase();
        const category = card.dataset.category;

        const matchesSearch = name.includes(searchTerm);

        let matchesCategory = true;

        if (activeCategory === "originals") {
            matchesCategory = category === "originals";
        } else if (activeCategory === "table") {
            matchesCategory = category === "table";
        } else if (activeCategory === "favorites") {
            matchesCategory = state.favorites.includes(card.dataset.name);
        }

        const visible = matchesSearch && matchesCategory;

        card.classList.toggle("hidden", !visible);

        if (visible) visibleGames++;
    });

    emptyState?.classList.toggle("hidden", visibleGames > 0);
}

function initializeFilters() {
    $("#gameSearch")?.addEventListener("input", applyFilters);

    $$(".category").forEach(button => {
        button.addEventListener("click", () => {
            activeCategory = button.dataset.category;

            $$(".category").forEach(category => {
                category.classList.toggle("active", category === button);
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
                item.classList.toggle("active", item === button);
            });

            if (view === "originals") {
                activeCategory = "originals";
                $("#pageTitle").textContent = "Originals";
            } else if (view === "favorites") {
                activeCategory = "favorites";
                $("#pageTitle").textContent = "Favorites";
            } else {
                activeCategory = "all";
                $("#pageTitle").textContent = "Laboratory";
            }

            $$(".category").forEach(category => {
                category.classList.toggle(
                    "active",
                    category.dataset.category === activeCategory
                );
            });

            applyFilters();
            $("#sidebar")?.classList.remove("open");
        });
    });

    $("#mobileMenu")?.addEventListener("click", () => {
        $("#sidebar")?.classList.toggle("open");
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

document.addEventListener("DOMContentLoaded", initializeApp);
