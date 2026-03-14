const { Client, GatewayIntentBits } = require('discord.js');
const mineflayer = require('mineflayer');

const dcClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// --- ตั้งค่า ID และ ข้อมูลเซิร์ฟเวอร์ ---
const DISCORD_CHANNEL_ID = '1482064161038139403'; 
const VOICE_CHANNEL_ID = '1482064304118304810';
const mcOptions = {
    host: 'sv4.mc4.in', 
    port: 50949,
    username: 'BOT',
    version: false // ให้บอทตรวจหาเวอร์ชั่นอัตโนมัติ
};

let bot;
let reconnectTimeout;

// ฟังก์ชันรายงานทุกอย่างที่เกิดขึ้นลงใน Discord Channel
function report(msg) {
    console.log(msg); // แสดงใน Console ของ Railway
    const channel = dcClient.channels.cache.get(DISCORD_CHANNEL_ID);
    if (channel) {
        channel.send(msg).catch(e => console.error('ส่งข้อความลง Discord ไม่ได้:', e.message));
    }
}

function createBot() {
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    
    if (bot) {
        bot.removeAllListeners();
        try { bot.quit(); } catch (e) {}
    }

    report('⏳ **[System]** กำลังพยายามเชื่อมต่อ Minecraft... (ถ้าหายเงียบไปเกิน 1 นาที แสดงว่าเซิร์ฟเวอร์ไม่ตอบกลับ)');
    
    bot = mineflayer.createBot(mcOptions);

    // ดักจับ Event ต่างๆ เพื่อรายงานความคืบหน้า
    bot.on('resourcePack', () => {
        report('📦 **[Addon]** ตรวจพบ Addon! กดยอมรับอัตโนมัติเรียบร้อย');
        bot.acceptResourcePack();
    });

    bot.on('login', () => {
        report('✅ **[Success]** บอทล็อกอินเข้าเซิร์ฟเวอร์สำเร็จ! กำลังโหลดโลก...');
    });

    bot.on('spawn', () => {
        report('🌍 **[World]** บอทเกิดในโลกแล้ว! พร้อมทำงาน');
        updateVoiceChannel();
    });

    bot.on('error', (err) => {
        let errorMsg = err.message;
        if (err.code === 'ECONNREFUSED') errorMsg = 'เซิร์ฟเวอร์ยังไม่เปิด หรือ IP/Port ไม่ถูกต้อง';
        report(`❌ **[Error]** ปัญหา: ${errorMsg}`);
        handleReconnect();
    });

    bot.on('end', () => {
        report('⚠️ **[Status]** บอทหลุดจากเซิร์ฟเวอร์... จะพยายามใหม่ใน 20 วินาที');
        handleReconnect();
    });
}

function handleReconnect() {
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    reconnectTimeout = setTimeout(() => createBot(), 20000); 
}

// อัปเดตชื่อห้องเสียง
async function updateVoiceChannel() {
    try {
        const voiceChannel = await dcClient.channels.fetch(VOICE_CHANNEL_ID);
        if (voiceChannel && bot.players) {
            const count = Object.keys(bot.players).length;
            await voiceChannel.setName(`Players Online: ${count}`);
        }
    } catch (e) {
        console.log('Update Voice Channel ติด Rate Limit');
    }
}

dcClient.once('ready', () => {
    console.log(`🤖 Discord Bot ออนไลน์: ${dcClient.user.tag}`);
    createBot();
});

dcClient.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // คำสั่งเช็คชีพจรบอท
    if (message.content === '!ping') {
        return message.reply('🏓 **Pong!** ระบบสั่งการปกติ (ถ้าไม่มีข้อความรายงานอื่นขึ้น แสดงว่าบอทค้างตอนเชื่อมต่อ Minecraft)');
    }

    // คำสั่งบังคับให้บอทพยายามเข้าเกมใหม่ทันที
    if (message.content === '!join') {
        report('🚀 **[Command]** บังคับเชื่อมต่อใหม่ทันที...');
        createBot();
    }

    if (message.content.startsWith('!bc ')) {
        const text = message.content.slice(4);
        if (bot && bot.entity) {
            bot.chat(`/title @a title {"text":"${text}","color":"gold","bold":true}`);
            bot.chat(`📢 [ประกาศ]: ${text}`);
            message.reply(`✅ ประกาศเรียบร้อย`);
        } else {
            message.reply('❌ บอทไม่อยู่ในเกมครับ');
        }
    }
});

dcClient.login(process.env.DISCORD_TOKEN);
