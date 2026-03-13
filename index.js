const { Client, GatewayIntentBits } = require('discord.js');
const mineflayer = require('mineflayer');

const dcClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// --- ตั้งค่า ID ---
const DISCORD_CHANNEL_ID = '1482064161038139403'; 
const VOICE_CHANNEL_ID = '1482064304118304810'; 
const mcOptions = {
    host: 'sv4.mc4.in', 
    port: 50949,
    username: 'BOT'
};

let bot;
let reconnectTimeout;

function createBot() {
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (bot) {
        bot.removeAllListeners();
        try { bot.quit(); } catch (e) {}
    }

    console.log('🔄 [System] กำลังพยายามเชื่อมต่อ...');
    bot = mineflayer.createBot(mcOptions);

    // --- ฟีเจอร์แก้ปัญหา Addons/Resource Pack ---
    bot.on('resourcePack', (url, hash) => {
        console.log('📦 เซิร์ฟเวอร์ขอให้โหลด Resource Pack... กำลังตอบรับอัตโนมัติ');
        bot.acceptResourcePack(); // สั่งให้บอทยอมรับทันที
    });

    bot.on('login', () => {
        console.log('✅ ออนไลน์สำเร็จ');
        const channel = dcClient.channels.cache.get(DISCORD_CHANNEL_ID);
        if (channel) channel.send('🟢 **บอทเข้าเซิร์ฟเวอร์สำเร็จแล้ว!**');
        updateVoiceChannel();
    });

    bot.on('end', () => {
        console.log('⚠️ หลุดจากเซิร์ฟเวอร์... จะลองใหม่ใน 15 วินาที');
        handleReconnect();
    });

    bot.on('error', (err) => {
        console.log(`❌ Error: ${err.message}`);
        handleReconnect();
    });
}

function handleReconnect() {
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    reconnectTimeout = setTimeout(() => {
        createBot();
    }, 15000); // รอ 15 วินาที
}

// ระบบนับคนออนไลน์
async function updateVoiceChannel() {
    try {
        const voiceChannel = await dcClient.channels.fetch(VOICE_CHANNEL_ID);
        if (voiceChannel && bot.players) {
            const count = Object.keys(bot.players).length;
            await voiceChannel.setName(`Players Online: ${count}`);
        }
    } catch (e) {}
}

createBot();

dcClient.on('messageCreate', (message) => {
    if (message.author.bot) return;

    // 1. คำสั่งบังคับเข้า (Force Join)
    if (message.content === '!join') {
        message.reply('🚀 **บอทกำลังเริ่มการเชื่อมต่อใหม่ทันที (Force Join)...**');
        createBot();
    }

    // 2. เช็คสถานะ
    if (message.content === '!check') {
        const status = (bot && bot.entity) ? '✅ บอทอยู่ในเกม' : '🔴 บอทอยู่นอกเกม (กำลังพยายามเข้า)';
        message.reply(status);
    }

    // 3. ประกาศ (Broadcast)
    if (message.content.startsWith('!bc ')) {
        const text = message.content.slice(4);
        if (bot && bot.entity) {
            bot.chat(`/title @a title {"text":"${text}","color":"gold","bold":true}`);
            bot.chat(`📢 [ประกาศ]: ${text}`);
            message.reply(`✅ ประกาศเรียบร้อย`);
        } else {
            message.reply('❌ บอทไม่อยู่ในเกม (ลองพิมพ์ !join เพื่อบังคับเข้า)');
        }
    }
});

dcClient.login(process.env.DISCORD_TOKEN);
