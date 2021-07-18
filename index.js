const { ethers } = require("ethers");
const { data } = require('./config.js');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const provider = new ethers.providers.JsonRpcProvider(data.url);
console.log(process.env.TELEGRAM_TOKEN)
const token = process.env.TELEGRAM_TOKEN;
// const token = '1904603403:AAEcBwan-sEuSekEU3ffuDwYep7kPgnRpUQ';

const bot = new TelegramBot(token, {polling: true});
let alertChatId;

let addressList = data.defaultAddresses;

function removeAddress(address) {
    if (addressList.includes(address)) {
        addressList = addressList.filter(iterAddress => iterAddress !== address);
        console.log(`Address ${address} succesfully removed`);
        return 200;
    } else {
        console.log(`Address ${address} not found in the list`);
        return 401;
    }
}

function addAddress(address) {
    if (addressList.includes(address)) {
        console.log("Address already present in the list");
        return 401;
    } else {
        addressList.push(address);
        console.log(`Address ${address} succesfully added`);
        return 200;
    }
}

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    alertChatId = chatId;
    bot.sendMessage(chatId, 'Welcome to Matic low balance alert');
    bot.sendMessage(chatId, 'To start alert type the command /alert');
    bot.sendMessage(chatId, 'To see the address list type the command /list');
    bot.sendMessage(chatId, "To add address type 'Add <Address>'. \nTo remove type 'Remove <Address>'");
});

bot.onText(/\/list/, (msg) => {
    const chatId = msg.chat.id;
    alertChatId = chatId;
    bot.sendMessage(chatId, addressList.join());
});

bot.onText(/\/alert/, (msg) => {
    const chatId = msg.chat.id;
    alertChatId = chatId;
    bot.sendMessage(chatId, "You are all set to receive alerts");
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    if (msg.text.toString().toLowerCase().indexOf("add") === 0) {
        let words = msg.text.toString().split(" ");
        let code = addAddress(words[1]);
        if (code === 200) {
            bot.sendMessage(chatId, 'Address successfully added');
        } else {
            bot.sendMessage(chatId, 'Error while adding address. \nCheck if the address is already added');
        }
    }

    if (msg.text.toString().toLowerCase().indexOf("remove") === 0) {
        let words = msg.text.toString().split(" ");
        console.log(words[1]);
        let code = removeAddress(words[1]);
        if (code === 200) {
            bot.sendMessage(chatId, 'Address successfully removed');
        } else {
            bot.sendMessage(chatId, 'Error while removing address. \nCheck if the address exists in the list');
        }
    }
});

async function sendAlert(address) {
    console.log(`Checking balance for address ${address}`);
    let balance = await provider.getBalance(address).catch((error) => {
        throw new Error("Error while getting balance")
    });
    balance = parseFloat(ethers.utils.formatEther(balance));
    if (balance < 0.5) {
        bot.sendPhoto(alertChatId, data.alertImgUrl, {caption: `Address ${address} has low balance. \nCurrent balance: ${balance}MTX`});
        console.log(`Address ${address} has ${balance}MTX which is less than 0.5MTX`);
    } else {
        console.log(`Address ${address} has ${balance}MTX`);
    }
}

setInterval(() => {
    addressList.forEach((address) => {
        sendAlert(address);
    })
}, 30000)