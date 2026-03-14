const { Client, GatewayIntentBits } = require('discord.js');
const mineflayer = require('mineflayer');

const dcClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// --- ข้อมูลการเชื่อมต่อ (เช็คให้ตรงกับเซิร์ฟเวอร์ของคุณ) ---
const DISCORD_CHANNEL_ID = '1482064161038139403'; 
const VOICE_CHANNEL_ID = '1482064304118304810';
const mcOptions = {
    host: 'sv4.mc4.in', 
    port: 50949,
    username: 'BOT'
};

let bot;
let reconnectTimeout;

// ฟังก์ชันรายงานสถานะไปที่ Discord เพื่อให้คุณดูความคืบหน้า
function report(msg) {
    console.log(msg);
    const channel = dcClient.channels.cache.get(DISCORD_CHANNEL_ID);
    if (channel) channel.send(msg).catch(e => console.error('Discord Send Error:', e.message));
}

function createBot() {
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    
    // ล้างบอทเก่าป้องกันการค้าง
    if (bot) {
        bot.removeAllListeners();
        try { bot.quit(); } catch (e) {}
    }

    report('⏳ **[System]** กำลังพยายามเชื่อมต่อ Minecraft... (รอการตอบรับจากเซิร์ฟเวอร์)');
    
    bot = mineflayer.createBot(mcOptions);

    // แก้ปัญหา Addons: ยอมรับ Resource Pack อัตโนมัติ
    bot.on('resourcePack', () => {
        report('📦 **[Addon]** ตรวจพบ Resource Pack! กำลังกดยอมรับอัตโนมัติเพื่อให้เข้าเกมได้...');
        bot.acceptResourcePack();
    });

    bot.on('login', () => {
        report('✅ **[Success]** บอทล็อกอินสำเร็จ! กำลังรอตัวละครเกิด...');
    });

    bot.on('spawn', () => {
        report('🌍 **[World]** บอทเกิดในโลกเรียบร้อยแล้ว! พร้อมสแตนด์บาย');
        updateVoiceChannel();
    });

    // ถ้าเข้าไม่ได้ หรือเซิร์ฟปิด (ECONNREFUSED)
    bot.on('error', (err) => {
        let errorType = err.code === 'ECONNREFUSED' ? 'เซิร์ฟเวอร์ยังไม่เปิด/พอร์ตปิด' : err.message;
        report(`❌ **[Error]** เชื่อมต่อไม่ได้: ${errorType} (จะลองใหม่ใน 20 วินาที)`);
        handleReconnect();
    });

    bot.on('end', () => {
        report('⚠️ **[Status]** การเชื่อมต่อสิ้นสุดลง... กำลังเตรียม Reconnect');
        handleReconnect();
    });
}

function handleReconnect() {
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    reconnectTimeout = setTimeout(() => createBot(), 20000); // พยายามใหม่ทุก 20 วินาที
}

// อัปเดตจำนวนคนในห้องเสียง
async function updateVoiceChannel() {
    try {
        const voiceChannel = await dcClient.channels.fetch(VOICE_CHANNEL_ID);
        if (voiceChannel && bot.players) {
            const count = Object.keys(bot.players).length;
            await voiceChannel.setName(`Players Online: ${count}`);
        }
    } catch (e) {
        console.log('Voice Channel Update Error (อาจติด Rate Limit)');
    }
}

// ระบบนับคนเข้า-ออก
dcClient.once('ready', () => {
    console.log(`🤖 Discord Bot ออนไลน์: ${dcClient.user.tag}`);
    createBot();
});

dcClient.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // 1. เช็คว่า Discord บอทยังตอบไหม
    if (message.content === '!ping') {
        return message.reply('🏓 **Pong!** ระบบ Discord ทำงานปกติ (ถ้าไม่มี Log อื่นขึ้นแสดงว่าบอทติด Error ที่ตัว Minecraft)');
    }

    // 2. บังคับเข้าเกมทันที
    if (message.content === '!join') {
        report('🚀 **[Command]** บังคับเชื่อมต่อใหม่ทันที...');
        createBot();
    }

    // 3. ประกาศข้อความ (!bc)
    if (message.content.startsWith('!bc ')) {
        const text = message.content.slice(4);
        if (bot && bot.entity) {
            bot.chat(`/title @a title {"text":"${text}","color":"gold","bold":true}`);
            bot.chat(`📢 [ประกาศจาก Discord]: ${text}`);
            message.reply(`✅ ประกาศข้อความ "${text}" เรียบร้อย`);
        } else {
            message.reply('❌ บอทไม่อยู่ในเกม ประกาศไม่ได้ครับ');
        }
    }
});

dcClient.login(process.env.DISCORD_TOKEN);
