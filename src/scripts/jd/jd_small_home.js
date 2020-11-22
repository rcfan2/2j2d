/*
 * @Author: lxk0301 https://github.com/lxk0301
 * @Date: 2020-11-12 11:42:12
 * @Last Modified by:   lxk0301
 * @Last Modified time: 2020-11-22 15:42:12
 */
/*
东东小窝 https://raw.githubusercontent.com/lxk0301/jd_scripts/master/jd_small_home.js
现有功能：
做日常任务任务，每日抽奖（有机会活动京豆，使用的是免费机会，不消耗WO币）
助力好友：一个账号一天只能助力一次(即：每个人助力机会只有一次)
后期有空优化相互助力功能
TODO；装扮领京豆（使用WO币购买装饰品可以获得京豆，分别可获得5,20，50,100,200,400,700，1200京豆）

注：目前使用此脚本会给脚本内置的两个码进行助力，请知晓

APP活动入口：
京东APP首页 ->搜索 玩一玩 -> DIY理想家
或 京东APP -> 我的-> 游戏与更多 - > 东东小窝
微信小程序入口：
来客有礼 - > 首页 -> 东东小窝
网页入口（注：进入后不能再此刷新，否则会有问题，需重新输入此链接进入）
https://h5.m.jd.com/babelDiy/Zeus/2HFSytEAN99VPmMGZ6V4EYWus1x/index.html

已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, 小火箭，JSBox, Node.js
===============Quantumultx===============
[task_local]
#东东小窝
16 0 * * * https://raw.githubusercontent.com/lxk0301/jd_scripts/master/jd_small_home.js, tag=东东小窝, enabled=true

================Loon==============
[Script]
cron "16 0 * * *" script-path=https://raw.githubusercontent.com/lxk0301/jd_scripts/master/jd_small_home.js, tag=东东小窝

===============Surge=================
东东小窝 = type=cron,cronexp="16 0 * * *",wake-system=1,timeout=20,script-path=https://raw.githubusercontent.com/lxk0301/jd_scripts/master/jd_small_home.js

============小火箭=========
东东小窝 = type=cron,script-path=https://raw.githubusercontent.com/lxk0301/jd_scripts/master/jd_small_home.js, cronexpr="16 0 * * *", timeout=200, enable=true
 */
const { Env } = require('../../utils/Env')
const $ = new Env('东东小窝')

const notify = require('../../utils/sendNotify')
// Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = require('../../utils/jdCookie.js')

// IOS等用户直接用NobyDa的jd cookie
const cookiesArr = []; let cookie = ''; let message = ''
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {}
} else {
  cookiesArr.push(...[$.getdata('CookieJD'), $.getdata('CookieJD2')])
}

const JD_API_HOST = 'https://lkyl.dianpusoft.cn/api'
const inviteCodes = []
!(async() => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', { 'open-url': 'https://bean.m.jd.com/' })
    return
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i]
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1])
      $.index = i + 1
      $.isLogin = true
      $.nickName = ''
      message = ''
      await TotalBean()
      console.log(`\n*******开始【京东账号${$.index}】${$.nickName || $.UserName}********\n`)
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/`, { 'open-url': 'https://bean.m.jd.com/' })

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`)
        } else {
          $.setdata('', `CookieJD${i ? i + 1 : ''}`)// cookie失效，故清空cookie。$.setdata('', `CookieJD${i ? i + 1 : "" }`);//cookie失效，故清空cookie。
        }
        continue
      }
      await smallHome()
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
  })
  .finally(() => {
    $.done()
  })
