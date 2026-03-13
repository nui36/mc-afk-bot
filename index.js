const { Client, GatewayIntentBits } = require('discord.js');
const mineflayer = require('mineflayer');

// 1. ตั้งค่า Discord Bot
const dcClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent // สำคัญ: ต้องเปิดใน Developer Portal ด้วยตามที่บอกไปครั้งก่อน
    ]
});

// 2. ตั้งค่า Minecraft Bot
const mcOptions = {
    host: 'sv4.mc4.in', 
    port: 50949,
    username: 'AFKGhost'
};

let bot;

// 3. ฟังก์ชันสร้างบอท Minecraft + Auto Reconnect
function createBot() {
    if (bot) bot.removeAllListeners(); // ล้างค่าเก่าก่อนสร้างใหม่

    bot = mineflayer.createBot(mcOptions);

    bot.on('login', () => {
        console.log('บอทเข้า Minecraft เรียบร้อยแล้ว!');
    });

    // ระบบ Auto Reconnect: ถ้าหลุดให้รอ 10 วินาทีแล้วเข้าใหม่
    bot.on('end', () => {
        console.log('บอทหลุดจาก Minecraft กำลังเชื่อมต่อใหม่ใน 10 วินาที...');
        setTimeout(createBot, 10000);
    });

    bot.on('error', (err) => {
        console.log('เกิดข้อผิดพลาด:', err.message);
    });
}

createBot();

// 4. ระบบคำสั่ง Discord
dcClient.on('messageCreate', (message) => {
    if (message.author.bot) return; // ไม่ตอบโต้บอทด้วยกัน

    // ลองพิมพ์ !ping
    if (message.content === '!ping') {
        message.reply('Pong! บอทยังมีชีวิตอยู่ครับ 🟢');
    }

    // คำสั่งเช็คสถานะบอทในเซิร์ฟ
    if (message.content === '!status') {
        const status = (bot && bot.entity) ? 'ออนไลน์อยู่ในเซิร์ฟเวอร์' : 'ออฟไลน์ (กำลังพยายามเชื่อมต่อ)';
        message.reply(`สถานะบอท: ${status}`);
    }
});

// 5. รันบอท (ใช้ตัวแปรจาก Railway ที่เราแก้กันครั้งก่อน)
dcClient.login(process.env.DISCORD_TOKEN);
});

const mcOptions = {
    host: 'sv4.mc4.in', 
    port: 50949,
    username: 'AFKGhost'
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
