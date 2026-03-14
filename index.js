const { Client, GatewayIntentBits } = require('discord.js');
const mineflayer = require('mineflayer');

const dcClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// --- ตั้งค่า ID ช่องที่บอทจะใช้คุย ---
const DISCORD_CHANNEL_ID = '1482064161038139403'; 

let bot;
let reconnectTimeout;
let serverInfo = { host: null, port: null };

function report(msg) {
    console.log(msg);
    const channel = dcClient.channels.cache.get(DISCORD_CHANNEL_ID);
    if (channel) {
        channel.send(msg).catch(() => {});
    }
}

function createBot() {
    if (!serverInfo.host || !serverInfo.port) return;

    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    
    if (bot) {
        bot.removeAllListeners();
        try { bot.quit(); } catch (e) {}
    }

    report(`📡 **[Connecting]** กำลังพยายามเชื่อมต่อที่ \`${serverInfo.host}:${serverInfo.port}\`...`);
    
    bot = mineflayer.createBot({
        host: serverInfo.host,
        port: parseInt(serverInfo.port),
        username: 'BOT',
        version: false
    });

    bot.on('login', () => report('✅ **[Login]** บอทล็อกอินสำเร็จ!'));
    
    bot.on('spawn', () => report('🌍 **[Spawn]** บอทออนไลน์ในโลกเรียบร้อย!'));
    
    bot.on('resourcePack', () => {
        report('📦 **[Addon]** ยอมรับ Resource Pack อัตโนมัติ');
        bot.acceptResourcePack();
    });

    bot.on('error', (err) => {
        report(`❌ **[Error]** พบปัญหา: \`${err.message}\``);
        handleReconnect();
    });

    bot.on('end', () => {
        report('⚠️ **[Status]** บอทหลุด... จะรอเชื่อมต่อใหม่ใน 20 วินาที');
        handleReconnect();
    });
}

function handleReconnect() {
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    reconnectTimeout = setTimeout(() => createBot(), 20000);
}

dcClient.once('ready', () => {
    console.log(`🤖 Discord Bot ออนไลน์: ${dcClient.user.tag}`);
    report('👋 **สวัสดีครับ! ระบบพร้อมทำงานแล้ว**\nกรุณาพิมพ์: `!set [IP] [PORT]` เพื่อเริ่มการเชื่อมต่อครับ');
});

dcClient.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // 1. คำสั่งตั้งค่า IP/Port
    if (message.content.startsWith('!set ')) {
        const parts = message.content.split(' ');
        if (parts.length < 3) {
            return message.reply('❌ รูปแบบผิด! ต้องเป็น `!set [IP] [PORT]`');
        }

        serverInfo.host = parts[1];
        serverInfo.port = parts[2];

        message.reply(`⚙️ รับทราบ! ตั้งค่าเป็น **${serverInfo.host}:${serverInfo.port}**\nกำลังเริ่มเชื่อมต่อ...`);
        createBot();
    }

    // 2. คำสั่งเช็คระบบ
    if (message.content === '!ping') {
        message.reply('🏓 **Pong!** ระบบรับคำสั่งปกติครับ');
    }
    
    // 3. คำสั่งประกาศ (Broadcast)
    if (message.content.startsWith('!bc ')) {
        const text = message.content.slice(4);
        if (bot && bot.entity) {
            bot.chat(`/title @a title {"text":"${text}","color":"gold"}`);
            bot.chat(`📢 [ประกาศ]: ${text}`);
            message.reply('✅ ประกาศสำเร็จ');
        } else {
            message.reply('❌ บอทยังไม่ได้เข้าเกม (พิมพ์ !set ก่อน)');
        }
    }
});

dcClient.login(process.env.DISCORD_TOKEN);
