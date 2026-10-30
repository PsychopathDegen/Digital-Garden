
"use strict";

/* ==========================================
   VAULTPLAY — MAIN WEBSITE ENGINE
   Virtual entertainment simulator only.
========================================== */

const VaultPlay = (() => {
  const STORAGE = {
    wallet: "vaultplay-account-v1",
    favorites: "vaultplay-favorites-v1",
    history: "vaultplay-history-v1"
  };

  const games = [
    {
      id: "plinko",
      name: "Plinko",
      description: "Drop the ball and chase multipliers.",
      category: "instant",
      art: "plinko",
      symbol: "◉",
      page: "games/plinko.html"
    },
    {
      id: "limbo",
      name: "Limbo",
      description: "Predict the multiplier.",
      category: "instant",
      art: "limbo",
      symbol: "↗"
    },
    {
      id: "mines",
      name: "Mines",
      description: "Find gems. Avoid the mines.",
      category: "instant",
      art: "mines",
      symbol: "💎"
    },
    {
      id: "dice",
      name: "Dice",
      description: "Choose your target and roll.",
      category: "instant",
      art: "dice",
      symbol: "⚄"
    },
    {
      id: "keno",
      name: "Keno",
      description: "Pick numbers and see what hits.",
      category: "instant",
      art: "keno",
      symbol: "▦"
    },
    {
      id: "blackjack",
      name: "Blackjack",
      description: "Beat the dealer to 21.",
      category: "table",
      art: "blackjack",
      symbol: "♠"
    },
    {
      id: "roulette",
      name: "Roulette",
      description: "Place your bets on the wheel.",
      category: "table",
      art: "roulette",
      symbol: "◉"
    },
    {
      id: "baccarat",
      name: "Baccarat",
      description: "Player, banker or tie.",
      category: "table",
      art: "baccarat",
      symbol: "♦"
    },
    {
      id: "dragon-tower",
      name: "Dragon Tower",
      description: "Climb the tower and choose wisely.",
      category: "instant",
      art: "dragon",
      symbol: "♜"
    },
    {
      id: "moles",
      name: "Moles",
      description: "Find the winning spots.",
      category: "instant",
      art: "moles",
      symbol: "●"
    },
    {
      id: "flip",
      name: "Flip",
      description: "Heads or tails?",
      category: "instant",
      art: "flip",
      symbol: "◐"
    },
    {
      id: "wheel",
      name: "Wheel",
      description: "Spin for a multiplier.",
      category: "instant",
      art: "wheel",
      symbol: "◉"
    },
    {
      id: "pump",
      name: "Pump",
      description: "Build the multiplier before it pops.",
      category: "instant",
      art: "pump",
      symbol: "◈"
    },
    {
      id: "diamonds",
      name: "Diamonds",
      description: "Reveal diamonds and multipliers.",
      category: "instant",
      art: "diamonds",
      symbol: "◆"
    },
    {
      id: "darts",
      name: "Darts",
      description: "Aim carefully and hit your target.",
      category: "instant",
      art: "darts",
      symbol: "◎"
    },
    {
      id: "cases",
      name: "Cases",
      description: "Open a case and reveal a reward.",
      category: "slots",
      art: "cases",
      symbol: "▣"
    },
    {
      id: "tome-of-life",
      name: "Tome of Life",
      description: "A themed reel and bonus game.",
      category: "slots",
      art: "tome",
      symbol: "▤"
    },
    {
      id: "video-poker",
      name: "Video Poker",
      description: "Build the best five-card hand.",
      category: "table",
      art: "videopoker",
      symbol: "♣"
    }
  ];

  let balance = 0;
  let favorites = [];
  let history = [];
  let currentPage = "casino";
  let currentFilter = "all";
  let searchTerm = "";

  const $ = selector => document.querySelector(selector);

  function readStorage(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("VaultPlay storage error:", error);
      showToast("Could not save data in this browser.");
    }
  }

  function loadData() {
    const wallet = readStorage(STORAGE.wallet, { balance: 0 });
    balance = Number(wallet?.balance);

    if (!Number.isFinite(balance) || balance < 0) {
      balance = 0;
    }

    favorites = readStorage(STORAGE.favorites, []);
    history = readStorage(STORAGE.history, []);

    if (!Array.isArray(favorites)) favorites = [];
    if (!Array.isArray(history)) history = [];

    updateBalanceDisplay();
  }

  function saveBalance() {
    writeStorage(STORAGE.wallet, { balance });
    updateBalanceDisplay();
  }

  function updateBalanceDisplay() {
    const formatted = balance.toFixed(2);

    const header = $("#header-balance");
    if (header) header.textContent = formatted;
  }

  function getBalance() {
    return balance;
  }

  function setBalance(amount) {
    const next = Number(amount);

    if (!Number.isFinite(next) || next < 0) {
      throw new Error("Invalid wallet balance.");
    }

    balance = Math.round(next * 100000000) / 100000000;
    saveBalance();

    return balance;
  }

  function addFunds(amount) {
    const value = Number(amount);

    if (!Number.isFinite(value) || value <= 0) {
      showToast("Enter a valid amount.");
      return false;
    }

    setBalance(balance + value);
    showToast(`${value.toFixed(2)} virtual USDT added.`);
    return true;
  }

  function recordBet(entry) {
    const bet = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      game: String(entry.game || "Unknown"),
      date: new Date().toISOString(),
      bet: Number(entry.bet) || 0,
      multiplier: Number(entry.multiplier) || 0,
      payout: Number(entry.payout) || 0,
      profit: Number(entry.profit) || 0,
      nonce: entry.nonce ?? null,
      serverSeedHash: entry.serverSeedHash ?? null,
      clientSeed: entry.clientSeed ?? null
    };

    history.unshift(bet);
    history = history.slice(0, 500);

    writeStorage(STORAGE.history, history);
    renderHistory();

    return bet;
  }

  function getHistory() {
    return [...history];
  }

  function getFavorites() {
    return [...favorites];
  }

  function showToast(message) {
    const container = $("#toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
  }

  function toggleFavorite(id) {
    if (favorites.includes(id)) {
      favorites = favorites.filter(item => item !== id);
      showToast("Removed from favorites.");
    } else {
      favorites.push(id);
      showToast("Added to favorites.");
    }

    writeStorage(STORAGE.favorites, favorites);
    renderGames();
  }

  function gameCard(game) {
    const favorite = favorites.includes(game.id);
    const playable = game.id === "plinko";

    const card = document.createElement("article");
    card.className = "game-card";

    card.innerHTML = `
      <div class="game-art art-${game.art}">
        <span class="game-symbol">${game.symbol}</span>
        <span class="coming-label">${playable ? "READY NEXT" : "COMING SOON"}</span>
        <button class="favorite-button ${favorite ? "is-favorite" : ""}"
          data-favorite="${game.id}" aria-label="Toggle favorite">
          ${favorite ? "♥" : "♡"}
        </button>
      </div>
      <div class="game-info">
        <h3>${game.name}</h3>
        <p>${game.description}</p>
        <div class="game-card-bottom">
          <span class="game-category">${categoryName(game.category)}</span>
          <span class="game-open">${playable ? "NEXT GAME" : "IN DEVELOPMENT"}</span>
        </div>
      </div>
    `;

    card.querySelector("[data-favorite]").addEventListener("click", event => {
      event.stopPropagation();
      toggleFavorite(game.id);
    });

    return card;
  }

  function categoryName(category) {
    return {
      instant: "Instant",
      table: "Table",
      slots: "Special"
    }[category] || "Original";
  }

  function filteredGames() {
    let list = [...games];

    if (currentPage === "favorites") {
      list = list.filter(game => favorites.includes(game.id));
    }

    if (currentFilter !== "all") {
      list = list.filter(game => game.category === currentFilter);
    }

    if (searchTerm) {
      list = list.filter(game =>
        `${game.name} ${game.description} ${game.category}`
          .toLowerCase()
          .includes(searchTerm)
      );
    }

    return list;
  }

  function renderGames() {
    const grid = $("#game-grid");
    const empty = $("#empty-state");
    const historySection = $("#history-section");
    const filterBar = $("#filter-bar");

    if (!grid) return;

    const isHistory = currentPage === "history";

    grid.classList.toggle("hidden", isHistory);
    historySection.classList.toggle("hidden", !isHistory);
    filterBar.classList.toggle("hidden", isHistory);

    if (isHistory) {
      $("#page-title").textContent = "Bet History";
      $("#page-subtitle").textContent = "Review your recent game activity.";
      $("#game-count").textContent = `${history.length} BETS`;
      renderHistory();
      empty.classList.add("hidden");
      return;
    }

    const list = filteredGames();

    grid.innerHTML = "";
    list.forEach(game => grid.appendChild(gameCard(game)));

    empty.classList.toggle("hidden", list.length !== 0);

    $("#game-count").textContent = `${list.length} GAMES`;

    if (currentPage === "favorites") {
      $("#page-title").textContent = "Favorites";
      $("#page-subtitle").textContent = "Your saved games.";
    } else if (currentFilter !== "all" || searchTerm) {
      $("#page-title").textContent = "Explore games";
      $("#page-subtitle").textContent = "Find your next favorite.";
    } else {
      $("#page-title").textContent = "Originals";
      $("#page-subtitle").textContent =
        "Explore our collection of original games.";
    }

    document.querySelectorAll(".nav-item[data-page]").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.page === currentPage
      );
    });

    document.querySelectorAll(".category-nav").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.category === currentFilter &&
        currentPage !== "favorites"
      );
    });

    document.querySelectorAll(".filter-chip").forEach(button => {
      button.classList.toggle(
        "selected",
        button.dataset.filter === currentFilter
      );
    });
  }

  function renderHistory() {
    const body = $("#history-body");
    const empty = $("#history-empty");

    if (!body || !empty) return;

    body.innerHTML = "";

    history.forEach(item => {
      const row = document.createElement("tr");
      const date = new Date(item.date);

      const safeDate = Number.isNaN(date.getTime())
        ? "Unknown"
        : date.toLocaleString();

      const profit = Number(item.profit) || 0;

      row.innerHTML = `
        <td>${escapeHTML(item.game)}</td>
        <td>${escapeHTML(safeDate)}</td>
        <td>${Number(item.bet).toFixed(2)} USDT</td>
        <td>${Number(item.multiplier).toFixed(2)}×</td>
        <td>${Number(item.payout).toFixed(2)} USDT</td>
        <td class="${profit >= 0 ? "profit-positive" : "profit-negative"}">
          ${profit >= 0 ? "+" : ""}${profit.toFixed(2)} USDT
        </td>
      `;

      body.appendChild(row);
    });

    empty.classList.toggle("hidden", history.length > 0);
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

  function setPage(page) {
    currentPage = page;
    searchTerm = "";

    const search = $("#search-input");
    if (search) search.value = "";

    if (page === "casino" || page === "originals") {
      currentFilter = "all";
    }

    if (page === "favorites") {
      currentFilter = "all";
    }

    renderGames();

    $("#sidebar")?.classList.remove("open");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setupNavigation() {
    document.querySelectorAll("[data-page]").forEach(button => {
      button.addEventListener("click", event => {
        event.preventDefault();
        setPage(button.dataset.page);
      });
    });

    document.querySelectorAll("[data-category]").forEach(button => {
      button.addEventListener("click", () => {
        currentPage = "casino";
        currentFilter = button.dataset.category;
        renderGames();
        $("#sidebar")?.classList.remove("open");
      });
    });

    document.querySelectorAll("[data-filter]").forEach(button => {
      button.addEventListener("click", () => {
        currentPage = "casino";
        currentFilter = button.dataset.filter;
        renderGames();
      });
    });

    $("#explore-games")?.addEventListener("click", () => {
      document.querySelector("#games-heading")?.scrollIntoView({
        behavior: "smooth"
      });
    });

    $("#mobile-menu")?.addEventListener("click", () => {
      $("#sidebar")?.classList.toggle("open");
    });

    $("#clear-search")?.addEventListener("click", () => {
      searchTerm = "";
      currentPage = "casino";
      currentFilter = "all";
      $("#search-input").value = "";
      renderGames();
    });

    $("#search-input")?.addEventListener("input", event => {
      searchTerm = event.target.value.trim().toLowerCase();
      currentPage = "casino";
      renderGames();
    });

    document.addEventListener("keydown", event => {
      if (event.key === "/" &&
          !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
        event.preventDefault();
        $("#search-input")?.focus();
      }

      if (event.key === "Escape") {
        closeDeposit();
        $("#sidebar")?.classList.remove("open");
      }
    });
  }

  function openDeposit() {
    $("#deposit-modal")?.classList.remove("hidden");
    $("#deposit-amount")?.focus();
  }

  function closeDeposit() {
    $("#deposit-modal")?.classList.add("hidden");
  }

  function setupDeposit() {
    $("#open-deposit")?.addEventListener("click", openDeposit);
    $("#close-deposit")?.addEventListener("click", closeDeposit);

    $("#deposit-modal")?.addEventListener("click", event => {
      if (event.target.id === "deposit-modal") closeDeposit();
    });

    document.querySelectorAll("[data-amount]").forEach(button => {
      button.addEventListener("click", () => {
        $("#deposit-amount").value = button.dataset.amount;
      });
    });

    $("#confirm-deposit")?.addEventListener("click", () => {
      const amount = Number($("#deposit-amount").value);

      if (!Number.isFinite(amount) || amount <= 0) {
        showToast("Enter an amount greater than zero.");
        return;
      }

      addFunds(amount);
      $("#deposit-amount").value = "";
      closeDeposit();
    });

    $("#deposit-amount")?.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        $("#confirm-deposit").click();
      }
    });
  }

  function setupHistory() {
    $("#clear-history")?.addEventListener("click", () => {
      if (!history.length) return;

      if (!confirm("Clear all bet history? This cannot be undone.")) return;

      history = [];
      writeStorage(STORAGE.history, history);
      renderHistory();
      showToast("Bet history cleared.");
    });
  }

  function init() {
    loadData();
    setupNavigation();
    setupDeposit();
    setupHistory();
    renderGames();
  }

  return {
    init,
    getBalance,
    setBalance,
    addFunds,
    recordBet,
    getHistory,
    getFavorites,
    showToast
  };
})();

/* Shared interface for every game page. */
window.VaultPlayWallet = {
  getBalance: () => VaultPlay.getBalance(),
  setBalance: amount => VaultPlay.setBalance(amount),
  addFunds: amount => VaultPlay.addFunds(amount),
  recordBet: entry => VaultPlay.recordBet(entry),
  getHistory: () => VaultPlay.getHistory()
};

window.VaultPlay = VaultPlay;

document.addEventListener("DOMContentLoaded", VaultPlay.init);
