
"use strict";

/* =========================================
   VAULTPLAY - MAIN APPLICATION
========================================= */

const STORAGE = {
    balance: "vaultplay_balance_v1",
    favorites: "vaultplay_favorites_v1",
    history: "vaultplay_history_v1"
};

const STARTING_BALANCE = 1000;

let balance = Number(localStorage.getItem(STORAGE.balance));

if (!Number.isFinite(balance) || balance < 0) {
    balance = STARTING_BALANCE;
}

let favorites = JSON.parse(
    localStorage.getItem(STORAGE.favorites) || "[]"
);

let history = JSON.parse(
    localStorage.getItem(STORAGE.history) || "[]"
);

let activeFilter = "all";
let searchTerm = "";


/* =========================================
   GAME ARTWORK
========================================= */

const artwork = {

    plinko: `
        <svg viewBox="0 0 220 135" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="plinkoBg">
                    <stop stop-color="#23552c"/>
                    <stop offset="1" stop-color="#102219"/>
                </radialGradient>
            </defs>
            <rect width="220" height="135" fill="url(#plinkoBg)"/>
            <g fill="#a6dca8">
                <circle cx="95" cy="20" r="3"/><circle cx="125" cy="20" r="3"/>
                <circle cx="80" cy="40" r="3"/><circle cx="110" cy="40" r="3"/><circle cx="140" cy="40" r="3"/>
                <circle cx="65" cy="60" r="3"/><circle cx="95" cy="60" r="3"/><circle cx="125" cy="60" r="3"/><circle cx="155" cy="60" r="3"/>
                <circle cx="50" cy="80" r="3"/><circle cx="80" cy="80" r="3"/><circle cx="110" cy="80" r="3"/><circle cx="140" cy="80" r="3"/><circle cx="170" cy="80" r="3"/>
                <circle cx="35" cy="100" r="3"/><circle cx="65" cy="100" r="3"/><circle cx="95" cy="100" r="3"/><circle cx="125" cy="100" r="3"/><circle cx="155" cy="100" r="3"/><circle cx="185" cy="100" r="3"/>
            </g>
            <circle cx="110" cy="10" r="7" fill="#fff" stroke="#00e701" stroke-width="3"/>
            <g fill="#00e701">
                <rect x="26" y="117" width="24" height="10" rx="2"/>
                <rect x="53" y="117" width="24" height="10" rx="2"/>
                <rect x="80" y="117" width="24" height="10" rx="2"/>
                <rect x="107" y="117" width="24" height="10" rx="2"/>
                <rect x="134" y="117" width="24" height="10" rx="2"/>
                <rect x="161" y="117" width="24" height="10" rx="2"/>
            </g>
        </svg>`,

    limbo: `
        <svg viewBox="0 0 220 135" xmlns="http://www.w3.org/2000/svg">
            <rect width="220" height="135" fill="#241638"/>
            <circle cx="110" cy="68" r="48" fill="#6134a3" opacity=".25"/>
            <path d="M25 110 L75 72 L112 89 L190 24" fill="none" stroke="#bd8cff" stroke-width="5" stroke-linecap="round"/>
            <path d="M25 110 L75 72 L112 89 L190 24" fill="none" stroke="#fff" stroke-width="1" opacity=".5"/>
            <text x="110" y="43" text-anchor="middle" fill="#fff" font-size="24" font-weight="bold">100x</text>
            <circle cx="190" cy="24" r="7" fill="#cba3ff"/>
        </svg>`,

    mines: `
        <svg viewBox="0 0 220 135" xmlns="http://www.w3.org/2000/svg">
            <rect width="220" height="135" fill="#2c2119"/>
            <g transform="translate(55 14)">
                ${Array.from({length:25},(_,i)=>{
                    const x=(i%5)*23, y=Math.floor(i/5)*23;
                    return `<rect x="${x}" y="${y}" width="19" height="19" rx="4" fill="#59402d" stroke="#805d39"/>`;
                }).join("")}
            </g>
            <circle cx="89" cy="72" r="8" fill="#ffcc54"/>
            <path d="M89 58 L89 48 M89 96 L89 86 M75 72 L65 72 M113 72 L103 72 M79 62 L71 54 M107 90 L99 82 M99 62 L107 54 M71 90 L79 82" stroke="#ffcc54" stroke-width="3" stroke-linecap="round"/>
            <circle cx="135" cy="49" r="5" fill="#ffcc54"/>
        </svg>`,

    dice: `
        <svg viewBox="0 0 220 135" xmlns="http://www.w3.org/2000/svg">
            <rect width="220" height="135" fill="#202d39"/>
            <g transform="translate(48 35) rotate(-13 40 35)">
                <rect width="68" height="68" rx="12" fill="#e9edf1"/>
                <g fill="#273444">
                    <circle cx="17" cy="17" r="5"/><circle cx="51" cy="51" r="5"/><circle cx="17" cy="51" r="5"/><circle cx="51" cy="17" r="5"/>
                </g>
            </g>
            <g transform="translate(112 28) rotate(12 40 35)">
                <rect width="68" height="68" rx="12" fill="#00e701"/>
                <g fill="#102012">
                    <circle cx="17" cy="17" r="5"/><circle cx="51" cy="51" r="5"/><circle cx="17" cy="51" r="5"/><circle cx="51" cy="17" r="5"/><circle cx="34" cy="34" r="5"/>
                </g>
            </g>
        </svg>`,

    keno: `
        <svg viewBox="0 0 220 135" xmlns="http://www.w3.org/2000/svg">
            <rect width="220" height="135" fill="#123437"/>
            <g fill="#147f79">
                ${Array.from({length:20},(_,i)=>{
                    return `<circle cx="${42+(i%5)*34}" cy="${26+Math.floor(i/5)*26}" r="12"/>`;
                }).join("")}
            </g>
            <g fill="#fff" font-size="9" text-anchor="middle">
                <text x="42" y="29">4</text><text x="76" y="29">9</text>
                <text x="110" y="29">12</text><text x="144" y="29">21</text>
                <text x="178" y="29">30</text>
                <text x="76" y="55">15</text><text x="144" y="81">36</text>
            </g>
            <circle cx="110" cy="78" r="13" fill="#00e701"/>
            <text x="110" y="82" text-anchor="middle" fill="#102012" font-size="10" font-weight="bold">18</text>
        </svg>`,

    wheel: `
        <svg viewBox="0 0 220 135" xmlns="http://www.w3.org/2000/svg">
            <rect width="220" height="135" fill="#30251a"/>
            <circle cx="110" cy="68" r="55" fill="#d7a53b"/>
            <circle cx="110" cy="68" r="48" fill="#203c2a"/>
            ${Array.from({length:8},(_,i)=>{
                return `<path d="M110 68 L${110+48*Math.cos(i*Math.PI/4)} ${68+48*Math.sin(i*Math.PI/4)}" stroke="#e6bd65" stroke-width="2"/>`;
            }).join("")}
            <circle cx="110" cy="68" r="13" fill="#e3bd6a"/>
            <path d="M110 5 L101 19 L119 19 Z" fill="#fff"/>
        </svg>`,

    flip: `
        <svg viewBox="0 0 220 135" xmlns="http://www.w3.org/2000/svg">
            <rect width="220" height="135" fill="#292419"/>
            <g transform="translate(57 22) rotate(-12 40 45)">
                <rect width="75" height="90" rx="8" fill="#d9ae50"/>
                <circle cx="37" cy="45" r="24" fill="#f8df9c"/>
                <text x="37" y="54" font-size="28" text-anchor="middle" fill="#80571b">★</text>
            </g>
            <g transform="translate(112 22) rotate(12 40 45)">
                <rect width="75" height="90" rx="8" fill="#eee6d3"/>
                <circle cx="37" cy="45" r="24" fill="#d2c6ae"/>
                <text x="37" y="54" font-size="28" text-anchor="middle" fill="#a33b3b">♦</text>
            </g>
        </svg>`,

    tower: `
        <svg viewBox="0 0 220 135" xmlns="http://www.w3.org/2000/svg">
            <rect width="220" height="135" fill="#30241c"/>
            <path d="M75 115 L75 45 L110 15 L145 45 L145 115 Z" fill="#9a6637" stroke="#d49a55" stroke-width="3"/>
            <path d="M92 115 L92 66 L110 48 L128 66 L128 115" fill="#4c3022"/>
            <path d="M65 48 L110 10 L155 48" fill="none" stroke="#e0b477" stroke-width="6"/>
            <path d="M95 40 L110 28 L125 40" fill="none" stroke="#f0d6a2" stroke-width="3"/>
        </svg>`,

    diamonds: `
        <svg viewBox="0 0 220 135" xmlns="http://www.w3.org/2000/svg">
            <rect width="220" height="135" fill="#12333b"/>
            <g fill="#39e3d5" stroke="#b3fff8" stroke-width="2">
                <path d="M110 15 L145 55 L110 112 L75 55 Z"/>
                <path d="M110 15 L110 112 L75 55 Z" fill="#168e94"/>
                <path d="M110 15 L145 55 L110 55 Z" fill="#8bfff0"/>
            </g>
            <circle cx="110" cy="60" r="44" fill="none" stroke="#65dcd1" opacity=".3"/>
        </svg>`,

    darts: `
        <svg viewBox="0 0 220 135" xmlns="http://www.w3.org/2000/svg">
            <rect width="220" height="135" fill="#302020"/>
            <circle cx="110" cy="68" r="51" fill="#e5e3d8"/>
            <circle cx="110" cy="68" r="41" fill="#c74742"/>
            <circle cx="110" cy="68" r="28" fill="#e8e1cf"/>
            <circle cx="110" cy="68" r="17" fill="#c74742"/>
            <circle cx="110" cy="68" r="7" fill="#e3c45d"/>
            <path d="M110 5 L110 68" stroke="#fff" stroke-width="3"/>
        </svg>`,

    moles: `
        <svg viewBox="0 0 220 135" xmlns="http://www.w3.org/2000/svg">
            <rect width="220" height="135" fill="#33251c"/>
            ${[0,1,2].map((n)=>`<ellipse cx="${60+n*50}" cy="100" rx="22" ry="14" fill="#795333"/>`).join("")}
            <circle cx="110" cy="64" r="27" fill="#ad7951"/>
            <circle cx="100" cy="58" r="4" fill="#241b16"/>
            <circle cx="120" cy="58" r="4" fill="#241b16"/>
            <ellipse cx="110" cy="72" rx="9" ry="6" fill="#4c2c20"/>
            <circle cx="110" cy="49" r="9" fill="#c18c64"/>
        </svg>`,

    pump: `
        <svg viewBox="0 0 220 135" xmlns="http://www.w3.org/2000/svg">
            <rect width="220" height="135" fill="#17321e"/>
            <path d="M110 111 C35 70 70 12 110 50 C150 12 185 70 110 111" fill="#00b95b" stroke="#67ee91" stroke-width="3"/>
            <path d="M110 111 L110 60" stroke="#c7f7cf" stroke-width="3"/>
            <circle cx="110" cy="68" r="18" fill="#a4ff9b" opacity=".6"/>
        </svg>`,

    baccarat: `
        <svg viewBox="0 0 220 135" xmlns="http://www.w3.org/2000/svg">
            <rect width="220" height="135" fill="#36191e"/>
            <rect x="48" y="28" width="55" height="78" rx="5" fill="#e7e2d9" transform="rotate(-12 75 67)"/>
            <rect x="117" y="28" width="55" height="78" rx="5" fill="#e7e2d9" transform="rotate(12 145 67)"/>
            <text x="75" y="76" font-size="28" fill="#bd363d" text-anchor="middle">♥</text>
            <text x="145" y="76" font-size="28" fill="#263a63" text-anchor="middle">♠</text>
        </svg>`,

    blackjack: `
        <svg viewBox="0 0 220 135" xmlns="http://www.w3.org/2000/svg">
            <rect width="220" height="135" fill="#123c2a"/>
            <rect x="58" y="26" width="65" height="86" rx="5" fill="#f3eee2" transform="rotate(-12 90 69)"/>
            <rect x="105" y="26" width="65" height="86" rx="5" fill="#f3eee2" transform="rotate(12 135 69)"/>
            <text x="86" y="59" font-size="17" fill="#c63c3c">A</text>
            <text x="142" y="59" font-size="17" fill="#222">K</text>
            <text x="110" y="100" font-size="23" fill="#e9c85c" text-anchor="middle">21</text>
        </svg>`,

    roulette: `
        <svg viewBox="0 0 220 135" xmlns="http://www.w3.org/2000/svg">
            <rect width="220" height="135" fill="#172c20"/>
            <circle cx="110" cy="68" r="54" fill="#d2a84d"/>
            <circle cx="110" cy="68" r="47" fill="#1c2921"/>
            ${Array.from({length:12},(_,i)=>`<path d="M110 68 L${110+47*Math.cos(i*Math.PI/6)} ${68+47*Math.sin(i*Math.PI/6)}" stroke="${i%2?"#b52d35":"#e8e0cb"}" stroke-width="9"/>`).join("")}
            <circle cx="110" cy="68" r="15" fill="#d3ae60"/>
        </svg>`,

    poker: `
        <svg viewBox="0 0 220 135" xmlns="http://www.w3.org/2000/svg">
            <rect width="220" height="135" fill="#27313d"/>
            <rect x="47" y="23" width="55" height="85" rx="5" fill="#f2eee5" transform="rotate(-15 75 65)"/>
            <rect x="83" y="23" width="55" height="85" rx="5" fill="#f2eee5"/>
            <rect x="119" y="23" width="55" height="85" rx="5" fill="#f2eee5" transform="rotate(15 145 65)"/>
            <g fill="#c33c42" font-size="27" text-anchor="middle">
                <text x="75" y="75">♥</text><text x="110" y="75">♦</text><text x="145" y="75">♣</text>
            </g>
        </svg>`,

    cases: `
        <svg viewBox="0 0 220 135" xmlns="http://www.w3.org/2000/svg">
            <rect width="220" height="135" fill="#32291d"/>
            <rect x="55" y="40" width="110" height="70" rx="8" fill="#976b35" stroke="#d5ad67" stroke-width="4"/>
            <path d="M55 59 L165 59" stroke="#e5c27e" stroke-width="3"/>
            <rect x="100" y="57" width="20" height="18" rx="3" fill="#e7c66e"/>
            <path d="M110 75 L110 91" stroke="#5c421f" stroke-width="4"/>
            <circle cx="110" cy="22" r="10" fill="#e7c66e"/>
        </svg>`,

    tome: `
        <svg viewBox="0 0 220 135" xmlns="http://www.w3.org/2000/svg">
            <rect width="220" height="135" fill="#30261d"/>
            <path d="M45 30 Q80 18 110 35 Q140 18 175 30 L175 108 Q140 96 110 112 Q80 96 45 108 Z" fill="#e5d1a2" stroke="#ad8c54" stroke-width="4"/>
            <path d="M110 35 L110 112" stroke="#ad8c54" stroke-width="3"/>
            <path d="M60 49 L94 49 M60 61 L94 61 M60 73 L94 73 M126 49 L160 49 M126 61 L160 61 M126 73 L160 73" stroke="#a88d60" stroke-width="2"/>
            <text x="110" y="94" text-anchor="middle" font-size="18" fill="#946f3f">✦</text>
        </svg>`
};


/* =========================================
   GAME COLLECTION
========================================= */

const games = [
    { id: "plinko", name: "Plinko", category: "Originals", group: "originals", playable: true },
    { id: "limbo", name: "Limbo", category: "Originals", group: "originals" },
    { id: "mines", name: "Mines", category: "Originals", group: "originals" },
    { id: "dice", name: "Dice", category: "Originals", group: "originals" },
    { id: "keno", name: "Keno", category: "Originals", group: "originals" },
    { id: "wheel", name: "Wheel", category: "Originals", group: "originals" },
    { id: "flip", name: "Flip", category: "Originals", group: "originals" },
    { id: "tower", name: "Dragon Tower", category: "Originals", group: "originals" },
    { id: "diamonds", name: "Diamonds", category: "Originals", group: "originals" },
    { id: "darts", name: "Darts", category: "Originals", group: "originals" },
    { id: "moles", name: "Moles", category: "Originals", group: "originals" },
    { id: "pump", name: "Pump", category: "Originals", group: "originals" },
    { id: "baccarat", name: "Baccarat", category: "Table Games", group: "table" },
    { id: "blackjack", name: "Blackjack", category: "Table Games", group: "table" },
    { id: "roulette", name: "Roulette", category: "Table Games", group: "table" },
    { id: "poker", name: "Video Poker", category: "Table Games", group: "table" },
    { id: "cases", name: "Cases", category: "Originals", group: "originals" },
    { id: "tome", name: "Tome of Life", category: "Originals", group: "originals" }
];


/* =========================================
   FORMAT AND STORAGE
========================================= */

function formatBalance(value) {
    return value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function saveBalance() {
    localStorage.setItem(STORAGE.balance, String(balance));
    updateBalanceDisplay();
}

function updateBalanceDisplay() {
    document.getElementById("topBalance").textContent =
        formatBalance(balance);

    document.getElementById("modalBalance").textContent =
        formatBalance(balance) + " USDT";
}

function saveFavorites() {
    localStorage.setItem(
        STORAGE.favorites,
        JSON.stringify(favorites)
    );
}

function saveHistory() {
    localStorage.setItem(
        STORAGE.history,
        JSON.stringify(history.slice(0, 50))
    );
}


/* =========================================
   RENDER GAME CARDS
========================================= */

function renderGames() {
    const grid = document.getElementById("gamesGrid");
    const empty = document.getElementById("emptyState");

    const filteredGames = games.filter(game => {

        const matchesSearch =
            game.name.toLowerCase().includes(searchTerm) ||
            game.category.toLowerCase().includes(searchTerm);

        let matchesFilter = true;

        if (activeFilter === "favorites") {
            matchesFilter = favorites.includes(game.id);
        } else if (activeFilter !== "all") {
            matchesFilter = game.group === activeFilter;
        }

        return matchesSearch && matchesFilter;
    });

    document.getElementById("gameCount").textContent =
        `${filteredGames.length} GAMES`;

    grid.innerHTML = filteredGames.map(game => {

        const isFavorite = favorites.includes(game.id);

        const cardContent = `
            <div class="game-art">
                ${artwork[game.id] || ""}
            </div>

            <div class="game-card-info">
                <div class="game-card-title">${game.name}</div>
                <div class="game-card-category">${game.category}</div>

                <div class="game-card-footer">
                    ${
                        game.playable
                            ? '<span class="playing-label">PLAY NOW →</span>'
                            : '<span class="coming-soon">COMING SOON</span>'
                    }
                </div>
            </div>
        `;

        return `
            <article class="game-card">

                <button
                    class="favorite-button ${isFavorite ? "selected" : ""}"
                    data-favorite="${game.id}"
                    aria-label="Toggle ${game.name} favorite"
                    title="Add to favorites"
                >${isFavorite ? "♥" : "♡"}</button>

                ${
                    game.playable
                        ? `<a class="game-link" href="games/plinko.html">${cardContent}</a>`
                        : `<div class="game-link disabled">${cardContent}</div>`
                }

            </article>
        `;

    }).join("");

    empty.hidden = filteredGames.length !== 0;
}


/* =========================================
   FILTERS AND SEARCH
========================================= */

function setFilter(filter) {
    activeFilter = filter;

    document.querySelectorAll("[data-filter]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.filter === filter
        );
    });

    renderGames();
}

document.querySelectorAll("[data-filter]").forEach(button => {
    button.addEventListener("click", () => {
        setFilter(button.dataset.filter);
    });
});

document.getElementById("gameSearch").addEventListener("input", event => {
    searchTerm = event.target.value.trim().toLowerCase();
    renderGames();
});


/* =========================================
   FAVORITES
========================================= */

document.getElementById("gamesGrid").addEventListener("click", event => {

    const button = event.target.closest("[data-favorite]");

    if (!button) return;

    event.preventDefault();

    const gameId = button.dataset.favorite;

    if (favorites.includes(gameId)) {
        favorites = favorites.filter(id => id !== gameId);
    } else {
        favorites.push(gameId);
    }

    saveFavorites();
    renderGames();
});


/* =========================================
   WALLET MODAL
========================================= */

function openModal(id) {
    document.getElementById(id).classList.add("show");
}

function closeModal(id) {
    document.getElementById(id).classList.remove("show");
}

document.getElementById("openWallet").addEventListener("click", () => {
    openModal("walletModal");
});

document.getElementById("topWallet").addEventListener("click", () => {
    openModal("walletModal");
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

document.getElementById("addCredits").addEventListener("click", () => {

    balance += 1000;

    saveBalance();

    addHistory(
        "Demo credits added",
        1000,
        "credit"
    );

});


/* =========================================
   VIRTUAL BET HISTORY
========================================= */

function addHistory(description, amount, type) {

    history.unshift({
        description,
        amount,
        type,
        date: new Date().toLocaleString()
    });

    saveHistory();
    renderHistory();
}

function renderHistory() {

    const list = document.getElementById("historyList");

    if (!history.length) {
        list.innerHTML = '<p class="no-history">No activity yet.</p>';
        return;
    }

    list.innerHTML = history.map(item => {

        const positive = item.amount >= 0;

        return `
            <div class="history-row">
                <div>
                    <strong>${escapeHTML(item.description)}</strong>
                    <small>${escapeHTML(item.date)}</small>
                </div>

                <div class="history-amount ${positive ? "positive" : "negative"}">
                    ${positive ? "+" : ""}${formatBalance(item.amount)}
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

document.getElementById("historyButton").addEventListener("click", () => {
    renderHistory();
    openModal("historyModal");
});


/* =========================================
   MOBILE SIDEBAR
========================================= */

document.getElementById("mobileMenu").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
});

document.querySelectorAll(".sidebar .nav-item").forEach(button => {
    button.addEventListener("click", () => {
        document.getElementById("sidebar").classList.remove("open");
    });
});


/* =========================================
   INITIALIZE VAULTPLAY
========================================= */

updateBalanceDisplay();
renderGames();
renderHistory();
