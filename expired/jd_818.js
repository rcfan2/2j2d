/*
 * @Author: lxk0301 https://github.com/lxk0301
 * @Date: 2020-11-03 09:25:47
 * @Last Modified by: lxk0301
 * @Last Modified time: 2020-11-02 09:26:12
 */
/*
京东手机狂欢城活动，每日可获得30+以上京豆（其中20京豆是往期奖励，需第一天参加活动后，第二天才能拿到）
活动时间10.21日-11.12日结束，活动23天，保底最少可以拿到690京豆
活动地址: https://rdcseason.m.jd.com/#/index

其中有20京豆是往期奖励，需第一天参加活动后，第二天才能拿到！！！！


每天0/6/12/18点逛新品/店铺/会场可获得京豆，京豆先到先得
往期奖励一般每天都能拿20京豆

注：脚本运行会给我提供的助力码助力，介意者可删掉脚本第48行helpCode里面的东西。留空即可（const helpCode = []）;

支持京东双账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
// quantumultx
[task_local]
#京东手机狂欢城
1 0-18/6 * * * https://raw.githubusercontent.com/lxk0301/scripts/master/jd_818.js, tag=京东手机狂欢城, enabled=true
// Loon
[Script]
cron "1 0-18/6 * * *" script-path=https://raw.githubusercontent.com/lxk0301/scripts/master/jd_818.js,tag=京东手机狂欢城
// Surge
京东手机狂欢城 = type=cron,cronexp=1 0-18/6 * * *,wake-system=1,timeout=20,script-path=https://raw.githubusercontent.com/lxk0301/scripts/master/jd_818.js
 */
const {Env} = require('../src/utils/Env')
const $ = new Env('京东手机狂欢城');

const notify = $.isNode() ? require('../src/utils/sendNotify') : '';
let jdNotify = false;//是否开启推送互助码
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

const JD_API_HOST = 'https://rdcseason.m.jd.com/api/';
const activeEndTime = '2020/11/11 23:59:59+08:00';
const addUrl = 'http://jd.turinglabs.net/helpcode/create/';
const printUrl = `http://jd.turinglabs.net/helpcode/print/20/`;
let helpCode = []
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', {"open-url": "https://bean.m.jd.com/"});
    return;
  }
  $.temp = [];
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
      await JD818();
      // await getHelp();
      // await doHelp();
      // await main();
    }
  }
  // console.log($.temp)
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
  })
  .finally(() => {
    $.done();
  })

async function main() {
  // await getHelp();
  await Promise.all([
    getHelp(),
    listGoods(),
    shopInfo(),
    listMeeting(),
  ]);
  await $.wait(10000);
  await Promise.all([
    listGoods(),
    shopInfo(),
    listMeeting(),
    doHelp(),
    myRank(),
  ]);
  await Promise.all([
    getListJbean(),
    getListRank(),
    getListIntegral(),
  ]);
  await showMsg()
}

async function JD818() {
  await getHelp();
  await listGoods();//逛新品
  await shopInfo();//逛店铺
  await listMeeting();//逛会场
  await $.wait(10000);
  //再次运行一次，避免出现遗漏的问题
  await listGoods();//逛新品
  await shopInfo();//逛店铺
  await listMeeting();//逛会场
  await doHelp();
  await myRank();//领取往期排名奖励
  await getListJbean();
  await getListRank();
  await getListIntegral();
  await showMsg()
}

