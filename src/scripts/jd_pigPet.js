/*
京东金融养猪猪
一键开完所有的宝箱功能。耗时70秒
抽奖
喂食
12 * * * *
 */
const {Env} = require('../utils/Env')
const $ = new Env('金融养猪');
let cookiesArr = [], cookie = '';
const JD_API_HOST = 'https://ms.jr.jd.com/gw/generic/uc/h5/m';
const notify = $.isNode() ? require('../utils/sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('../utils/jdCookie') : '';
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {
  };
} else {
  cookiesArr.push(...[$.getdata('CookieJD'), $.getdata('CookieJD2')])
}
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
      message = '';
      subTitle = '';
      goodsUrl = '';
      taskInfoKey = [];
      option = {};
      await jdPigPet();
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
  })
  .finally(() => {
    $.done();
  })

async function jdPigPet() {
  await pigPetOpenBox();
  await pigPetLotteryIndex();
  await pigPetLottery();
  await pigPetUserBag();
}

async function pigPetLottery() {
  if ($.currentCount > 0) {
    for (let i = 0; i < $.currentCount; i++) {
      await pigPetLotteryPlay();
    }
  }
}

//查询背包食物
function pigPetUserBag() {
  return new Promise(async resolve => {
    const body = {
      "source": 0,
      "channelLV": "yqs",
      "riskDeviceParam": "{}",
      "t": Date.now(),
      "skuId": "1001003004",
      "category": "1001"
    };
    $.post(taskUrl('pigPetUserBag', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data.resultCode === 0) {
              if (data.resultData.resultCode === 0) {
                if (data.resultData.resultData && data.resultData.resultData.goods) {
                  console.log(`\n食物名称     数量`);
                  for (let item of data.resultData.resultData.goods) {
                    console.log(`${item.goodsName}      ${item.count}g`);
                  }
                  for (let item of data.resultData.resultData.goods) {
                    if (item.count > 20) {
                      console.log(`10秒后开始喂食${item.goodsName}，当前数量为${item.count}g`)
                      await $.wait(10000);
                      await pigPetAddFood(item.sku);
                    }
                  }
                } else {
                  console.log(`暂无食物`)
                }
              } else {
                console.log(`开宝箱其他情况：${JSON.stringify(data)}`)
              }
            }
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

//喂食
function pigPetAddFood(skuId) {
  return new Promise(async resolve => {
    console.log(`skuId::::${skuId}`)
    const body = {
      "source": 0,
      "channelLV": "yqs",
      "riskDeviceParam": "{}",
      "t": 1605073588888,
      skuId,
      "category": "1001"
    }
    $.post(taskUrl('pigPetAddFood', body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (data) {
            // console.log(data)
            JSON.parse(data);
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

//开宝箱
function pigPetOpenBox() {
  return new Promise(async resolve => {
    const body = {
      "source": 0,
      "channelLV": "yqs",
      "riskDeviceParam": "{}",
      "no": 5,
      "category": "1001",
      "t": Date.now()
    }
    $.post(taskUrl('pigPetOpenBox', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (data) {
            // console.log(data)
            data = JSON.parse(data);
            if (data.resultCode === 0) {
              if (data.resultData.resultCode === 0) {
                if (data.resultData.resultData && data.resultData.resultData.award) {
                  console.log(`开宝箱获得${data.resultData.resultData.award.content}，数量：${data.resultData.resultData.award.count}`);

                } else {
                  console.log(`开宝箱暂无奖励`)
                }
                await $.wait(2000);
                await pigPetOpenBox();
              } else if (data.resultData.resultCode === 420) {
                console.log(`开宝箱失败:${data.resultData.resultMsg}`)
              } else {
                console.log(`开宝箱其他情况：${JSON.stringify(data)}`)
              }
            }
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

//查询大转盘的次数
function pigPetLotteryIndex() {
  $.currentCount = 0;
  return new Promise(async resolve => {
    const body = {
      "source": 0,
      "channelLV": "juheye",
      "riskDeviceParam": "{}"
    }
    $.post(taskUrl('pigPetLotteryIndex', body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (data) {
            console.log(data)
            data = JSON.parse(data);
            if (data.resultCode === 0) {
              if (data.resultData.resultCode === 0) {
                if (data.resultData.resultData) {
                  console.log(`当前大转盘剩余免费抽奖次数：：${data.resultData.resultData.currentCount}`);
                  $.currentCount = data.resultData.resultData.currentCount;
                }
              } else {
                console.log(`查询大转盘的次数：${JSON.stringify(data)}`)
              }
            }
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

//抽奖
function pigPetLotteryPlay() {
  return new Promise(async resolve => {
    const body = {
      "source": 0,
      "channelLV": "juheye",
      "riskDeviceParam": "{}",
      "t": Date.now(),
      "type": 0,
    }
    $.post(taskUrl('pigPetLotteryPlay', body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (data) {
            console.log(data)
            data = JSON.parse(data);
            if (data.resultCode === 0) {
              if (data.resultData.resultCode === 0) {
                if (data.resultData.resultData) {
                  // console.log(`当前大转盘剩余免费抽奖次数：：${data.resultData.resultData.currentCount}`);
                  $.currentCount = data.resultData.resultData.currentCount;
                }
              } else {
                console.log(`其他情况：${JSON.stringify(data)}`)
              }
            }
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
    url: `${JD_API_HOST}/${function_id}?_=${Date.now()}`,
    body: `reqData=${encodeURIComponent(JSON.stringify(body))}`,
    headers: {
      'Accept': `application/json`,
      'Origin': `https://uua.jr.jd.com`,
      'Accept-Encoding': `gzip, deflate, br`,
      'Cookie': cookie,
      'Content-Type': `application/x-www-form-urlencoded;charset=UTF-8`,
      'Host': `ms.jr.jd.com`,
      'Connection': `keep-alive`,
      'User-Agent': `jdapp;iPhone;9.0.0;13.4.1;e35caf0a69be42084e3c97eef56c3af7b0262d01;network/4g;ADID/F75E8AED-CB48-4EAC-A213-E8CE4018F214;supportApplePay/3;hasUPPay/0;pushNoticeIsOpen/1;model/iPhone11,8;addressid/2005183373;hasOCPay/0;appBuild/167237;supportBestPay/0;jdSupportDarkMode/0;pv/1287.19;apprpd/MyJD_GameMain;ref/https%3A%2F%2Fuua.jr.jd.com%2Fuc-fe-wxgrowing%2Fmoneytree%2Findex%2F%3Fchannel%3Dyxhd%26lng%3D113.325843%26lat%3D23.204628%26sid%3D2d98e88cf7d182f60d533476c2ce777w%26un_area%3D19_1601_50258_51885;psq/1;ads/;psn/e35caf0a69be42084e3c97eef56c3af7b0262d01|3485;jdv/0|kong|t_1000170135|tuiguang|notset|1593059927172|1593059927;adk/;app_device/IOS;pap/JA2015_311210|9.0.0|IOS 13.4.1;Mozilla/5.0 (iPhone; CPU iPhone OS 13_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1`,
      'Referer': `https://uua.jr.jd.com`,
      'Accept-Language': `zh-cn`
    }
  }
}
