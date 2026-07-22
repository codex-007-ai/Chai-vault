# 🔐 Chai Vault

Privacy-first offline password encryption. Everything runs in your browser. Nothing leaves your device. **ZERO persistent storage.**

## Features

✅ **AES-256-GCM Encryption** — Military-grade via Web Crypto API  
✅ **Completely Offline** — Works without internet  
✅ **Zero Dependencies** — Pure HTML, CSS, JavaScript  
✅ **No Databases** — No localStorage, no IndexedDB, no files  
✅ **Zero Persistence** — Vault entries cleared on page refresh  
✅ **Open Source** — Audit the code yourself  
✅ **Mobile-Friendly** — Works great on phones and tablets  
✅ **Auto-Clear** — Sensitive fields disappear after 30 seconds  
✅ **Copy to Clipboard** — One-click copying  
✅ **Hacker Theme** — Neon green terminal vibes  

## Quick Start

### Option 1: GitHub Pages (Recommended)

1. Fork this repository
2. In repo settings, enable GitHub Pages for the `main` branch
3. Your vault is now live at `https://yourusername.github.io/chai-vault/`

That's it. No backend needed. Completely free hosting.

### Option 2: Local Development

```bash
# Clone the repo
git clone https://github.com/yourusername/chai-vault.git
cd chai-vault

# Run a local server (Python 3)
python -m http.server 8000

# Or with Node.js
npx http-server

# Open http://localhost:8000 in your browser
```

### Option 3: Run Without Server

1. Download `index.html`, `style.css`, and `script.js`
2. Open `index.html` directly in your browser
3. Works offline immediately

## How to Use

### Encrypt a Password

1. **Enter a Secret Key** — Your master password (min 8 characters)
2. **Add Account Name** — e.g., "GitHub", "Gmail"
3. **Enter Plain Text** — Your password or sensitive note
4. **Click "Encrypt"** — Generates encrypted text
5. **Click "Copy"** — Automatically copied to clipboard

### Decrypt a Password

1. **Paste Encrypted Text** — Into the decrypt box
2. **Enter Same Secret Key** — The one you used to encrypt
3. **Click "Decrypt"** — Reveals the original password
4. Auto-clears after 30 seconds for security

### Manage Vault

- **View Entries** — See all encrypted entries in your vault
- **Delete Entries** — Remove unwanted entries
- **Download Vault** — Save as `vault.json` for backup

## Zero Storage Policy

**This is NOT a password manager.** Chai Vault has:

- ✅ **NO localStorage** - Nothing saved to browser storage
- ✅ **NO IndexedDB** - No database files created
- ✅ **NO cookies** - No tracking
- ✅ **NO cloud sync** - No servers
- ✅ **NO JSON files** - Nothing written to disk

**How it works:**
1. Type in your secret key
2. Enter password to encrypt
3. Get encrypted text
4. Copy encrypted text (or paste a previous one to decrypt)
5. **Refresh page = everything is gone**

It's pure in-memory encryption. No persistence. No footprint.

## Security

### ✅ Safe

- AES-256-GCM encryption (NIST-approved)
- PBKDF2 key derivation (100,000 iterations)
- Random IV for every encryption
- No external servers
- No tracking, no analytics
- Open-source code
- No data stored anywhere

### ❌ Avoid

- Don't share your secret key
- Don't store master password anywhere
- Don't upload decrypted passwords
- Never share encrypted strings (not reversible without key, but still private)

### How Encryption Works

```
Secret Key
    ↓
PBKDF2 Derivation (SHA-256, 100,000 iterations)
    ↓
Cryptographic Key (256-bit)
    ↓
AES-256-GCM Encryption
    ↓
Random IV (12 bytes) + Encrypted Data (base64)
```

Each encryption uses a fresh random IV, making identical passwords produce different ciphertext.

## File Structure

```
chai-vault/
├── index.html          # Main page structure
├── style.css          # All styling
├── script.js          # Encryption logic & UI handlers
├── manifest.json      # PWA manifest (v3 feature)
├── .gitignore         # Never commit sensitive data
├── README.md          # This file
└── LICENSE            # Open source license
```

