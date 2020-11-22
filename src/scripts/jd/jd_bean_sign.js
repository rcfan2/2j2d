/*
京豆签到,自用,可N个京东账号,IOS软件用户请使用 https://raw.githubusercontent.com/NobyDa/Script/master/JD-DailyBonus/JD_DailyBonus.js
Node.JS专用
更新时间：2020-11-17
从 github @ruicky改写而来
version v0.0.1
create by ruicky
detail url: https://github.com/ruicky/jd_sign_bot
 */
const { Env } = require('../../utils/Env')
const $ = new Env('京豆签到')
const notify = require('../../utils/sendNotify')
// Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = require('../../utils/jdCookie')
const exec = require('child_process').execSync
const fs = require('fs')
const download = require('download')
let resultPath = './result.txt'
let JD_DailyBonusPath = './JD_DailyBonus.js'
let outPutUrl = './'
const cookiesArr = []; let cookie = ''

if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') {
    console.log = () => {
    }
  }
}
!(async() => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', { 'open-url': 'https://bean.m.jd.com/' })
    return
  }
  await requireConfig()
  // 下载最新代码
  await downFile()
  const content = await fs.readFileSync(JD_DailyBonusPath, 'utf8')
  for (let i = 0; i < cookiesArr.length; i++) {
    cookie = cookiesArr[i]
    if (cookie) {
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1])
      $.index = i + 1
      $.nickName = ''
      await TotalBean()
      console.log(`*****************开始京东账号${$.index} ${$.nickName || $.UserName}京豆签到*******************\n`)
      console.log(`⚠️⚠️⚠️⚠️目前Bark APP推送通知消息失败的,请换用其他通知方式,Bark对推送内容长度有限制 ⚠️⚠️⚠️⚠️\n`)
      await changeFile(content)
      await execSign()
    }
  }
})()
  .catch((e) => $.logErr(e))
  .finally(() => $.done())

async function execSign() {
  console.log(`\n开始执行脚本签到，请稍等`)
  try {
    if (notify.TG_BOT_TOKEN && notify.TG_USER_ID) {
      await exec(`${process.execPath} ${JD_DailyBonusPath} >> ${resultPath}`)
    } else {
      // 如果没有提供通知推送，则打印日志
      console.log('没有提供通知推送，则打印脚本执行日志')
      await exec(`${process.execPath} ${JD_DailyBonusPath}`, { stdio: 'inherit' })
    }
    // await exec("node JD_DailyBonus.js", { stdio: "inherit" });
    // console.log('执行完毕', new Date(new Date().getTime() + 8 * 60 * 60 * 1000).toLocaleDateString())
    // 发送通知
    if ($.isNode()) {
      let notifyContent = ''
      let BarkContent = ''
      if (fs.existsSync(resultPath)) {
        notifyContent = await fs.readFileSync(resultPath, 'utf8')
        const barkContentStart = notifyContent.indexOf('【签到概览】')
        const barkContentEnd = notifyContent.length
        if (process.env.JD_BEAN_SIGN_STOP_NOTIFY === 'true') return
        if (process.env.JD_BEAN_SIGN_NOTIFY_SIMPLE === 'true') {
          if (barkContentStart > -1 && barkContentEnd > -1) {
            BarkContent = notifyContent.substring(barkContentStart, barkContentEnd)
          }
          BarkContent = BarkContent.split('\n\n')[0]
        } else {
          if (barkContentStart > -1 && barkContentEnd > -1) {
            BarkContent = notifyContent.substring(barkContentStart, barkContentEnd)
          }
        }
      }
      // 不管哪个时区,这里得到的都是北京时间的时间戳;
      const UTC8 = new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000
      $.beanSignTime = timeFormat(UTC8)
      console.log(`脚本执行完毕时间：${$.beanSignTime}`)
      if (BarkContent) {
        await notify.sendNotify(`京豆签到 - 账号${$.index} - ${$.nickName || $.UserName}`, `【签到号 ${$.index}】: ${$.nickName || $.UserName}\n【签到时间】:  ${$.beanSignTime}\n${BarkContent}`)
      }
    }
    // 运行完成后，删除下载的文件
    console.log('运行完成后，删除下载的文件\n')
    await deleteFile(resultPath)// 删除result.txt
    await deleteFile(JD_DailyBonusPath)// 删除JD_DailyBonus.js
    console.log(`*****************京东账号${$.index} ${$.nickName || $.UserName}京豆签到完成*******************\n`)
  } catch (e) {
    console.log('京东签到脚本执行异常:' + e)
  }
}

