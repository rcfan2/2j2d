/*
 * @Author: lxk0301
 * @Date: 2020-11-03 18:12:38
 * @Last Modified by: lxk0301
 * @Last Modified time: 2020-10-30 20:37:24
*/
/*
京东全民开红包（京东app->主页->领券->抢红包(在底部)）
已完成功能：
①浏览活动
②关注频道
③领取红包
未实现功能：
领3张券功能,邀请好友未实现

支持京东双账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
QuantumultX
[task_local]
#京东全民开红包
1 1 * * * https://raw.githubusercontent.com/lxk0301/scripts/master/jd_redPacket.js, tag=京东全民开红包, img-url=https://raw.githubusercontent.com/58xinian/icon/master/jd_redPacket.png, enabled=true
Loon
[Script]
cron "1 1 * * *" script-path=https://raw.githubusercontent.com/lxk0301/scripts/master/jd_redPacket.js, tag=京东全民开红包
Surge
京东全民开红包 = type=cron,cronexp=1 1 * * *,wake-system=1,timeout=20,script-path=https://raw.githubusercontent.com/lxk0301/scripts/master/jd_redPacket.js
 */
const {Env} = require('../utils/Env')
const $ = new Env('京东全民开红包');
const notify = $.isNode() ? require('../utils/sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('../utils/jdCookie') : '';

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
        $.setdata('', `CookieJD${i ? i + 1 : ""}`);//cookie失效，故清空cookie。
        if ($.isNode()) await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        continue
      }
      $.discount = 0;
      await redPacket();
      await showMsg();
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
  })
  .finally(() => {
    $.done();
  })

async function redPacket() {
  const response = await taskHomePage();
  if (response.code === 0) {
    $.taskInfo = response.data.result.taskInfos;
    if ($.taskInfo && $.taskInfo.length > 0) {
      console.log(`    任务     状态  红包是否领取`);
      for (let item of $.taskInfo) {
        console.log(`${item.title.slice(-6)}   ${item.alreadyReceivedCount ? item.alreadyReceivedCount : 0}/${item.requireCount}      ${item.innerStatus === 4 ? '是' : '否'}`)
      }
      for (let item of $.taskInfo) {
        //innerStatus=4已领取红包，3：任务已完成，红包未领取，2：任务未完成，7,未领取任务
        if (item.innerStatus === 4) {
          console.log(`[${item.title}] 已经领取奖励`)
        } else if (item.innerStatus === 3) {
          await receiveTaskRedpacket(item.taskType);
        } else if (item.innerStatus !== 4) {
          await startTask(item.taskType);
          if (item.taskType !== 0) {
            console.log(`开始做浏览任务\n`);
            await active(item.taskType);
            await receiveTaskRedpacket(item.taskType);
          } else {
            //TODO 领3张优惠券
            console.log(`[${item.title}] 任务未开发`)
          }
        }
      }
    }
  }
}

