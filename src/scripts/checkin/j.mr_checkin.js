// 闪电签到
// https://freemycloud.pw
const HOST_NAME = 'https://j01.best'
const {Env} = require('../../utils/Env')
const $ = new Env('几鸡签到');
const notify = $.isNode() ? require('../../utils/sendNotify') : '';

let usernames = []
let passwords = []
if (process.env.JJ_USERNAME && process.env.JJ_PASSWORD) {
  usernames = process.env.JJ_USERNAME.split('&')
  passwords = process.env.JJ_PASSWORD.split('&')
} else {
  console.log('您未提供几鸡账号及密码，即将退出签到')
  return
}

if (usernames.length !== passwords.length) {
  console.log('您提供的账号密码数量不匹配，即将退出签到')
  return
}

console.log(`您提供了${usernames.length}个账号，即将开始签到`)

const login = (username, password) => {
  return new Promise(resolve => {
    const option = {
      url: `${HOST_NAME}/auth/login`,
      headers: {
        "accept": "*/*",
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "zh-CN,zh;q=0.9",
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1",
      },
      form: {
        email: username,
        passwd: password,
        remember_me: 'on'
      }
    };
    $.post(option, (err, resp, data) => {
      try {
        if (err) {
          console.log('\n闪电登录失败')
        } else {
          data = JSON.parse(data)
          console.log(data)
          if (data.code === 200) {
            data = resp.headers['set-cookie']
          } else {
            console.log(`\n闪电登录失败 --> ${data.msg}`)
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

const checkin = (cookies) => {
  return new Promise(resolve => {
    const option = {
      url: `${HOST_NAME}/user/checkin`,
      headers: {
        "accept": "*/*",
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "zh-CN,zh;q=0.9",
        "cache-control": "no-cache",
        "cookie": cookies,
        "pragma": "no-cache",
        "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1",
      }
    };
    $.post(option, (err, resp, data) => {
      try {
        if (err) {
          console.log('\n闪电签到失败')
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

let summary = ''
let text = ''
for (let i = 0; i < usernames.length; i++) {
  let username = usernames[i]
  let password = passwords[i]
  login(username, password).then(cookies => {
    checkin(cookies)
      .then(data => {
        if (data.ret === 1) {
          let msg = `【${username}】闪电签到成功 --> ${data.msg}，当前剩余流量：${data.traffic}`
          console.log(`\n${msg}`)
          summary = `${msg}`
          text = data.msg
        } else {
          let msg = `【${username}】闪电签到失败 --> ${data.msg}`
          console.log(`\n${msg}`)
          summary = `${msg}`
          text = data.msg
        }
        notify.sendNotify(text, summary).then(() => {
        })
      })
  })
}
