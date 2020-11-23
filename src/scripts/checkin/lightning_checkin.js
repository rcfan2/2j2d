// 签到
// https://freemycloud.pw
// let cookie = process.env.FREE_MY_CLOUD_COOKIE;
const HOST_NAME = 'https://freemycloud.pw'
const {Env} = require('../../utils/Env')
const $ = new Env('闪电签到');
const notify = require('../../utils/sendNotify');

let usernames = []
let passwords = []
if (process.env.FREE_MY_CLOUD_USERNAME && process.env.FREE_MY_CLOUD_PASSWORD) {
  usernames = process.env.FREE_MY_CLOUD_USERNAME.split('&')
  passwords = process.env.FREE_MY_CLOUD_PASSWORD.split('&')
} else {
  console.log('您未提供账号及密码，即将退出签到')
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
        } else {
          data = JSON.parse(data)
          let ret = data.ret;
          if (data.ret === 1) {
            data = resp.headers['set-cookie']
          } else {
            $.message = `\n登录失败 --> ${data.msg}`
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
          $.message += '\n签到失败'
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

for (let i = 0; i < usernames.length; i++) {
  let username = usernames[i]
  let password = passwords[i]
  login(username, password).then(cookies => {
    checkin(cookies)
      .then(data => {
        if (data.ret === 1) {
          $.message = `【${username}】签到成功 --> ${data.msg}`
        } else {
          $.message = `【${username}】签到失败 --> ${data.msg}`
        }
        notify.sendNotify(`${$.name}-`, $.message).then(() => {
        })
      })
  })
}
