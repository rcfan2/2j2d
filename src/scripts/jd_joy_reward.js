/*
宠汪汪积分兑换奖品脚本, 目前脚本只兑换京豆，兑换京豆成功，才会发出通知提示，其他情况不通知。
更新时间：2020-11-18
兑换规则：一个账号一天只能兑换一次京豆。
兑换奖品成功后才会有系统弹窗通知
每日京豆库存会在0:00、8:00、16:00更新，经测试发现中午12:00也会有补发京豆。
支持京东双账号
脚本兼容: Quantumult X, Surge, Loon, JSBox, Node.js
// Quantumult X
[task_local]
#宠汪汪积分兑换奖品
0 0-16/8 * * * https://raw.githubusercontent.com/lxk0301/scripts/master/jd_joy_reward.js, tag=宠汪汪积分兑换奖品, img-url=https://raw.githubusercontent.com/58xinian/icon/master/jdcww.png, enabled=true
// Loon
[Script]
cron "0 0-16/8 * * *" script-path=https://raw.githubusercontent.com/lxk0301/scripts/master/jd_joy_reward.js,tag=宠汪汪积分兑换奖品
// Surge
宠汪汪积分兑换奖品 = type=cron,cronexp="0 0-16/8 * * *",wake-system=1,timeout=20,script-path=https://raw.githubusercontent.com/lxk0301/scripts/master/jd_joy_reward.js
 */