async function smallHome() {
  await loginHome()
  await ssjjRooms()
  await helpFriends()
  if (!$.isUnLock) return
  await createInviteUser()
  await queryDraw()
  await lottery()
  await doAllTask()
  await queryByUserId()
  await showMsg()
}
function showMsg() {
  return new Promise(resolve => {
    $.msg($.name, '', `【京东账号${$.index}】${$.nickName}\n${message}`)
    resolve()
  })
}
async function lottery() {
  if ($.freeDrawCount > 0) {
    await drawRecord($.lotteryId)
  } else {
    console.log(`免费抽奖机会今日已使用\n`)
  }
}
// 获取详情
function queryByUserId() {
  return new Promise(resolve => {
    $.get(taskUrl(`ssjj-wo-home-info/queryByUserId/2`), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data)
            if (data.head.code === 200) {
              if (data.body) {
                message += `【小窝名】${data.body.name}\n`
                message += `【当前WO币】${data.body.woB}\n`
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data)
      }
    })
  })
}
async function doChannelsListTask(taskId) {
  await queryChannelsList(taskId)
  for (const item of $.queryChannelsList) {
    if (item.showOrder !== 1) {
      await $.wait(1000)
      await followChannel(taskId, item.id)
      await queryDoneTaskRecord(taskId)
    }
  }
}
async function helpFriends() {
  for (const item of inviteCodes) {
    if (!item) continue
    await createAssistUser(item, $.createAssistUserID || '1318106976846299138')
  }
}
async function doAllTask() {
  await queryAllTaskInfo()// 获取任务详情列表$.taskList
  for (const item of $.taskList) {
    if (item.ssjjTaskInfo.type === 1) {
      // 邀请好友助力自己
      // await createAssistUser('1330186694770339842', item.ssjjTaskInfo.id)
      $.createAssistUserID = item.ssjjTaskInfo.id
      console.log(`助力您的好友:${item.doneNum}人`)
    }
    if (item.ssjjTaskInfo.type === 2) {
      // 每日打卡
      if (item.doneNum === (item.ssjjTaskInfo.awardOfDayNum || 1)) {
        console.log(`${item.ssjjTaskInfo.name}已完成（${item.doneNum}/${item.ssjjTaskInfo.awardOfDayNum || 1}）`)
        continue
      }
      await clock(item.ssjjTaskInfo.id, item.ssjjTaskInfo.awardWoB)
    }
    // 限时连连看
    if (item.ssjjTaskInfo.type === 3) {
      if (item.doneNum === item.ssjjTaskInfo.awardOfDayNum) {
        console.log(`${item.ssjjTaskInfo.name}已完成[${item.doneNum}/${item.ssjjTaskInfo.awardOfDayNum}]`)
        continue
      }
      for (let i = 0; i < new Array(item.ssjjTaskInfo.awardOfDayNum || 1).fill('').length; i++) {
        await game(item.ssjjTaskInfo.id, item.doneNum)
      }
      // await game(item.ssjjTaskInfo.id, item.doneNum);
      // await doAllTask();
    }

    if (item.ssjjTaskInfo.type === 6) {
      // 关注4个频道
      if (item.doneNum === item.ssjjTaskInfo.awardOfDayNum) {
        console.log(`${item.ssjjTaskInfo.name}已完成[${item.doneNum}/${item.ssjjTaskInfo.awardOfDayNum}]`)
        continue
      }
      await doChannelsListTask(item.ssjjTaskInfo.id)
    }
    if (item.ssjjTaskInfo.type === 7) {
      // 浏览3个频道
      if (item.doneNum === item.ssjjTaskInfo.awardOfDayNum) {
        console.log(`${item.ssjjTaskInfo.name}已完成[${item.doneNum}/${item.ssjjTaskInfo.awardOfDayNum}]`)
        continue
      }
      for (let i = 0; i < new Array(item.ssjjTaskInfo.awardOfDayNum || 1).fill('').length; i++) {
        await browseChannels('browseChannels', item.ssjjTaskInfo.id, item.browseId)
      }
      // await browseChannels('browseChannels', item.ssjjTaskInfo.id, item.browseId);
      // await doAllTask();
    }
    if (item.ssjjTaskInfo.type === 11) {
      // 浏览会场
      if (item.doneNum === item.ssjjTaskInfo.awardOfDayNum) {
        console.log(`${item.ssjjTaskInfo.name}已完成[${item.doneNum}/${item.ssjjTaskInfo.awardOfDayNum}]`)
        continue
      }
      for (let i = 0; i < new Array(item.ssjjTaskInfo.awardOfDayNum || 1).fill('').length; i++) {
        await browseChannels('browseMeetings', item.ssjjTaskInfo.id, item.browseId)
      }
      // await browseChannels('browseMeetings' ,item.ssjjTaskInfo.id, item.browseId);
      // await doAllTask();
    }
  }
}
// 获取需要关注的频道列表
function queryChannelsList(taskId) {
  return new Promise(resolve => {
    $.get(taskUrl(`ssjj-task-channels/queryChannelsList/${taskId}`), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data)
            if (data.head.code === 200) {
              if (data.body) {
                $.queryChannelsList = data.body
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data)
      }
    })
  })
}
// 浏览频道，浏览会场API
function browseChannels(functionID, taskId, browseId) {
  return new Promise(resolve => {
    $.get(taskUrl(`/ssjj-task-record/${functionID}/${taskId}/${browseId}`), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            console.log(`${functionID === 'browseChannels' ? '浏览频道' : '浏览会场'}`, data)
            data = JSON.parse(data)
            if (data.head.code === 200) {
              if (data.body) {
                // message += `【限时连连看】成功，活动${awardWoB}WO币\n`;
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data)
      }
    })
  })
}
// 记录已关注的频道
function queryDoneTaskRecord(taskId) {
  return new Promise(resolve => {
    $.get(taskUrl(`/ssjj-task-record/queryDoneTaskRecord/6/${taskId}`), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data)
            if (data.head.code === 200) {
              if (data.body) {
                // message += `【限时连连看】成功，活动${awardWoB}WO币\n`;
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data)
      }
    })
  })
}
// 关注频道API
function followChannel(taskId, channelId) {
  return new Promise(resolve => {
    $.get(taskUrl(`/ssjj-task-record/followChannel/${channelId}/${taskId}`), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data)
            if (data.head.code === 200) {
              if (data.body) {
                // message += `【限时连连看】成功，活动${awardWoB}WO币\n`;
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data)
      }
    })
  })
}
function createInviteUser() {
  return new Promise(resolve => {
    $.get(taskUrl(`/ssjj-task-record/createInviteUser`), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data)
            if (data.head.code === 200) {
              if (data.body) {
                if (data.body.id) {
                  console.log(`\n您的${$.name}shareCode:【${data.body.id}】\n`)
                  $.shareCode = data.body.id
                }
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data)
      }
    })
  })
}

