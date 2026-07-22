// ============================================================================
// Chai Vault - Main Script
// ============================================================================

// State Management
const state = {
  vault: [],
  keyDerived: false,
  clearTimers: {}
};

// ============================================================================
// Crypto Functions
// ============================================================================

/**
 * Derive a cryptographic key from a password using PBKDF2
 * @param {string} password - The password to derive from
 * @returns {Promise<CryptoKey|null>} The derived key or null if failed
 */
async function deriveKey(password) {
  if (!password || password.length < 8) {
    showNotification('Key must be at least 8 characters', 'error');
    return null;
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const salt = encoder.encode('chai-vault-salt'); // Fixed salt for consistency

    const baseKey = await crypto.subtle.importKey(
      'raw',
      data,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
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

/**
 * Encrypt plain text using AES-256-GCM
 * @param {string} plainText - Text to encrypt
 * @param {CryptoKey} key - The cryptographic key
 * @returns {Promise<string|null>} Base64-encoded encrypted data or null if failed
 */
async function encryptText(plainText, key) {
  try {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);

    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);

    // Convert to base64
    return btoa(String.fromCharCode.apply(null, combined));
  } catch (err) {
    console.error('Encryption failed:', err);
    throw err;
  }
}

/**
 * Decrypt base64-encoded encrypted text using AES-256-GCM
 * @param {string} encryptedBase64 - Base64-encoded encrypted data
 * @param {CryptoKey} key - The cryptographic key
 * @returns {Promise<string|null>} Decrypted text or null if failed
 */
async function decryptText(encryptedBase64, key) {
  try {
    const combined = new Uint8Array(
      atob(encryptedBase64).split('').map(c => c.charCodeAt(0))
    );
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (err) {
    console.error('Decryption failed:', err);
    throw err;
  }
}

// ============================================================================
// UI Handlers
// ============================================================================

/**
 * Handle encryption button click
 */
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

    // Display encrypted output
    document.getElementById('encryptedOutput').value = encrypted;
    document.getElementById('encryptedBox').classList.remove('hidden');

    // Add to vault
    state.vault.push({
      name: accountName,
      encrypted,
      timestamp: new Date().toLocaleString()
    });
    updateVaultUI();

    // Copy to clipboard
    await navigator.clipboard.writeText(encrypted);
    showNotification('✅ Encryption complete - copied to clipboard');

    // Auto-clear after 30 seconds
    clearTimeout(state.clearTimers.encrypt);
    state.clearTimers.encrypt = setTimeout(() => {
      clearEncryptForm();
    }, 30000);
  } catch (err) {
    console.error('Encryption error:', err);
    showNotification('❌ Encryption failed', 'error');
  }
}

/**
 * Handle decryption button click
 */
async function handleDecrypt() {
  const secretKey = document.getElementById('secretKey').value;
  const decryptInput = document.getElementById('decryptInput').value;

  if (!secretKey || !decryptInput) {
    showNotification('Key and encrypted text required', 'error');
    return;
  }

  try {
    const key = await deriveKey(secretKey);
    if (!key) return;

    const decrypted = await decryptText(decryptInput, key);

    // Display decrypted output
    document.getElementById('decryptedOutput').value = decrypted;
    document.getElementById('decryptedBox').classList.remove('hidden');
    showNotification('🔓 Successfully decrypted');

    // Auto-clear after 30 seconds
    clearTimeout(state.clearTimers.decrypt);
    state.clearTimers.decrypt = setTimeout(() => {
      clearDecryptForm();
    }, 30000);
  } catch (err) {
    console.error('Decryption error:', err);
    showNotification('❌ Wrong key or corrupted data', 'error');
  }
}

/**
 * Toggle password visibility
 */
