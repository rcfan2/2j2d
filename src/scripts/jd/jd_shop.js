/**
 进店领豆(京东APP首页-领京豆-进店领豆),每天可拿四京豆
 更新时间：2020-11-03
 已支持IOS双京东账号,Node.js支持N个京东账号
 脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
 // quantumultx
 [task_local]
 #进店领豆
 10 0 * * * https://raw.githubusercontent.com/lxk0301/scripts/master/jd_shop.js, tag=进店领豆, img-url=https://raw.githubusercontent.com/58xinian/icon/master/jd_shop.png, enabled=true
 //Loon
 [Script]
 cron "10 0 * * *" script-path=https://raw.githubusercontent.com/lxk0301/scripts/master/jd_shop.js,tag=进店领豆
 //Surge
 进店领豆 = type=cron,cronexp="10 0 * * *",wake-system=1,timeout=20,script-path=https://raw.githubusercontent.com/lxk0301/scripts/master/jd_shop.js
 * */
const { Env } = require('../../utils/Env')
const $ = new Env('进店领豆')
const notify = require('../../utils/sendNotify')
// Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = require('../../utils/jdCookie')

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
let message = ''; let subTitle = ''

const JD_API_HOST = 'https://api.m.jd.com/client.action'
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
        if ($.isNode()) await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`)
        continue
      }
      message = ''
      subTitle = ''
      await jdShop()
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
  })
  .finally(() => {
    $.done()
  })

async function jdShop() {
  const taskData = await getTask()
  if (taskData.code === '0') {
    if (!taskData.data.taskList) {
      console.log(`${taskData.data.taskErrorTips}\n`)
      $.msg($.name, '', `京东账号 ${$.index} ${$.nickName}\n${taskData.data.taskErrorTips}`)
    } else {
      const { taskList } = taskData.data
      let beanCount = 0
      for (const item of taskList) {
        if (item.taskStatus === 3) {
          console.log(`${item.shopName} 已拿到2京豆\n`)
        } else {
          console.log(`taskId::${item.taskId}`)
          const doTaskRes = await doTask(item.taskId)
          if (doTaskRes.code === '0') {
            beanCount += 2
          }
        }
      }
      console.log(`beanCount::${beanCount}`)
      if (beanCount > 0) {
        $.msg($.name, '', `京东账号 ${$.index} ${$.nickName}\n成功领取${beanCount}京豆`)
        // if ($.isNode()) {
        //   await notify.sendNotify(`${$.name} - 账号${$.index} - ${$.nickName}`, `京东账号${$.index} ${UserName}\n成功领取${beanCount}京豆`);
        // }
        // if ($.isNode()) {
        //   await notify.BarkNotify(`${$.name}`, `京东账号${$.index} ${UserName}\n成功领取${beanCount}京豆`);
        // }
      }
    }
  }
}

function doTask(taskId) {
  console.log(`doTask-taskId::${taskId}`)
  return new Promise(resolve => {
    const body = { 'taskId': `${taskId}` }
    const options = {
      url: `${JD_API_HOST}`,
      body: `functionId=takeTask&body=${escape(JSON.stringify(body))}&appid=ld`,
      headers: {
        'User-Agent': 'JD4iPhone/167169 (iPhone; iOS 13.4.1; Scale/3.00)',
        'Host': 'api.m.jd.com',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookie
      }
    }
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log('\n进店领豆: API查询请求失败 ‼️‼️')
          $.logErr(err)
        } else {
          // console.log(data)
          data = JSON.parse(data)
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data)
      }
    })
  })
}

function getTask(body = {}) {
  return new Promise(resolve => {
    const options = {
      url: `${JD_API_HOST}`,
      body: `functionId=queryTaskIndex&body=${escape(JSON.stringify(body))}&appid=ld`,
      headers: {
        'User-Agent': 'JD4iPhone/167169 (iPhone; iOS 13.4.1; Scale/3.00)',
        'Host': 'api.m.jd.com',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookie
      }
    }
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log('\n进店领豆: API查询请求失败 ‼️‼️')
          $.logErr(err)
        } else {
          // console.log(data)
          data = JSON.parse(data)
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data)
      }
    })
  })
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
