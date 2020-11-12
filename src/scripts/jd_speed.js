/*
京东天天加速链接：https://raw.githubusercontent.com/lxk0301/scripts/master/jd_speed.js
更新时间：2020-11-03
支持京东双账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
每天4京豆，再小的苍蝇也是肉
从 https://github.com/Zero-S1/JD_tools/blob/master/JD_speed.py 改写来的
建议3小时运行一次，打卡时间间隔是6小时
注：如果使用Node.js, 需自行安装'crypto-js,got,http-server,tough-cookie'模块. 例: npm install crypto-js http-server tough-cookie got --save
*/
// quantumultx
// [task_local]
// #天天加速
// 8 */3 * * * https://raw.githubusercontent.com/lxk0301/scripts/master/jd_speed.js, tag=京东天天加速, img-url=https://raw.githubusercontent.com/58xinian/icon/master/jdjs.png, enabled=true
// Loon
// [Script]
// cron "8 */3 * * *" script-path=https://raw.githubusercontent.com/lxk0301/scripts/master/jd_speed.js,tag=京东天天加速
// Surge
//天天加速 = type=cron,cronexp="8 */3 * * *",wake-system=1,timeout=20,script-path=https://raw.githubusercontent.com/lxk0301/scripts/master/jd_speed.js
const {Env} = require('../utils/Env')
const $ = new Env('✈️天天加速');
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
let jdNotify = true;//是否开启静默运行。默认true开启
let message = '', subTitle = '';
const JD_API_HOST = 'https://api.m.jd.com/'

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
      await jDSpeedUp();
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

function showMsg() {
  jdNotify = $.getdata('jdSpeedNotify') ? $.getdata('jdSpeedNotify') : jdNotify;
  if (!jdNotify || jdNotify === 'false') {
    $.msg($.name, subTitle, `【京东账号${$.index}】${$.nickName}\n` + message);
  } else {
    $.log(`\n${message}\n`);
  }
}