const {Env} = require('../utils/Env')
const $ = new Env('宠汪汪积分兑换奖品');
let joyRewardName = 20;//是否兑换京豆，默认开启兑换功能，其中20为兑换20京豆,500为兑换500京豆，0为不兑换京豆.数量有限先到先得
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('../utils/jdCookie') : '';
const notify = $.isNode() ? require('../utils/sendNotify') : '';
let jdNotify = false;//是否开启静默运行，默认false关闭(即:奖品兑换成功后会发出通知提示)
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
const JD_API_HOST = 'https://jdjoy.jd.com';
!(async () => {
  if (!cookiesArr[0]) {
    $.msg('【京东账号一】宠汪汪积分兑换奖品失败', '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', {"open-url": "https://bean.m.jd.com/"});
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
      message = '';
      subTitle = '';
      await joyReward();
      // $.msg($.name, '兑换脚本暂不能使用', `请停止使用，等待后期更新\n如果新版本兑换您有兑换机会，请抓包兑换\n再把抓包数据发送telegram用户@lxk0301`);
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
  })
  .finally(() => {
    $.done();
  })

async function joyReward() {
  await getExchangeRewards();
  if ($.getExchangeRewardsRes && $.getExchangeRewardsRes.success) {
    // console.log('success', $.getExchangeRewardsRes);
    const data = $.getExchangeRewardsRes.data;
    const levelSaleInfos = data.levelSaleInfos;
    const giftSaleInfos = levelSaleInfos.giftSaleInfos;
    console.log(`当前积分 ${data.coin}\n`);
    console.log(`宠物等级 ${data.level}\n`);
    console.log(`京东昵称 ${$.nickName}\n`);
    let saleInfoId = '', giftValue = '', extInfo = '', leftStock = 0, salePrice = 0;
    let rewardNum;
    if ($.isNode() && process.env.JD_JOY_REWARD_NAME) {
      rewardNum = process.env.JD_JOY_REWARD_NAME * 1;
    } else if ($.getdata('joyRewardName')) {
      if ($.getdata('joyRewardName') * 1 === 1) {
        //兼容之前的BoxJs设置
        rewardNum = 20;
      } else {
        rewardNum = $.getdata('joyRewardName') * 1;
      }
    } else {
      rewardNum = joyRewardName;
    }
    for (let item of giftSaleInfos) {
      if (item.giftType === 'jd_bean' && item['giftValue'] === rewardNum) {
        saleInfoId = item.id;
        leftStock = item.leftStock;
        salePrice = item.salePrice;
        giftValue = item.giftValue;
      }
    }
    console.log(`当前京豆库存:${leftStock}`)
    console.log(`saleInfoId:${saleInfoId}`)
    // 兼容之前BoxJs兑换设置的数据
    if (rewardNum && (rewardNum === 1 || rewardNum === 20 || rewardNum === 50 || rewardNum === 100 || rewardNum === 500 || rewardNum === 1000)) {
      //开始兑换
      if (data.coin >= salePrice) {
        if (leftStock) {
          if (!saleInfoId) return
          console.log(`当前账户积分:${data.coin}\n当前京豆库存:${leftStock}\n满足兑换条件,开始为您兑换京豆\n`);
          await exchange(saleInfoId, 'pet');
          if ($.exchangeRes && $.exchangeRes.success) {
            if ($.exchangeRes.errorCode === 'buy_success') {
              console.log(`兑换${giftValue}成功,【宠物等级】${data.level}\n【消耗积分】${salePrice}个\n【剩余积分】${data.coin - salePrice}个\n`)
              let ctrTemp;
              if ($.isNode() && process.env.JD_JOY_REWARD_NOTIFY) {
                ctrTemp = `${process.env.JD_JOY_REWARD_NOTIFY}` === 'false';
              } else if ($.getdata('jdJoyRewardNotify')) {
                ctrTemp = $.getdata('jdJoyRewardNotify') === 'false';
              } else {
                ctrTemp = `${jdNotify}` === 'false';
              }
              if (ctrTemp) {
                $.msg($.name, `兑换${giftValue}京豆成功`, `【京东账号${$.index}】${$.nickName}\n【宠物等级】${data.level}\n【积分详情】消耗积分 ${salePrice}, 剩余积分 ${data.coin - salePrice}`);
                if ($.isNode()) {
                  await notify.sendNotify(`${$.name} - 账号${$.index} - ${$.nickName}`, `【京东账号${$.index}】 ${$.nickName}\n【兑换${giftValue}京豆】成功\n【宠物等级】${data.level}\n【积分详情】消耗积分 ${salePrice}, 剩余积分 ${data.coin - salePrice}`);
                }
              }
              // if ($.isNode()) {
              //   await notify.BarkNotify(`${$.name}`, `【京东账号${$.index}】 ${$.nickName}\n【兑换${giftName}】成功\n【宠物等级】${data.level}\n【消耗积分】${salePrice}分\n【当前剩余】${data.coin - salePrice}积分`);
              // }
            } else if ($.exchangeRes && $.exchangeRes.errorCode === 'buy_limit') {
              console.log(`兑换${rewardNum}京豆失败，原因：兑换京豆已达上限，请把机会留给更多的小伙伴~`)
              //$.msg($.name, `兑换${giftName}失败`, `【京东账号${$.index}】${$.nickName}\n兑换京豆已达上限\n请把机会留给更多的小伙伴~\n`)
            } else {
              console.log(`兑奖异常:${JSON.stringify($.exchangeRes)}`)
            }
          } else {
            console.log(`兑换京豆异常:${JSON.stringify($.exchangeRes)}`)
          }
        } else {
          console.log(`兑换${rewardNum}京豆失败，原因：京豆库存不足，已抢完，请下一场再兑换`)
        }
      } else {
        console.log(`兑换${rewardNum}京豆失败，原因：您目前只有${data.coin}积分，已不足兑换${giftValue}京豆所需的${salePrice}积分\n`)
        //$.msg($.name, `兑换${giftName}失败`, `【京东账号${$.index}】${$.nickName}\n目前只有${data.coin}积分\n已不足兑换${giftName}所需的${salePrice}积分\n`)
      }
    } else {
      console.log('您设置了不兑换京豆,如需兑换京豆，请去BoxJs重新设置或修改第20行代码')
    }
  } else {
    console.log(`${$.name}getExchangeRewards异常,${JSON.stringify($.getExchangeRewardsRes)}`)
  }
}

function getExchangeRewards() {
  return new Promise((resolve) => {
    const option = {
      url: `${JD_API_HOST}/gift/getHomeInfo`,
      headers: {
        "Host": "jdjoy.jd.com",
        "Content-Type": "application/json",
        "Cookie": cookie,
        "reqSource": "h5",
        "Connection": "keep-alive",
        "Accept": "*/*",
        "User-Agent": "jdapp;iPhone;9.0.4;13.5.1;e35caf0a69be42084e3c97eef56c3af7b0262d01;network/4g;ADID/3B3AD5BC-B5E6-4A08-B32A-030CD805B5DD;supportApplePay/3;hasUPPay/0;pushNoticeIsOpen/1;model/iPhone11,8;addressid/2005183373;hasOCPay/0;appBuild/167283;supportBestPay/0;jdSupportDarkMode/1;pv/169.3;apprpd/MyJD_Main;ref/MyJdMTAManager;psq/2;ads/;psn/e35caf0a69be42084e3c97eef56c3af7b0262d01|638;jdv/0|iosapp|t_335139774|appshare|CopyURL|1596547194976|1596547198;adk/;app_device/IOS;pap/JA2015_311210|9.0.4|IOS 13.5.1;Mozilla/5.0 (iPhone; CPU iPhone OS 13_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
        "Referer": "https://jdjoy.jd.com/pet/index",
        "Accept-Language": "zh-cn",
        "Accept-Encoding": "gzip, deflate, br"
      },
    }
    $.get(option, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (data) {
            $.getExchangeRewardsRes = JSON.parse(data);
          } else {
            console.log(`${$.name}api返回数据为空，请检查自身原因`)
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  })
}

function exchange(saleInfoId, orderSource) {
  return new Promise((resolve) => {
    const option = {
      url: `${JD_API_HOST}/gift/exchange`,
      body: `${JSON.stringify({saleInfoId, orderSource})}`,
      headers: {
        "Host": "jdjoy.jd.com",
        "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Content-Type": "application/json",
        "Origin": "https://jdjoy.jd.com",
        "reqSource": "h5",
        "Connection": "keep-alive",
        "User-Agent": "jdapp;iPhone;9.0.4;13.5.1;e35caf0a69be42084e3c97eef56c3af7b0262d01;network/4g;ADID/3B3AD5BC-B5E6-4A08-B32A-030CD805B5DD;supportApplePay/3;hasUPPay/0;pushNoticeIsOpen/1;model/iPhone11,8;addressid/2005183373;hasOCPay/0;appBuild/167283;supportBestPay/0;jdSupportDarkMode/1;pv/169.3;apprpd/MyJD_Main;ref/MyJdMTAManager;psq/2;ads/;psn/e35caf0a69be42084e3c97eef56c3af7b0262d01|638;jdv/0|iosapp|t_335139774|appshare|CopyURL|1596547194976|1596547198;adk/;app_device/IOS;pap/JA2015_311210|9.0.4|IOS 13.5.1;Mozilla/5.0 (iPhone; CPU iPhone OS 13_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
        "Referer": "https://jdjoy.jd.com/pet/index",
        "Content-Length": "10",
        "Cookie": cookie
      },
    }
    $.post(option, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (data) {
            $.exchangeRes = JSON.parse(data);
          } else {
            console.log(`${$.name}api返回数据为空，请检查自身原因`)
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  })
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
