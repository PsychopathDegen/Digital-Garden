
/* =========================================
   VAULTPLAY LABORATORY
   Main application
========================================= */

const STARTING_BALANCE = 0;

const STORAGE_KEYS = {
    balance: "vaultplay_balance_v1",
    history: "vaultplay_history_v1",
    favorites: "vaultplay_favorites_v1"
};

/* =========================================
   GAME ARTWORK
========================================= */

function makeArtwork(type, color = "#00e701", secondary = "#153b20") {
    const drawings = {

        plinko: `
            <g fill="#dce9de">
                ${[0, 1, 2, 3, 4].map(row =>
                    Array.from({ length: row + 3 }, (_, col) =>
                        `<circle cx="${100 + col * 25 - row * 12.5}" cy="${35 + row * 23}" r="3.2"/>`
                    ).join("")
                ).join("")}
            </g>
            <circle cx="100" cy="28" r="7" fill="${color}"/>
            <g fill="${color}">
                <rect x="48" y="145" width="15" height="8" rx="2"/>
                <rect x="70" y="145" width="15" height="8" rx="2"/>
                <rect x="92" y="145" width="15" height="8" rx="2"/>
                <rect x="114" y="145" width="15" height="8" rx="2"/>
                <rect x="136" y="145" width="15" height="8" rx="2"/>
            </g>`,

        limbo: `
            <path d="M100 28 L145 75 L100 122 L55 75 Z" fill="${secondary}" stroke="${color}" stroke-width="3"/>
            <path d="M100 42 L132 75 L100 108 L68 75 Z" fill="${color}" opacity=".28"/>
            <text x="100" y="83" text-anchor="middle" font-size="24" font-weight="900" fill="${color}">∞</text>`,

        mines: `
            ${Array.from({ length: 25 }, (_, i) => {
                const x = 49 + (i % 5) * 25;
                const y = 37 + Math.floor(i / 5) * 25;
                const mine = [2, 8, 16, 21].includes(i);
                return mine
                    ? `<circle cx="${x}" cy="${y}" r="8" fill="#f05b60"/><path d="M${x-4} ${y-4} L${x+4} ${y+4} M${x+4} ${y-4} L${x-4} ${y+4}" stroke="#fff" stroke-width="2"/>`
                    : `<rect x="${x-9}" y="${y-9}" width="18" height="18" rx="4" fill="${secondary}" stroke="${color}" stroke-width="1"/><path d="M${x-4} ${y} L${x-1} ${y+3} L${x+5} ${y-4}" fill="none" stroke="${color}" stroke-width="2"/>`;
            }).join("")}`,

        dice: `
            <g transform="rotate(-12 100 85)">
                <rect x="53" y="38" width="94" height="94" rx="15" fill="${color}"/>
                <g fill="#102014">
                    <circle cx="76" cy="61" r="7"/>
                    <circle cx="124" cy="61" r="7"/>
                    <circle cx="100" cy="85" r="7"/>
                    <circle cx="76" cy="109" r="7"/>
                    <circle cx="124" cy="109" r="7"/>
                </g>
            </g>`,

        keno: `
            ${Array.from({ length: 16 }, (_, i) => {
                const x = 53 + (i % 4) * 31;
                const y = 42 + Math.floor(i / 4) * 31;
                const active = [1, 3, 6, 9, 14].includes(i);
                return `<circle cx="${x}" cy="${y}" r="10" fill="${active ? color : secondary}" stroke="${active ? color : "#54705b"}"/><circle cx="${x}" cy="${y}" r="3" fill="${active ? "#102014" : "#9bb19f"}"/>`;
            }).join("")}`,

        wheel: `
            <circle cx="100" cy="87" r="62" fill="${secondary}" stroke="${color}" stroke-width="3"/>
            ${Array.from({ length: 8 }, (_, i) => `<path d="M100 87 L${100 + 60 * Math.cos(i * Math.PI / 4)} ${87 + 60 * Math.sin(i * Math.PI / 4)}" stroke="${color}" stroke-width="2"/>`).join("")}
            <circle cx="100" cy="87" r="17" fill="${color}"/>
            <path d="M100 15 L91 29 L109 29 Z" fill="#fff"/>`,

        flip: `
            <circle cx="100" cy="86" r="57" fill="${color}"/>
            <circle cx="100" cy="86" r="47" fill="none" stroke="#102014" stroke-width="2"/>
            <text x="100" y="99" text-anchor="middle" font-size="42" font-weight="900" fill="#102014">₮</text>`,

        tower: `
            ${Array.from({ length: 5 }, (_, row) => {
                const count = 5 - row;
                return Array.from({ length: count }, (_, col) => {
                    const x = 100 - count * 15 + col * 30;
                    const y = 36 + row * 23;
                    return `<rect x="${x-11}" y="${y}" width="22" height="17" rx="4" fill="${(row + col) % 3 === 0 ? color : secondary}" stroke="${color}" stroke-width="1"/>`;
                }).join("");
            }).join("")}`,

        diamonds: `
            <path d="M100 25 L151 78 L100 145 L49 78 Z" fill="${color}" opacity=".8"/>
            <path d="M100 25 L100 145 M49 78 L151 78 M100 25 L75 78 L100 145 L125 78 Z" fill="none" stroke="#e4ffe7" stroke-width="2"/>`,

        darts: `
            <circle cx="100" cy="85" r="55" fill="#203e27" stroke="${color}" stroke-width="3"/>
            <circle cx="100" cy="85" r="35" fill="none" stroke="#b8d7bd" stroke-width="2"/>
            <circle cx="100" cy="85" r="15" fill="${color}"/>
            <path d="M143 28 L102 81 L114 93 Z" fill="#e9f2eb"/>
            <path d="M143 28 L128 22 L138 42 Z" fill="${color}"/>`,

        moles: `
            <g fill="${secondary}" stroke="${color}" stroke-width="2">
                <ellipse cx="67" cy="64" rx="21" ry="16"/>
                <ellipse cx="133" cy="64" rx="21" ry="16"/>
                <ellipse cx="100" cy="112" rx="21" ry="16"/>
            </g>
            <g fill="${color}">
                <circle cx="61" cy="61" r="3"/><circle cx="73" cy="61" r="3"/>
                <circle cx="127" cy="61" r="3"/><circle cx="139" cy="61" r="3"/>
                <circle cx="94" cy="109" r="3"/><circle cx="106" cy="109" r="3"/>
            </g>`,

        pump: `
            <path d="M100 23 C65 65 62 85 100 135 C138 85 135 65 100 23Z" fill="${color}"/>
            <path d="M100 52 C82 78 83 91 100 113 C117 91 118 78 100 52Z" fill="#b6ffba"/>
            <path d="M65 142 L135 142" stroke="${color}" stroke-width="5" stroke-linecap="round"/>`,

        baccarat: `
            <rect x="42" y="38" width="57" height="80" rx="6" fill="#e8eee9" transform="rotate(-12 70 78)"/>
            <rect x="102" y="38" width="57" height="80" rx="6" fill="${color}" transform="rotate(12 130 78)"/>
            <text x="69" y="88" text-anchor="middle" font-size="27" fill="#b62f45">A</text>
            <text x="130" y="88" text-anchor="middle" font-size="27" fill="#102014">K</text>`,

        blackjack: `
            <rect x="45" y="38" width="64" height="88" rx="6" fill="#eaf0eb" transform="rotate(-12 75 82)"/>
            <rect x="100" y="38" width="64" height="88" rx="6" fill="#eaf0eb" transform="rotate(12 132 82)"/>
            <text x="72" y="92" text-anchor="middle" font-size="31" fill="#b72f45">A</text>
            <text x="132" y="92" text-anchor="middle" font-size="31" fill="#17251b">K</text>`,

        roulette: `
            <circle cx="100" cy="85" r="59" fill="#17291d" stroke="${color}" stroke-width="4"/>
            ${Array.from({ length: 12 }, (_, i) => `<path d="M100 85 L${100 + 56 * Math.cos(i * Math.PI / 6)} ${85 + 56 * Math.sin(i * Math.PI / 6)}" stroke="${i % 2 ? "#e34d52" : "#e7e9e7"}" stroke-width="7"/>`).join("")}
            <circle cx="100" cy="85" r="16" fill="${color}"/>`,

        poker: `
            <rect x="42" y="43" width="67" height="88" rx="7" fill="#e8eee9" transform="rotate(-10 75 87)"/>
            <rect x="96" y="37" width="67" height="88" rx="7" fill="#e8eee9" transform="rotate(10 130 81)"/>
            <text x="73" y="94" text-anchor="middle" font-size="30" fill="#c33c4b">A</text>
            <text x="129" y="89" text-anchor="middle" font-size="30" fill="#c33c4b">Q</text>`,

        cases: `
            <rect x="49" y="51" width="102" height="76" rx="9" fill="${secondary}" stroke="${color}" stroke-width="3"/>
            <path d="M49 70 L100 40 L151 70" fill="${color}" opacity=".6" stroke="${color}" stroke-width="3"/>
            <rect x="91" y="79" width="18" height="28" rx="3" fill="${color}"/>`,

        tome: `
            <path d="M45 45 Q73 34 100 55 Q127 34 155 45 L155 132 Q127 121 100 142 Q73 121 45 132 Z" fill="${secondary}" stroke="${color}" stroke-width="3"/>
            <path d="M100 55 L100 142" stroke="${color}" stroke-width="2"/>
            <path d="M62 70 L87 76 M62 87 L87 93 M113 76 L138 70 M113 93 L138 87" stroke="#b6d7bb" stroke-width="3" stroke-linecap="round"/>`
    };

    return `
        <svg viewBox="0 0 200 170" xmlns="http://www.w3.org/2000/svg"
             role="img" aria-label="${type} game artwork">
            ${drawings[type] || drawings.diamonds}
        </svg>
    `;
}

/* =========================================
   GAME COLLECTION
========================================= */

const games = [
    { id: "plinko", name: "Plinko", category: "originals", art: "plinko", color: "#00e701", subtitle: "Drop and multiply", playable: true },
    { id: "limbo", name: "Limbo", category: "originals", art: "limbo", color: "#27d6b5", subtitle: "Reach your target" },
    { id: "mines", name: "Mines", category: "originals", art: "mines", color: "#00e701", subtitle: "Find the safe tiles" },
    { id: "dice", name: "Dice", category: "originals", art: "dice", color: "#e2b34a", subtitle: "Roll your chance" },
    { id: "keno", name: "Keno", category: "originals", art: "keno", color: "#54c8ff", subtitle: "Pick your numbers" },
    { id: "wheel", name: "Wheel", category: "originals", art: "wheel", color: "#f1b94e", subtitle: "Spin the wheel" },
    { id: "flip", name: "Flip", category: "originals", art: "flip", color: "#00e701", subtitle: "Choose a side" },
    { id: "tower", name: "Dragon Tower", category: "originals", art: "tower", color: "#f07b3e", subtitle: "Climb the tower" },
    { id: "diamonds", name: "Diamonds", category: "originals", art: "diamonds", color: "#56d8e7", subtitle: "Find the diamonds" },
    { id: "darts", name: "Darts", category: "originals", art: "darts", color: "#f4b84a", subtitle: "Hit your target" },
    { id: "moles", name: "Moles", category: "originals", art: "moles", color: "#b5e66b", subtitle: "Catch the moles" },
    { id: "pump", name: "Pump", category: "originals", art: "pump", color: "#ed8b48", subtitle: "Build your multiplier" },

    { id: "baccarat", name: "Baccarat", category: "table", art: "baccarat", color: "#e5c36c", subtitle: "Player vs Banker" },
    { id: "blackjack", name: "Blackjack", category: "table", art: "blackjack", color: "#00e701", subtitle: "Beat the dealer" },
    { id: "roulette", name: "Roulette", category: "table", art: "roulette", color: "#e85c63", subtitle: "Place your bets" },
    { id: "poker", name: "Video Poker", category: "table", art: "poker", color: "#d5b5f1", subtitle: "Build your hand" },

    { id: "cases", name: "Cases", category: "other", art: "cases", color: "#d6aa54", subtitle: "Open a case" },
    { id: "tome", name: "Tome of Life", category: "other", art: "tome", color: "#a88cf0", subtitle: "Discover your fate" }
];

/* =========================================
   APPLICATION STATE
========================================= */

function loadNumber(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        if (value === null) return fallback;

        const number = Number(value);
        return Number.isFinite(number) && number >= 0 ? number : fallback;
    } catch (error) {
        return fallback;
    }
}

function loadArray(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(value) ? value : [];
    } catch (error) {
        return [];
    }
}

let balance = loadNumber(STORAGE_KEYS.balance, STARTING_BALANCE);
let history = loadArray(STORAGE_KEYS.history);
let favorites = loadArray(STORAGE_KEYS.favorites);

let currentFilter = "all";
let currentSearch = "";

/* =========================================
   SAVE FUNCTIONS
========================================= */

function saveBalance() {
    localStorage.setItem(STORAGE_KEYS.balance, String(balance));
    updateBalanceDisplay();
}

function saveHistory() {
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
}

function saveFavorites() {
    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites));
}

/* =========================================
   BALANCE DISPLAY
========================================= */

function formatUSDT(amount) {
    return Number(amount).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function updateBalanceDisplay() {
    const topBalance = document.getElementById("topBalance");
    const modalBalance = document.getElementById("modalBalance");

    if (topBalance) {
        topBalance.textContent = formatUSDT(balance);
    }

    if (modalBalance) {
        modalBalance.textContent = `${formatUSDT(balance)} USDT`;
    }
}

/* =========================================
   TRANSACTION HISTORY
========================================= */

function addHistory(description, amount, type) {
    history.unshift({
        id: Date.now() + Math.random(),
        description,
        amount: Number(amount),
        type,
        date: new Date().toISOString()
    });

    history = history.slice(0, 100);

    saveHistory();
    renderHistory();
}

function renderHistory() {
    const historyList = document.getElementById("historyList");

    if (!historyList) return;

    if (history.length === 0) {
        historyList.innerHTML = `
            <div class="history-empty">
                No transactions yet.
            </div>
        `;
        return;
    }

    historyList.innerHTML = history.map(item => {
        const isCredit = item.type === "credit";
        const date = new Date(item.date);

        return `
            <div class="history-item">
                <div>
                    <strong>${escapeHTML(item.description)}</strong>
                    <small>${date.toLocaleString()}</small>
                </div>

                <div class="history-amount ${isCredit ? "credit" : "debit"}">
                    ${isCredit ? "+" : "-"}${formatUSDT(item.amount)} USDT
                </div>
            </div>
        `;
    }).join("");
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

/* =========================================
   GAME RENDERING
========================================= */

function renderGames() {
    const grid = document.getElementById("gamesGrid");
    const emptyState = document.getElementById("emptyState");

    let filteredGames = [...games];

    if (currentFilter === "favorites") {
        filteredGames = filteredGames.filter(game =>
            favorites.includes(game.id)
        );
    } else if (currentFilter !== "all") {
        filteredGames = filteredGames.filter(game =>
            game.category === currentFilter
        );
    }

    if (currentSearch.trim()) {
        const query = currentSearch.toLowerCase().trim();

        filteredGames = filteredGames.filter(game =>
            game.name.toLowerCase().includes(query) ||
            game.subtitle.toLowerCase().includes(query)
        );
    }

    document.getElementById("favoriteCount").textContent = favorites.length;

    if (filteredGames.length === 0) {
        grid.innerHTML = "";
        emptyState.classList.remove("hidden");
        return;
    }

    emptyState.classList.add("hidden");

    grid.innerHTML = filteredGames.map(game => {
        const isFavorite = favorites.includes(game.id);
        const destination = game.playable
            ? "games/plinko.html"
            : "#";

        return `
            <article class="game-card"
                style="--art-bg:${game.color}12; --art-glow:${game.color};">

                <a class="game-card-link"
                   href="${destination}"
                   ${game.playable ? "" : 'data-unavailable="true"'}
                   aria-label="Open ${escapeHTML(game.name)}">

                    <div class="game-art">
                        ${makeArtwork(game.art, game.color)}
                    </div>

                    <div class="game-card-info">
                        <div>
                            <h3>${escapeHTML(game.name)}</h3>
                            <p>${escapeHTML(game.subtitle)}</p>
                        </div>
                    </div>
                </a>

                <button
                    class="favorite-button ${isFavorite ? "selected" : ""}"
                    data-favorite="${game.id}"
                    aria-label="${isFavorite ? "Remove from" : "Add to"} favorites"
                    title="${isFavorite ? "Remove favorite" : "Add favorite"}"
                    style="position:absolute; right:9px; top:9px;">
                    ${isFavorite ? "★" : "☆"}
                </button>
            </article>
        `;
    }).join("");
}

/* =========================================
   FILTERS AND SEARCH
========================================= */

function setFilter(filter) {
    currentFilter = filter;

    document.querySelectorAll(".filter-button").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.filter === filter
        );
    });

    document.querySelectorAll(".category-shortcut").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.category === filter
        );
    });

    const titles = {
        all: "All Games",
        originals: "Originals",
        table: "Table Games",
        other: "Other Games",
        favorites: "Favorites"
    };

    document.getElementById("sectionTitle").textContent =
        titles[filter] || "All Games";

    renderGames();

    document.getElementById("gamesSection").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

document.querySelectorAll(".filter-button").forEach(button => {
    button.addEventListener("click", () => {
        setFilter(button.dataset.filter);
    });
});

document.querySelectorAll(".category-shortcut").forEach(button => {
    button.addEventListener("click", () => {
        setFilter(button.dataset.category);
        closeSidebar();
    });
});

document.getElementById("gameSearch").addEventListener("input", event => {
    currentSearch = event.target.value;
    renderGames();
});

/* =========================================
   FAVORITES
========================================= */

document.getElementById("gamesGrid").addEventListener("click", event => {
    const favoriteButton = event.target.closest("[data-favorite]");

    if (favoriteButton) {
        event.preventDefault();
        event.stopPropagation();

        const id = favoriteButton.dataset.favorite;

        if (favorites.includes(id)) {
            favorites = favorites.filter(item => item !== id);
        } else {
            favorites.push(id);
        }

        saveFavorites();
        renderGames();
    }

    const unavailableLink = event.target.closest('[data-unavailable="true"]');

    if (unavailableLink) {
        event.preventDefault();
    }
});

document.getElementById("favoritesShortcut").addEventListener("click", () => {
    setFilter("favorites");
    closeSidebar();
});

/* =========================================
   MODAL CONTROLS
========================================= */

function openModal(id) {
    const modal = document.getElementById(id);

    if (modal) {
        modal.classList.add("show");
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);

    if (modal) {
        modal.classList.remove("show");
    }
}

document.getElementById("openWallet").addEventListener("click", () => {
    updateBalanceDisplay();
    document.getElementById("depositError").textContent = "";
    openModal("walletModal");
});

document.getElementById("historyShortcut").addEventListener("click", () => {
    renderHistory();
    openModal("historyModal");
    closeSidebar();
});

document.querySelectorAll("[data-close]").forEach(button => {
    button.addEventListener("click", () => {
        closeModal(button.dataset.close);
    });
});

document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", event => {
        if (event.target === overlay) {
            overlay.classList.remove("show");
        }
    });
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        document.querySelectorAll(".modal-overlay.show").forEach(modal => {
            modal.classList.remove("show");
        });

        closeSidebar();
    }
});

/* =========================================
   VIRTUAL DEPOSIT
========================================= */

document.getElementById("confirmDeposit").addEventListener("click", () => {
    const input = document.getElementById("depositAmount");
    const error = document.getElementById("depositError");

    const amount = Number(input.value);

    error.textContent = "";

    if (!Number.isFinite(amount) || amount <= 0) {
        error.textContent = "Enter a valid deposit amount.";
        return;
    }

    if (amount > 1000000000) {
        error.textContent = "Maximum virtual deposit is 1,000,000,000 USDT.";
        return;
    }

    if (!Number.isFinite(balance + amount)) {
        error.textContent = "The resulting balance is too large.";
        return;
    }

    balance = Math.round((balance + amount) * 100) / 100;

    saveBalance();

    addHistory("Virtual deposit", amount, "credit");

    input.value = "";

    closeModal("walletModal");
});

document.getElementById("depositAmount").addEventListener("keydown", event => {
    if (event.key === "Enter") {
        document.getElementById("confirmDeposit").click();
    }
});

/* =========================================
   MOBILE SIDEBAR
========================================= */

const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");

function openSidebar() {
    sidebar.classList.add("open");
    sidebarOverlay.classList.add("show");
}

function closeSidebar() {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("show");
}

document.getElementById("mobileMenu").addEventListener("click", openSidebar);
sidebarOverlay.addEventListener("click", closeSidebar);

/* =========================================
   INITIALIZE
========================================= */

updateBalanceDisplay();
renderGames();
renderHistory();