async function downFile() {
  let url
  // if (process.env.CDN_JD_DAILYBONUS) {
  //   url = 'https://cdn.jsdelivr.net/gh/NobyDa/Script@master/JD-DailyBonus/JD_DailyBonus.js';
  // } else if (process.env.JD_COOKIE) {
  //   url = 'https://raw.githubusercontent.com/NobyDa/Script/master/JD-DailyBonus/JD_DailyBonus.js';
  // } else {
  //   url = 'https://cdn.jsdelivr.net/gh/NobyDa/Script@master/JD-DailyBonus/JD_DailyBonus.js';
  // }
  await downloadUrl()
  if ($.body) {
    url = 'https://raw.githubusercontent.com/NobyDa/Script/master/JD-DailyBonus/JD_DailyBonus.js'
  } else {
    url = 'https://cdn.jsdelivr.net/gh/NobyDa/Script@master/JD-DailyBonus/JD_DailyBonus.js'
  }
  try {
    await download(url, outPutUrl)
    console.log('文件下载完毕')
  } catch (e) {
    console.log('文件下载异常:' + e)
  }
}

async function changeFile(content) {
  console.log(`开始替换变量`)
  let newContent = content.replace(/var Key = ''/, `var Key = '${cookie}'`)
  if (process.env.JD_BEAN_STOP && process.env.JD_BEAN_STOP !== '0') {
    newContent = newContent.replace(/var stop = 0/, `var stop = ${process.env.JD_BEAN_STOP * 1}`)
  }
  const zone = new Date().getTimezoneOffset()
  if (zone === 0) {
    // 此处针对UTC-0时区用户做的
    newContent = newContent.replace(/tm\s=.*/, `tm = new Date(new Date().toLocaleDateString()).getTime() - 28800000;`)
  }
  try {
    await fs.writeFileSync(JD_DailyBonusPath, newContent, 'utf8')
    console.log('替换变量完毕')
  } catch (e) {
    console.log('京东签到写入文件异常:' + e)
  }
}

async function deleteFile(path) {
  // 查看文件result.txt是否存在,如果存在,先删除
  const fileExists = await fs.existsSync(path)
  // console.log('fileExists', fileExists);
  if (fileExists) {
    const unlinkRes = await fs.unlinkSync(path)
    // console.log('unlinkRes', unlinkRes)
  }
}

function TotalBean() {
  return new Promise(async resolve => {
    const options = {
      'url': `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
      'headers': {
        'Accept': 'application/json,text/plain, */*',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'zh-cn',
        'Connection': 'keep-alive',
        'Cookie': cookie,
        'Referer': 'https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
      }
    }
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (data) {
            data = JSON.parse(data)
            if (data['retcode'] === 13) {
              $.isLogin = false // cookie过期
              return
            }
            $.nickName = data['base'].nickname
          } else {
            console.log(`京东服务器返回空数据`)
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve()
      }
    })
  })
}

function downloadUrl(url = 'https://raw.githubusercontent.com/NobyDa/Script/master/JD-DailyBonus/JD_DailyBonus.js') {
  return new Promise(resolve => {
    $.get({ url }, async(err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`检测到您不能访问外网,将使用CDN下载JD_DailyBonus.js文件`)
        } else {
          $.body = data
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve()
      }
    })
  })
}
function requireConfig() {
  return new Promise(resolve => {
    const file = 'src/scripts/jd_bean_sign.js'
    fs.access(file, fs.constants.W_OK, (err) => {
      resultPath = err ? '/tmp/result.txt' : resultPath
      JD_DailyBonusPath = err ? '/tmp/JD_DailyBonus.js' : JD_DailyBonusPath
      outPutUrl = err ? '/tmp/' : outPutUrl
      resolve()
    })
  })
}
function timeFormat(time) {
  let date
  if (time) {
    date = new Date(time)
  } else {
    date = new Date()
  }
  return date.getFullYear() + '-' + ((date.getMonth() + 1) >= 10 ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1)) + '-' + (date.getDate() >= 10 ? date.getDate() : '0' + date.getDate())
}