function listMeeting() {
  const options = {
    'url': `${JD_API_HOST}task/listMeeting?t=${Date.now()}`,
    'headers': {
      'Host': 'rdcseason.m.jd.com',
      'Accept': 'application/json, text/plain, */*',
      'Connection': ' keep-alive',
      'Cookie': cookie,
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/7.0.14(0x17000e2a) NetType/4G Language/zh_CN',
      'Accept-Language': 'zh-cn',
      'Referer': `https://rdcseason.m.jd.com/?reloadWQPage=t_${Date.now()}`,
      'Accept-Encoding': 'gzip, deflate, br'
    }
  }
  return new Promise((resolve) => {
    $.get(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          data = JSON.parse(data);
          // console.log('ddd----ddd', data.code)
          if (data.code === 200 && data.data.meetingList) {
            let integralNum = 0, jdNum = 0;
            for (let item of data.data.meetingList) {
              let res = await browseMeeting(item.id);
              if (res.code === 200) {
                let res2 = await getMeetingPrize(item.id);
                integralNum += res2.data.integralNum * 1;
                jdNum += res2.data.jdNum * 1;
              }
              // await browseMeeting('1596206323911');
              // await getMeetingPrize('1596206323911');
            }
            console.log(`逛会场--获得积分:${integralNum}`)
            console.log(`逛会场--获得京豆:${jdNum}`)
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

function listGoods() {
  const options = {
    'url': `${JD_API_HOST}task/listGoods?t=${Date.now()}`,
    'headers': {
      'Host': 'rdcseason.m.jd.com',
      'Accept': 'application/json, text/plain, */*',
      'Connection': ' keep-alive',
      'Cookie': cookie,
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/7.0.14(0x17000e2a) NetType/4G Language/zh_CN',
      'Accept-Language': 'zh-cn',
      'Referer': `https://rdcseason.m.jd.com/?reloadWQPage=t_${Date.now()}`,
      'Accept-Encoding': 'gzip, deflate, br'
    }
  }
  return new Promise((resolve) => {
    $.get(options, async (err, resp, data) => {
      try {
        // console.log('data1', data);
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          data = JSON.parse(data);
          if (data.code === 200 && data.data.goodsList) {
            let integralNum = 0, jdNum = 0;
            for (let item of data.data.goodsList) {
              let res = await browseGoods(item.id);
              if (res.code === 200) {
                let res2 = await getGoodsPrize(item.id);
                // console.log('逛新品领取奖励res2', res2);
                integralNum += res2.data.integralNum * 1;
                jdNum += res2.data.jdNum * 1;
              }
            }
            console.log(`逛新品获得积分:${integralNum}`)
            console.log(`逛新品获得京豆:${jdNum}`)
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  });
}

function shopInfo() {
  const options = {
    'url': `${JD_API_HOST}task/shopInfo?t=${Date.now()}`,
    'headers': {
      'Host': 'rdcseason.m.jd.com',
      'Accept': 'application/json, text/plain, */*',
      'Connection': ' keep-alive',
      'Cookie': cookie,
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/7.0.14(0x17000e2a) NetType/4G Language/zh_CN',
      'Accept-Language': 'zh-cn',
      'Referer': `https://rdcseason.m.jd.com/?reloadWQPage=t_${Date.now()}`,
      'Accept-Encoding': 'gzip, deflate, br'
    }
  }
  return new Promise((resolve) => {
    $.get(options, async (err, resp, data) => {
      try {
        // console.log('data1', data);
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          data = JSON.parse(data);
          if (data.code === 200 && data.data) {
            let integralNum = 0, jdNum = 0;
            for (let item of data.data) {
              let res = await browseShop(item.shopId);
              // console.log('res', res)
              // res = JSON.parse(res);
              // console.log('res', res.code)
              if (res.code === 200) {
                // console.log('---')
                let res2 = await getShopPrize(item.shopId);
                // console.log('res2', res2);
                // res2 = JSON.parse(res2);
                integralNum += res2.data.integralNum * 1;
                jdNum += res2.data.jdNum * 1;
              }
            }
            console.log(`逛店铺获得积分:${integralNum}`)
            console.log(`逛店铺获得京豆:${jdNum}`)
          }
        }
        // console.log('data1', data);
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve()
      }
    })
  })

}

function browseGoods(id) {
  const options = {
    "url": `${JD_API_HOST}task/browseGoods?t=${Date.now()}&skuId=${id}`,
    "headers": {
      "Host": "rdcseason.m.jd.com",
      "Accept": "application/json, text/plain, */*",
      "Connection": "keep-alive",
      "Cookie": cookie,
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1",
      "Accept-Language": "zh-cn",
      "Referer": "https://rdcseason.m.jd.com/",
      "Accept-Encoding": "gzip, deflate, br"
    }
  }
  return new Promise((resolve) => {
    $.get(options, (err, resp, data) => {
      try {
        // console.log('data1', data);
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          data = JSON.parse(data);
        }
        // console.log('data1', data);
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}

function getGoodsPrize(id) {
  const options = {
    "url": `${JD_API_HOST}task/getGoodsPrize?t=${Date.now()}&skuId=${id}`,
    "headers": {
      "Host": "rdcseason.m.jd.com",
      "Accept": "application/json, text/plain, */*",
      "Connection": "keep-alive",
      "Cookie": cookie,
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1",
      "Accept-Language": "zh-cn",
      "Referer": "https://rdcseason.m.jd.com/",
      "Accept-Encoding": "gzip, deflate, br"
    }
  }
  return new Promise((resolve) => {
    $.get(options, (err, resp, data) => {
      try {
        // console.log('data1', data);
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
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

function browseShop(id) {
  const options2 = {
    "url": `${JD_API_HOST}task/browseShop`,
    "body": `shopId=${id}`,
    "headers": {
      "Host": "rdcseason.m.jd.com",
      "Accept": "application/json, text/plain, */*",
      "Connection": "keep-alive",
      "Cookie": cookie,
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1",
      "Accept-Language": "zh-cn",
      "Referer": "https://rdcseason.m.jd.com/",
      "Accept-Encoding": "gzip, deflate, br"
    }
  }
  return new Promise((resolve) => {
    $.post(options2, (err, resp, data) => {
      try {
        // console.log('data1', data);
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
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

function getShopPrize(id) {
  const options = {
    "url": `${JD_API_HOST}task/getShopPrize`,
    "body": `shopId=${id}`,
    "headers": {
      "Host": "rdcseason.m.jd.com",
      "Accept": "application/json, text/plain, */*",
      "Connection": "keep-alive",
      "Cookie": cookie,
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1",
      "Accept-Language": "zh-cn",
      "Referer": "https://rdcseason.m.jd.com/",
      "Accept-Encoding": "gzip, deflate, br"
    }
  }
  return new Promise((resolve) => {
    $.post(options, (err, resp, data) => {
      try {
        // console.log('getShopPrize', data);
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
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

function browseMeeting(id) {
  const options2 = {
    "url": `${JD_API_HOST}task/browseMeeting`,
    "body": `meetingId=${id}`,
    "headers": {
      "Host": "rdcseason.m.jd.com",
      "Accept": "application/json, text/plain, */*",
      "Connection": "keep-alive",
      "Cookie": cookie,
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1",
      "Accept-Language": "zh-cn",
      "Referer": "https://rdcseason.m.jd.com/",
      "Accept-Encoding": "gzip, deflate, br"
    }
  }
  return new Promise((resolve) => {
    $.post(options2, (err, resp, data) => {
      try {
        // console.log('点击浏览会场', data);
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
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

function getMeetingPrize(id) {
  const options = {
    "url": `${JD_API_HOST}task/getMeetingPrize`,
    "body": `meetingId=${id}`,
    "headers": {
      "Host": "rdcseason.m.jd.com",
      "Accept": "application/json, text/plain, */*",
      "Connection": "keep-alive",
      "Cookie": cookie,
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1",
      "Accept-Language": "zh-cn",
      "Referer": "https://rdcseason.m.jd.com/",
      "Accept-Encoding": "gzip, deflate, br"
    }
  }
  return new Promise((resolve) => {
    $.post(options, (err, resp, data) => {
      try {
        // console.log('getMeetingPrize', data);
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
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

function myRank() {
  return new Promise(resolve => {
    const options = {
      "url": `${JD_API_HOST}task/myRank?t=${Date.now()}`,
      "headers": {
        "Host": "rdcseason.m.jd.com",
        "Accept": "application/json, text/plain, */*",
        "Connection": "keep-alive",
        "Cookie": cookie,
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1",
        "Accept-Language": "zh-cn",
        "Referer": "https://rdcseason.m.jd.com/",
        "Accept-Encoding": "gzip, deflate, br"
      }
    }
    $.jbeanNum = '';
    $.get(options, async (err, resp, data) => {
      try {
        // console.log('查询获奖列表data', data);
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          data = JSON.parse(data);
          if (data.code === 200 && data.data.myHis) {
            for (let i = 0; i < data.data.myHis.length; i++) {
              $.date = data.data.myHis[0].date;
              if (data.data.myHis[i].status === '21') {
                await $.wait(1000);
                console.log('开始领奖')
                let res = await saveJbean(data.data.myHis[i].id);
                // console.log('领奖结果', res)
                if (res.code === 200 && res.data.rsCode === 200) {
                  // $.jbeanNum += Number(res.data.jbeanNum);
                  console.log(`${data.data.myHis[i].date}日奖励领取成功${JSON.stringify(res.data.jbeanNum)}`)
                }
              }
              if (i === 0 && data.data.myHis[i].status === '22') {
                $.jbeanNum = data.data.myHis[i].prize;
              }
            }
            // for (let item of data.data.myHis){
            //   if (item.status === '21') {
            //     await $.wait(1000);
            //     console.log('开始领奖')
            //     let res = await saveJbean(item.id);
            //     // console.log('领奖结果', res)
            //     if (res.code === 200 && res.data.rsCode === 200) {
            //       $.jbeanNum += Number(res.data.jbeanNum);
            //     }
            //   }
            // }
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

function saveJbean(id) {
  return new Promise(resolve => {
    const options = {
      "url": `${JD_API_HOST}task/saveJbean`,
      "body": `prizeId=${id}`,
      "headers": {
        "Host": "rdcseason.m.jd.com",
        "Accept": "application/json, text/plain, */*",
        "Connection": "keep-alive",
        "Cookie": cookie,
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1",
        "Accept-Language": "zh-cn",
        "Referer": "https://rdcseason.m.jd.com/",
        "Accept-Encoding": "gzip, deflate, br"
      }
    }
    $.post(options, (err, resp, data) => {
      try {
        // console.log('领取京豆结果', data);
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
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

async function doHelp() {
  console.log(`脚本自带助力码数量:${helpCode.length}`)
  let body = '', nowTime = Date.now(), tempCode = [];
  const zone = new Date().getTimezoneOffset();
  if (zone === 0) {
    nowTime += 28800000;//UTC-0时区加上8个小时
  }
  await updateShareCodes();
  if (!$.updatePkActivityIdRes) await updateShareCodesCDN();
  tempCode = $.updatePkActivityIdRes.shareCodes;
  console.log(`是否大于当天九点🕘:${nowTime > new Date(nowTime).setHours(9, 0, 0, 0)}`)
  //当天大于9:00才从API里面取收集的助力码
  if (nowTime > new Date(nowTime).setHours(9, 0, 0, 0)) body = await printAPI();//访问收集的互助码
  if (body) {
    console.log(`printAPI返回助力码数量:${body.replace(/"/g, '').split(',').length}`)
    tempCode = tempCode.concat(body.replace(/"/g, '').split(','))
  }
  console.log(`累计助力码数量:${tempCode.length}`)
  //去掉重复的
  tempCode = [...new Set(tempCode)];
  console.log(`去重后总助力码数量:${tempCode.length}`)
  for (let item of tempCode) {
    if (!item) continue;
    const helpRes = await toHelp(item.trim());
    if (helpRes.data.status === 5) {
      console.log(`助力机会已耗尽，跳出助力`);
      break;
    }
  }
}

function printAPI() {
  return new Promise(resolve => {
    $.get({url: `${printUrl}`}, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          // data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

function toHelp(code) {
  return new Promise(resolve => {
    const options = {
      "url": `${JD_API_HOST}task/toHelp`,
      "body": `shareId=${code}`,
      "headers": {
        "Host": "rdcseason.m.jd.com",
        "Content-Type": "application/x-www-form-urlencoded",
        "Origin": "https://rdcseason.m.jd.com",
        "Accept-Encoding": "gzip, deflate, br",
        "Cookie": cookie,
        "Connection": "keep-alive",
        "Accept": "application/json, text/plain, */*",
        "User-Agent": "jdapp;iPhone;9.1.0;14.0;e35caf0a69be42084e3c97eef56c3af7b0262d01;network/4g;supportApplePay/3;hasUPPay/0;pushNoticeIsOpen/1;model/iPhone11,8;addressid/2005183373;hasOCPay/0;appBuild/167348;supportBestPay/0;jdSupportDarkMode/0;pv/252.3;apprpd/Home_Main;ref/JDWebViewController;psq/2;ads/;psn/e35caf0a69be42084e3c97eef56c3af7b0262d01|695;jdv/0|kong|t_2010957099_|jingfen|3b5422e836e74037862fea3dcf1a6802|1600647811440|1600647814;adk/;app_device/IOS;pap/JA2015_311210|9.1.0|IOS 14.0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
        "Referer": "https://rdcseason.m.jd.com/",
        "Content-Length": "44",
        "Accept-Language": "zh-cn"
      }
    }
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          console.log(`助力结果:${data}`);
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

function getHelp() {
  return new Promise(resolve => {
    const options = {
      "url": `${JD_API_HOST}task/getHelp?t=${Date.now()}`,
      "headers": {
        "Host": "rdcseason.m.jd.com",
        "Accept": "application/json, text/plain, */*",
        "Connection": "keep-alive",
        "Cookie": cookie,
        "User-Agent": "jdapp;iPhone;9.1.0;14.0;e35caf0a69be42084e3c97eef56c3af7b0262d01;network/4g;supportApplePay/3;hasUPPay/0;pushNoticeIsOpen/1;model/iPhone11,8;addressid/2005183373;hasOCPay/0;appBuild/167348;supportBestPay/0;jdSupportDarkMode/0;pv/255.2;apprpd/Home_Main;ref/JDMainPageViewController;psq/1;ads/;psn/e35caf0a69be42084e3c97eef56c3af7b0262d01|701;jdv/0|kong|t_2010957099_|jingfen|3b5422e836e74037862fea3dcf1a6802|1600647811440|1600647814;adk/;app_device/IOS;pap/JA2015_311210|9.1.0|IOS 14.0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
        "Accept-Language": "zh-cn",
        "Referer": "https://rdcseason.m.jd.com",
        "Accept-Encoding": "gzip, deflate, br"
      }
    }
    $.get(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          data = JSON.parse(data);
          if (data.code === 200) {
            console.log(`\n您的助力码shareId(互助码每天都是变化的)\n\n"${data.data.shareId}",\n`);
            console.log(`每日9:00以后复制下面的URL链接在浏览器里面打开一次就能自动上车\n\n${addUrl}${data.data.shareId}\n`);
            let ctrTemp;
            if ($.isNode() && process.env.JD_818_SHAREID_NOTIFY) {
              console.log(`环境变量JD_818_SHAREID_NOTIFY::${process.env.JD_818_SHAREID_NOTIFY}`)
              ctrTemp = `${process.env.JD_818_SHAREID_NOTIFY}` === 'true';
            } else {
              ctrTemp = `${jdNotify}` === 'true';
            }
            console.log(`是否发送上车推送链接:${ctrTemp ? '是' : '否'}`)
            // 只在早晨9点钟触发一次
            let NowHours = new Date().getHours();
            const zone = new Date().getTimezoneOffset();
            if (zone === 0) {
              NowHours += 8;//UTC-0时区加上8个小时
            }
            if (ctrTemp && NowHours === 9 && $.isNode()) await notify.sendNotify(`${$.name} - 账号${$.index} - ${$.nickName}互助码自动上车`, `[9:00之后上车]您的互助码上车链接是 ↓↓↓ \n\n ${addUrl}${data.data.shareId} \n\n ↑↑↑`, {
              url: `${addUrl}${data.data.shareId}`
            })
            // await $.http.get({url: `http://jd.turinglabs.net/helpcode/add/${data.data.shareId}/`}).then((resp) => {
            //   console.log(resp);
            //   return
            //   if (resp.statusCode === 200) {
            //     const { body } = resp;
            //   }
            // });
            $.temp.push(data.data.shareId);
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

//获取当前活动总京豆数量
function getListJbean() {
  return new Promise(resolve => {
    const options = {
      "url": `${JD_API_HOST}task/listJbean?pageNum=1`,
      "headers": {
        "Host": "rdcseason.m.jd.com",
        "Accept": "application/json, text/plain, */*",
        "Connection": "keep-alive",
        "Cookie": cookie,
        "User-Agent": "jdapp;iPhone;9.1.0;14.0;e35caf0a69be42084e3c97eef56c3af7b0262d01;network/4g;supportApplePay/3;hasUPPay/0;pushNoticeIsOpen/1;model/iPhone11,8;addressid/2005183373;hasOCPay/0;appBuild/167348;supportBestPay/0;jdSupportDarkMode/0;pv/255.2;apprpd/Home_Main;ref/JDMainPageViewController;psq/1;ads/;psn/e35caf0a69be42084e3c97eef56c3af7b0262d01|701;jdv/0|kong|t_2010957099_|jingfen|3b5422e836e74037862fea3dcf1a6802|1600647811440|1600647814;adk/;app_device/IOS;pap/JA2015_311210|9.1.0|IOS 14.0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
        "Accept-Language": "zh-cn",
        "Referer": "https://rdcseason.m.jd.com",
        "Accept-Encoding": "gzip, deflate, br"
      }
    }
    $.get(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          data = JSON.parse(data);
          if (data.code === 200) {
            $.jbeanCount = data.data.jbeanCount;
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

function getListIntegral() {
  return new Promise(resolve => {
    const options = {
      "url": `${JD_API_HOST}task/listIntegral?pageNum=1`,
      "headers": {
        "Host": "rdcseason.m.jd.com",
        "Accept": "application/json, text/plain, */*",
        "Connection": "keep-alive",
        "Cookie": cookie,
        "User-Agent": "jdapp;iPhone;9.1.0;14.0;e35caf0a69be42084e3c97eef56c3af7b0262d01;network/4g;supportApplePay/3;hasUPPay/0;pushNoticeIsOpen/1;model/iPhone11,8;addressid/2005183373;hasOCPay/0;appBuild/167348;supportBestPay/0;jdSupportDarkMode/0;pv/255.2;apprpd/Home_Main;ref/JDMainPageViewController;psq/1;ads/;psn/e35caf0a69be42084e3c97eef56c3af7b0262d01|701;jdv/0|kong|t_2010957099_|jingfen|3b5422e836e74037862fea3dcf1a6802|1600647811440|1600647814;adk/;app_device/IOS;pap/JA2015_311210|9.1.0|IOS 14.0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
        "Accept-Language": "zh-cn",
        "Referer": "https://rdcseason.m.jd.com",
        "Accept-Encoding": "gzip, deflate, br"
      }
    }
    $.get(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          data = JSON.parse(data);
          if (data.code === 200) {
            $.integralCount = data.data.integralCount;
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

//查询今日累计积分与排名
function getListRank() {
  return new Promise(resolve => {
    const options = {
      "url": `${JD_API_HOST}task/listRank?t=${Date.now()}`,
      "headers": {
        "Host": "rdcseason.m.jd.com",
        "Accept": "application/json, text/plain, */*",
        "Connection": "keep-alive",
        "Cookie": cookie,
        "User-Agent": "jdapp;iPhone;9.1.0;14.0;e35caf0a69be42084e3c97eef56c3af7b0262d01;network/4g;supportApplePay/3;hasUPPay/0;pushNoticeIsOpen/1;model/iPhone11,8;addressid/2005183373;hasOCPay/0;appBuild/167348;supportBestPay/0;jdSupportDarkMode/0;pv/255.2;apprpd/Home_Main;ref/JDMainPageViewController;psq/1;ads/;psn/e35caf0a69be42084e3c97eef56c3af7b0262d01|701;jdv/0|kong|t_2010957099_|jingfen|3b5422e836e74037862fea3dcf1a6802|1600647811440|1600647814;adk/;app_device/IOS;pap/JA2015_311210|9.1.0|IOS 14.0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
        "Accept-Language": "zh-cn",
        "Referer": "https://rdcseason.m.jd.com",
        "Accept-Encoding": "gzip, deflate, br"
      }
    }
    $.get(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          data = JSON.parse(data);
          if (data.code === 200) {
            if (data.data.my) {
              $.integer = data.data.my.integer;
              $.num = data.data.my.num;
            }
            if (data.data.last) {
              $.lasNum = data.data.last.num;
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

function updateShareCodes(url = 'https://raw.githubusercontent.com/lxk0301/updateTeam/master/jd_shareCodes.json') {
  return new Promise(resolve => {
    //https://cdn.jsdelivr.net/gh/lxk0301/updateTeam@master/jd_shareCodes.json
    //https://raw.githubusercontent.com/lxk0301/updateTeam/master/jd_shareCodes.json
    $.get({url}, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
        } else {
          $.updatePkActivityIdRes = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}

function updateShareCodesCDN(url = 'https://cdn.jsdelivr.net/gh/lxk0301/updateTeam@master/jd_shareCodes.json') {
  return new Promise(resolve => {
    //https://cdn.jsdelivr.net/gh/lxk0301/updateTeam@master/jd_shareCodes.json
    //https://raw.githubusercontent.com/lxk0301/updateTeam/master/jd_shareCodes.json
    $.get({url}, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          $.updatePkActivityIdRes = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
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

async function showMsg() {
  if (Date.now() > new Date(activeEndTime).getTime()) {
    $.msg($.name, '活动已结束', `该活动累计获得京豆：${$.jbeanCount}个\niOS用户请删除此脚本\ngithub action用户请删除.github/workflows/jd_818.yml文件\n如果帮助到您可以点下🌟STAR鼓励我一下,谢谢\n咱江湖再见\nhttps://github.com/lxk0301/scripts`, {"open-url": "https://github.com/lxk0301/scripts"});
    if ($.isNode()) await notify.sendNotify($.name + '活动已结束', `请删除此脚本\ngithub action用户请删除.github/workflows/jd_818.yml文件\n如果帮助到您可以点下🌟STAR鼓励我一下,谢谢\n咱江湖再见\n https://github.com/lxk0301/scripts`)
  } else {
    $.msg($.name, `京东账号${$.index} ${$.nickName || $.UserName}`, `${$.jbeanCount ? `${$.integer ? `今日获得积分：${$.integer}个\n` : ''}${$.num ? `今日排名：${$.num}\n` : ''}今日参数人数：${$.lasNum}人\n累计获得京豆：${$.jbeanCount}个🐶\n` : ''}${$.jbeanCount ? `累计获得积分：${$.integralCount}个\n` : ''}${$.jbeanNum ? `${$.date}日奖品：${$.jbeanNum}\n` : ''}具体详情点击弹窗跳转后即可查看`, {"open-url": "https://rdcseason.m.jd.com/#/hame"});
  }
}