//获取任务列表
function taskHomePage() {
  return new Promise((resolve) => {
    $.post(taskUrl(arguments.callee.name.toString(), {"clientInfo": {}}), (err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${$.name}: API查询请求失败 ‼️‼️`);
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}

//领取任务
function startTask(taskType) {
  // 从taskHomePage返回的数据里面拿taskType
  const data = {"clientInfo": {}, taskType};
  return new Promise((resolve) => {
    $.post(taskUrl(arguments.callee.name.toString(), data), (err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${$.name}: API查询请求失败 ‼️‼️`);
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}

async function active(taskType) {
  const getTaskDetailForColorRes = await getTaskDetailForColor(taskType);
  if (getTaskDetailForColorRes && getTaskDetailForColorRes.code === 0) {
    if (getTaskDetailForColorRes.data && getTaskDetailForColorRes.data.result) {
      const {advertDetails} = getTaskDetailForColorRes.data.result;
      for (let item of advertDetails) {
        await $.wait(1000);
        if (item.id && item.status === 0) {
          let taskReportForColorRes = await taskReportForColor(taskType, item.id);
          // console.log(`完成任务的动作---${JSON.stringify(taskReportForColorRes)}`)
        }
      }
    } else {
      console.log(`任务列表为空,手动进入app内检查 是否存在[从京豆首页进领券中心逛30秒]的任务,如存在,请手动完成再运行脚本`)
      $.msg(`${$.name}`, '', '手动进入app内检查\n是否存在[从京豆首页进领券中心逛30秒]的任务\n如存在,请手动完成再运行脚本');
      if ($.isNode()) await notify.sendNotify(`${$.name} - 账号${$.index} - ${$.nickName}`, `执行脚本出现异常\n请手动进入app内检查\n是否存在[从京豆首页进领券中心逛30秒]的任务\n如存在,请手动完成再运行脚本`)
    }
  } else {
    console.log(`---具体任务详情---${JSON.stringify(getTaskDetailForColorRes)}`);
  }
}

//获取具体任务详情
function getTaskDetailForColor(taskType) {
  const data = {"clientInfo": {}, taskType};
  return new Promise((resolve) => {
    $.post(taskUrl(arguments.callee.name.toString(), data), (err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${$.name}: API查询请求失败 ‼️‼️`);
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}

//完成任务的动作
function taskReportForColor(taskType, detailId) {
  const data = {"clientInfo": {}, taskType, detailId};
  //console.log(`活动id：：：${detailId}\n`)
  return new Promise((resolve) => {
    $.post(taskUrl(arguments.callee.name.toString(), data), (err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${$.name}: API查询请求失败 ‼️‼️`);
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}

//领取 领3张券任务后的红包
function receiveTaskRedpacket(taskType) {
  const body = {"clientInfo": {}, taskType};
  return new Promise((resolve) => {
    $.post(taskUrl(arguments.callee.name.toString(), body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${$.name}: API查询请求失败 ‼️‼️`);
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
          if (data.data.success && data.data.biz_code === 0) {
            $.discount += Number(data.data.result.discount);
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}

function showMsg() {
  console.log(`${$.name}获得红包：${$.discount}元`);
}

// function newReceiveRvcCouponWithTask() {
//   const data = {"taskType":"0","extend":"","source":"couponCenter_app","pageClickKey":"CouponCenter","rcType":"1","taskId":"415","childActivityUrl":"","eid":"","shshshfpb":"","lat":"","lng":""};
//   request(arguments.callee.name.toString(), data).then((response) => {
//     try {
//       // taskInfo = res.data.result.taskInfos;
//       console.log(`领券结果:${JSON.stringify(response)}`);
//       step.next();
//     } catch (e) {
//       console.log(e);
//       console.log('初始化任务异常');
//     }
//   })
// }
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

function taskUrl(function_id, body) {
  return {
    url: `${JD_API_HOST}?appid=jd_mp_h5&functionId=${function_id}&loginType=2&client=jd_mp_h5&t=${new Date().getTime() * 1000}`,
    body: `body=${JSON.stringify(body)}`,
    headers: {
      "Host": "api.m.jd.com",
      "Content-Type": "application/x-www-form-urlencoded",
      "Origin": "https://happy.m.jd.com",
      "Accept-Encoding": "gzip, deflate, br",
      "Cookie": cookie,
      "Connection": "keep-alive",
      "Accept": "*/*",
      "User-Agent": "jdapp;iPhone;9.0.2;13.5.1;e35caf0a69be42084e3c97eef56c3af7b0262d01;network/wifi;ADID/3B3AD5BC-B5E6-4A08-B32A-030CD805B5DD;supportApplePay/1;hasUPPay/0;pushNoticeIsOpen/1;model/iPhone11,8;addressid/;hasOCPay/0;appBuild/167249;supportBestPay/0;jdSupportDarkMode/0;pv/2.76;apprpd/CouponCenter;ref/NewCouponCenterViewController;psq/0;ads/;psn/e35caf0a69be42084e3c97eef56c3af7b0262d01|28;jdv/0|;adk/;app_device/IOS;pap/JA2015_311210|9.0.2|IOS 13.5.1;Mozilla/5.0 (iPhone; CPU iPhone OS 13_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
      "Referer": "https://happy.m.jd.com/babelDiy/zjyw/3ugedFa7yA6NhxLN5gw2L3PF9sQC/index.html",
      "Content-Length": "36",
      "Accept-Language": "zh-cn"
    }
  }
}