function jDSpeedUp(sourceId, doubleKey) {
  return new Promise((resolve) => {
    let body = {"source": "game"};
    if (sourceId) {
      body.source_id = sourceId
    }
    const url = {
      // url: JD_API_HOST + '?appid=memberTaskCenter&functionId=flyTask_' + (sourceId ? 'start&body=%7B%22source%22%3A%22game%22%2C%22source_id%22%3A' + sourceId + '%7D' : 'state&body=%7B%22source%22%3A%22game%22%7D'),
      url: `${JD_API_HOST}?appid=memberTaskCenter&functionId=flyTask_${sourceId ? 'start' : 'state'}&body=${escape(JSON.stringify(body))}`,
      headers: {
        'Cookie': cookie,
        'Host': 'api.m.jd.com',
        'Accept': '*/*',
        'Connection': 'keep-alive',
        'User-Agent': 'jdapp;iPhone;8.5.5;13.4;9b812b59e055cd226fd60ebb5fd0981c4d0d235d;network/wifi;supportApplePay/3;hasUPPay/0;pushNoticeIsOpen/0;model/iPhone9,2;addressid/138109592;hasOCPay/0;appBuild/167121;supportBestPay/0;jdSupportDarkMode/0;pv/104.43;apprpd/MyJD_GameMain;ref/MyJdGameEnterPageController;psq/9;ads/;psn/9b812b59e055cd226fd60ebb5fd0981c4d0d235d|272;jdv/0|direct|-|none|-|1583449735697|1583796810;adk/;app_device/IOS;pap/JA2015_311210|8.5.5|IOS 13.4;Mozilla/5.0 (iPhone; CPU iPhone OS 13_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
        'Accept-Language': 'zh-cn',
        'Referer': 'https://h5.m.jd.com/babelDiy/Zeus/6yCQo2eDJPbyPXrC3eMCtMWZ9ey/index.html?lng=116.845095&lat=39.957701&sid=ea687233c5e7d226b30940ed7382c5cw&un_area=5_274_49707_49973',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    };
    $.get(url, async (err, resp, data) => {
      try {
        if (err) {
          console.log('京东天天-加速: 签到接口请求失败 ‼️‼️');
        } else {
          if (data) {
            let res = JSON.parse(data);
            if (!sourceId) {
              console.log(`\n天天加速任务进行中`);
            } else {
              console.log("\n" + "天天加速-开始本次任务 ");
            }
            if (res.info.isLogin === 1) {
              subTitle = `【奖励】${res.data.beans_num}京豆`;
              if (res.data.task_status === 0) {
                const taskID = res.data.source_id;
                await jDSpeedUp(taskID);
              } else if (res.data.task_status === 1) {
                const EndTime = res.data.end_time ? res.data.end_time : ""
                console.log("\n天天加速进行中-结束时间: \n" + EndTime);
                const space = await spaceEventList()
                const HandleEvent = await spaceEventHandleEvent(space)
                const step1 = await energyPropList();//检查燃料
                const step2 = await receiveEnergyProp(step1);//领取可用的燃料
                const step3 = await energyPropUsaleList(step2)
                const step4 = await useEnergy(step3)
                if (step4) {
                  await jDSpeedUp(null);
                } else {
                  message += `【空间站】 ${res.data.destination}\n`;
                  message += `【结束时间】 ${res.data.end_time}\n`;
                  message += `【进度】 ${((res.data['done_distance'] / res.data.distance) * 100).toFixed(2)}%\n`;
                }
              } else if (res.data.task_status === 2) {
                if (data.match(/\"beans_num\":\d+/)) {
                  //message += "【上轮奖励】成功领取" + data.match(/\"beans_num\":(\d+)/)[1] + "京豆 🐶";
                  if (!jdNotify || jdNotify === 'false') {
                    $.msg($.name, '', `【京东账号${$.index}】${$.nickName}\n` + "【上轮太空旅行】成功领取" + data.match(/\"beans_num\":(\d+)/)[1] + "京豆 🐶");
                  }
                } else {
                  console.log("京东天天-加速: 成功, 明细: 无京豆 🐶")
                }
                console.log("\n天天加速-领取上次奖励成功")
                await jDSpeedUp(null);
              } else {
                console.log("\n" + "天天加速-判断状态码失败")
              }
            } else {
              console.log("\n" + "天天加速-判断状态失败")
            }
          } else {
            console.log(`京豆api返回数据为空，请检查自身原因`)
          }
        }
      } catch (e) {
        $.msg("京东天天-加速" + e.name + "‼️", JSON.stringify(e), e.message)
      } finally {
        resolve()
      }
    })
  })
}

// 检查太空特殊事件
function spaceEventList() {
  return new Promise((resolve) => {
    let spaceEvents = [];
    const body = {"source": "game"};
    const spaceEventUrl = {
      url: `${JD_API_HOST}?appid=memberTaskCenter&functionId=spaceEvent_list&body=${escape(JSON.stringify(body))}`,
      headers: {
        Referer: 'https://h5.m.jd.com/babelDiy/Zeus/6yCQo2eDJPbyPXrC3eMCtMWZ9ey/index.html',
        Cookie: cookie
      }
    }
    $.get(spaceEventUrl, async (err, resp, data) => {
      try {
        if (err) {
          console.log("\n京东天天-加速: 查询太空特殊事件请求失败 ‼️‼️")
        } else {
          if (data) {
            const cc = JSON.parse(data);
            if (cc.message === "success" && cc.data.length > 0) {
              for (let item of cc.data) {
                if (item.status === 1) {
                  for (let j of item.options) {
                    if (j.type === 1) {
                      spaceEvents.push({
                        "id": item.id,
                        "value": j.value
                      })
                    }
                  }
                }
              }
              if (spaceEvents && spaceEvents.length > 0) {
                console.log("\n天天加速-查询到" + spaceEvents.length + "个太空特殊事件")
              } else {
                console.log("\n天天加速-暂无太空特殊事件")
              }
            } else {
              console.log("\n天天加速-查询无太空特殊事件")
            }
          } else {
            console.log(`京豆api返回数据为空，请检查自身原因`)
          }
        }
      } catch (e) {
        $.msg("天天加速-查询太空特殊事件" + e.name + "‼️", JSON.stringify(e), e.message)
      } finally {
        resolve(spaceEvents)
      }
    })
  })
}

//处理太空特殊事件
function spaceEventHandleEvent(spaceEventList) {
  return new Promise((resolve) => {
    if (spaceEventList && spaceEventList.length > 0) {
      let spaceEventCount = 0, spaceNumTask = 0;
      for (let item of spaceEventList) {
        let body = {
          "source": "game",
          "eventId": item.id,
          "option": item.value
        }
        const spaceHandleUrl = {
          url: `${JD_API_HOST}?appid=memberTaskCenter&functionId=spaceEvent_handleEvent&body=${escape(JSON.stringify(body))}`,
          headers: {
            Referer: 'https://h5.m.jd.com/babelDiy/Zeus/6yCQo2eDJPbyPXrC3eMCtMWZ9ey/index.html',
            Cookie: cookie
          }
        }
        spaceEventCount += 1
        $.get(spaceHandleUrl, (err, resp, data) => {
          try {
            if (err) {
              console.log("\n京东天天-加速: 处理太空特殊事件请求失败 ‼️‼️")
            } else {
              if (data) {
                const cc = JSON.parse(data);
                // console.log(`处理特殊事件的结果：：${JSON.stringify(cc)}`);
                console.log("\n天天加速-尝试处理第" + spaceEventCount + "个太空特殊事件")
                if (cc.message === "success" && cc.success) {
                  spaceNumTask += 1;
                } else {
                  console.log("\n天天加速-处理太空特殊事件失败")
                }
              } else {
                console.log(`京豆api返回数据为空，请检查自身原因`)
              }
            }
          } catch (e) {
            $.msg("天天加速-查询处理太空特殊事件" + e.name + "‼️", JSON.stringify(e), e.message)
          } finally {
            if (spaceEventList.length === spaceNumTask) {
              console.log("\n天天加速-已成功处理" + spaceNumTask + "个太空特殊事件")
              resolve()
            }
          }
        })
      }
    } else {
      resolve()
    }
  })
}

//检查燃料
function energyPropList() {
  return new Promise((resolve) => {
    let TaskID = "";
    const body = {"source": "game"};
    const QueryUrl = {
      // url: JD_API_HOST + '?appid=memberTaskCenter&functionId=energyProp_list&body=%7B%22source%22%3A%22game%22%7D',
      url: `${JD_API_HOST}?appid=memberTaskCenter&functionId=energyProp_list&body=${escape(JSON.stringify(body))}`,
      headers: {
        Referer: 'https://h5.m.jd.com/babelDiy/Zeus/6yCQo2eDJPbyPXrC3eMCtMWZ9ey/index.html',
        Cookie: cookie
      }
    };
    $.get(QueryUrl, async (err, resp, data) => {
      try {
        if (err) {
          console.log("\n京东天天-加速: 查询道具请求失败 ‼️‼️")
        } else {
          if (data) {
            const cc = JSON.parse(data)
            if (cc.message === "success" && cc.data.length > 0) {
              for (let i = 0; i < cc.data.length; i++) {
                if (cc.data[i].thaw_time === 0) {
                  TaskID += cc.data[i].id + ",";
                }
              }
              if (TaskID.length > 0) {
                TaskID = TaskID.substr(0, TaskID.length - 1).split(",")
                console.log("\n天天加速-查询到" + TaskID.length + "个可用燃料")
              } else {
                console.log("\n天天加速-检查燃料-暂无可用燃料")
              }
            } else {
              console.log("\n天天加速-查询无燃料")
            }
          } else {
            console.log(`京豆api返回数据为空，请检查自身原因`)
          }
        }
      } catch (eor) {
        $.msg("天天加速-查询燃料" + eor.name + "‼️", JSON.stringify(eor), eor.message)
      } finally {
        resolve(TaskID)
      }
    })
  })
}

//领取可用的燃料
function receiveEnergyProp(CID) {
  return new Promise((resolve) => {
    let NumTask = 0;
    if (CID) {
      let count = 0
      for (let i = 0; i < CID.length; i++) {
        let body = {
          "source": "game",
          "energy_id": CID[i]
        }
        const TUrl = {
          // url: JD_API_HOST + '?appid=memberTaskCenter&functionId=energyProp_gain&body=%7B%22source%22%3A%22game%22%2C%22energy_id%22%3A' + CID[i] + '%7D',
          url: `${JD_API_HOST}?appid=memberTaskCenter&functionId=energyProp_gain&body=${escape(JSON.stringify(body))}`,
          headers: {
            Referer: 'https://h5.m.jd.com/babelDiy/Zeus/6yCQo2eDJPbyPXrC3eMCtMWZ9ey/index.html',
            Cookie: cookie
          }
        };
        count += 1
        $.get(TUrl, (error, response, data) => {
          try {
            if (error) {
              console.log("\n天天加速-领取道具请求失败 ‼️‼️")
            } else {
              if (data) {
                const cc = JSON.parse(data)
                console.log("\n天天加速-尝试领取第" + count + "个可用燃料")
                if (cc.message === 'success') {
                  NumTask += 1
                }
              } else {
                console.log(`京豆api返回数据为空，请检查自身原因`)
              }
            }
          } catch (eor) {
            $.msg("天天加速-领取可用燃料" + eor.name + "‼️", JSON.stringify(eor), eor.message)
          } finally {
            if (CID.length === count) {
              console.log("\n天天加速-已成功领取" + NumTask + "个可用燃料")
              resolve(NumTask)
            }
          }
        })
      }
    } else {
      resolve(NumTask)
    }
  })
}

//检查剩余燃料
function energyPropUsaleList(EID) {
  return new Promise((resolve) => {
    let TaskCID = '';
    const body = {"source": "game"};
    const EUrl = {
      // url: JD_API_HOST + '?appid=memberTaskCenter&functionId=energyProp_usalbeList&body=%7B%22source%22%3A%22game%22%7D',
      url: `${JD_API_HOST}?appid=memberTaskCenter&functionId=energyProp_usalbeList&body=${escape(JSON.stringify(body))}`,
      headers: {
        Referer: 'https://h5.m.jd.com/babelDiy/Zeus/6yCQo2eDJPbyPXrC3eMCtMWZ9ey/index.html',
        Cookie: cookie
      }
    };
    $.get(EUrl, (error, response, data) => {
      try {
        if (error) {
          console.log("\n天天加速-查询道具ID请求失败 ‼️‼️")
        } else {
          if (data) {
            const cc = JSON.parse(data);
            if (cc.data.length > 0) {
              for (let i = 0; i < cc.data.length; i++) {
                if (cc.data[i].id) {
                  TaskCID += cc.data[i].id + ",";
                }
              }
              if (TaskCID.length > 0) {
                TaskCID = TaskCID.substr(0, TaskCID.length - 1).split(",")
                console.log("\n天天加速-查询成功" + TaskCID.length + "个燃料ID")
              } else {
                console.log("\n天天加速-暂无有效燃料ID")
              }
            } else {
              console.log("\n天天加速-查询无燃料ID")
            }
          } else {
            console.log(`京豆api返回数据为空，请检查自身原因`)
          }
        }
      } catch (eor) {
        $.msg("天天加速-燃料ID" + eor.name + "‼️", JSON.stringify(eor), eor.message)
      } finally {
        resolve(TaskCID)
      }
    })
    // if (EID) {
    //
    // } else {
    //   resolve(TaskCID)
    // }
  })
}

//使用能源
function useEnergy(PropID) {
  return new Promise((resolve) => {
    let PropNumTask = 0;
    let PropCount = 0
    if (PropID) {
      for (let i = 0; i < PropID.length; i++) {
        let body = {
          "source": "game",
          "energy_id": PropID[i]
        }
        const PropUrl = {
          // url: JD_API_HOST + '?appid=memberTaskCenter&functionId=energyProp_use&body=%7B%22source%22%3A%22game%22%2C%22energy_id%22%3A%22' + PropID[i] + '%22%7D',
          url: `${JD_API_HOST}?appid=memberTaskCenter&functionId=energyProp_use&body=${escape(JSON.stringify(body))}`,
          headers: {
            Referer: 'https://h5.m.jd.com/babelDiy/Zeus/6yCQo2eDJPbyPXrC3eMCtMWZ9ey/index.html',
            Cookie: cookie
          }
        };
        PropCount += 1;
        $.get(PropUrl, (error, response, data) => {
          try {
            if (error) {
              console.log("\n天天加速-使用燃料请求失败 ‼️‼️")
            } else {
              if (data) {
                const cc = JSON.parse(data);
                console.log("\n天天加速-尝试使用第" + PropCount + "个燃料")
                if (cc.message === 'success' && cc.success === true) {
                  PropNumTask += 1
                }
              } else {
                console.log(`京豆api返回数据为空，请检查自身原因`)
              }
            }
          } catch (eor) {
            $.msg("天天加速-使用燃料" + eor.name + "‼️", JSON.stringify(eor), eor.message)
          } finally {
            if (PropID.length === PropCount) {
              console.log("\n天天加速-已成功使用" + PropNumTask + "个燃料")
              resolve(PropNumTask)
            }
          }
        })
      }
    } else {
      resolve(PropNumTask)
    }
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
