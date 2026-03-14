const { Client, GatewayIntentBits } = require('discord.js');
const mineflayer = require('mineflayer');

const dcClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// --- ตั้งค่า ID ช่องที่บอทจะใช้รายงานตัว (แก้ให้ตรงกับของคุณ) ---
const DISCORD_CHANNEL_ID = '1482064161038139403'; 

let bot;
let reconnectTimeout;
let serverConfig = { host: null, port: null };

// ฟังก์ชันรายงานสถานะไปที่ Discord
function report(msg) {
    console.log(msg);
    const channel = dcClient.channels.cache.get(DISCORD_CHANNEL_ID);
    if (channel) {
        channel.send(msg).catch(() => {});
    }
}

// ฟังก์ชันหลักเชื่อมต่อ Minecraft
function createBot() {
    if (!serverConfig.host || !serverConfig.port) return;

    // เคลียร์บอทเก่าและ Timeout เดิม
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (bot) {
        bot.removeAllListeners();
        try { bot.quit(); } catch (e) {}
    }

    report(`📡 **[System]** กำลังพยายามเข้าเซิร์ฟเวอร์ \`${serverConfig.host}:${serverConfig.port}\`...`);
    
    bot = mineflayer.createBot({
        host: serverConfig.host,
        port: parseInt(serverConfig.port),
        username: 'BOT',
        version: false // ตรวจสอบเวอร์ชั่นอัตโนมัติ
    });

    bot.on('login', () => {
        report('✅ **[Step 1]** ล็อกอินสำเร็จ!');
    });
    
    bot.on('spawn', () => {
        report('🌍 **[Step 2]** ตัวละครเกิดในโลกแล้ว! ออนไลน์ปกติ');
    });
    
    bot.on('resourcePack', () => {
        report('📦 **[Addon]** ตรวจพบไฟล์ทรัพยากร... กดยอมรับอัตโนมัติ');
        bot.acceptResourcePack();
    });

    bot.on('error', (err) => {
        let errorMsg = err.message;
        if (err.code === 'ECONNREFUSED') errorMsg = 'เซิร์ฟเวอร์ยังไม่เปิด หรือใส่ IP/Port ผิด';
        report(`❌ **[Error]** พบปัญหา: \`${errorMsg}\``);
        handleReconnect();
    });

    bot.on('end', () => {
        report('⚠️ **[Status]** บอทหลุดจากเซิร์ฟ... จะลองใหม่ใน 20 วินาที');
        handleReconnect();
    });
}

function handleReconnect() {
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    reconnectTimeout = setTimeout(() => {
        createBot();
    }, 20000); // พยายามใหม่ทุกๆ 20 วินาที
}

// เมื่อ Discord Bot ออนไลน์
dcClient.once('ready', () => {
    console.log(`🤖 Discord Bot ออนไลน์: ${dcClient.user.tag}`);
    report('👋 **ระบบพร้อมทำงานแล้วครับ!**\n\n👉 กรุณาสั่งงานด้วยคำสั่ง: `!set [IP] [PORT]`\n*(เช่น `!set sv4.mc4.in 50949`)*');
});

// จัดการคำสั่งจาก Discord
dcClient.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // 1. ตั้งค่าและเริ่มเชื่อมต่อ
    if (message.content.startsWith('!set ')) {
        const parts = message.content.split(' ');
        if (parts.length < 3) {
            return message.reply('❌ รูปแบบผิด! ต้องพิมพ์แบบนี้: `!set [IP] [PORT]`');
        }
        serverConfig.host = parts[1];
        serverConfig.port = parts[2];
        message.reply(`⚙️ บันทึกค่าใหม่: **${serverConfig.host}:${serverConfig.port}**\nกำลังเริ่มเชื่อมต่อ...`);
        createBot();
    }

    // 2. เช็คการทำงาน
    if (message.content === '!ping') {
        message.reply('🏓 **Pong!** ระบบ Discord พร้อมรับคำสั่งครับ');
    }
    
    // 3. ประกาศข้อความ (!bc)
    if (message.content.startsWith('!bc ')) {
        const text = message.content.slice(4);
        if (bot && bot.entity) {
            bot.chat(`/title @a title {"text":"${text}","color":"gold","bold":true}`);
            bot.chat(`📢 [ประกาศจาก Discord]: ${text}`);
            message.reply('✅ ประกาศข้อความเรียบร้อย');
        } else {
            message.reply('❌ บอทยังไม่ได้อยู่ในโลก (พิมพ์ !set ก่อน)');
        }
    }
});

dcClient.login(process.env.DISCORD_TOKEN);
    }
});

dcClient.login(process.env.DISCORD_TOKEN);
