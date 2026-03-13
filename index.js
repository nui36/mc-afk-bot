const mineflayer = require('mineflayer');
const { Client, GatewayIntentBits } = require('discord.js');

// ================= [ ตั้งค่าข้อมูลของคุณตรงนี้ ] =================
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const TEXT_CH_ID = '1482064161038139403'; // ห้องที่ให้บอทพิมพ์แจ้งคนเข้า-ออก
const STATUS_VC_ID = '1482064161038139403'; // เช่น 🟢 Server: Online
const PLAYER_VC_ID = '1482064304118304810'; // เช่น 👥 Players: 1/20
const MC_HOST = 'sv4.mc4.in'; 
const MC_PORT = 50949; // พอร์ต Bedrock ปกติคือ 19132
const BOT_NAME = 'AFK_Ghost'; // ชื่อของบอทที่จะไปปรากฏในเกม
// =========================================================

const dcClient = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

let bot;

function createGhost() {
    console.log('กำลังเชื่อมต่อเข้าเซิร์ฟเวอร์ Minecraft...');
    
    bot = mineflayer.createBot({
        host: MC_HOST,
        port: MC_PORT,
        username: BOT_NAME,
        version: false // ค้นหาเวอร์ชันอัตโนมัติ
    });

    // ฟังก์ชันสำหรับอัปเดตชื่อห้องเสียง
    async function updateVoiceChannels(status, playerInfo) {
        try {
            const statusChan = await dcClient.channels.fetch(STATUS_VC_ID);
            const playerChan = await dcClient.channels.fetch(PLAYER_VC_ID);
            if (statusChan) await statusChan.setName(`🟢 Server: ${status}`);
            if (playerChan) await playerChan.setName(`👥 Players: ${playerInfo}`);
        } catch (err) {
            console.log('Discord Rate Limit: ไม่สามารถเปลี่ยนชื่อห้องได้ถี่เกินไป (ระบบจะลองใหม่ภายหลัง)');
        }
    }

    // เมื่อบอทเข้าสู่เซิร์ฟเวอร์ (Spawn)
    bot.on('spawn', () => {
        console.log('Ghost Online ในเกมแล้ว!');
        const channel = dcClient.channels.cache.get(TEXT_CH_ID);
        if (channel) channel.send('✅ **บอท Ghost เข้าเซิร์ฟเวอร์สำเร็จ!** (ระบบ AFK เริ่มทำงาน 24 ชม.)');
        
        // อัปเดตห้องเสียงเบื้องต้น (นับรวมตัวบอทเองเป็น 1)
        updateVoiceChannels('Online', `${Object.keys(bot.players).length}/20`);
    });

    // ตรวจสอบข้อความแชทในเกม (แจ้งเตือนคนเข้า-ออก)
    bot.on('message', (message) => {
        const msg = message.toString();
        const textChannel = dcClient.channels.cache.get(TEXT_CH_ID);

        // เช็คข้อความระบบ (ปรับตามข้อความจริงในเซิร์ฟเวอร์ของคุณ)
        if (msg.includes('joined the game') || msg.includes('เข้าสู่เกม')) {
            textChannel?.send(`📥 **[Join]** ${msg}`);
            updateVoiceChannels('Online', `${Object.keys(bot.players).length}/20`);
        } 
        else if (msg.includes('left the game') || msg.includes('ออกจากเกม')) {
            textChannel?.send(`📤 **[Leave]** ${msg}`);
            updateVoiceChannels('Online', `${Object.keys(bot.players).length}/20`);
        }
    });

    // เมื่อบอทหลุดออกจากเซิร์ฟเวอร์
    bot.on('end', (reason) => {
        console.log(`บอทหลุดจากเซิร์ฟเวอร์: ${reason}`);
        const channel = dcClient.channels.cache.get(TEXT_CH_ID);
        if (channel) channel.send(`❌ **บอท Ghost หลุด!** (สาเหตุ: ${reason}) เซิร์ฟเวอร์อาจจะปิดตัวลง`);
        
        updateVoiceChannels('Offline', '0/20');

        // พยายามเชื่อมต่อใหม่ในอีก 60 วินาที
        setTimeout(createGhost, 60000);
    });

    // กัน Error พังบอท
    bot.on('error', (err) => {
        console.error('เกิดข้อผิดพลาด:', err);
    });
}

// เมื่อบอทดิสคอร์ดพร้อม
dcClient.once('ready', () => {
    console.log(`Discord Bot พร้อมใช้งาน: ${dcClient.user.tag}`);
    createGhost();
});

dcClient.login(DISCORD_TOKEN);

const { Client, GatewayIntentBits } = require('discord.js');
const mineflayer = require('mineflayer');

// ตั้งค่า Discord Bot
const dcClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent // ต้องมีบรรทัดนี้เพื่อให้อ่านคำสั่งได้
    ]
});

const mcOptions = {
    host: 'sv4.mc4.in', 
    port: 50949,
    username: 'AFK_Ghost'
};

let bot;

// ฟังก์ชันสร้างบอท Minecraft พร้อมระบบ Auto-Reconnect
function createBot() {
    bot = mineflayer.createBot(mcOptions);

    bot.on('login', () => {
        console.log('บอทเข้า Minecraft เรียบร้อยแล้ว!');
    });

    // ถ้าหลุด ให้รอ 5 วินาทีแล้วเข้าใหม่เอง
    bot.on('end', () => {
        console.log('บอทหลุดจาก Minecraft กำลังพยายามเชื่อมต่อใหม่ใน 5 วินาที...');
        setTimeout(createBot, 5000);
    });

    bot.on('error', (err) => console.log('เกิดข้อผิดพลาด:', err));
}

createBot();

// ส่วนของคำสั่ง Discord
dcClient.on('messageCreate', (message) => {
    // ป้องกันบอทตอบตัวเอง
    if (message.author.bot) return;

    // ลองพิมพ์ !ping ใน Discord
    if (message.content === '!ping') {
        message.reply('Pong! บอทยังทำงานอยู่นะครับ');
    }

    // คำสั่งเช็คสถานะ
    if (message.content === '!status') {
        message.reply(bot && bot.entity ? 'บอทกำลังออนไลน์ใน Minecraft' : 'บอทไม่ได้อยู่ในเซิร์ฟเวอร์');
    }
});

dcClient.login(process.env.DISCORD_TOKEN);
