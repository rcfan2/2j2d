/*
 * @Author: lxk0301 https://github.com/lxk0301
 * @Date: 2020-11-20 11:42:03
 * @Last Modified by:   lxk0301
 * @Last Modified time: 2020-11-20 11:42:03
 */
/*
点点券，可以兑换无门槛红包（1元，5元，10元，100元，部分红包需抢购）
APP活动入口：“最新版本京东APP >领券中心/券后9.9>领点点券”页面
网页入口：https://h5.m.jd.com/babelDiy/Zeus/41Lkp7DumXYCFmPYtU3LTcnTTXTX/index.html
已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
===============Quantumultx===============
[task_local]
#点点券
10 0,20 * * * https://raw.githubusercontent.com/lxk0301/jd_scripts/master/jd_necklace.js, tag=点点券, enabled=true

================Loon==============
[Script]
cron "10 0,20 * * *" script-path=https://raw.githubusercontent.com/lxk0301/jd_scripts/master/jd_necklace.js,tag=点点券

===============Surge=================
点点券 = type=cron,cronexp="10 0,20 * * *",wake-system=1,timeout=20,script-path=https://raw.githubusercontent.com/lxk0301/jd_scripts/master/jd_necklace.js

============小火箭=========
东东农场 = type=cron,script-path=https://raw.githubusercontent.com/lxk0301/jd_scripts/master/jd_necklace.js, cronexpr="10 0,20 * * *", timeout=200, enable=true
 */
const {Env} = require('../utils/Env')
const $ = new Env('点点券');

const notify = $.isNode() ? require('../utils/sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('../utils/jdCookie.js') : '';

//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '';
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {
  };
} else {
  cookiesArr.push(...[$.getdata('CookieJD'), $.getdata('CookieJD2')]);
}

const JD_API_HOST = 'https://api.m.jd.com/api';
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', {"open-url": "https://bean.m.jd.com/"});
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1])
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      await TotalBean();
      console.log(`\n开始【京东账号${$.index}】${$.nickName || $.UserName}\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/`, {"open-url": "https://bean.m.jd.com/"});

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        } else {
          $.setdata('', `CookieJD${i ? i + 1 : ""}`);//cookie失效，故清空cookie。$.setdata('', `CookieJD${i ? i + 1 : "" }`);//cookie失效，故清空cookie。
        }
        continue
      }
      await JD818();
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
  })
  .finally(() => {
    $.done();
  })

async function JD818() {
  await necklace_homePage();
  await doTask();
  await necklace_homePage();
  await receiveBubbles();
  await sign();
  await necklace_homePage();
  await showMsg();
}

function showMsg() {
  return new Promise(resolve => {
    $.msg($.name, '', `京东账号 ${$.index} ${$.nickName}\n当前${$.name}${$.totalScore}个`);
    resolve()
  })
}

async function doTask() {
  for (let item of $.taskConfigVos) {
    if (item.taskStage === 0) {
      console.log(`${item.taskName}未完成`);
      await necklace_startTask(item.id);
      await $.wait(2000);
      await necklace_startTask(item.id);
    } else if (item.taskStage === 2) {
      console.log(`${item.taskName}任务已做完,奖励未领取`);
    } else if (item.taskStage === 3) {
      console.log(`${item.taskName}奖励已领取`);
    }
  }
}

async function receiveBubbles() {
  for (let item of $.bubbles) {
    console.log(`开始领取点点券\n`);
    await necklace_chargeScores(item.id)
  }
}

async function sign() {
  if ($.signInfo.todayCurrentSceneSignStatus === 1) {
    await necklace_sign();
  } else {
    console.log(`当前${new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000).toLocaleString()}已签到`)
  }
}

