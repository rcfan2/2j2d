/** ***
 宠汪汪喂食(如果喂食80g失败，降级一个档次喂食（40g）,依次类推),三餐，建议一小时运行一次
 更新时间：2020-11-03
 支持京东多个账号
 脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
 ****/
// quantumultx
// [task_local]
// #京东宠汪汪喂食
// 15 */1 * * * https://raw.githubusercontent.com/lxk0301/scripts/master/jd_joy_feedPets.js, tag=京东宠汪汪喂食, img-url=https://raw.githubusercontent.com/58xinian/icon/master/jdcww.png, enabled=true
// Loon
// [Script]
// cron "15 */1 * * *" script-path=https://raw.githubusercontent.com/lxk0301/scripts/master/jd_joy_feedPets.js,tag=京东宠汪汪喂食
// Surge
// 京东宠汪汪喂食 = type=cron,cronexp="15 */1 * * *",wake-system=1,timeout=20,script-path=https://raw.githubusercontent.com/lxk0301/scripts/master/jd_joy_feedPets.js
const { Env } = require('../../utils/Env')
const $ = new Env('宠汪汪🐕喂食')
const notify = $.isNode() ? require('../../utils/sendNotify') : ''
// Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('../../utils/jdCookie') : ''

// IOS等用户直接用NobyDa的jd cookie
let cookiesArr = []; let cookie = ''
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') {
    console.log = () => {
    }
  }
} else {
  let cookiesData = $.getdata('CookiesJD') || '[]'
  cookiesData = jsonParse(cookiesData)
  cookiesArr = cookiesData.map(item => item.cookie)
  cookiesArr.push(...[$.getdata('CookieJD'), $.getdata('CookieJD2')])
}
let jdNotify = true// 是否开启静默运行。默认true开启
let message = ''; let subTitle = ''
const JD_API_HOST = 'https://jdjoy.jd.com'
let FEED_NUM = ($.getdata('joyFeedCount') * 1) || 10 // 喂食数量默认10g,可选 10,20,40,80 , 其他数字不可.

!(async() => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', { 'open-url': 'https://bean.m.jd.com/' })
    return
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i]
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1])
      $.index = i + 1
      $.isLogin = true
      $.nickName = ''
      await TotalBean()
      console.log(`\n开始【京东账号${$.index}】${$.nickName || $.UserName}\n`)
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/`, { 'open-url': 'https://bean.m.jd.com/' })
        $.setdata('', `CookieJD${i ? i + 1 : ''}`)// cookie失效，故清空cookie。
        if ($.isNode()) await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取cookie`)
        continue
      }
      message = ''
      subTitle = ''
      if ($.isNode()) {
        if (process.env.JOY_FEED_COUNT) {
          if ([10, 20, 40, 80].indexOf(process.env.JOY_FEED_COUNT * 1) > -1) {
            FEED_NUM = process.env.JOY_FEED_COUNT ? process.env.JOY_FEED_COUNT * 1 : FEED_NUM
          } else {
            console.log(`您输入的 JOY_FEED_COUNT 为非法数字，请重新输入`)
          }
        }
      }
      await feedPets(FEED_NUM)// 喂食
      await ThreeMeals()// 三餐
      await showMsg()
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
  })
  .finally(() => {
    $.done()
  })

function showMsg() {
  $.log(`\n${message}\n`)
  jdNotify = $.getdata('jdJoyNotify') ? $.getdata('jdJoyNotify') : jdNotify
  if (!jdNotify || jdNotify === 'false') {
    $.msg($.name, subTitle, `【京东账号${$.index}】${$.UserName}\n` + message)
  }
}

