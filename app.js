/* ============ PlayStake shared logic ============ */
const STORE_KEY = 'playstake_v1';

// VIP Levels mapped out from Stake
const VIP_LEVELS = [
  { name: 'Non-VIP', threshold: 0, icon: '⭐' },
  { name: 'Bronze', threshold: 10000, icon: '🥉' },
  { name: 'Silver', threshold: 50000, icon: '🥈' },
  { name: 'Gold', threshold: 100000, icon: '🥇' },
  { name: 'Platinum I', threshold: 250000, icon: '💎' },
  { name: 'Platinum II', threshold: 500000, icon: '💎' },
  { name: 'Platinum III', threshold: 1000000, icon: '💎' },
  { name: 'Platinum IV', threshold: 2500000, icon: '💎' },
  { name: 'Platinum V', threshold: 5000000, icon: '💎' },
  { name: 'Platinum VI', threshold: 10000000, icon: '💎' },
  { name: 'Diamond I', threshold: 25000000, icon: '💠' },
  { name: 'Diamond II', threshold: 50000000, icon: '💠' },
  { name: 'Diamond III', threshold: 100000000, icon: '💠' },
  { name: 'Diamond IV', threshold: 250000000, icon: '💠' },
  { name: 'Diamond V', threshold: 500000000, icon: '💠' },
  { name: 'Obsidian', threshold: 1000000000, icon: '🖤' }
];

const defaultState = {
  balance: 0,             // USDT
  bets: 0,
  wagered: 0,             // This tracks total lifetime wagered for VIP
  profit: 0,
  history: [],            // {game, amount, payout, win, time}
  seeds: {}
};

let state = loadState();

function loadState(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(!raw) return structuredClone(defaultState);
    return Object.assign(structuredClone(defaultState), JSON.parse(raw));
  }catch(e){ return structuredClone(defaultState); }
}

function saveState(){
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
  renderBalance();
  renderStats();
  updateVIPProgress(); // Update VIP UI whenever state saves
}

/* ---------- Balance ---------- */
function renderBalance(){
  const el = document.getElementById('balanceDisplay');
  if(el) el.textContent = Number(state.balance).toFixed(8); // 8 decimals like Stake
}

function setBalance(v){
  state.balance = Math.max(0, Number(v));
  saveState();
}

/* ---------- VIP Progress Logic ---------- */
function updateVIPProgress() {
  const totalWagered = state.wagered;
  
  // Find current level
  let currentLevelIdx = 0;
  for (let i = VIP_LEVELS.length - 1; i >= 0; i--) {
    if (totalWagered >= VIP_LEVELS[i].threshold) {
      currentLevelIdx = i;
      break;
    }
  }
  
  const currentLevel = VIP_LEVELS[currentLevelIdx];
  const nextLevel = VIP_LEVELS[currentLevelIdx + 1];
  
  // Update DOM elements
  const elName = document.getElementById('vipName');
  const elPercent = document.getElementById('vipPercentage');
  const elFill = document.getElementById('vipProgressFill');
  const elCurrentLvl = document.getElementById('vipCurrentLevel');
  const elNextLvl = document.getElementById('vipNextLevel');
  const elBadge = document.getElementById('vipBadge');
  const elWageredText = document.getElementById('vipWageredText');
  const elNextThresholdText = document.getElementById('vipNextThresholdText');
  
  if(!elName) return; // Exit if elements aren't on page (e.g., on a game page)

  elName.textContent = currentLevel.name;
  elBadge.textContent = currentLevel.icon;
  elCurrentLvl.textContent = currentLevel.name;
  elWageredText.textContent = `$${totalWagered.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} Wagered`;
  
  if (!nextLevel) {
    // Max level reached
    elPercent.textContent = '100%';
    elFill.style.width = '100%';
    elNextLvl.textContent = 'MAX';
    elNextThresholdText.textContent = 'Max VIP Level Reached';
  } else {
    // Calculate progress towards next level
    // Stake formula: (Total Wagered - Current Threshold) / (Next Threshold - Current Threshold) * 100
    const range = nextLevel.threshold - currentLevel.threshold;
    const progressInRange = totalWagered - currentLevel.threshold;
    const percentage = (progressInRange / range) * 100;
    
    elPercent.textContent = `${percentage.toFixed(2)}%`;
    elFill.style.width = `${percentage}%`;
    elNextLvl.textContent = nextLevel.name;
    
    const remaining = nextLevel.threshold - totalWagered;
    elNextThresholdText.textContent = `$${remaining.toLocaleString(undefined, {maximumFractionDigits: 0})} to ${nextLevel.name}`;
  }
}

