/*
 * @Author: lxk0301
 * @Date: 2020-10-21 17:04:04
 * @Last Modified by: lxk0301
 * @Last Modified time: 2020-11-05 00:35:04
 */
/**
 星推官脚本 https://raw.githubusercontent.com/lxk0301/scripts/master/jd_xtg.js
 星推官活动地址：https://prodev.m.jd.com/mall/active/3gSzKSnvrrhYushciUpzHcDnkYE3/index.html
 活动时间：2020年10月21日 00:00:00-2020年11月11日 23:59:59
 京豆先到先得！！！！！！！！！！！
 出现任务做完没领取的情况，就再运行一次脚本
 能做完所有的任务，包括自动抽奖,脚本会给内置的shareId助力
 一共23个活动，耗时比较久，surge请加大timeout时间
 支持京东双账号
 脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
 // quantumultx
 [task_local]
 #京东星推官
 2 0 * * * https://raw.githubusercontent.com/lxk0301/scripts/master/jd_xtg.js, tag=京东星推官, enabled=true
 // Loon
 [Script]
 cron "2 0 * * *" script-path=https://raw.githubusercontent.com/lxk0301/scripts/master/jd_xtg.js,tag=京东星推官
 // Surge
 京东星推官 = type=cron,cronexp=2 0 * * *,wake-system=1,timeout=320,script-path=https://raw.githubusercontent.com/lxk0301/scripts/master/jd_xtg.js
 */
