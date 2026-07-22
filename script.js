// ---------------------------------------------------------------------------
// STATE
// ---------------------------------------------------------------------------
const state = {
  vault: [],
  keyDerived: false,
  clearTimers: {},
  unlocked: false
};

// ---------------------------------------------------------------------------
// MATRIX BACKGROUND
// ---------------------------------------------------------------------------
(function initMatrix() {
  const canvas = document.getElementById('matrix');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = 0, height = 0, columns = 0, drops = [], fontSize = 16;
  const chars = '123456789@CHAITANYA@19062009<>#$%&*+=/\\|{}[]日CHAITANYA@19062009ﾍｦｲｸｺｿﾁﾄﾉﾌﾔﾖﾙﾚﾛﾝ';

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    width = canvas.width = Math.floor(window.innerWidth * dpr);
    height = canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    fontSize = Math.max(14, Math.floor(16 * dpr));
    columns = Math.floor(width / fontSize);
    drops = new Array(columns).fill(0).map(() => Math.random() * -height / fontSize);
  }

  function draw() {
    // fade previous frame
    ctx.fillStyle = 'rgba(3, 5, 3, 0.10)';
    ctx.fillRect(0, 0, width, height);

    ctx.font = fontSize + "px 'JetBrains Mono', monospace";

    for (let i = 0; i < drops.length; i++) {
      const ch = chars[(Math.random() * chars.length) | 0];
      const x = i * fontSize;
      const y = drops[i] * fontSize;

      // occasional bright head
      if (Math.random() > 0.975) {
        ctx.fillStyle = '#eafff5';
        ctx.shadowColor = '#00ff9c';
        ctx.shadowBlur = 12;
      } else {
        // rare cyan accent
        const hue = Math.random() > 0.985 ? '#00e5ff' : '#00ff9c';
        ctx.fillStyle = hue;
        ctx.shadowColor = hue;
        ctx.shadowBlur = 4;
      }
      ctx.fillText(ch, x, y);

      if (y > height && Math.random() > 0.972) {
        drops[i] = 0;
      }
      drops[i] += 1;
    }
    ctx.shadowBlur = 0;
  }

  resize();
  window.addEventListener('resize', resize);
  setInterval(draw, 45);
})();

// ---------------------------------------------------------------------------
// CRT CLOCK
// ---------------------------------------------------------------------------
(function crtClock() {
  const el = document.getElementById('crtClock');
  if (!el) return;
  const tick = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    el.textContent = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  };
  tick();
  setInterval(tick, 1000);
})();

// ---------------------------------------------------------------------------
// BOOT SEQUENCE
// ---------------------------------------------------------------------------
const bootLog = document.getElementById('bootLog');
const passPrompt = document.getElementById('passPrompt');
const typedPass = document.getElementById('typedPass');
const grantedBlock = document.getElementById('grantedBlock');
const bootScreen = document.getElementById('bootScreen');
const enterBtn = document.getElementById('enterBtn');

const bootLines = [
  { html: '<span class="dim">[boot]</span> chai-vault-loader v3.7.1 — <span class="hi">initializing</span>...', delay: 90 },
  { html: '<span class="dim">[hw]</span>   detecting entropy source ......... <span class="ok">OK</span>', delay: 220 },
  { html: '<span class="dim">[mem]</span>  allocating session heap .......... <span class="ok">OK</span>', delay: 180 },
  { html: '<span class="dim">[net]</span>  isolating network interfaces ..... <span class="ok">AIRGAPPED</span>', delay: 240 },
  { html: '<span class="dim">[api]</span>  window.crypto.subtle ............. <span class="ok">AVAILABLE</span>', delay: 180 },
  { html: '<span class="dim">[key]</span>  loading PBKDF2 module ............ <span class="ok">READY</span>', delay: 200 },
  { html: '<span class="dim">[key]</span>  arming AES-256-GCM ............... <span class="ok">READY</span>', delay: 200 },
  { html: '<span class="dim">[sec]</span>  scanning for storage leaks ....... <span class="ok">NONE</span>', delay: 220 },
  { html: '<span class="dim">[sec]</span>  purging localStorage ............. <span class="ok">CLEAN</span>', delay: 180 },
  { html: '<span class="warn">[!]</span>    all data lives in RAM. refresh = wipe.', delay: 260 },
  { html: '<span class="dim">[sys]</span>  awaiting root authorization ......', delay: 260 }
];

function appendLine(html) {
  const div = document.createElement('div');
  div.className = 'ln';
  div.innerHTML = html;
  bootLog.appendChild(div);
  bootLog.scrollTop = bootLog.scrollHeight;
}