function feedPets(feedNum) {
  return new Promise(resolve => {
    console.log(`您设置的喂食数量::${FEED_NUM}g\n`)
    console.log(`实际的喂食数量::${feedNum}g\n`)
    const options = {
      url: `${JD_API_HOST}/pet/feed?feedCount=${feedNum}`,
      headers: {
        'Cookie': cookie,
        'reqSource': 'h5',
        'Host': 'jdjoy.jd.com',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json',
        'Referer': 'https://jdjoy.jd.com/pet/index',
        'User-Agent': 'jdapp;iPhone;8.5.8;13.4.1;9b812b59e055cd226fd60ebb5fd0981c4d0d235d;network/wifi;supportApplePay/3;hasUPPay/0;pushNoticeIsOpen/0;model/iPhone9,2;addressid/138109592;hasOCPay/0;appBuild/167169;supportBestPay/0;jdSupportDarkMode/0;pv/200.75;apprpd/MyJD_Main;ref/MyJdMTAManager;psq/29;ads/;psn/9b812b59e055cd226fd60ebb5fd0981c4d0d235d|608;jdv/0|direct|-|none|-|1587263154256|1587263330;adk/;app_device/IOS;pap/JA2015_311210|8.5.8|IOS 13.4.1;Mozilla/5.0 (iPhone; CPU iPhone OS 13_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
        'Accept-Language': 'zh-cn',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    }
    $.get(options, async(err, resp, data) => {
      try {
        $.data = JSON.parse(data)
        if ($.data.success) {
          if ($.data.errorCode === 'feed_ok') {
            console.log('喂食成功')
            message += `【喂食成功】${feedNum}g\n`
          } else if ($.data.errorCode === 'time_error') {
            console.log('喂食失败：正在食用')
            message += `【喂食失败】您的汪汪正在食用\n`
          } else if ($.data.errorCode === 'food_insufficient') {
            console.log(`当前喂食${feedNum}g狗粮不够, 现为您降低一档次喂食\n`)
            if ((feedNum) === 80) {
              feedNum = 40
            } else if ((feedNum) === 40) {
              feedNum = 20
            } else if ((feedNum) === 20) {
              feedNum = 10
            } else if ((feedNum) === 10) {
              feedNum = 0
            }
            // 如果喂食设置的数量失败, 就降低一个档次喂食.
            if ((feedNum) !== 0) {
              await feedPets(feedNum)
            } else {
              console.log('您的狗粮已不足10g')
              message += `【喂食失败】您的狗粮已不足10g\n`
            }
          } else {
            console.log(`其他状态${$.data.errorCode}`)
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve($.data)
      }
    })
  })
}

// 三餐
function ThreeMeals() {
  return new Promise(resolve => {
    const options = {
      url: `${JD_API_HOST}/pet/getFood?taskType=ThreeMeals`,
      headers: {
        'Cookie': cookie,
        'reqSource': 'h5',
        'Host': 'jdjoy.jd.com',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json',
        'Referer': 'https://jdjoy.jd.com/pet/index',
        'User-Agent': 'jdapp;iPhone;8.5.8;13.4.1;9b812b59e055cd226fd60ebb5fd0981c4d0d235d;network/wifi;supportApplePay/3;hasUPPay/0;pushNoticeIsOpen/0;model/iPhone9,2;addressid/138109592;hasOCPay/0;appBuild/167169;supportBestPay/0;jdSupportDarkMode/0;pv/200.75;apprpd/MyJD_Main;ref/MyJdMTAManager;psq/29;ads/;psn/9b812b59e055cd226fd60ebb5fd0981c4d0d235d|608;jdv/0|direct|-|none|-|1587263154256|1587263330;adk/;app_device/IOS;pap/JA2015_311210|8.5.8|IOS 13.4.1;Mozilla/5.0 (iPhone; CPU iPhone OS 13_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
        'Accept-Language': 'zh-cn',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    }
    $.get(options, async(err, resp, data) => {
      try {
        data = JSON.parse(data)
        if (data.success) {
          if (data.errorCode === 'received') {
            console.log(`三餐结果领取成功`)
            message += `【三餐】领取成功，获得${data.data}g狗粮\n`
          }
        }
      } catch (e) {
        $.logErr(resp, e)
      } finally {
        resolve(data)
      }
    })
  })
}

function jsonParse(str) {
  if (typeof str === 'string') {
    try {
      return JSON.parse(str)
    } catch (e) {
      console.log(e)
      $.msg($.name, '', '不要在BoxJS手动复制粘贴修改cookie')
      return []
    }
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
