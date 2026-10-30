/*
  VAULTPLAY — PLINKO
  Browser-based Provably Fair implementation.

  Integration:
  mountPlinko(document.getElementById("plinko-game"), {
    getBalance: () => currentBalance,
    setBalance: (newBalance) => updateBalance(newBalance)
  });
*/

const VaultPlinko = (() => {
  const STORAGE_KEY = "vaultplay-plinko-fair-v1";

  const PAYOUTS = {
    8: {
      low:    [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6],
      medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
      high:   [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29]
    },
    12: {
      low:    [8.4, 3, 1.6, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.6, 3, 8.4],
      medium: [33, 11, 4, 2, 1.1, 0.5, 0.3, 0.5, 1.1, 2, 4, 11, 33],
      high:   [100, 30, 9, 3, 1, 0.4, 0.2, 0.4, 1, 3, 9, 30, 100]
    },
    16: {
      low:    [16, 9, 2, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 2, 9, 16, 9, 16],
      medium: [110, 41, 10, 5, 2, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 2, 5, 10, 41, 110],
      high:   [1000, 130, 26, 9, 4, 2, 0.5, 0.2, 0.2, 0.5, 2, 4, 9, 26, 130, 1000, 130]
    }
  };

  const encoder = new TextEncoder();

  function randomSeed() {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
  }

  function loadFairState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved?.serverSeed && saved?.clientSeed) return saved;
    } catch {}

    const state = {
      serverSeed: randomSeed(),
      clientSeed: "vaultplay-player",
      nonce: 0,
      history: [],
      previousSeeds: []
    };

    saveFairState(state);
    return state;
  }

  function saveFairState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  async function sha256(message) {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      encoder.encode(message)
    );

    return Array.from(new Uint8Array(digest),
      b => b.toString(16).padStart(2, "0")
    ).join("");
  }

  async function hmac(serverSeed, message) {
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(serverSeed),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(message)
    );

    return new Uint8Array(signature);
  }

  async function generatePath(serverSeed, clientSeed, nonce, rows) {
    const path = [];

    for (let step = 0; step < rows; step++) {
      const bytes = await hmac(
        serverSeed,
        `${clientSeed}:${nonce}:${step}`
      );

      // Each HMAC byte supplies one deterministic left/right decision.
      path.push(bytes[0] % 2);
    }

    return path;
  }

  async function calculateResult(serverSeed, clientSeed, nonce, rows) {
    const path = await generatePath(serverSeed, clientSeed, nonce, rows);
    const rightCount = path.reduce((sum, direction) => sum + direction, 0);

    return {
      path,
      bucket: rightCount,
      multiplier: PAYOUTS[rows].medium[rightCount]
    };
  }

  function money(value) {
    return Number(value).toFixed(2);
  }

  function mount(root, wallet) {
    if (!root) throw new Error("Plinko container not found.");
    if (!wallet?.getBalance || !wallet?.setBalance) {
      throw new Error("Plinko requires getBalance() and setBalance() wallet functions.");
    }

    let fair = loadFairState();
    let rows = 16;
    let risk = "medium";
    let busy = false;

    root.innerHTML = `
      <section class="plinko-shell">
        <div class="plinko-heading">
          <div>
            <div class="plinko-eyebrow">VAULTPLAY ORIGINAL</div>
            <h2>Plinko</h2>
            <p>Drop the ball. See where it lands.</p>
          </div>
          <div class="plinko-fair-status">PROVABLY FAIR</div>
        </div>

        <div class="plinko-layout">
          <div class="plinko-board-panel">
            <div class="plinko-board-wrap">
              <canvas class="plinko-canvas"></canvas>
            </div>
            <div class="plinko-buckets"></div>
            <div class="plinko-result"></div>
          </div>

          <div class="plinko-controls">
            <label>Bet amount</label>
            <div class="plinko-bet-row">
              <input class="plinko-bet" type="number" min="0.01"
                step="0.01" value="1">
              <span>USDT</span>
            </div>

            <div class="plinko-quick-bets">
              <button data-bet="0.5">½</button>
              <button data-bet="1">1/2</button>
              <button data-bet="2">2×</button>
              <button data-bet="5">5</button>
            </div>

            <label>Risk</label>
            <div class="plinko-risk">
              <button data-risk="low">Low</button>
              <button data-risk="medium" class="selected">Medium</button>
              <button data-risk="high">High</button>
            </div>

            <label>Number of rows</label>
            <div class="plinko-rows">
              <button data-rows="8">8</button>
              <button data-rows="12">12</button>
              <button data-rows="16" class="selected">16</button>
            </div>

            <button class="plinko-drop">DROP BALL</button>

            <div class="plinko-balance">
              <span>Available balance</span>
              <strong class="plinko-balance-value"></strong>
            </div>
          </div>
        </div>

        <div class="plinko-fair-panel">
          <h3>Provably Fair</h3>
          <p>Server seed hash (commitment)</p>
          <code class="plinko-hash"></code>

          <p>Client seed</p>
          <div class="plinko-seed-row">
            <input class="plinko-client-seed" value="${fair.clientSeed}">
            <button class="plinko-update-seed">Update</button>
          </div>

          <p>Nonce: <strong class="plinko-nonce"></strong></p>

          <button class="plinko-rotate">Reveal seed & rotate</button>
          <div class="plinko-revealed"></div>

          <h3>Verify a round</h3>
          <input class="plinko-verify-seed" placeholder="Revealed server seed">
          <input class="plinko-verify-client" placeholder="Client seed">
          <input class="plinko-verify-nonce" type="number" placeholder="Nonce">
          <input class="plinko-verify-rows" type="number" placeholder="Rows (8, 12 or 16)">
          <button class="plinko-verify">VERIFY RESULT</button>
          <div class="plinko-verify-result"></div>
        </div>

        <div class="plinko-history-panel">
          <h3>Recent bets</h3>
          <div class="plinko-history"></div>
        </div>
      </section>
    `;

    const $ = selector => root.querySelector(selector);
    const canvas = $(".plinko-canvas");
    const ctx = canvas.getContext("2d");

    function updateBalance() {
      $(".plinko-balance-value").textContent =
        `${money(wallet.getBalance())} USDT`;
    }

    async function updateFairDisplay() {
      $(".plinko-hash").textContent = await sha256(fair.serverSeed);
      $(".plinko-nonce").textContent = fair.nonce;
      $(".plinko-client-seed").value = fair.clientSeed;
    }

    function drawBoard(path = null, animated = false) {
      const width = 560;
      const height = 490;
      const top = 35;
      const bottom = 440;
      const spacingX = 31;
      const spacingY = (bottom - top) / rows;

      canvas.width = width;
      canvas.height = height;

      ctx.clearRect(0, 0, width, height);

      const center = width / 2;

      // Draw pegs.
      for (let r = 0; r < rows; r++) {
        const count = r + 3;
        const startX = center - ((count - 1) * spacingX) / 2;

        for (let c = 0; c < count; c++) {
          const x = startX + c * spacingX;
          const y = top + r * spacingY;

          ctx.beginPath();
          ctx.arc(x, y, 3.3, 0, Math.PI * 2);
          ctx.fillStyle = "#b6bdca";
          ctx.fill();
        }
      }

      // Draw ball path.
      if (path) {
        let position = 0;

        for (let r = 0; r < path.length; r++) {
          const count = r + 3;
          const startX = center - ((count - 1) * spacingX) / 2;
          const x = startX + position * spacingX;
          const y = top + r * spacingY;

          if (path[r] === 1) position++;

          const nextCount = r + 4;
          const nextStart = center - ((nextCount - 1) * spacingX) / 2;
          const nextX = nextStart + position * spacingX;
          const nextY = top + (r + 1) * spacingY;

          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(nextX, nextY);
          ctx.strokeStyle = "#28dca0";
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        const finalCount = rows + 2;
        const startX = center - ((finalCount - 1) * spacingX) / 2;
        const finalX = startX + position * spacingX;
        const finalY = bottom + 8;

        ctx.beginPath();
        ctx.arc(finalX, finalY, 7, 0, Math.PI * 2);
        ctx.fillStyle = "#28dca0";
        ctx.shadowColor = "#28dca0";
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    function renderBuckets() {
      const multipliers = PAYOUTS[rows][risk];

      $(".plinko-buckets").innerHTML = multipliers.map((value, i) => `
        <div class="plinko-bucket ${value >= 10 ? "big" : ""}">
          ${value}×
        </div>
      `).join("");

      drawBoard();
    }

    function renderHistory() {
      $(".plinko-history").innerHTML = fair.history.slice(0, 10).map(item => `
        <div class="plinko-history-row">
          <span>${money(item.bet)} USDT</span>
          <span>${item.rows} rows · ${item.risk}</span>
          <span>${item.multiplier}×</span>
          <strong class="${item.profit >= 0 ? "positive" : "negative"}">
            ${item.profit >= 0 ? "+" : ""}${money(item.profit)}
          </strong>
        </div>
      `).join("") || "<p>No bets yet.</p>";
    }

    function animatePath(path) {
      return new Promise(resolve => {
        let step = 0;

        const drawStep = () => {
          drawBoard(path.slice(0, step));

          if (step >= path.length) {
            drawBoard(path);
            resolve();
            return;
          }

          step++;
          setTimeout(drawStep, 75);
        };

        drawStep();
      });
    }

    async function dropBall() {
      if (busy) return;

      const bet = Number($(".plinko-bet").value);

      if (!Number.isFinite(bet) || bet <= 0) {
        $(".plinko-result").textContent = "Enter a valid bet amount.";
        return;
      }

      const balance = Number(wallet.getBalance());

      if (bet > balance) {
        $(".plinko-result").textContent = "Insufficient balance.";
        return;
      }

      busy = true;
      $(".plinko-drop").disabled = true;
      $(".plinko-drop").textContent = "DROPPING...";

      try {
        const roundNonce = fair.nonce;
        const roundServerSeed = fair.serverSeed;
        const roundClientSeed = fair.clientSeed;
        const commitment = await sha256(roundServerSeed);

        const result = await calculateResult(
          roundServerSeed,
          roundClientSeed,
          roundNonce,
          rows
        );

        const multiplier = PAYOUTS[rows][risk][result.bucket];
        const payout = bet * multiplier;
        const profit = payout - bet;

        // Deduct stake first, then credit payout.
        wallet.setBalance(balance - bet);

        await animatePath(result.path);

        wallet.setBalance(Number(wallet.getBalance()) + payout);

        fair.history.unshift({
          bet,
          rows,
          risk,
          multiplier,
          payout,
          profit,
          bucket: result.bucket,
          nonce: roundNonce,
          clientSeed: roundClientSeed,
          serverSeedHash: commitment,
          path: result.path
        });

        fair.nonce++;
        saveFairState(fair);

        $(".plinko-result").innerHTML = `
          <strong>${multiplier}×</strong>
          <span>${money(payout)} USDT payout</span>
          <span class="${profit >= 0 ? "positive" : "negative"}">
            ${profit >= 0 ? "+" : ""}${money(profit)} USDT
          </span>
          <small>Nonce ${roundNonce} · Bucket ${result.bucket}</small>
        `;

        renderHistory();
        updateBalance();
        updateFairDisplay();

      } catch (error) {
        console.error(error);
        $(".plinko-result").textContent =
          "Something went wrong. Please try again.";
      } finally {
        busy = false;
        $(".plinko-drop").disabled = false;
        $(".plinko-drop").textContent = "DROP BALL";
      }
    }

    $(".plinko-drop").addEventListener("click", dropBall);

    root.querySelectorAll("[data-risk]").forEach(button => {
      button.addEventListener("click", () => {
        risk = button.dataset.risk;

        root.querySelectorAll("[data-risk]").forEach(b =>
          b.classList.toggle("selected", b === button)
        );

        renderBuckets();
      });
    });

    root.querySelectorAll("[data-rows]").forEach(button => {
      button.addEventListener("click", () => {
        rows = Number(button.dataset.rows);

        root.querySelectorAll("[data-rows]").forEach(b =>
          b.classList.toggle("selected", b === button)
        );

        renderBuckets();
      });
    });

    root.querySelectorAll("[data-bet]").forEach(button => {
      button.addEventListener("click", () => {
        $(".plinko-bet").value = button.dataset.bet;
      });
    });

    $(".plinko-update-seed").addEventListener("click", () => {
      const seed = $(".plinko-client-seed").value.trim();

      if (!seed) return;
      fair.clientSeed = seed;
      saveFairState(fair);
      updateFairDisplay();
    });

    $(".plinko-rotate").addEventListener("click", async () => {
      if (busy) return;

      const revealed = fair.serverSeed;

      fair.previousSeeds.unshift({
        serverSeed: revealed,
        hash: await sha256(revealed)
      });

      fair.serverSeed = randomSeed();
      fair.nonce = 0;
      saveFairState(fair);

      $(".plinko-revealed").innerHTML = `
        <p>Previous server seed:</p>
        <code>${revealed}</code>
        <p>Previous hash:</p>
        <code>${fair.previousSeeds[0].hash}</code>
      `;

      updateFairDisplay();
    });

    $(".plinko-verify").addEventListener("click", async () => {
      const seed = $(".plinko-verify-seed").value.trim();
      const client = $(".plinko-verify-client").value.trim();
      const nonce = Number($(".plinko-verify-nonce").value);
      const verifyRows = Number($(".plinko-verify-rows").value);

      if (!seed || !client || !Number.isInteger(nonce) ||
          ![8, 12, 16].includes(verifyRows)) {
        $(".plinko-verify-result").textContent =
          "Enter a server seed, client seed, nonce and valid row count.";
        return;
      }

      const result = await calculateResult(seed, client, nonce, verifyRows);
      const multiplier = PAYOUTS[verifyRows].medium[result.bucket];

      $(".plinko-verify-result").innerHTML = `
        <p>Result bucket: <strong>${result.bucket}</strong></p>
        <p>Path: <code>${result.path.join("")}</code></p>
        <p>Medium-risk multiplier: <strong>${multiplier}×</strong></p>
        <p>Server seed hash: <code>${await sha256(seed)}</code></p>
      `;
    });

    updateBalance();
    updateFairDisplay();
    renderBuckets();
    renderHistory();

    return {
      destroy() {
        root.innerHTML = "";
      }
    };
  }

  return { mount };
})();

window.mountPlinko = VaultPlinko.mount;