/* ---------- Deposit ---------- */
const FAKE_ADDRS = {
  'TRC20 (Tron)': 'TXk9mFake7uQ2wZbP3rLd8sVn1yHa4Kc6Qz',
  'ERC20 (Ethereum)': '0xFake9Ab2cD4eF6gH8iJ0kL2mN4oP6qR8sT0uV2',
  'BEP20 (BSC)': '0xBep0Fake1C2d3E4f5A6b7C8d9E0f1A2b3C4d5E6',
  'Polygon': '0xPol7Fake8A9b0C1d2E3f4G5h6I7j8K9l0M1n2O3'
};

function openDeposit(){
  document.getElementById('depositModal').classList.add('open');
  updateAddress();
  drawQR();
  document.getElementById('depositAmount').value = '';
}

function closeDeposit(){
  document.getElementById('depositModal').classList.remove('open');
}

function updateAddress(){
  const net = document.getElementById('networkSelect').value;
  document.getElementById('fakeAddress').textContent = FAKE_ADDRS[net] || 'TXfake...';
}

document.addEventListener('DOMContentLoaded', ()=>{
  const sel = document.getElementById('networkSelect');
  if(sel) sel.addEventListener('change', updateAddress);
});

function copyAddress(){
  const txt = document.getElementById('fakeAddress').textContent;
  navigator.clipboard?.writeText(txt);
  flash('Address copied (fake!)');
}

function confirmDeposit(){
  const amt = parseFloat(document.getElementById('depositAmount').value);
  if(!amt || amt <= 0){ flash('Enter a valid amount'); return; }
  state.balance += amt;
  saveState();
  closeDeposit();
  flash('Deposited ' + amt.toFixed(2) + ' USDT (fake)');
  playSound('deposit');
}

/* ---------- Wallet / Stats ---------- */
function openWallet(){ renderStats(); renderHistory(); document.getElementById('walletModal').classList.add('open'); }
function closeWallet(){ document.getElementById('walletModal').classList.remove('open'); }

function renderStats(){
  const b = document.getElementById('statBets');
  const w = document.getElementById('statWagered');
  const p = document.getElementById('statProfit');
  if(b) b.textContent = state.bets;
  if(w) w.textContent = Number(state.wagered).toFixed(2);
  if(p){
    p.textContent = Number(state.profit).toFixed(2);
    p.style.color = state.profit >= 0 ? 'var(--accent)' : 'var(--danger)';
  }
}

function renderHistory(){
  const list = document.getElementById('historyList');
  if(!list) return;
  if(!state.history.length){ list.innerHTML = '<p class="muted tiny">No bets yet.</p>'; return; }
  list.innerHTML = state.history.slice(0,50).map(h=>`
    <div class="history-item">
      <span>${h.game} · ${Number(h.amount).toFixed(2)}</span>
      <span class="${h.win?'win':'loss'}">${h.win?'+':'-'}${Number(h.payout).toFixed(2)}</span>
    </div>`).join('');
}

function resetBalance(){
  state.balance = 0; saveState(); flash('Balance reset to 0.00');
}
function clearHistory(){
  state.history = []; state.bets=0; state.wagered=0; state.profit=0;
  saveState(); renderHistory(); updateVIPProgress(); flash('History cleared');
}