const {Env} = require('../src/utils/Env')
const $ = new Env('京东星推官');
const activeEndTime = '2020/11/11 23:59:59';//活动结束时间
const notify = $.isNode() ? require('../src/utils/sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('../src/utils/jdCookie.js') : '';

//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '';
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  let cookiesData = $.getdata('CookiesJD') || "[]";
  cookiesData = jsonParse(cookiesData);
  cookiesArr = cookiesData.map(item => item.cookie);
  cookiesArr.push($.getdata('CookieJD'));
  cookiesArr.push($.getdata('CookieJD2'));
}
const starID = [
  'bolangwutiaoren',
  'oulebyangzi',
  'meiditongliya',
  'chuangweimaobuyi',
  'quechaozhuyilong',
  'haierchenxiao',
  'feilipulixian',
  'feilipurenjialun',
  'feilipuwangziyi',
  'changhongsongyi',
  'jiuyangdenglun',
  'aokesilingengxin',
  'haixinchengguo',
  'fangtai',
  'lgyangzishan',
  'laobansongweilong',
  'haiermaoxiaotong',
  "skgwangyibo",
  "kongtiaozhangjike",
  "sanxingningjing",
  "xiaojiadianxiongziqi",
  "heidianliyitong",
  "oulebzhangyixing",
];
const shareID = [
  'e646c144-28a7-4b1b-8145-5b0dbff107ec',
  'b3fcb734-cbdd-4436-9f92-b13b445fc253',
  'e2d63b19-19d6-4a20-b2af-74b828e703d0',
  'a7a3b9b7-2872-4244-a627-3b82c271dee7',
  'f7b521e7-5306-4908-ba8a-df2d221bdd9d',
  'd17ec374-70d4-49d5-8673-7093e61f904c',
  '915b9567-dc88-4389-8be9-ecc25588353a',
  '7abdc8f4-d8f4-497f-8daa-cdab01cf645c',
  '50ecc8de-1ee5-4420-bbb8-1136d86d80db',
  'fd0770e1-5007-45c1-8d69-402e02ff9a52',
  'cb9e9a59-a86b-4a0d-a308-4503fe5baaa4',
  '93b3afeb-a18c-437c-b5ca-fbd9f389671d',
  '8778793c-e9ad-4339-a709-723ae3ebde8e',
  '921c376e-8cc5-4236-8242-ff8bb1b88a95',
  '8b3ce203-4b10-4c36-a87d-da8c82efe362',
  'c8e1feb3-6ab1-4410-8444-1de8bd22e041',
  "dd6b5270-3e5e-436d-be0f-295a8604cf47",
  "7aef5700-4fa0-43b8-98fa-3a09f46ea47c",
  "be0ec81c-bf26-4b7b-9527-d02b0286e5af",
  "ecd890e0-db46-46c7-862e-cb9776c207dc",
  "91ceb3eb-df84-471e-ad77-320cd95763ee",
];
const JD_API_HOST = 'https://urvsaggpt.m.jd.com/guardianstar';
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
      $.beanCount = 0;
      $.jdNum = 0;
      $.isLogin = true;
      $.nickName = '';
      const beforeTotal = await TotalBean();
      console.log(`\n===============开始【京东账号${$.index}】${$.nickName || $.UserName}==================\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/`, {"open-url": "https://bean.m.jd.com/"});
        $.setdata('', `CookieJD${i ? i + 1 : "" }`);//cookie失效，故清空cookie。
        if ($.isNode()) await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        continue
      }
      console.log(`一共${starID.length}个${$.name}任务，耗时会很久，请提前知晓`)
      $.beanCount = beforeTotal && beforeTotal['base'].jdNum;
      for (let index = 0; index < starID.length; index ++) {
        $.activeId = starID[index];
        $.j = index;
        await JD_XTG();
      }
      console.log(`\n等待8秒后，再去领取奖励\n`)
      console.log(`做任务之前京豆总计:${$.beanCount}`)
      await $.wait(8000);
      for (let index = 0; index < starID.length; index ++) {
        $.activeId = starID[index];
        $.j = index;
        await JD_XTG();
        await doSupport(shareID[index]);
      }
      const afterTotal = await TotalBean();
      $.jdNum = afterTotal['base'].jdNum;
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
async function showMsg() {
  console.log(`\n做任务之前京豆总计:${$.beanCount}`)
  console.log(`做完任务后京豆总计:${$.jdNum}`);
  console.log(`活动活动京豆数量:${$.jdNum - $.beanCount}`);
  let nowTime = Date.now();
  const zone = new Date().getTimezoneOffset();
  if (zone === 0) {
    nowTime += 28800000;//UTC-0时区加上8个小时
  }
  if (nowTime > new Date(activeEndTime).getTime()) {
    $.msg($.name, '活动已结束', `请删除或禁用此脚本\n如果帮助到您可以点下🌟STAR鼓励我一下,谢谢\n咱江湖再见\nhttps://github.com/lxk0301/scripts`, {"open-url": "https://github.com/lxk0301/scripts"});
    if ($.isNode()) await notify.sendNotify($.name + '活动已结束', `请删除此脚本\n如果帮助到您可以点下🌟STAR鼓励我一下,谢谢\n咱江湖再见\nhttps://github.com/lxk0301/scripts`)
  } else {
    $.msg($.name, `账号${$.index} ${$.nickName || $.UserName}`, `做任务之前京豆总计:${$.beanCount}\n做完任务后京豆总计:${$.jdNum}\n${($.jdNum - $.beanCount) > 0 ? `获得京豆：${$.jdNum - $.beanCount}京豆 🐶(仅供参考)\n` : ''}京豆先到先得\n活动地址点击弹窗跳转后即可查看\n注：如未获得京豆就是已被分完`, {"open-url": "https://prodev.m.jd.com/mall/active/3gSzKSnvrrhYushciUpzHcDnkYE3/index.html"})
    if ($.isNode()) await notify.sendNotify(`${$.name} - 账号${$.index} - ${$.nickName || $.UserName}`, `账号${$.index} ${$.nickName || $.UserName}\n做任务之前京豆总计:${$.beanCount}\n做完任务后京豆总计:${$.jdNum}\n${($.jdNum - $.beanCount) > 0 ? `获得京豆：${$.jdNum - $.beanCount}京豆 🐶(仅供参考)\n` : ''}京豆先到先得\n注：如未获得京豆就是已被分完\n活动地址：https://prodev.m.jd.com/mall/active/3gSzKSnvrrhYushciUpzHcDnkYE3/index.html`)
  }
}
async function JD_XTG() {
  await getHomePage();
  if ($.homeData && $.homeData.code === 200) {
    const { shopList, venueList, productList, orderSkuList, shareId } = $.homeData.data[0];
    console.log(`\n===========活动${$.j + 1}-[${starID[$.j]}] 助力码==========\n${shareId}\n`);
    for (let item of shopList) {
      console.log(`\n任务一：关注${item['shopName']}`)
      if (item['shopStatus'] === 4) {
        console.log(`入会任务，假入会`);
        await doTask('shop', item['shopId'], 0)
        continue
      }
      if (item['shopStatus'] === 3) {
        console.log(`此任务已做完，跳过`);
        continue
      }
      console.log(`shopStatus:::${item['shopStatus']}`)
      if (item['shopStatus'] !== 3 && item['shopStatus'] !== 4) {
        await doTask('shop', item['shopId'], item['shopStatus'])
      }
      // if (item['shopStatus'] === 2) {
      //   await doTask('shop', item['shopId'], 2)
      // }
      // if (item['shopStatus'] === 4) {
      //   await doTask('shop', item['shopId'], 4)
      // }
    }
    for (let item1 of venueList) {
      console.log(`\n任务二：逛逛[${item1['venueName']}]-${item1['venueStatus']  !== 3 ? '' : '已做完'}`)
      if (item1['venueStatus'] === 1) {
        await doTask('venue', item1['venueId'], 1);
      }
      if (item1['venueStatus'] === 2) {
        await doTask('venue', item1['venueId'], 2);
      }
    }
    for (let item2 of productList) {
      console.log(`\n任务三：逛逛[${item2['productName']}]-${item2['productStatus']  !== 3 ? '' : '已做完'}`)
      if (item2['productStatus'] === 1) {
        await doTask('product', item2['productId'], 1);
      }
      if (item2['productStatus'] === 2) {
        await doTask('product', item2['productId'], 2);
      }
    }
    //付定金 TODO
    // for (let item3 of orderSkuList) {
    //   await doTask('order', item3['skuId'], 1);
    //   await doTask('order', item3['skuId'], 2);
    //   await doTask('order', item3['skuId'], 3);
    //   await doTask('order', item3['skuId'], 0);
    //
    //   await doTask('order', item3['skuId'], 2);
    //   await doTask('order', item3['skuId'], 1);
    // }
    console.log(`\n开始抽奖\n`)
    await getDayPrizeStatus(4, `${$.activeId}#1`, 3);
    await getDayPrizeStatus(1, `${$.activeId}#2`, 3);
  } else {
    console.log(`京东服务器返回无数据！`)
  }
}
function getHomePage() {
  return new Promise(resolve => {
    $.get(taskUrl('getHomePage'), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (data) {
            $.homeData = JSON.parse(data);
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
function doTask(type, id, status) {
  return new Promise(async resolve => {
    $.post(taskPostUrl(type, id, status), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          console.log(`做任务结果:${data}`);
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}

function doSupport(shareId) {
  return new Promise(async resolve => {
    const options = {
      "url": `${JD_API_HOST}/doSupport`,
      "body": `starId=${$.activeId}&shareId=${shareId}`,
      "headers": {
        "Accept": "application/json,text/plain, */*",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Connection": "keep-alive",
        "Cookie": cookie,
        "Host": "urvsaggpt.m.jd.com",
        "Referer": "https://urvsaggpt.m.jd.com/static/index.html",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
      }
    }
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          // console.log(`\n助力结果:${data}`);
          // data = JSON.parse(data);
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
        resolve(data);
      }
    })
  })
}
function getDayPrizeStatus(prizeType, prizeId, status) {
  return new Promise(async resolve => {
    const options = {
      "url": `${JD_API_HOST}/getDayPrizeStatus`,
      "body": `starId=${$.activeId}&status=${status}&prizeType=${prizeType}&prizeId=${prizeId}`,
      "headers": {
        "Accept": "application/json,text/plain, */*",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Connection": "keep-alive",
        "Cookie": cookie,
        "Host": "urvsaggpt.m.jd.com",
        "Referer": "https://urvsaggpt.m.jd.com/static/index.html",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
      }
    }
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          console.log(`抽奖结果:${data}`);
          // data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}
function taskPostUrl(type, id, status) {
  return {
    url: `${JD_API_HOST}/doTask`,
    body: `starId=${$.activeId}&type=${type}&id=${id}&status=${status}`,
    headers: {
      "Accept": "application/json,text/plain, */*",
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "zh-cn",
      "Connection": "keep-alive",
      "Cookie": cookie,
      "Host": "urvsaggpt.m.jd.com",
      "Referer": "https://urvsaggpt.m.jd.com/static/index.html",
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
    }
  }
}
function jsonParse(str) {
  if (typeof str == "string") {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.log(e);
      $.msg($.name, '', '不要在BoxJS手动复制粘贴修改cookie')
      return [];
    }
  }
}
function taskUrl(function_id) {
  return {
    url: `${JD_API_HOST}/${function_id}?t=${Date.now()}&starId=${$.activeId}`,
    headers: {
      "Accept": "application/json,text/plain, */*",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "zh-cn",
      "Connection": "keep-alive",
      "Cookie": cookie,
      "Host": "urvsaggpt.m.jd.com",
      "Referer": "https://urvsaggpt.m.jd.com/static/index.html",
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
    }
  }
}