function createAssistUser(inviteId, taskId) {
  return new Promise(resolve => {
    $.get(taskUrl(`/ssjj-task-record/createAssistUser/${inviteId}/${taskId}`), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data)
            if (data.head.code === 200) {
              if (data.body) {
                console.log(`\n给好友${data.body.inviteId}:【${data.head.msg}】\n`)
              }
            } else {
              console.log(`助力失败${JSON.stringify(data)}}`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data)
      }
    })
  })
}
function game(taskId, index, awardWoB = 100) {
  return new Promise(resolve => {
    $.get(taskUrl(`/ssjj-task-record/game/${index}/${taskId}`), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data)
            if (data.head.code === 200) {
              if (data.body) {
                message += `【限时连连看】成功，活动${awardWoB}WO币\n`
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data)
      }
    })
  })
}
function clock(taskId, awardWoB) {
  return new Promise(resolve => {
    $.get(taskUrl(`/ssjj-task-record/clock/${taskId}`), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data)
            if (data.head.code === 200) {
              if (data.body) {
                message += `【每日打卡】成功，活动${awardWoB}WO币\n`
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data)
      }
    })
  })
}
function queryAllTaskInfo() {
  return new Promise(resolve => {
    $.get(taskUrl(`ssjj-task-info/queryAllTaskInfo/2`), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data)
            if (data.head.code === 200) {
              if (data.body) {
                $.taskList = data.body
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve()
      }
    })
  })
}
// 免费抽奖
function drawRecord(id) {
  return new Promise(resolve => {
    $.get(taskUrl(`ssjj-draw-record/draw/${id}`), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data)
            if (data.head.code === 200) {
              if (data.body) {
                message += `【免费抽奖】获得：${data.body.name}\n`
              } else {
                message += `【免费抽奖】未中奖\n`
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data)
      }
    })
  })
}
// 查询免费抽奖机会
function queryDraw() {
  return new Promise(resolve => {
    $.get(taskUrl('ssjj-draw-center/queryDraw'), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data)
            if (data.head.code === 200) {
              $.freeDrawCount = data.body.freeDrawCount// 免费抽奖次数
              $.lotteryId = data.body.center.id
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data)
      }
    })
  })
}
// 查询是否开启了此活动
function ssjjRooms() {
  return new Promise(resolve => {
    $.get(taskUrl('ssjj-rooms/info/%E5%AE%A2%E5%8E%85'), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data)
            if (data.head.code === 200) {
              $.isUnLock = data.body.isUnLock
              if (!$.isUnLock) {
                console.log(`京东账号${$.index}${$.nickName}未开启此活动\n`)
                $.msg($.name, '', `京东账号${$.index}${$.nickName}未开启此活动\n点击弹窗去开启此活动(￣▽￣)"`, { 'open-url': 'openjd://virtual?params=%7B%20%22category%22:%20%22jump%22,%20%22des%22:%20%22m%22,%20%22url%22:%20%22https://h5.m.jd.com/babelDiy/Zeus/2HFSytEAN99VPmMGZ6V4EYWus1x/index.html%22%20%7D' })
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data)
      }
    })
  })
}
function loginHome() {
  return new Promise(resolve => {
    const options = {
      'url': 'https://jdhome.m.jd.com/saas/framework/encrypt/pin?appId=6d28460967bda11b78e077b66751d2b0',
      'headers': {
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'zh-cn',
        'Connection': 'keep-alive',
        'Content-Length': '0',
        'Content-Type': 'application/json',
        'Cookie': cookie,
        'Host': 'jdhome.m.jd.com',
        'Origin': 'https://jdhome.m.jd.com',
        'Referer': 'https://jdhome.m.jd.com/dist/taro/index.html/',
        'User-Agent': 'jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0'
      }
    }
    $.post(options, async(err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data)
            await login(data.data)
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve()
      }
    })
  })
}
function login(userName) {
  return new Promise(resolve => {
    const body = {
      'body': {
        'client': 2,
        userName
      }
    }
    const options = {
      'url': `${JD_API_HOST}/user-info/login`,
      'body': JSON.stringify(body),
      'headers': {
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'zh-cn',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json',
        'Host': 'lkyl.dianpusoft.cn',
        'Origin': 'https://lkyl.dianpusoft.cn',
        'Referer': 'https://h5.m.jd.com/babelDiy/Zeus/2HFSytEAN99VPmMGZ6V4EYWus1x/index.html',
        'User-Agent': 'jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0'
      }
    }
    $.post(options, async(err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          data = JSON.parse(data)
          if (data.head.code === 200) {
            $.token = data.head.token
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data)
      }
    })
  })
}
function taskUrl(url, body = {}) {
  return {
    url: `${JD_API_HOST}/${url}?body=${escape(body)}`,
    headers: {
      'Accept': '*/*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'Connection': 'keep-alive',
      'content-type': 'application/json',
      'Host': 'lkyl.dianpusoft.cn',
      'Referer': 'https://h5.m.jd.com/babelDiy/Zeus/2HFSytEAN99VPmMGZ6V4EYWus1x/index.html',
      'token': $.token,
      'User-Agent': 'jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0'
    }
  }
}
function TotalBean() {
  return new Promise(resolve => {
    const options = {
      'url': `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
      'headers': {
        'Accept': 'application/json,text/plain, */*',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'zh-cn',
        'Connection': 'keep-alive',
        'Cookie': cookie,
        'Referer': 'https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
      }
    }
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data)
            if (data['retcode'] === 13) {
              $.isLogin = false // cookie过期
              return
            }
            $.nickName = data['base'].nickname
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve()
      }
    })
  })
}
function safeGet(data) {
  try {
    if (typeof JSON.parse(data) === 'object') {
      return true
    }
  } catch (e) {
    console.log(e)
    console.log(`京东服务器访问数据为空，请检查自身设备网络情况`)
    return false
  }
}
