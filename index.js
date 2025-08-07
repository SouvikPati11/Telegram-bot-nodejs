// Project: Telegram Bot for View/Reaction Order (Node.js Version) // Platform: Vercel + GitHub

const express = require('express'); const bodyParser = require('body-parser'); const axios = require('axios'); const TelegramBot = require('node-telegram-bot-api');

const app = express(); const PORT = process.env.PORT || 3000; const TOKEN = process.env.BOT_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN'; const ADMIN_ID = '5325612831'; const CHANNEL_USERNAME = '@SocialHiker'; const PANEL_API_KEY = '106882239b9d2c8d7875585ceb10d266';

const bot = new TelegramBot(TOKEN, { polling: true });

app.use(bodyParser.json()); app.get('/', (req, res) => { res.send('Bot is running...'); });

// --- User Data Store (replace with DB for production) --- let users = {}; let stats = { total_bonus_claims: 0, userpayment: 0, totalPayment: 0 };

// --- Helper Functions --- const isNumeric = (n) => !isNaN(parseFloat(n)) && isFinite(n);

function getUser(id) { if (!users[id]) { users[id] = { balance: 0, bonus: 0, status: 'active', last_bonus: '', link: '', orderAmount: 0 }; } return users[id]; }

// --- Commands --- bot.onText(//start/, (msg) => { const id = msg.from.id; bot.sendMessage(id, '🏘 Main Menu\nThis bot is fully powered by @SocialMediaHikeOfficial', { reply_markup: { keyboard: [[ '👁‍🗨 Order single post Views', '👁‍🗨 Order multi post Views' ], [ '👍 Order post Reactions' ], [ '👤 My Account', '➕ Buy point' ], [ '⁉️ FAQ', '🎉 Bonus' ]], resize_keyboard: true }, parse_mode: 'Markdown' }); });

bot.onText(/👁‍🗨 Order single post Views/, (msg) => { const id = msg.from.id; bot.sendMessage(id, '🔗 Send your post link'); bot.once('message', (msg2) => { const user = getUser(id); user.link = msg2.text;

if (user.status === 'ban') {
  return bot.sendMessage(id, '*🚫 You\'re banned from using this bot.*', { parse_mode: 'Markdown' });
}

if (user.balance < 100) {
  return bot.sendMessage(id, '❌ You have to own at least 100 Points');
}

bot.sendMessage(id, '👁️‍🗨️ *Enter the number of reactions you want (Minimum 100)*', { parse_mode: 'Markdown' });
bot.once('message', (msg3) => {
  const amount = parseInt(msg3.text);
  if (!isNumeric(amount) || amount < 100 || amount > user.balance) {
    return bot.sendMessage(id, '❌ Invalid amount or insufficient balance');
  }

  user.orderAmount = amount;
  user.balance -= amount;

  axios.get(`https://n1panel.com/api/v2?key=${PANEL_API_KEY}&action=add&service=3183&link=${user.link}&quantity=${amount}`)
    .then((res) => {
      const data = res.data;
      if (data.order) {
        stats.userpayment += amount;
        stats.totalPayment += amount;
        bot.sendMessage(id,
          `*✅ Order Placed Successfully!*\n\n` +
          `🆔 *Order ID:* \`${data.order}\`\n` +
          `🔗 *Link:* \`${user.link}\`\n` +
          `👁️‍🗨️ *Views Ordered:* \`${amount}\``,
          {
            parse_mode: 'Markdown'
          });

        bot.sendMessage(CHANNEL_USERNAME,
          `✅ *New Order Recieved*\n\n` +
          `ℹ️ Order ID : \`${data.order}\`\n` +
          `✨ Service : *👀 Telegram Views*\n` +
          `📈 Quantity : \`${amount}\` Views\n` +
          `💰 Order Charge : ${amount} Points\n\n` +
          `🤩 *Grow Your Telegram Platforms\nFrom Here ➡️* @ViewsBoosterProBot`,
          { parse_mode: 'Markdown' });
      } else {
        bot.sendMessage(id, `❌ Failed to place order:\n${data.error || 'Unknown error'}`);
      }
    })
    .catch((err) => {
      bot.sendMessage(id, `❌ Error placing order:\n${err.message}`);
    });
});

}); });

bot.onText(/🎉 Bonus/, (msg) => { const id = msg.from.id; const user = getUser(id); const today = new Date().toDateString();

if (user.status === 'left') { return bot.sendMessage(id, '❌ Join @SocialHiker first to claim bonus'); }

if (user.last_bonus === today) { return bot.sendMessage(id, '⏳ You've already claimed today's bonus. Come back tomorrow!'); }

const bonus = Math.floor(Math.random() * 101) + 500; user.bonus += bonus; user.last_bonus = today; stats.total_bonus_claims++;

bot.sendMessage(id, 🎉 You've received *${bonus}* Bonus Points for today!, { parse_mode: 'Markdown' });

bot.sendMessage(CHANNEL_USERNAME, 🎉 New User Claimed Bonus 🎉\n\n + 🆔 User ID = ${id}\n + 👁️‍🗨️ Amount = ${bonus} Points); });

bot.onText(/👤 My Account/, (msg) => { const id = msg.from.id; const user = getUser(id);

bot.sendMessage(id, <b>👤 Account Information</b>\n\n + 👩‍💻 <b>Name:</b> ${msg.from.first_name}\n + 🆔 <b>User ID:</b> ${id}\n\n + 💰 <b>Balance</b>\n + 👁‍🗨 <b>Deposit:</b> <code>${user.balance.toFixed(2)}</code> Points\n + 🎉 <b>Bonus:</b> <code>${user.bonus.toFixed(2)}</code> Points\n\n + <blockquote>⚠️ You can use your Bonus Points only by clicking on the Use Bonus option while placing a View Order.</blockquote>, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🎁 Use Bonus', callback_data: 'use_bonus' }]] } }); });

// --- Vercel handler --- module.exports = app;

