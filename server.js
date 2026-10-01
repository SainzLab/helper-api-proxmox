const express = require('express');
const fs = require('fs');
const axios = require('axios');
const https = require('https');
const readline = require('readline');

const app = express();
const PORT = 3000; 
const CONFIG_FILE = './config.json';

let config = {};
let isHotkeySetup = false;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function loadConfig() {
    if (fs.existsSync(CONFIG_FILE)) return JSON.parse(fs.readFileSync(CONFIG_FILE));
    return { pveIp: '', pvePort: '8006', pveTokenId: '', pveSecret: '', bridgeToken: '', bridgeSecret: '' };
}

function saveConfig(cfg) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
}

app.use('/api2/json', async (req, res) => {
    if (!config.pveIp || !config.pveTokenId) {
        return res.status(500).json({ error: "Backend Bridge belum di-setting." });
    }

    const expectedAuth = `PVEAPIToken=root@pam!${config.bridgeToken}=${config.bridgeSecret}`;
    if (req.headers['authorization'] !== expectedAuth) {
        console.log("[BLOCKED] Akses Ilegal Diblokir: Kredensial HP tidak valid.");
        return res.status(401).json({ error: "Unauthorized." });
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
        if (err.response) res.status(err.response.status).json(err.response.data);
        else res.status(500).json({ error: err.message });
    }
});

async function promptForCredentials() {
    if (process.stdin.isTTY) process.stdin.setRawMode(false);
    
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (query) => new Promise(resolve => rl.question(query, resolve));

    console.log("\n==================================================");
    console.log("MYMOMOX BRIDGE SETUP (CLI MODE)");
    console.log("==================================================");
    
    config.pveIp = await question("IP Proxmox Lokal (misal 192.168.8.133) : ");
    config.pvePort = await question("Port Proxmox (tekan Enter untuk 8006): ") || '8006';
    config.pveTokenId = await question("Token ID Proxmox Asli                  : ");
    config.pveSecret = await question("Secret Key Proxmox Asli                : ");

    config.bridgeToken = 'app_' + Math.random().toString(36).substring(2, 8);
    config.bridgeSecret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 10);
    
    saveConfig(config);
    rl.close();
    
    console.log("\n[SUCCESS] Konfigurasi Tersimpan!");
    showAppCredentials();
    setupHotkeys(); 
}

function showAppCredentials() {
    console.log("\n==================================================");
    console.log("MASUKKAN DATA INI KE APLIKASI MYMOMOX DI HP");
    console.log("==================================================");
    console.log(`IP Address   : (Gunakan IP Publik)`);
    console.log(`Port         : ${PORT} (default)`);
    console.log(`Proxmox User : root@pam`);
    console.log(`Token ID     : ${config.bridgeToken}`);
    console.log(`Secret Key   : ${config.bridgeSecret}`);
    console.log("==================================================");
    console.log("\n[HOTKEY AKTIF]:");
    console.log("   [r] Reset  |  [s] Info Asli  |  [Ctrl+C] Keluar\n");
}

function setupHotkeys() {
    if (isHotkeySetup) return;
    isHotkeySetup = true;

    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);

    process.stdin.on('keypress', async (str, key) => {
        if (key.ctrl && key.name === 'c') process.exit();

        switch (key.name) {
            case 's': // SHOW CREDENTIALS
                console.log("\n==================================================");
                console.log("INFO KREDENSIAL ASLI (PROXMOX)");
                console.log("==================================================");
                console.log(`IP/Port       : ${config.pveIp}:${config.pvePort}`);
                console.log(`Token ID Asli : ${config.pveTokenId}`);
                console.log(`Secret Asli   : ${config.pveSecret}`);
                console.log("==================================================\n");
                break;

            case 'r': // RESET
                console.log("\n[RESET] Mereset konfigurasi...");
                if (fs.existsSync(CONFIG_FILE)) fs.unlinkSync(CONFIG_FILE);
                config = { pveIp: '', pvePort: '8006', pveTokenId: '', pveSecret: '', bridgeToken: '', bridgeSecret: '' };
                
                isHotkeySetup = false;
                process.stdin.removeAllListeners('keypress');
                await promptForCredentials();
                break;
        }
    });
}

async function initServer() {
    config = loadConfig();

    if (!config.pveIp || !config.pveSecret) {
        await promptForCredentials();
    } else {
        showAppCredentials();
        setupHotkeys();
    }

    if (fs.existsSync('server.key') && fs.existsSync('server.cert')) {
        https.createServer({
            key: fs.readFileSync('server.key'),
            cert: fs.readFileSync('server.cert')
        }, app).listen(PORT, '0.0.0.0', () => {
            console.log(`[STARTED] port ${PORT}`);
        });
    } else {
        console.error("\n[ERROR] File sertifikat SSL (server.key & server.cert) tidak ditemukan.");
        process.exit(1);
    }
}

initServer();