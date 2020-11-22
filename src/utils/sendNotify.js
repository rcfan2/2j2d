const { Env } = require('../utils/Env')
// TG代理
// const tunnel = require('tunnel')
const $ = new Env('消息通知服务')

// =======================================telegram机器人通知设置区域===========================================
// 此处填你telegram bot 的Token，例如：1077xxx4424:AAFjv0FcqxxxxxxgEMGfi22B4yh15R5uw
// 注：此处设置github action用户填写到Settings-Secrets里面(Name输入TG_BOT_TOKEN)
let TG_BOT_TOKEN = ''
// 此处填你接收通知消息的telegram用户的id，例如：129xxx206
// 注：此处设置github action用户填写到Settings-Secrets里面(Name输入TG_USER_ID)
let TG_USER_ID = ''

if (process.env.TG_BOT_TOKEN) {
  TG_BOT_TOKEN = process.env.TG_BOT_TOKEN
}
if (process.env.TG_USER_ID) {
  TG_USER_ID = process.env.TG_USER_ID
}

async function sendNotify(text, desp, params = {}) {
  await tgBotNotify(text, desp)
}

function tgBotNotify(text, desp) {
  return new Promise(resolve => {
    if (TG_BOT_TOKEN && TG_USER_ID) {
      const options = {
        url: `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`,
        body: `chat_id=${TG_USER_ID}&text=${text.match(/.*?(?=\s?-)/g) && text.match(/.*?(?=\s?-)/g)[0]}\n\n${desp}&disable_web_page_preview=true`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
      // if (process.env.TG_PROXY_HOST && process.env.TG_PROXY_PORT) {
      //   const agent = {
      //     https: tunnel.httpsOverHttp({
      //       proxy: {
      //         host: process.env.TG_PROXY_HOST,
      //         port: process.env.TG_PROXY_PORT * 1
      //       }
      //     })
      //   }
      //   Object.assign(options, { agent })
      // }
      $.post(options, (err, resp, data) => {
        try {
          if (err) {
            console.log('\ntelegram发送通知消息失败！！\n')
            console.log(err)
          } else {
            data = JSON.parse(data)
            if (data.ok) {
              console.log('\nTelegram发送通知消息完成。\n')
            } else if (data.error_code === 400) {
              console.log('\n请主动给bot发送一条消息并检查接收用户ID是否正确。\n')
            } else if (data.error_code === 401) {
              console.log('\nTelegram bot token 填写错误。\n')
            }
          }
        } catch (e) {
          $.logErr(e, resp)
        } finally {
          resolve(data)
        }
      })
    } else {
      console.log('\n您未提供telegram机器人推送所需的TG_BOT_TOKEN和TG_USER_ID，取消telegram推送消息通知\n')
      resolve()
    }
  })
}

module.exports = {
  sendNotify,
  TG_BOT_TOKEN,
  TG_USER_ID
}// 这里导出SCKEY,BARK_PUSH等通知参数是jd_bean_sign.js处需要