//每日签到福利
function necklace_sign() {
  return new Promise(resolve => {
    const body = {
      currentDate: $.lastRequestTime.replace(/:/g, "%3A"),
    }
    $.post(taskPostUrl("necklace_sign", body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          console.log(data);
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.rtn_code === 0) {
              if (data.data.biz_code === 0) {
                console.log(`签到成功，时间：${new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000).toLocaleString()}`)
                // $.taskConfigVos = data.data.result.taskConfigVos;
                // $.exchangeGiftConfigs = data.data.result.exchangeGiftConfigs;
              }
            }
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

//领取奖励
function necklace_chargeScores(bubleId) {
  return new Promise(resolve => {
    const body = {
      bubleId,
      currentDate: $.lastRequestTime.replace(/:/g, "%3A"),
    }
    $.post(taskPostUrl("necklace_chargeScores", body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          console.log(data);
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.rtn_code === 0) {
              if (data.data.biz_code === 0) {
                // $.taskConfigVos = data.data.result.taskConfigVos;
                // $.exchangeGiftConfigs = data.data.result.exchangeGiftConfigs;
              }
            }
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

function necklace_startTask(taskId) {
  return new Promise(resolve => {
    const body = {
      taskId,
      currentDate: $.lastRequestTime.replace(/:/g, "%3A"),
    }
    $.post(taskPostUrl("necklace_startTask", body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          console.log(data);
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.rtn_code === 0) {
              if (data.data.biz_code === 0) {
                // $.taskConfigVos = data.data.result.taskConfigVos;
                // $.exchangeGiftConfigs = data.data.result.exchangeGiftConfigs;
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}

function necklace_homePage() {
  return new Promise(resolve => {
    $.post(taskPostUrl('necklace_homePage'), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.rtn_code === 0) {
              if (data.data.biz_code === 0) {
                $.taskConfigVos = data.data.result.taskConfigVos;
                $.exchangeGiftConfigs = data.data.result.exchangeGiftConfigs;
                $.lastRequestTime = data.data.result.lastRequestTime;
                $.bubbles = data.data.result.bubbles;
                $.signInfo = data.data.result.signInfo;
                $.totalScore = data.data.result.totalScore;
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}

function taskPostUrl(function_id, body = {}) {
  const time = new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000;
  return {
    url: `${JD_API_HOST}?functionId=${function_id}&appid=jd_mp_h5&loginType=2&client=jd_mp_h5&t=${time}&body=${escape(JSON.stringify(body))}`,
    headers: {
      "Cookie": cookie,
      "User-Agent": `jdapp;iPhone;9.1.0;14.0;e35caf0a69be42084e3c97eef56c3af7b0262d01;network/4g;supportApplePay/3;hasUPPay/0;pushNoticeIsOpen/1;model/iPhone11,8;addressid/2005183373;hasOCPay/0;appBuild/167348;supportBestPay/0;jdSupportDarkMode/0;pv/255.2;apprpd/Home_Main;ref/JDMainPageViewController;psq/1;ads/;psn/e35caf0a69be42084e3c97eef56c3af7b0262d01|701;jdv/0|kong|t_2010957099_|jingfen|3b5422e836e74037862fea3dcf1a6802|1600647811440|1600647814;adk/;app_device/IOS;pap/JA2015_311210|9.1.0|IOS 14.0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1`,
    }
  }
}

function TotalBean() {
  return new Promise(async resolve => {
    const options = {
      "url": `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
      "headers": {
        "Accept": "application/json,text/plain, */*",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Connection": "keep-alive",
        "Cookie": cookie,
        "Referer": "https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
      }
    }
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data['retcode'] === 13) {
              $.isLogin = false; //cookie过期
              return
            }
            $.nickName = data['base'].nickname;
          } else {
            console.log(`京东服务器返回空数据`)
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}

function safeGet(data) {
  try {
    if (typeof JSON.parse(data) == "object") {
      return true;
    }
  } catch (e) {
    console.log(e);
    console.log(`京东服务器访问数据为空，请检查自身设备网络情况`);
    return false;
  }
}