async function runBoot() {
  for (const line of bootLines) {
    appendLine(line.html);
    await sleep(line.delay);
  }
  await sleep(200);
  passPrompt.classList.remove('hidden');
  await typePassword();
  await sleep(300);
  appendLine('<span class="dim">[auth]</span> verifying keychain ............... <span class="ok">GRANTED</span>');
  await sleep(280);
  grantedBlock.classList.remove('hidden');
  enterBtn.focus();
}

async function typePassword() {
  const fake = 'sudo0verR1d3!';
  for (let i = 0; i < fake.length; i++) {
    typedPass.textContent += fake[i];
    await sleep(70 + Math.random() * 90);
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function unlockVault() {
  if (state.unlocked) return;
  state.unlocked = true;
  bootScreen.classList.add('closing');
  document.body.classList.remove('locked');
  document.body.classList.add('unlocked');
  setTimeout(() => {
    bootScreen.style.display = 'none';
    const key = document.getElementById('secretKey');
    if (key) key.focus();
  }, 500);
}

// Start boot on load
window.addEventListener('DOMContentLoaded', () => {
  runBoot();

  enterBtn.addEventListener('click', unlockVault);
  document.addEventListener('keydown', (e) => {
    if (!state.unlocked && (e.key === 'Enter' || e.key === ' ')) {
      if (!grantedBlock.classList.contains('hidden')) {
        e.preventDefault();
        unlockVault();
      }
    }
  });
});

// ---------------------------------------------------------------------------
// CRYPTO
// ---------------------------------------------------------------------------
async function deriveKey(password) {
  if (!password || password.length < 8) {
    showNotification('Key must be at least 8 characters', 'error');
    return null;
  }
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const salt = encoder.encode('chai-vault-salt');

    const baseKey = await crypto.subtle.importKey(
      'raw', data, 'PBKDF2', false, ['deriveKey']
    );

    const derivedKey = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    state.keyDerived = true;
    updateKeyStatus();
    return derivedKey;
  } catch (err) {
    console.error('Key derivation failed:', err);
    showNotification('Failed to derive key', 'error');
    return null;
  }
}

async function encryptText(plainText, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(plainText);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode.apply(null, combined));
}

async function decryptText(encryptedBase64, key) {
  const combined = new Uint8Array(
    atob(encryptedBase64).split('').map(c => c.charCodeAt(0))
  );
  const iv = combined.slice(0, 12);
  const encryptedData = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encryptedData);
  return new TextDecoder().decode(decrypted);
}

// ---------------------------------------------------------------------------
// HANDLERS
// ---------------------------------------------------------------------------
async function handleEncrypt() {
  const secretKey = document.getElementById('secretKey').value;
  const plainText = document.getElementById('plainText').value;
  const accountName = document.getElementById('accountName').value;

  if (!secretKey || !plainText || !accountName) {
    showNotification('All fields required', 'error');
    return;
  }
  try {
    const key = await deriveKey(secretKey);
    if (!key) return;
    const encrypted = await encryptText(plainText, key);

    document.getElementById('encryptedOutput').value = encrypted;
    document.getElementById('encryptedBox').classList.remove('hidden');

    state.vault.push({
      name: accountName,
      encrypted,
      timestamp: new Date().toLocaleString()
    });
    updateVaultUI();

    try { await navigator.clipboard.writeText(encrypted); } catch (_) { /* clipboard blocked */ }
    showNotification('Encryption complete — copied to clipboard');

    clearTimeout(state.clearTimers.encrypt);
    state.clearTimers.encrypt = setTimeout(clearEncryptForm, 30000);
  } catch (err) {
    console.error('Encryption error:', err);
    showNotification('Encryption failed', 'error');
  }
}

async function handleDecrypt() {
  const secretKey = document.getElementById('secretKey').value;
  const decryptInput = document.getElementById('decryptInput').value.trim();

  if (!secretKey || !decryptInput) {
    showNotification('Key and encrypted text required', 'error');
    return;
  }
  try {
    const key = await deriveKey(secretKey);
    if (!key) return;
    const decrypted = await decryptText(decryptInput, key);
    document.getElementById('decryptedOutput').value = decrypted;
    document.getElementById('decryptedBox').classList.remove('hidden');
    showNotification('Successfully decrypted');

    clearTimeout(state.clearTimers.decrypt);
    state.clearTimers.decrypt = setTimeout(clearDecryptForm, 30000);
  } catch (err) {
    console.error('Decryption error:', err);
    showNotification('Wrong key or corrupted data', 'error');
  }
}

function toggleKeyVisibility() {
  const input = document.getElementById('secretKey');
  const toggle = document.getElementById('toggleText');
  if (input.type === 'password') {
    input.type = 'text';
    toggle.textContent = 'hide';
  } else {
    input.type = 'password';
    toggle.textContent = 'show';
  }
}

