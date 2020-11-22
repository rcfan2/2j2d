/*
 * @Author: lxk0301 https://github.com/lxk0301
 * @Date: 2020-11-01 16:25:41
 * @Last Modified by:   lxk0301
 * @Last Modified time: 2020-11-03 16:25:41
 */
/*
京豆变动通知脚本：https://raw.githubusercontent.com/lxk0301/scripts/master/jd_bean_change.js
统计昨日京豆的变化情况，包括收入，支出，以及显示当前京豆数量,目前小问题:下单使用京豆后,退款重新购买会出现异常
网页查看地址 : https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean
支持京东双账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
quantumultx
[task_local]
#京豆变动通知
2 9 * * * https://raw.githubusercontent.com/lxk0301/scripts/master/jd_bean_change.js, tag=京豆变动通知, enabled=true
Loon
[Script]
cron "2 9 * * *" script-path=https://raw.githubusercontent.com/lxk0301/scripts/master/jd_bean_change.js, tag=京豆变动通知
Surge
京豆变动通知 = type=cron,cronexp=2 9 * * *,wake-system=1,timeout=440,script-path=https://raw.githubusercontent.com/lxk0301/scripts/master/jd_bean_change.js
 */
const { Env } = require('../../utils/Env')
const $ = new Env('京豆变动通知')
const notify = require('../../utils/sendNotify')
// Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('../../utils/jdCookie') : ''

// IOS等用户直接用NobyDa的jd cookie
const cookiesArr = []; let cookie = ''
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') {
    console.log = () => {
    }
  }
} else {
  cookiesArr.push($.getdata('CookieJD'))
  cookiesArr.push($.getdata('CookieJD2'))
}
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
      $.beanCount = 0
      $.incomeBean = 0
      $.expenseBean = 0
      $.errorMsg = ''
      $.isLogin = true
      $.nickName = ''
      await TotalBean()
      console.log(`\n开始【京东账号${$.index}】${$.nickName || $.UserName}\n`)
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/`, { 'open-url': 'https://bean.m.jd.com/' })
        $.setdata('', `CookieJD${i ? i + 1 : ''}`)// cookie失效，故清空cookie。
        if ($.isNode()) await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`)
        continue
      }
      await bean()
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

async function showMsg() {
  if ($.errorMsg) return
  if ($.isNode()) {
    await notify.sendNotify(`${$.name} - 账号${$.index} - ${$.nickName}`, `账号${$.index}：${$.nickName || $.UserName}\n昨日收入：${$.incomeBean}京豆 🐶\n昨日支出：${$.expenseBean}京豆 🐶\n当前京豆：${$.beanCount}京豆 🐶`, { url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean` })
  }
  $.msg($.name, '', `账号${$.index}：${$.nickName || $.UserName}\n昨日收入：${$.incomeBean}京豆 🐶\n昨日支出：${$.expenseBean}京豆 🐶\n当前京豆：${$.beanCount}京豆 🐶`, { 'open-url': 'https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean' })
}

async function bean() {
  // 前一天的0:0:0时间戳
  // console.log(`北京时间零点时间戳:${parseInt((Date.now() + 28800000) / 86400000) * 86400000 - 28800000}`);
  // console.log(`北京时间2020-10-28 06:16:05::${new Date("2020/10/28 06:16:05+08:00").getTime()}`)
  // 不管哪个时区。得到都是当前时刻北京时间的时间戳 new Date().getTime() + new Date().getTimezoneOffset()*60*1000 + 8*60*60*1000
  const tm = parseInt((Date.now() + 28800000) / 86400000) * 86400000 - 28800000 - (24 * 60 * 60 * 1000)
  // 今天0:0:0时间戳
  const tm1 = parseInt((Date.now() + 28800000) / 86400000) * 86400000 - 28800000
  let page = 1; let t = 0; const yesterdayArr = []
  do {
    const response = await getJingBeanBalanceDetail(page)
    console.log(`第${page}页: ${JSON.stringify(response)}`)
    if (response && response.code === '0') {
      page++
      const detailList = response.detailList
      if (detailList && detailList.length > 0) {
        for (const item of detailList) {
          const date = item.date.replace(/-/g, '/') + '+08:00'
          if (tm <= new Date(date).getTime() && new Date(date).getTime() < tm1) {
            // 昨日的
            yesterdayArr.push(item)
          } else if (tm > new Date(date).getTime()) {
            // 前天的
            t = 1
            break
          }
        }
      } else {
        $.errorMsg = `数据异常`
        $.msg($.name, ``, `账号${$.index}：${$.nickName}\n${$.errorMsg}`)
        t = 1
      }
    }
  } while (t === 0)
  for (const item of yesterdayArr) {
    if (Number(item.amount) > 0) {
      $.incomeBean += Number(item.amount)
    } else if (Number(item.amount) < 0) {
      $.expenseBean += Number(item.amount)
    }
  }
  // console.log(`昨日收入：${$.incomeBean}个京豆 🐶`);
  // console.log(`昨日支出：${$.expenseBean}个京豆 🐶`)
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
            if (data['retcode'] === 0) {
              $.beanCount = data['base'].jdNum
            }
          } else {
            console.log(`京东服务器返回空数据`)
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data)
      }
    })
  })
}

function getJingBeanBalanceDetail(page) {
  return new Promise(async resolve => {
    const options = {
      'url': `https://api.m.jd.com/client.action?functionId=getJingBeanBalanceDetail`,
      'body': `body=${escape(JSON.stringify({ 'pageSize': '20', 'page': page.toString() }))}&appid=ld`,
      'headers': {
        'User-Agent': 'JD4iPhone/167169 (iPhone; iOS 13.4.1; Scale/3.00)',
        'Host': 'api.m.jd.com',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookie
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
            // console.log(data)
          } else {
            console.log(`京东服务器返回空数据`)
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data)
      }
    })
  })
}
