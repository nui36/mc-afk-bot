const { Client, GatewayIntentBits } = require('discord.js');
const mineflayer = require('mineflayer');

// 1. ตั้งค่า Discord Bot
const dcClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// 2. ตั้งค่า Minecraft Bot (แก้ IP และชื่อตรงนี้)
const mcOptions = {
    host: 'sv4.mc4.in', 
    port: 50949,
    username: 'AFKGhost'
};

let bot;

// 3. ฟังก์ชันสร้างบอท Minecraft + Auto Reconnect
function createBot() {
    if (bot) bot.quit();
    bot = mineflayer.createBot(mcOptions);

    bot.on('login', () => {
        console.log('✅ บอทเข้า Minecraft สำเร็จ!');
    });

    bot.on('chat', (username, message) => {
        if (username === bot.username) return;
        console.log(`[MC] ${username}: ${message}`);
    });

    // ถ้าหลุดจาก MC ให้รอ 10 วินาทีแล้วเข้าใหม่
    bot.on('end', () => {
        console.log('⚠️ บอทหลุดจาก MC กำลังเชื่อมต่อใหม่...');
        setTimeout(createBot, 10000);
    });

    bot.on('error', (err) => console.log('❌ MC Error:', err.message));
}

createBot();

// 4. ระบบคำสั่ง Discord
dcClient.on('messageCreate', (message) => {
    if (message.author.bot) return;

    // พิมพ์ !ping ในดิสคอร์ดเพื่อเช็คว่าบอทอ่านข้อความได้ไหม
    if (message.content === '!ping') {
        message.reply('🟢 Pong! บอทยังออนไลน์และอ่านข้อความได้ครับ');
    }

    // สั่งให้บอทพิมพ์ข้อความเข้าไปในเกม Minecraft
    if (message.content.startsWith('!say ')) {
        const text = message.content.slice(5);
        if (bot && bot.entity) {
            bot.chat(text);
            message.reply(`📤 ส่งข้อความเข้าเกม: ${text}`);
        } else {
            message.reply('❌ บอทไม่ได้อยู่ในเซิร์ฟเวอร์ MC ในขณะนี้');
        }
    }
});

dcClient.login(process.env.DISCORD_TOKEN);
dcClient.login(process.env.DISCORD_TOKEN);
