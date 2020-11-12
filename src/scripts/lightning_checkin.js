// 闪电签到
// https://freemycloud.pw
// let cookie = process.env.FREE_MY_CLOUD_COOKIE;
const {Env} = require('../utils/Env')
const $ = new Env('闪电签到');
const notify = $.isNode() ? require('../utils/sendNotify') : '';

let usernames = process.env.FREE_MY_CLOUD_USERNAME.split('&')
let passwords = process.env.FREE_MY_CLOUD_PASSWORD.split('&')

const login = (username, password) => {
  return new Promise(resolve => {
    const option = {
      url: `https://freemycloud.pw/auth/login`,
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
          let ret = data.ret;
          if (data.ret === 1) {
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
      url: `https://freemycloud.pw/user/checkin`,
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

console.log(`找到${usernames.length}个账号，开始签到`)
let summary = ''
let text = ''
for (let i = 0; i < usernames.length; i++) {
  let username = usernames[i]
  let password = passwords[i]
  login(username, password).then(cookies => {
    checkin(cookies)
      .then(data => {
        if (data.ret === 1) {
          console.log(`\n【${username}】闪电签到成功 --> ${data.msg}`)
          summary = `【${username}】闪电签到成功 --> ${data.msg}`
          text = data.msg
        } else {

          console.log(`\n【${username}】闪电签到失败 --> ${data.msg}`)
          summary = `【${username}】闪电签到失败 --> ${data.msg}`
          text = data.msg
        }
        notify.sendNotify(text, summary).then(() => {
        })
      })
  })
}