## Roadmap

### ✅ v1.0 (Current - MVP)

- Single encrypt/decrypt
- Character counting
- Copy to clipboard
- Basic vault viewing
- Dark theme

### 🚀 v2.0 (Real Vault)

Features coming:
- [ ] Add/Edit/Delete entries
- [ ] Search entries
- [ ] Copy username/password fields
- [ ] Password generator
- [ ] Import/export encrypted vault
- [ ] Organized categories

### 📲 v3.0 (Installable App)

Add PWA support:
- [ ] Service worker
- [ ] Offline caching
- [ ] Install to home screen
- [ ] Works without browser
- [ ] Faster loading

### 🔒 v4.0 (Master Password)

Security upgrades:
- [ ] Master password screen on load
- [ ] Session timeout
- [ ] Lock after inactivity
- [ ] Biometric unlock
- [ ] Two-factor setup

## Custom Domain

If you own a domain, you can use it instead of GitHub Pages:

```bash
# Point your domain to GitHub Pages IPs
# Instructions: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site

# Add CNAME file to repo
echo "chaivault.com" > CNAME
git add CNAME
git commit -m "Add custom domain"
git push
```

Popular affordable domains:
- `chaivault.me` (~$5/year)
- `vault.chai.dev` (~$10/year)
- `chaivault.app` (~$5/year)

## Tech Stack

- **Encryption:** Web Crypto API (built into browsers)
- **Frontend:** Vanilla HTML, CSS, JavaScript
- **Hosting:** GitHub Pages (free)
- **Framework:** None (zero dependencies)

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome  | ✅ 37+ |
| Firefox | ✅ 34+ |
| Safari  | ✅ 11+ |
| Edge    | ✅ 15+ |
| IE 11   | ❌ No  |

## Privacy Policy

**Chai Vault has ZERO privacy policy because:**
- No data is sent to any server
- No cookies or tracking
- No analytics
- No ads
- No cloud sync
- 100% client-side only

Your data never leaves your device.

## Contributing

Found a bug? Have a feature idea?

1. Open an issue
2. Describe what you want
3. Submit a PR

All contributions welcome!

## License

MIT License - Free for personal and commercial use

## Security Disclosure

Found a vulnerability? Please email `security@chaivault.dev` instead of opening a public issue.

## FAQ

### Is my password safe if I forget the key?

**No.** AES-256 is unbreakable. If you forget your secret key, your passwords are lost forever. Write it down in a safe place (like a notebook, not a file).

### Can I sync to multiple devices?

Not yet, but v2.0 will support encrypted cloud sync. For now, download your vault as JSON and transfer it securely.

### What if Chai Vault goes offline?

It won't. You can download the files and run them locally. You can even use them without the internet.

### Is the code audited?

Not by professionals yet, but it's open source and uses only standard Web Crypto API. If you're paranoid, hire a security auditor.

### Can I use the same key for different passwords?

Yes, each password uses a random IV, so they'll encrypt differently. But using unique keys is more secure.

### What's the master password?

In v1, there is no master password. In v4.0, we'll add one. For now, just remember your secret key.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Enter | Encrypt |
| Ctrl+Enter | Decrypt |
| (coming in v2) | |

## Troubleshooting

### "Wrong key or corrupted data" error

- You used a different key to decrypt than you used to encrypt
- The encrypted text was modified
- Copy the exact encrypted string again

### "All fields required" error

- Secret key must be at least 8 characters
- Account name cannot be empty
- Plain text cannot be empty

### Can't copy to clipboard

- Allow clipboard permissions in browser settings
- Try copying manually (Ctrl+C)

### Slow encryption

That's normal! PBKDF2 uses 100,000 iterations for security. Takes 1-2 seconds.

## Credits

Built with ❤️ by Chaitanya  
Inspired by password managers that respect privacy  
Powered by Web Crypto API

## Star ⭐

If you like Chai Vault, please star this repo! It helps others discover it.

---

**Last Updated:** 2026-07-22  
**Version:** 1.0.0  
**Status:** Production Ready
