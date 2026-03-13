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

function createBot() {
    if (bot) bot.quit();
    bot = mineflayer.createBot(mcOptions);

    bot.on('login', () => {
        console.log('✅ บอทออนไลน์');
        const channel = dcClient.channels.cache.get(DISCORD_CHANNEL_ID);
        if (channel) channel.send('🟢 **เซิร์ฟเวอร์เปิดอยู่ (บอทเชื่อมต่อแล้ว)**');
        updateVoiceChannel();
    });

    bot.on('playerJoined', (player) => {
        if (player.username === bot.username) return;
        const channel = dcClient.channels.cache.get(DISCORD_CHANNEL_ID);
        if (channel) channel.send(`📥 **${player.username}** joined the server`);
        updateVoiceChannel();
    });

    bot.on('playerLeft', (player) => {
        const channel = dcClient.channels.cache.get(DISCORD_CHANNEL_ID);
        if (channel) channel.send(`📤 **${player.username}** left the server`);
        updateVoiceChannel();
    });

    bot.on('end', () => {
        const channel = dcClient.channels.cache.get(DISCORD_CHANNEL_ID);
        if (channel) channel.send('🔴 **บอทหลุดจากเซิร์ฟเวอร์ (เซิร์ฟอาจจะปิด)**');
        setTimeout(createBot, 10000);
    });
}

async function updateVoiceChannel() {
    try {
        const voiceChannel = await dcClient.channels.fetch(VOICE_CHANNEL_ID);
        if (voiceChannel) {
            const count = Object.keys(bot.players).length;
            await voiceChannel.setName(`Players Online: ${count}`);
        }
    } catch (err) {
        console.log('❌ อัปเดตชื่อห้องเสียงไม่ได้:', err.message);
    }
}

createBot();

dcClient.on('messageCreate', (message) => {
    if (message.author.bot) return;

    // 1. เช็คว่าบอทยังอยู่ในเกมไหม (In-game Check)
    if (message.content === '!check') {
        if (bot && bot.entity) {
            message.reply(`✅ บอทออนไลน์อยู่ในเกมที่พิกัด: ${Math.round(bot.entity.position.x)}, ${Math.round(bot.entity.position.z)}`);
        } else {
            message.reply('🔴 บอทไม่อยู่ในเซิร์ฟเวอร์ Minecraft ขณะนี้');
        }
    }

    // 2. เช็คการตอบสนองของบอท Discord (Responsiveness Check)
    if (message.content === '!ping') {
        message.reply('🏓 **Pong!** ระบบสั่งการยังทำงานปกติครับ');
    }

    // คำสั่ง !bc
    if (message.content.startsWith('!bc ')) {
        const text = message.content.slice(4);
        if (bot && bot.entity) {
            bot.chat(`/title @a title {"text":"${text}","color":"gold","bold":true}`);
            message.reply(`✅ ประกาศเรียบร้อย`);
        }
    }
});

dcClient.login(process.env.DISCORD_TOKEN);