/* ---------- Bet settlement (used by games) ---------- */
/* Call: recordBet({game:'Dice', amount:10, payout:20, win:true}) */
function recordBet({game, amount, payout, win}){
  state.bets += 1;
  state.wagered += amount; // This feeds the VIP progress bar
  state.profit += (payout - amount);
  state.history.unshift({game, amount, payout, win, time:Date.now()});
  if(state.history.length > 200) state.history.pop();
  saveState();
}

/* Place a bet: deducts stake, returns false if insufficient */
function placeBet(game, amount){
  amount = Number(amount);
  if(!amount || amount <= 0) return false;
  if(amount > state.balance){ flash('Insufficient balance'); return false; }
  state.balance -= amount;
  saveState();
  return true;
}

/* ---------- Provably fair (cosmetic) ---------- */
function getSeeds(game){
  if(!state.seeds[game]){
    state.seeds[game] = {
      serverSeed: randHex(32),
      clientSeed: randHex(16),
      nonce: 0
    };
    saveState();
  }
  return state.seeds[game];
}
function nextNonce(game){
  const s = getSeeds(game);
  s.nonce += 1;
  saveState();
  return s.nonce;
}
function randHex(n){
  const chars='0123456789abcdef'; let out='';
  for(let i=0;i<n;i++) out += chars[Math.floor(Math.random()*16)];
  return out;
}

/* ---------- Sounds (WebAudio, no files) ---------- */
let audioCtx = null;
function playSound(type){
  try{
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    if(type === 'win'){ o.frequency.value = 660; o.type='triangle'; g.gain.setValueAtTime(.15, now); g.gain.exponentialRampToValueAtTime(.001, now+.35); }
    else if(type === 'lose'){ o.frequency.value = 180; o.type='sawtooth'; g.gain.setValueAtTime(.12, now); g.gain.exponentialRampToValueAtTime(.001, now+.3); }
    else if(type === 'click'){ o.frequency.value = 420; o.type='square'; g.gain.setValueAtTime(.06, now); g.gain.exponentialRampToValueAtTime(.001, now+.08); }
    else if(type === 'deposit'){ o.frequency.value = 520; o.type='sine'; g.gain.setValueAtTime(.15, now); g.gain.exponentialRampToValueAtTime(.001, now+.4); }
    o.start(now); o.stop(now+.5);
  }catch(e){}
}

/* ---------- Toast ---------- */
function flash(msg){
  let t = document.getElementById('toast');
  if(!t){
    t = document.createElement('div');
    t.id='toast';
    t.style.cssText='position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#00e701;color:#04140a;font-weight:800;padding:12px 22px;border-radius:10px;z-index:100;font-size:.9rem;box-shadow:0 8px 24px rgba(0,0,0,.4);transition:.2s;opacity:0';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(()=>{ t.style.opacity='0'; }, 2200);
}

/* ---------- QR (placeholder pattern) ---------- */
function drawQR(){
  const c = document.getElementById('qrCanvas');
  if(!c) return;
  const ctx = c.getContext('2d');
  const size = 21; const cell = c.width / size;
  ctx.fillStyle = '#fff'; ctx.fillRect(0,0,c.width,c.height);
  ctx.fillStyle = '#000';
  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      if(Math.random() > 0.5) ctx.fillRect(x*cell, y*cell, cell, cell);
    }
  }
  [[0,0],[size-7,0],[0,size-7]].forEach(([ox,oy])=>{
    ctx.fillStyle='#fff'; ctx.fillRect(ox*cell,oy*cell,7*cell,7*cell);
    ctx.fillStyle='#000'; ctx.fillRect(ox*cell,oy*cell,7*cell,7*cell);
    ctx.fillStyle='#fff'; ctx.fillRect((ox+1)*cell,(oy+1)*cell,5*cell,5*cell);
    ctx.fillStyle='#000'; ctx.fillRect((ox+2)*cell,(oy+2)*cell,3*cell,3*cell);
  });
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', ()=>{
  renderBalance();
  renderStats();
  updateVIPProgress();
});
