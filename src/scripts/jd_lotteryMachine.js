/*
自用于github action
author：yangtingxiao
github： https://github.com/yangtingxiao
京东抽奖机
更新时间：2020-11-07 11:09
脚本说明：五个抽奖活动，【东东抽奖机】【新店福利】【东东福利屋】【东东生活】【闪购盲盒】，点通知只能跳转一个，入口在京东APP玩一玩里面可以看到
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
// quantumultx
[task_local]
#京东抽奖机
11 1 * * * https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/scripts/jd/jd_lotteryMachine.js, tag=京东抽奖机, img-url=https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/image/jd.png, enabled=true
// Loon
[Script]
cron "11 1 * * *" script-path=https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/scripts/jd/jd_lotteryMachine.js,tag=京东抽奖机
// Surge
京东抽奖机 = type=cron,cronexp=11 1 * * *,wake-system=1,timeout=20,script-path=https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/scripts/jd/jd_lotteryMachine.js
 */
const {Env} = require('../utils/Env')
const $ = new Env('京东抽奖机');
main();

async function main() {
  $.http.get({url: `https://purge.jsdelivr.net/gh/yangtingxiao/QuantumultX@master/scripts/jd/jd_lotteryMachine.js`}).then((resp) => {
    if (resp.statusCode === 200) {
      console.log(`${$.name}CDN缓存刷新成功`)
    }
  });
  await updateShareCodes();
  if (!$.body) await updateShareCodesCDN();
  if ($.body) {
    eval($.body);
  }
}

function updateShareCodes(url = 'https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/scripts/jd/jd_lotteryMachine.js') {
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

function updateShareCodesCDN(url = 'https://cdn.jsdelivr.net/gh/yangtingxiao/QuantumultX@master/scripts/jd/jd_lotteryMachine.js') {
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
