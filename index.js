const { Client, GatewayIntentBits } = require('discord.js');
const mineflayer = require('mineflayer');

const dcClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const DISCORD_CHANNEL_ID = '1482064161038139403'; 
const VOICE_CHANNEL_ID = '1482064304118304810';

let bot;
let reconnectTimeout;
let currentConfig = { host: null, port: null, username: 'BOT' }; // เก็บค่าที่ป้อนจาก Discord

function report(msg) {
    console.log(msg);
    const channel = dcClient.channels.cache.get(DISCORD_CHANNEL_ID);
    if (channel) channel.send(msg).catch(e => {});
}

function createBot() {
    if (!currentConfig.host || !currentConfig.port) {
        return report('❌ **[System]** ยังไม่มีข้อมูลเซิร์ฟเวอร์! กรุณาพิมพ์ `!setup [IP] [PORT]`');
    }

    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (bot) {
        bot.removeAllListeners();
        try { bot.quit(); } catch (e) {}
    }

    report(`⏳ **[System]** กำลังพยายามเข้าเซิร์ฟเวอร์ \`${currentConfig.host}:${currentConfig.port}\`...`);
    
    bot = mineflayer.createBot({
        host: currentConfig.host,
        port: parseInt(currentConfig.port),
        username: currentConfig.username,
        version: false
    });

    bot.on('resourcePack', () => {
        report('📦 **[Addon]** พบ Addon! กดยอมรับอัตโนมัติเรียบร้อย');
        bot.acceptResourcePack();
    });

    bot.on('login', () => report('✅ **[Success]** บอทล็อกอินสำเร็จ!'));
    bot.on('spawn', () => {
        report('🌍 **[World]** บอทเกิดในโลกแล้ว!');
        updateVoiceChannel();
    });

    bot.on('error', (err) => {
        report(`❌ **[Error]** ปัญหา: ${err.message}`);
        handleReconnect();
    });

    bot.on('end', () => {
        report('⚠️ **[Status]** บอทหลุด... จะลองใหม่ใน 20 วินาที');
        handleReconnect();
    });
}

function handleReconnect() {
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    reconnectTimeout = setTimeout(() => createBot(), 20000);
}

async function updateVoiceChannel() {
    try {
        const voiceChannel = await dcClient.channels.fetch(VOICE_CHANNEL_ID);
        if (voiceChannel && bot.players) {
            const count = Object.keys(bot.players).length;
            await voiceChannel.setName(`Players Online: ${count}`);
        }
    } catch (e) {}
}

dcClient.once('ready', () => {
    console.log(`🤖 Discord Bot ออนไลน์: ${dcClient.user.tag}`);
    report('👋 **บอทพร้อมรับคำสั่งแล้ว!**\nกรุณาพิมพ์: `!setup [IP] [PORT]` เพื่อเริ่มการทำงาน');
});

dcClient.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // --- คำสั่งใหม่สำหรับการตั้งค่า IP/Port ---
    if (message.content.startsWith('!setup ')) {
        const args = message.content.split(' '); // แยกคำสั่งด้วยช่องว่าง
        if (args.length < 3) return message.reply('❌ รูปแบบผิด! ต้องเป็น `!setup [IP] [PORT]` เช่น `!setup sv4.mc4.in 50949`');

        currentConfig.host = args[1];
        currentConfig.port = args[2];
        
        message.reply(`⚙️ ตั้งค่าเซิร์ฟเวอร์เป็น **${currentConfig.host}:${currentConfig.port}** เรียบร้อย!`);
        createBot(); // เริ่มทำงานทันที
    }

    if (message.content === '!ping') message.reply('🏓 **Pong!** ระบบ Discord พร้อมรับคำสั่ง');

    if (message.content === '!join') createBot();

    if (message.content.startsWith('!bc ')) {
        const text = message.content.slice(4);
        if (bot && bot.entity) {
            bot.chat(`/title @a title {"text":"${text}","color":"gold","bold":true}`);
            bot.chat(`📢 [ประกาศ]: ${text}`);
            message.reply('✅ ประกาศเรียบร้อย');
        } else {
            message.reply('❌ บอทยังไม่ได้เข้าเกม (พิมพ์ !setup ก่อน)');
        }
    }
});

dcClient.login(process.env.DISCORD_TOKEN);
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