function toggleKeyVisibility() {
  const input = document.getElementById('secretKey');
  const toggle = document.getElementById('toggleText');
  if (input.type === 'password') {
    input.type = 'text';
    toggle.textContent = 'Hide';
  } else {
    input.type = 'password';
    toggle.textContent = 'Show';
  }
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(elementId) {
  const element = document.getElementById(elementId);
  try {
    await navigator.clipboard.writeText(element.value);
    showNotification('📋 Copied to clipboard');
  } catch (err) {
    console.error('Copy failed:', err);
    showNotification('Failed to copy', 'error');
  }
}

/**
 * Clear vault (temporary storage only)
 */
function clearVault() {
  state.vault = [];
  updateVaultUI();
  showNotification('Vault cleared - (not saved to disk)');
}

/**
 * Delete vault entry
 */
function deleteEntry(idx) {
  state.vault.splice(idx, 1);
  updateVaultUI();
  showNotification('🗑️ Entry deleted');
}

// ============================================================================
// UI Utilities
// ============================================================================

/**
 * Show notification message
 */
function showNotification(message, type = 'success') {
  const notif = document.getElementById('notification');
  notif.textContent = message;
  notif.className = 'notification ' + (type === 'error' ? 'error' : '');
  notif.classList.remove('hidden');
  setTimeout(() => notif.classList.add('hidden'), 3000);
}

/**
 * Update key status indicator
 */
function updateKeyStatus() {
  const keyLength = document.getElementById('secretKey').value.length;
  const keyStatus = document.getElementById('keyStatus');

  if (keyLength === 0) {
    keyStatus.textContent = 'No key entered';
  } else if (keyLength < 8) {
    keyStatus.textContent = `Too short (${keyLength}/8)`;
  } else {
    keyStatus.textContent = '✅ Key ready';
  }
}

/**
 * Update character count display
 */
function updateCharCount(spanId, inputId) {
  const input = document.getElementById(inputId);
  document.getElementById(spanId).textContent = input.value.length;
}

/**
 * Clear encrypt form and hide result
 */
function clearEncryptForm() {
  document.getElementById('encryptedOutput').value = '';
  document.getElementById('encryptedBox').classList.add('hidden');
  document.getElementById('plainText').value = '';
  document.getElementById('accountName').value = '';
  updateCharCount('plainLength', 'plainText');
}

/**
 * Clear decrypt form and hide result
 */
function clearDecryptForm() {
  document.getElementById('decryptedOutput').value = '';
  document.getElementById('decryptedBox').classList.add('hidden');
  document.getElementById('decryptInput').value = '';
}

/**
 * Update vault display (temporary in-memory storage only)
 */
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
  list.innerHTML = '<div class="char-count" style="margin-bottom: 16px; font-size: 10px; color: var(--text-muted); border-bottom: 1px dashed var(--border-color); padding-bottom: 8px;">SESSION MEMORY ONLY - Clears on refresh</div>';

  state.vault.forEach((entry, idx) => {
    const div = document.createElement('div');
    div.className = 'vault-entry';
    div.innerHTML = `
      <div class="entry-info">
        <div class="entry-name">${escapeHtml(entry.name)}</div>
        <div class="entry-time">${entry.timestamp}</div>
      </div>
      <button class="secondary" onclick="deleteEntry(${idx})" style="white-space: nowrap;">
        Delete
      </button>
    `;
    list.appendChild(div);
  });
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// ============================================================================
// Event Listeners
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Key management
  document.getElementById('secretKey').addEventListener('input', (e) => {
    document.getElementById('keyLength').textContent = e.target.value.length;
    updateKeyStatus();
  });

  document.getElementById('toggleKeyBtn').addEventListener('click', toggleKeyVisibility);

  // Encryption form
  document.getElementById('plainText').addEventListener('input', () => {
    updateCharCount('plainLength', 'plainText');
  });

  document.getElementById('plainText').addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') handleEncrypt();
  });

  document.getElementById('encryptBtn').addEventListener('click', handleEncrypt);
  document.getElementById('copyEncryptedBtn').addEventListener('click', () => {
    copyToClipboard('encryptedOutput');
  });

  // Decryption form
  document.getElementById('decryptInput').addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') handleDecrypt();
  });

  document.getElementById('decryptBtn').addEventListener('click', handleDecrypt);
  document.getElementById('copyDecryptedBtn').addEventListener('click', () => {
    copyToClipboard('decryptedOutput');
  });
});

// ============================================================================
// Service Worker Registration (for future PWA support)
// ============================================================================

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Service worker registration will be added in v3.0
    // navigator.serviceWorker.register('service-worker.js').catch(err => {
    //   console.log('Service Worker registration failed:', err);
    // });
  });
}