async function copyToClipboard(elementId) {
  const element = document.getElementById(elementId);
  try {
    await navigator.clipboard.writeText(element.value);
    showNotification('Copied to clipboard');
  } catch (err) {
    console.error('Copy failed:', err);
    showNotification('Failed to copy', 'error');
  }
}

function deleteEntry(idx) {
  state.vault.splice(idx, 1);
  updateVaultUI();
  showNotification('Entry deleted');
}

// ---------------------------------------------------------------------------
// UI HELPERS
// ---------------------------------------------------------------------------
function showNotification(message, type = 'success') {
  const notif = document.getElementById('notification');
  notif.textContent = message;
  notif.className = 'notification ' + (type === 'error' ? 'error' : '');
  notif.classList.remove('hidden');
  clearTimeout(state.clearTimers.notif);
  state.clearTimers.notif = setTimeout(() => notif.classList.add('hidden'), 3000);
}

function updateKeyStatus() {
  const input = document.getElementById('secretKey');
  const len = input.value.length;
  const status = document.getElementById('keyStatus');
  const meter = document.getElementById('keyMeter');

  // simple strength: length + character variety
  let score = Math.min(len / 24, 1);
  const val = input.value;
  const variety = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].reduce(
    (acc, re) => acc + (re.test(val) ? 0.05 : 0), 0
  );
  score = Math.min(1, score + variety);
  meter.style.width = (score * 100).toFixed(0) + '%';

  if (len === 0) status.textContent = 'no key entered';
  else if (len < 8) status.textContent = `too short (${len}/8)`;
  else if (score < 0.5) status.textContent = 'weak key';
  else if (score < 0.85) status.textContent = 'ok — ready';
  else status.textContent = 'strong — ready';
}

function updateCharCount(spanId, inputId) {
  document.getElementById(spanId).textContent =
    document.getElementById(inputId).value.length;
}

function clearEncryptForm() {
  document.getElementById('encryptedOutput').value = '';
  document.getElementById('encryptedBox').classList.add('hidden');
  document.getElementById('plainText').value = '';
  document.getElementById('accountName').value = '';
  updateCharCount('plainLength', 'plainText');
}

function clearDecryptForm() {
  document.getElementById('decryptedOutput').value = '';
  document.getElementById('decryptedBox').classList.add('hidden');
  document.getElementById('decryptInput').value = '';
}

function updateVaultUI() {
  const card = document.getElementById('vaultCard');
  const list = document.getElementById('vaultList');
  const count = document.getElementById('vaultCount');

  if (state.vault.length === 0) {
    card.classList.add('hidden');
    return;
  }
  card.classList.remove('hidden');
  count.textContent = state.vault.length;
  list.innerHTML =
    '<div class="vault-note">SESSION MEMORY ONLY &mdash; clears on refresh</div>';

  state.vault.forEach((entry, idx) => {
    const div = document.createElement('div');
    div.className = 'vault-entry';
    div.setAttribute('data-testid', 'vault-entry');
    div.innerHTML = `
      <div class="entry-info">
        <div class="entry-name">${escapeHtml(entry.name)}</div>
        <div class="entry-time">${escapeHtml(entry.timestamp)}</div>
      </div>
      <button class="ghost mini" data-testid="vault-delete-btn">delete</button>
    `;
    div.querySelector('button').addEventListener('click', () => deleteEntry(idx));
    list.appendChild(div);
  });
}

function escapeHtml(text) {
  const map = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// ---------------------------------------------------------------------------
// EVENT WIRING
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const secretKey = document.getElementById('secretKey');
  secretKey.addEventListener('input', () => {
    document.getElementById('keyLength').textContent = secretKey.value.length;
    updateKeyStatus();
  });

  document.getElementById('toggleKeyBtn').addEventListener('click', toggleKeyVisibility);

  document.getElementById('plainText').addEventListener('input',
    () => updateCharCount('plainLength', 'plainText'));

  document.getElementById('plainText').addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') handleEncrypt();
  });

  document.getElementById('encryptBtn').addEventListener('click', handleEncrypt);
  document.getElementById('copyEncryptedBtn').addEventListener('click',
    () => copyToClipboard('encryptedOutput'));

  document.getElementById('decryptInput').addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') handleDecrypt();
  });

  document.getElementById('decryptBtn').addEventListener('click', handleDecrypt);
  document.getElementById('copyDecryptedBtn').addEventListener('click',
    () => copyToClipboard('decryptedOutput'));

  // click-to-copy on the encrypted textarea
  document.getElementById('encryptedOutput').addEventListener('click',
    () => copyToClipboard('encryptedOutput'));
});
