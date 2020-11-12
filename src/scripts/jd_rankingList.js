/*
自用于github action
author：yangtingxiao
github： https://github.com/yangtingxiao
京东排行榜
更新时间：2020-11-05 16:07
脚本说明：京东排行榜签到得京豆
活动入口：找不着了，点击脚本通知进入吧
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
// quantumultx
[task_local]
#京东排行榜
11 9 * * * https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/scripts/jd/jd_rankingList.js, tag=京东排行榜, img-url=https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/image/jd.png, enabled=true
// Loon
[Script]
cron "11 9 * * *" script-path=https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/scripts/jd/jd_rankingList.js,tag=京东排行榜
// Surge
京东排行榜 = type=cron,cronexp=11 9 * * *,wake-system=1,timeout=20,script-path=https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/scripts/jd/jd_rankingList.js
 */
const {Env} = require('../utils/Env')
const $ = new Env('京东排行榜');
main();

async function main() {
  $.http.get({url: `https://purge.jsdelivr.net/gh/yangtingxiao/QuantumultX@master/scripts/jd/jd_rankingList.js`}).then((resp) => {
    if (resp.statusCode === 200) {
      console.log(`${$.name}CDN缓存刷新成功`)
    }
  });
  await updateShareCodes();
  if (!$.body) await scriptsCDN();
  if ($.body) {
    eval($.body);
  }
}

function updateShareCodes(url = 'https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/scripts/jd/jd_rankingList.js') {
  return new Promise(resolve => {
    $.get({url}, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
        } else {
          $.body = data;
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}

function scriptsCDN(url = 'https://cdn.jsdelivr.net/gh/yangtingxiao/QuantumultX@master/scripts/jd/jd_rankingList.js') {
  return new Promise(resolve => {
    $.get({url}, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          $.body = data;
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}
