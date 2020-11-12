/*
京东全民营业领金币
仅仅是收集一下京东双十一全名营业每秒产生的金币

每小时的第20分运行一次
20 * * * * https://raw.githubusercontent.com/lxk0301/scripts/master/jd_collectProduceScore.js
 */
const {Env} = require('../src/utils/Env')
const $ = new Env('京东全民营业领金币');
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('../src/utils/jdCookie') : '';
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '';

if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {
  };
} else {
  cookiesArr.push($.getdata('CookieJD'));
  cookiesArr.push($.getdata('CookieJD2'));
}
let UserName = '';
const JD_API_HOST = `https://api.m.jd.com/client.action`;
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', {"open-url": "https://bean.m.jd.com/"});
    return;
  }
  console.log(`\n小功能::仅仅是收集一下京东双十一全名营业每秒产生的金币,建议一个小时跑一次脚本\n`)
  for (let i = 0; i < cookiesArr.length; i++) {
    cookie = cookiesArr[i];
    if (cookie) {
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1])
      $.index = i + 1;
      await collectProduceScore()
    }
  }
})()
  .catch((e) => $.logErr(e))
  .finally(() => $.done())

async function collectProduceScore() {
  await getHomeData();
  if ($.secretp) {
    const temp = {
      "taskId": "collectProducedCoin",
      "rnd": getRnd(),
      "inviteId": "-1",
      "stealId": "-1"
    }
    const extraData = {
      "jj": 6,
      "buttonid": "jmdd-react-smash_0",
      "sceneid": "homePageh5",
      "appid": '50073'
    }
    const body = encode(temp, $.secretp, extraData);
    await stall_collectProduceScore(body);
  }
}

function stall_collectProduceScore(body) {
  return new Promise((resolve) => {
    $.post(taskPostUrl('stall_collectProduceScore', body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data && data.data.bizCode === 0) {
              console.log(`京东账号${$.index} ${$.UserName}成功收集金币:${data.data.result.produceScore}个`)
            } else {
              console.log(`京东账号${$.index} ${$.UserName}成功收集金币失败:${data.data.bizMsg}`)
            }
          } else {
            console.log(`请检查自身设备原因`);
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    })
  })
}

function getHomeData() {
  return new Promise((resolve) => {
    $.post(taskPostUrl('stall_getHomeData'), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          data = JSON.parse(data);
          if (data && data.data['bizCode'] === 0) {
            $.secretp = data.data.result.homeMainInfo.secretp;
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    })
  })
}

function encode(data, aa, extraData) {
  const temp = {
    "extraData": JSON.stringify(extraData),
    "businessData": JSON.stringify(data),
    "secretp": aa,
  }
  return {"ss": (JSON.stringify(temp))};
}

function getRnd() {
  return Math.floor(1e6 * Math.random()).toString();
}

function taskPostUrl(functionId, body = {}) {
  return {
    url: `${JD_API_HOST}?functionId=${functionId}`,
    body: `functionId=${functionId}&body=${escape(JSON.stringify(body))}&client=wh5&clientVersion=1.0.0`,
    headers: {
      'User-Agent': 'jdapp;iPhone;9.2.0;14.1;;network/wifi;Mozilla/5.0 (iPhone; CPU iPhone OS 14_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Host': 'api.m.jd.com',
      'Cookie': cookie,
      'Origin': 'https://wbbny.m.jd.com',
      'Referer': 'https://wbbny.m.jd.com/babelDiy/Zeus/4SJUHwGdUQYgg94PFzjZZbGZRjDd/index.html',
    }
  }
}
