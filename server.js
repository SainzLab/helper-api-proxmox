const express = require('express');
const fs = require('fs');
const axios = require('axios');
const https = require('https');

const app = express();
const PORT = 3000; 
const CONFIG_FILE = './config.json';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function loadConfig() {
    if (fs.existsSync(CONFIG_FILE)) {
        return JSON.parse(fs.readFileSync(CONFIG_FILE));
    }
    
    return { pveIp: '', pvePort: '8006', pveTokenId: '', pveSecret: '', bridgeToken: '', bridgeSecret: '' };
}

function saveConfig(config) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

app.get('/', (req, res) => {
    const config = loadConfig();
    res.send(`
        <!DOCTYPE html>
        <html lang="id" class="dark">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>mymomox Helper Setup</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; }
                .font-mono { font-family: 'JetBrains Mono', monospace; }
            </style>
        </head>
        <body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4">
            <div class="w-full max-w-lg bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8">
                <!-- Header -->
                <div class="flex items-center gap-3 mb-6">
                    <div class="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                    </div>
                    <div>
                        <h2 class="text-xl font-bold text-white tracking-tight">mymomox Helper Setup</h2>
                        <p class="text-xs text-slate-400 mt-0.5">Konfigurasi Bridge Proxy Proxmox VE</p>
                    </div>
                </div>

                <p class="text-xs sm:text-sm text-slate-400 mb-6 bg-slate-800/40 p-3.5 rounded-xl border border-slate-800/80 leading-relaxed">
                    Masukkan kredensial Proxmox asli Anda. Sistem akan membuatkan kredensial gembok baru untuk dikonfigurasi di aplikasi HP.
                </p>

                <!-- Form -->
                <form action="/save" method="POST" class="space-y-4">
                    <div class="grid grid-cols-3 gap-3">
                        <div class="col-span-2">
                            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">IP Proxmox Lokal</label>
                            <input type="text" name="pveIp" value="${config.pveIp}" placeholder="192.168.8.133" required class="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 outline-none transition font-mono">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Port</label>
                            <input type="text" name="pvePort" value="${config.pvePort}" placeholder="8006" required class="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 outline-none transition font-mono">
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Token ID Proxmox Asli</label>
                        <input type="text" name="pveTokenId" value="${config.pveTokenId}" placeholder="misal: mymomox-token" required class="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 outline-none transition font-mono">
                    </div>

                    <div>
                        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Secret Key Proxmox Asli</label>
                        <input type="password" name="pveSecret" value="${config.pveSecret}" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" required class="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 outline-none transition font-mono">
                    </div>

                    <button type="submit" class="w-full mt-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition duration-150 flex items-center justify-center gap-2 cursor-pointer">
                        <span>SIMPAN & BUAT KREDENSIAL HP</span>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </button>
                </form>
            </div>
        </body>
        </html>
    `);
});

app.post('/save', (req, res) => {
    let newConfig = req.body;
    
    newConfig.bridgeToken = 'app_' + Math.random().toString(36).substring(2, 8);
    newConfig.bridgeSecret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 10);
    
    saveConfig(newConfig);
    
    res.send(`
        <!DOCTYPE html>
        <html lang="id" class="dark">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>mymomox - Success</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; }
                .font-mono { font-family: 'JetBrains Mono', monospace; }
            </style>
        </head>
        <body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4">
            <div class="w-full max-w-lg bg-slate-900/90 backdrop-blur-md border border-emerald-500/30 rounded-2xl shadow-2xl p-6 sm:p-8">
                <!-- Icon & Title -->
                <div class="text-center mb-6">
                    <div class="inline-flex items-center justify-center w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 mb-3">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <h2 class="text-xl font-bold text-white tracking-tight">Kredensial Info</h2>
                    <p class="text-xs text-slate-400 mt-1 leading-relaxed">Buka aplikasi <b class="text-emerald-400 font-semibold">mymomox</b> di HP Anda, masuk ke menu <b>Settings</b>, lalu masukkan data berikut:</p>
                </div>

                <!-- Credential Box -->
                <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 font-mono text-sm">
                    <div class="flex items-center justify-between pb-2 border-b border-slate-800/80">
                        <span class="text-xs font-sans text-slate-400 uppercase tracking-wider">IP Address</span>
                        <span class="text-emerald-400 font-bold">IP_PUBLIK_ANDA</span>
                    </div>
                    <div class="flex items-center justify-between pb-2 border-b border-slate-800/80">
                        <span class="text-xs font-sans text-slate-400 uppercase tracking-wider">Port</span>
                        <span class="text-emerald-400 font-bold">PORT_IP_PUBLIK</span>
                    </div>
                    <div class="flex items-center justify-between pb-2 border-b border-slate-800/80">
                        <span class="text-xs font-sans text-slate-400 uppercase tracking-wider">Proxmox User</span>
                        <span class="text-emerald-400 font-bold">root@pam</span>
                    </div>
                    <div class="flex flex-col gap-1 pb-2 border-b border-slate-800/80">
                        <span class="text-xs font-sans text-slate-400 uppercase tracking-wider">Token ID</span>
                        <div class="bg-slate-900 border border-slate-800 px-3 py-2 rounded text-emerald-400 font-bold break-all select-all">${newConfig.bridgeToken}</div>
                    </div>
                    <div class="flex flex-col gap-1">
                        <span class="text-xs font-sans text-slate-400 uppercase tracking-wider">Secret Key</span>
                        <div class="bg-slate-900 border border-slate-800 px-3 py-2 rounded text-emerald-400 font-bold break-all select-all">${newConfig.bridgeSecret}</div>
                    </div>
                </div>

                <!-- Alert Box -->
                <div class="mt-4 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                    <svg class="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    <p class="text-xs text-amber-200/80 leading-relaxed">
                        Kredensial di atas sekarang berfungsi sebagai <b>kunci gembok</b>. Jika aplikasi di HP tidak mengirimkan Token ID dan Secret Key yang persis sama, koneksi akan langsung ditolak.
                    </p>
                </div>

                <!-- Back Button -->
                <button onclick="window.location.href='/'" class="w-full mt-6 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-3 px-4 rounded-xl border border-slate-700 transition duration-150 cursor-pointer">
                    ← Kembali ke Pengaturan
                </button>
            </div>
        </body>
        </html>
    `);
});

app.use('/api2/json', async (req, res) => {
    const config = loadConfig();
    
    if (!config.pveIp || !config.pveTokenId || !config.bridgeToken) {
        return res.status(500).json({ error: "Backend Bridge belum di-setting." });
    }

    const expectedAuth = `PVEAPIToken=root@pam!${config.bridgeToken}=${config.bridgeSecret}`;
    const clientAuth = req.headers['authorization'];

    if (clientAuth !== expectedAuth) {
        console.log("Akses Ilegal Diblokir: Kredensial HP tidak valid.");
        return res.status(401).json({ error: "Unauthorized. Kredensial mymomox tidak valid." });
    }
    
    const targetUrl = `https://${config.pveIp}:${config.pvePort}${req.originalUrl}`;
    const secureToken = `PVEAPIToken=root@pam!${config.pveTokenId}=${config.pveSecret}`;

    try {
        const pveRes = await axios({
            method: req.method,
            url: targetUrl,
            headers: { 'Authorization': secureToken },
            data: req.body,
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        });
        res.status(pveRes.status).json(pveRes.data);
    } catch (err) {
        if (err.response) {
            res.status(err.response.status).json(err.response.data);
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

https.createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
}, app).listen(PORT, () => {
    console.log(`Backend berjalan -> https://0.0.0.0:${PORT}`);
});