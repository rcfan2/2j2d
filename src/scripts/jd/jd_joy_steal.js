/*
jd宠汪汪偷好友积分与狗粮,及给好友喂食
偷好友积分上限是20个好友(即获得100积分)，帮好友喂食上限是20个好友(即获得200积分)，偷好友狗粮上限也是20个好友(最多获得120g狗粮)
IOS用户支持京东双账号,NodeJs用户支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
更新时间:2020-11-03
如果开启了给好友喂食功能，建议先凌晨0点运行jd_joy.js脚本获取狗粮后，再运行此脚本(jd_joy_steal.js)可偷好友积分，6点运行可偷好友狗粮
注：如果使用Node.js, 需自行安装'crypto-js,got,http-server,tough-cookie'模块. 例: npm install crypto-js http-server tough-cookie got --save
*/
// quantumultx
// [task_local]
// #宠汪汪偷好友积分与狗粮
// 0 0,6 * * * https://raw.githubusercontent.com/lxk0301/scripts/master/jd_joy_steal.js, tag=宠汪汪偷好友积分与狗粮, img-url=https://raw.githubusercontent.com/58xinian/icon/master/jdcww.png, enabled=true
// Loon
// [Script]
// cron "0 0,6 * * *" script-path=https://raw.githubusercontent.com/lxk0301/scripts/master/jd_joy_steal.js,tag=宠汪汪偷好友积分与狗粮
// Surge
// 宠汪汪偷好友积分与狗粮 = type=cron,cronexp="0 0,6 * * *",wake-system=1,timeout=320,script-path=https://raw.githubusercontent.com/lxk0301/scripts/master/jd_joy_steal.js
const {Env} = require('../../utils/Env')
const $ = new Env('宠汪汪偷好友积分与狗粮');
const notify = $.isNode() ? require('../../utils/sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('../../utils/jdCookie.js') : '';

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
let message = '', subTitle = '';

let jdNotify = false;//是否开启静默运行，false关闭静默运行(即通知)，true打开静默运行(即不通知)
let jdJoyHelpFeed = false;//是否给好友喂食，false为不给喂食，true为给好友喂食，默认不给好友喂食
let jdJoyStealCoin = true;//是否偷好友积分与狗粮，false为否，true为是，默认是偷
const weAppUrl = 'https://draw.jdfcloud.com//pet';
const JD_API_HOST = 'https://jdjoy.jd.com/pet'
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
      message = '';
      subTitle = '';
      await jdJoySteal();
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

async function jdJoySteal() {
  await getFriends();
  if ($.getFriendsData && $.getFriendsData.success) {
    message += `【京东账号${$.index}】${$.nickName}\n`;
    await getCoinChanges();
    if ($.getFriendsData && $.getFriendsData.datas && $.getFriendsData.datas.length > 0) {
      const {lastPage} = $.getFriendsData.page;
      console.log('lastPage', lastPage)
      $.allFriends = [];
      for (let i = 1; i <= new Array(lastPage).fill('').length; i++) {
        console.log(`开始查询第${i}页好友\n`);
        await getFriends(i);
        $.allFriends = $.allFriends.concat($.getFriendsData.datas);
      }
      for (let index = 0; index < $.allFriends.length; index++) {
        //剔除自己
        if (!$.allFriends[index].stealStatus) {
          $.allFriends.splice(index, 1);
        }
      }
      console.log(`共${$.allFriends.length}个好友`);
      $.helpFood = 0;
      $.stealFriendCoin = 0;
      $.stealFood = 0;
      await Promise.all([
        stealFriendCoinFun(),//偷积分
        stealFriendsFood(),//偷好友狗粮
        helpFriendsFeed()//给好友喂食
      ])
    }
  } else {
    message += `${$.getFriendsData && $.getFriendsData.errorMessage}\n`;
  }
}

async function stealFriendsFood() {
  let jdJoyStealCoinTemp;
  if ($.isNode() && process.env.jdJoyStealCoin) {
    jdJoyStealCoinTemp = `${process.env.jdJoyStealCoin}` === 'true';
  } else if ($.getdata('jdJoyStealCoin')) {
    jdJoyStealCoinTemp = $.getdata('jdJoyStealCoin') === 'true';
  } else {
    jdJoyStealCoinTemp = `${jdJoyStealCoin}` === 'true';
  }
  if (jdJoyStealCoinTemp) {
    console.log(`开始偷好友狗粮`);
    for (let friends of $.allFriends) {
      const {friendPin, status, stealStatus} = friends;
      console.log(`stealFriendsFood---好友【${friendPin}】--偷食状态：${stealStatus}\n`);
      // console.log(`stealFriendsFood---好友【${friendPin}】--喂食状态：${status}\n`);
      if (stealStatus === 'can_steal') {
        //可偷狗粮
        //偷好友狗粮
        console.log(`发现好友【${friendPin}】可偷狗粮\n`)
        await enterFriendRoom(friendPin);
        await doubleRandomFood(friendPin);
        const getRandomFoodRes = await getRandomFood(friendPin);
        console.log(`偷好友狗粮结果：${JSON.stringify(getRandomFoodRes)}`)
        if (getRandomFoodRes && getRandomFoodRes.success) {
          if (getRandomFoodRes.errorCode === 'steal_ok') {
            $.stealFood += getRandomFoodRes.data;
          }
        }
      } else if (stealStatus === 'chance_full') {
        console.log('偷好友狗粮已达上限，跳出循环');
        break;
      }
    }
  }
}

//偷好友积分
async function stealFriendCoinFun() {
  let jdJoyStealCoinTemp;
  if ($.isNode() && process.env.jdJoyStealCoin) {
    jdJoyStealCoinTemp = `${process.env.jdJoyStealCoin}` === 'true';
  } else if ($.getdata('jdJoyStealCoin')) {
    jdJoyStealCoinTemp = $.getdata('jdJoyStealCoin') === 'true';
  } else {
    jdJoyStealCoinTemp = `${jdJoyStealCoin}` === 'true';
  }
  if (jdJoyStealCoinTemp) {
    if ($.visit_friend !== 100) {
      console.log('开始偷好友积分')
      for (let friends of $.allFriends) {
        const {friendPin} = friends;
        await stealFriendCoin(friendPin);//领好友积分
        if ($.stealFriendCoin * 1 === 100) {
          console.log(`偷好友积分已达上限${$.stealFriendCoin}个，现跳出循环`)
          break
        }
      }
    } else {
      console.log('偷好友积分已达上限(已获得100积分)')
      $.stealFriendCoin = `已达上限(已获得100积分)`
    }
  }
}

//给好友喂食
async function helpFriendsFeed() {
  if ($.help_feed !== 200) {
    //可给好友喂食
    let ctrTemp;
    if ($.isNode() && process.env.JOY_HELP_FEED) {
      ctrTemp = `${process.env.JOY_HELP_FEED}` === 'true';
    } else if ($.getdata('jdJoyHelpFeed')) {
      ctrTemp = $.getdata('jdJoyHelpFeed') === 'true';
    } else {
      ctrTemp = `${jdJoyHelpFeed}` === 'true';
    }
    if (ctrTemp) {
      console.log(`\n开始给好友喂食`);
      for (let friends of $.allFriends) {
        const {friendPin, status, stealStatus} = friends;
        // console.log(`\nhelpFriendsFeed---好友【${friendPin}】--偷食状态：${stealStatus}`);
        console.log(`\nhelpFriendsFeed---好友【${friendPin}】--喂食状态：${status}`);
        if (status === 'not_feed') {
          const helpFeedRes = await helpFeed(friendPin);
          // console.log(`帮忙喂食结果--${JSON.stringify(helpFeedRes)}`)
          if (helpFeedRes && helpFeedRes.errorCode === 'help_ok' && helpFeedRes.success) {
            console.log(`帮好友[${friendPin}]喂食10g狗粮成功,你获得10积分\n`);
            $.helpFood += 10;
          } else if (helpFeedRes && helpFeedRes.errorCode === 'chance_full') {
            console.log('喂食已达上限,不再喂食\n')
            break
          } else if (helpFeedRes && helpFeedRes.errorCode === 'food_insufficient') {
            console.log('帮好友喂食失败，您的狗粮不足10g\n')
            break
          } else {
            console.log(JSON.stringify(helpFeedRes))
          }
        } else if (status === 'time_error') {
          console.log(`帮好友喂食失败,好友[${friendPin}]的汪汪正在食用\n`)
        }
      }
    } else {
      console.log('您已设置不为好友喂食，现在跳过喂食，如需为好友喂食请在BoxJs打开喂食开关或者更改脚本 jdJoyHelpFeed 处')
    }
  } else {
    console.log('帮好友喂食已达上限(已帮喂20个好友获得200积分)')
    $.helpFood = '已达上限(已帮喂20个好友获得200积分)'
  }
}

function getFriends(currentPage = '1') {
  return new Promise(resolve => {
    const options = {
      url: `${JD_API_HOST}/getFriends?itemsPerPage=20&currentPage=${currentPage}`,
      headers: {
        'Cookie': cookie,
        'reqSource': 'h5',
        'Host': 'jdjoy.jd.com',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json',
        'Referer': 'https://jdjoy.jd.com/pet/index',
        'User-Agent': 'jdapp;iPhone;8.5.8;13.4.1;9b812b59e055cd226fd60ebb5fd0981c4d0d235d;network/wifi;supportApplePay/3;hasUPPay/0;pushNoticeIsOpen/0;model/iPhone9,2;addressid/138109592;hasOCPay/0;appBuild/167169;supportBestPay/0;jdSupportDarkMode/0;pv/200.75;apprpd/MyJD_Main;ref/MyJdMTAManager;psq/29;ads/;psn/9b812b59e055cd226fd60ebb5fd0981c4d0d235d|608;jdv/0|direct|-|none|-|1587263154256|1587263330;adk/;app_device/IOS;pap/JA2015_311210|8.5.8|IOS 13.4.1;Mozilla/5.0 (iPhone; CPU iPhone OS 13_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
        'Accept-Language': 'zh-cn',
        'Accept-Encoding': 'gzip, deflate, br',
      }
    }
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          console.log('\n京东宠汪汪: API查询请求失败 ‼️‼️')
          throw new Error(err);
        } else {
          // console.log('JSON.parse(data)', JSON.parse(data))
          if (data) {
            $.getFriendsData = JSON.parse(data);
          } else {
            console.log(`京豆api返回数据为空，请检查自身原因`)
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

async function stealFriendCoin(friendPin) {
  // console.log(`进入好友 ${friendPin}的房间`)
  const enterFriendRoomRes = await enterFriendRoom(friendPin);
  if (enterFriendRoomRes) {
    const {friendHomeCoin} = enterFriendRoomRes.data;
    if (friendHomeCoin > 0) {
      //领取好友积分
      console.log(`好友 ${friendPin}的房间可领取积分${friendHomeCoin}个\n`)
      const getFriendCoinRes = await getFriendCoin(friendPin);
      console.log(`偷好友积分结果：${JSON.stringify(getFriendCoinRes)}\n`)
      if (getFriendCoinRes && getFriendCoinRes.errorCode === 'coin_took_ok') {
        $.stealFriendCoin += getFriendCoinRes.data;
      }
    } else {
      console.log(`好友 ${friendPin}的房间暂无可领取积分\n`)
    }
  }
}

//进入好友房间
function enterFriendRoom(friendPin) {
  console.log(`\nfriendPin:: ${friendPin}\n`);
  return new Promise(async resolve => {
    $.get(taskUrl('enterFriendRoom', (friendPin)), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n京东宠汪汪: API查询请求失败 ‼️‼️')
          console.log(`\n${JSON.stringify(err)}`)
          console.log(`\n${err}\n`)
          throw new Error(err);
        } else {
          // console.log('进入好友房间', JSON.parse(data))
          if (data) {
            data = JSON.parse(data);
            console.log(`可偷狗粮：${data.data.stealFood}`)
            console.log(`可偷积分：${data.data.friendHomeCoin}`)
          } else {
            console.log(`京豆api返回数据为空，请检查自身原因`)
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

//收集好友金币
function getFriendCoin(friendPin) {
  return new Promise(resolve => {
    $.get(taskUrl('getFriendCoin', friendPin), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n京东宠汪汪: API查询请求失败 ‼️‼️')
          throw new Error(err);
        } else {
          if (data) {
            data = JSON.parse(data);
          } else {
            console.log(`京豆api返回数据为空，请检查自身原因`)
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

//帮好友喂食
function helpFeed(friendPin) {
  return new Promise(resolve => {
    $.get(taskUrl('helpFeed', friendPin), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n京东宠汪汪: API查询请求失败 ‼️‼️')
          throw new Error(err);
        } else {
          if (data) {
            data = JSON.parse(data);
          } else {
            console.log(`京豆api返回数据为空，请检查自身原因`)
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

//收集好友狗粮,已实现分享可得双倍狗粮功能
//①分享
function doubleRandomFood(friendPin) {
  return new Promise(resolve => {
    $.get(taskUrl('doubleRandomFood', friendPin), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n京东宠汪汪: API查询请求失败 ‼️‼️')
          throw new Error(err);
        } else {
          // console.log('分享', JSON.parse(data))
          // $.appGetPetTaskConfigRes = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    })
  })
}

//②领取双倍狗粮
function getRandomFood(friendPin) {
  return new Promise(resolve => {
    $.get(taskUrl('getRandomFood', friendPin), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n京东宠汪汪: API查询请求失败 ‼️‼️')
          throw new Error(err);
        } else {
          if (data) {
            console.log(`领取双倍狗粮结果--${data}`)
            data = JSON.parse(data);
          } else {
            console.log(`京豆api返回数据为空，请检查自身原因`)
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

function getCoinChanges() {
  return new Promise(resolve => {
    const options = {
      url: `${JD_API_HOST}/getCoinChanges?changeDate=${Date.now()}`,
      headers: {
        'Cookie': cookie,
        'reqSource': 'h5',
        'Host': 'jdjoy.jd.com',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json',
        'Referer': 'https://jdjoy.jd.com/pet/index',
        'User-Agent': 'jdapp;iPhone;8.5.8;13.4.1;9b812b59e055cd226fd60ebb5fd0981c4d0d235d;network/wifi;supportApplePay/3;hasUPPay/0;pushNoticeIsOpen/0;model/iPhone9,2;addressid/138109592;hasOCPay/0;appBuild/167169;supportBestPay/0;jdSupportDarkMode/0;pv/200.75;apprpd/MyJD_Main;ref/MyJdMTAManager;psq/29;ads/;psn/9b812b59e055cd226fd60ebb5fd0981c4d0d235d|608;jdv/0|direct|-|none|-|1587263154256|1587263330;adk/;app_device/IOS;pap/JA2015_311210|8.5.8|IOS 13.4.1;Mozilla/5.0 (iPhone; CPU iPhone OS 13_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
        'Accept-Language': 'zh-cn',
        'Accept-Encoding': 'gzip, deflate, br',
      }
    }
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          console.log('\n京东宠汪汪: API查询请求失败 ‼️‼️')
          throw new Error(err);
        } else {
          // console.log('getCoinChanges', JSON.parse(data))
          if (data) {
            data = JSON.parse(data);
            if (data.datas && data.datas.length > 0) {
              $.help_feed = 0;
              $.visit_friend = 0;
              for (let item of data.datas) {
                if ($.time('yyyy-MM-dd') === timeFormat(item.createdDate) && item.changeEvent === 'help_feed') {
                  $.help_feed = item.changeCoin;
                }
                if ($.time('yyyy-MM-dd') === timeFormat(item.createdDate) && item.changeEvent === 'visit_friend') {
                  $.visit_friend = item.changeCoin;
                }
              }
              console.log(`$.help_feed给好友喂食获得积分：${$.help_feed}`);
              console.log(`$.visit_friend领取好友积分：${$.visit_friend}`);
            }
          } else {
            console.log(`京豆api返回数据为空，请检查自身原因`)
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

function showMsg() {
  $.stealFood = $.stealFood >= 0 ? `【偷好友狗粮】获取${$.stealFood}g狗粮\n` : `【偷好友狗粮】${$.stealFood}\n`;
  $.stealFriendCoin = $.stealFriendCoin >= 0 ? `【领取好友积分】获得${$.stealFriendCoin}个\n` : `【领取好友积分】${$.stealFriendCoin}\n`;
  $.helpFood = $.helpFood >= 0 ? `【给好友喂食】消耗${$.helpFood}g狗粮,获得积分${$.helpFood}个\n` : `【给好友喂食】${$.helpFood}\n`;
  message += $.stealFriendCoin;
  message += $.stealFood;
  message += $.helpFood;
  let ctrTemp;
  if ($.getdata('jdJoyStealNotify')) {
    ctrTemp = `${$.getdata('jdJoyStealNotify')}` === 'false';
  } else {
    ctrTemp = `${jdNotify}` === 'false';
  }
  if (ctrTemp) {
    $.msg($.name, '', message);
  } else {
    $.log(`\n${message}\n`);
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

function taskUrl(functionId, friendPin) {
  return {
    url: `${JD_API_HOST}/${functionId}?friendPin=${encodeURI(friendPin)}`,
    headers: {
      'Cookie': cookie,
      'reqSource': 'h5',
      'Host': 'jdjoy.jd.com',
      'Connection': 'keep-alive',
      'Content-Type': 'application/json',
      'Referer': 'https://jdjoy.jd.com/pet/index',
      'User-Agent': 'jdapp;iPhone;8.5.8;13.4.1;9b812b59e055cd226fd60ebb5fd0981c4d0d235d;network/wifi;supportApplePay/3;hasUPPay/0;pushNoticeIsOpen/0;model/iPhone9,2;addressid/138109592;hasOCPay/0;appBuild/167169;supportBestPay/0;jdSupportDarkMode/0;pv/200.75;apprpd/MyJD_Main;ref/MyJdMTAManager;psq/29;ads/;psn/9b812b59e055cd226fd60ebb5fd0981c4d0d235d|608;jdv/0|direct|-|none|-|1587263154256|1587263330;adk/;app_device/IOS;pap/JA2015_311210|8.5.8|IOS 13.4.1;Mozilla/5.0 (iPhone; CPU iPhone OS 13_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      'Accept-Language': 'zh-cn',
      'Accept-Encoding': 'gzip, deflate, br',
    }
  }
}

function timeFormat(time) {
  let date;
  if (time) {
    date = new Date(time)
  } else {
    date = new Date();
  }
  return date.getFullYear() + '-' + ((date.getMonth() + 1) >= 10 ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1)) + '-' + (date.getDate() >= 10 ? date.getDate() : '0' + date.getDate());
}
