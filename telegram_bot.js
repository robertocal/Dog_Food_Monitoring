const { Telegraf } = require('telegraf')
const amqp = require('amqplib')
const moment = require('moment')
require('dotenv').config()

const bot = new Telegraf(`${process.env.BOT_TOKEN}`)
var chatId

// * Client receives a message from the queue
connectAndWait()

// * Bot start
bot.start((ctx) => {
  chatId = ctx.update.message.chat.id
  ctx
    .reply(`🐶 Hi ${ctx.update.message.chat.first_name}! Nice to meet you!\n\nI’ll warn you when your food dispenser need to be refilled.`)
    .then(() => {
      ctx.reply(`⚠️ Don't stop this bot if you want to keep track of your dispenser.\n`)
    })
})

// * Callback function
bot.action('refill_dispenser', (ctx) => {
  sendMessage('I’m refilling the dispenser remotely.')
  ctx.deleteMessage()
  var str = '🐾 Don’t worry: I’ll take care of it.\n\nDate: ' + moment().format('MMMM Do YYYY, h:mm:ss a')

  ctx.reply(str)
})

// * Callback function
bot.action('warn_dispenser', (ctx) => {
  sendMessage('I’m warning someone to refill the dispenser.')
  ctx.deleteMessage()
  var str = "🦴 Don't worry: I'll take care of it.\n\nDate: " + moment().format('MMMM Do YYYY, h:mm:ss a')

  ctx.reply(str)
})

bot.launch()

// * Waiting for connections
function connectAndWait() {
  amqp
    .connect(`amqp://guest:guest@${process.env.MY_IP}:5672`)
    .then(function (conn) {
      return conn.createChannel().then(function (ch) {
        var ok = ch.assertQueue('iot/dispenser', { durable: false })

        ok = ok.then(function (_qok) {
          return ch.consume(
            'iot/dispenser',
            function (msg) { waitForMessage(msg) },
            { noAck: true }
          )
        })

        return ok.then(function (_consumeOk) {
          console.log(' *** Telegram Bot Started! ***')
        })
      })
    })
    .catch(console.warn)
}

// * Waiting for messages
function waitForMessage(msg) {
  console.log('Food: ' + msg.content.toString())
  // * Opzioni per callback
  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Refill dispenser remotely',
            callback_data: 'refill_dispenser',
          },
        ],
        [
          {
            text: 'Warn someone to refill the dispenser',
            callback_data: 'warn_dispenser',
          },
        ],
      ],
    },
  }

  // Message to bot
  bot.telegram.sendMessage(
    chatId,
    `Hey! The dispenser has no food and the dog bowl food is at ${msg.content.toString()} grams! 😕\nWhat do you want to do?`,
    options
  )
}

// * Reading the response messages
function sendMessage(msg) {
  var queue = 'iot/logs'
  amqp
    .connect(`amqp://guest:guest@${process.env.MY_IP}:5672`)
    .then(function (conn) {
      return conn
        .createChannel()
        .then(function (channel) {
          var ok = channel.assertQueue(queue, { durable: false })
          return ok.then(function (_qok) {
            channel.sendToQueue(queue, Buffer.from(msg))
            console.log('- ' + msg + '\n')
            return channel.close()
          })
        })
        .finally(function () {
          conn.close()
        })
    })
    .catch(console.warn)
}

