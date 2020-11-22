// 闪电签到
// https://freemycloud.pw
const HOST_NAME = 'https://www.v2ex.com'
const { Env } = require('../../utils/Env')
const $ = new Env('V2EX签到')
const notify = require('../../utils/sendNotify')
$.message = ''

const check = (cookie) => {
  return new Promise(resolve => {
    const option = {
      url: `${HOST_NAME}/mission/daily`,
      headers: {
        'cookie': cookie,
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1'
      }
    }
    $.get(option, (err, resp, data) => {
      try {
        if (err) {
          console.log('\n签到失败')
          return false
        }
        let regex = /需要先登录/
        if (regex.test(data)) {
          $.message += 'Cookie失效'
          return false
        }
        regex = /每日登录奖励已领取/
        if (regex.test(data)) {
          $.message += '今天已经签到过了'
          return false
        }
        regex = /redeem\?once=(.*?)'/
        $.once = data.data.match(regex)[1]
        console.log(`获取成功 once:${$.once}`)
        return true
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data)
      }
    })
  })
}

const checkin = (cookie) => {
  return new Promise(resolve => {
    const option = {
      url: `${HOST_NAME}/mission/daily/redeem?once=${$.once}`,
      headers: {
        'cookie': cookie,
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1'
      }
    }
    $.get(option, (err, resp, data) => {
      try {
        console.log(data)
        if (err) {
          console.log('\n签到失败')
        } else {
          const regex = /已成功领取每日登录奖励/
          if (regex.test(data)) {
            $.message += '签到成功'
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

!(async() => {
  if (process.env.V2EX_COOKIE) {
    const cookies = process.env.V2EX_COOKIE.split('&')
    console.log(`您提供了${cookies.length}个账号，即将开始签到`)
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i]
      const isCheckin = await check(cookie)
      if (!isCheckin) {
        await checkin(cookie)
      }
      console.log($.message)
      await notify.sendNotify(`${$.name}-`, $.message)
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
  })
  .finally(() => {
    $.done()
  })
