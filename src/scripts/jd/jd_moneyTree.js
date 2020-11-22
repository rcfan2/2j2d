/*
京东摇钱树 ：https://raw.githubusercontent.com/lxk0301/scripts/master/jd_moneyTree.js
更新时间：2020-11-16
京东摇钱树支持京东双账号
注：如果使用Node.js, 需自行安装'crypto-js,got,http-server,tough-cookie'模块. 例: npm install crypto-js http-server tough-cookie got --save
*/
// quantumultx
// [task_local]
// #京东摇钱树
// 3 */2 * * * https://raw.githubusercontent.com/lxk0301/scripts/master/jd_moneyTree.js, tag=京东摇钱树, img-url=https://raw.githubusercontent.com/58xinian/icon/master/jdyqs.png, enabled=true
// Loon
// [Script]
// cron "3 */2 * * *" script-path=https://raw.githubusercontent.com/lxk0301/scripts/master/jd_moneyTree.js,tag=京东摇钱树
// Surge
// 京东摇钱树 = type=cron,cronexp="3 */2 * * *",wake-system=1,timeout=20,script-path=https://raw.githubusercontent.com/lxk0301/scripts/master/jd_moneyTree.js
const { Env } = require('../../utils/Env')
const $ = new Env('京东摇钱树')
const notify = require('../../utils/sendNotify')
// Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = require('../../utils/jdCookie')

// IOS等用户直接用NobyDa的jd cookie
const cookiesArr = []; let cookie = ''
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') {
    console.log = () => {
    }
  }
} else {
  cookiesArr.push($.getdata('CookieJD'))
  cookiesArr.push($.getdata('CookieJD2'))
}

const jdNotify = true// 是否开启静默运行，默认true开启
const JD_API_HOST = 'https://ms.jr.jd.com/gw/generic/uc/h5/m'
let userInfo = null; let taskInfo = []; let message = ''; let subTitle = ''; let fruitTotal = 0
!(async() => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', { 'open-url': 'https://bean.m.jd.com/' })
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i]
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1])
      $.index = i + 1
      $.isLogin = true
      $.nickName = ''
      await TotalBean()
      console.log(`\n开始【京东账号${$.index}】${$.nickName || $.UserName}\n`)
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/`, { 'open-url': 'https://bean.m.jd.com/' })
        $.setdata('', `CookieJD${i ? i + 1 : ''}`)// cookie失效，故清空cookie。
        if ($.isNode()) await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`)
        continue
      }
      message = ''
      subTitle = ''
      await jd_moneyTree()
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
  })
  .finally(() => {
    $.done()
  })

async function jd_moneyTree() {
  const userRes = await user_info()
  if (!userRes || !userRes.realName) return
  await signEveryDay()
  await dayWork()
  await harvest()
  await sell()
  await myWealth()
  await stealFriendFruit()

  $.log(`\n${message}\n`)
  if (!jdNotify || jdNotify === 'false') {
    $.msg($.name, subTitle, message)
  }
}

function user_info() {
  console.log('初始化摇钱树个人信息')
  const params = {
    'sharePin': '',
    'shareType': 1,
    'channelLV': '',
    'source': 0,
    'riskDeviceParam': {
      'eid': '',
      'dt': '',
      'ma': '',
      'im': '',
      'os': '',
      'osv': '',
      'ip': '',
      'apid': '',
      'ia': '',
      'uu': '',
      'cv': '',
      'nt': '',
      'at': '1',
      'fp': '',
      'token': ''
    }
  }
  params.riskDeviceParam = JSON.stringify(params.riskDeviceParam)
  // await $.wait(5000); //歇口气儿, 不然会报操作频繁
  return new Promise((resolve, reject) => {
    $.post(taskurl('login', params), async(err, resp, data) => {
      try {
        if (err) {
          console.log('\n摇钱树京东API请求失败 ‼️‼️')
          console.log(JSON.stringify(err))
        } else {
          if (data) {
            const res = JSON.parse(data)
            if (res && res.resultCode === 0) {
              $.isLogin = true
              console.log('resultCode为0')
              if (res.resultData.data) {
                userInfo = res.resultData.data
                // userInfo.realName = null;
                if (userInfo.realName) {
                  // console.log(`助力码sharePin为：：${userInfo.sharePin}`);
                  $.treeMsgTime = userInfo.sharePin
                  subTitle = `【${userInfo.nick}】${userInfo.treeInfo.treeName}`
                  // message += `【我的金果数量】${userInfo.treeInfo.fruit}\n`;
                  // message += `【我的金币数量】${userInfo.treeInfo.coin}\n`;
                  // message += `【距离${userInfo.treeInfo.level + 1}级摇钱树还差】${userInfo.treeInfo.progressLeft}\n`;
                } else {
                  $.msg($.name, `【提示】京东账号${$.index}${$.UserName}运行失败`, '此账号未实名认证或者未参与过此活动\n①如未参与活动,请先去京东app参加摇钱树活动\n入口：我的->游戏与互动->查看更多\n②如未实名认证,请进行实名认证', { 'open-url': 'openApp.jdMobile://' })
                }
              }
            } else {
              console.log(`其他情况::${JSON.stringify(res)}`)
            }
          } else {
            console.log(`京豆api返回数据为空，请检查自身原因`)
          }
        }
      } catch (eor) {
        $.msg('摇钱树-初始化个人信息' + eor.name + '‼️', JSON.stringify(eor), eor.message)
      } finally {
        resolve(userInfo)
      }
    })
  })
}

function dayWork() {
  console.log(`开始做任务userInfo了\n`)
  return new Promise(async resolve => {
    const data = {
      'source': 0,
      'linkMissionIds': ['666', '667'],
      'LinkMissionIdValues': [7, 7],
      'riskDeviceParam': {
        'eid': '',
        'dt': '',
        'ma': '',
        'im': '',
        'os': '',
        'osv': '',
        'ip': '',
        'apid': '',
        'ia': '',
        'uu': '',
        'cv': '',
        'nt': '',
        'at': '1',
        'fp': '',
        'token': ''
      }
    }
    const response = await request('dayWork', data)
    // console.log(`获取任务的信息:${JSON.stringify(response)}\n`)
    const canTask = []
    taskInfo = []
    if (response && response.resultCode === 0) {
      if (response.resultData.code === '200') {
        response.resultData.data.map((item) => {
          if (item.prizeType === 2) {
            canTask.push(item)
          }
          if (item.workType === 7 && item.prizeType === 0) {
            // missionId.push(item.mid);
            taskInfo.push(item)
          }
          // if (item.workType === 7 && item.prizeType === 0) {
          //   missionId2 = item.mid;
          // }
        })
      }
    }
    console.log(`canTask::${JSON.stringify(canTask)}\n`)
    console.log(`浏览任务列表taskInfo::${JSON.stringify(taskInfo)}\n`)
    for (const item of canTask) {
      if (item.workType === 1) {
        //  签到任务
        // let signRes = await sign();
        // console.log(`签到结果:${JSON.stringify(signRes)}`);
        if (item.workStatus === 0) {
          // const data = {"source":2,"workType":1,"opType":2};
          // let signRes = await request('doWork', data);
          const signRes = await sign()
          console.log(`三餐签到结果:${JSON.stringify(signRes)}`)
        } else if (item.workStatus === 2) {
          console.log(`三餐签到任务已经做过`)
        } else if (item.workStatus === -1) {
          console.log(`三餐签到任务不在时间范围内`)
        }
      } else if (item.workType === 2) {
        // 分享任务
        if (item.workStatus === 0) {
          // share();
          const data = { 'source': 0, 'workType': 2, 'opType': 1 }
          // 开始分享
          // let shareRes = await request('doWork', data);
          const shareRes = await share(data)
          console.log(`开始分享的动作:${JSON.stringify(shareRes)}`)
          const b = { 'source': 0, 'workType': 2, 'opType': 2 }
          // let shareResJL = await request('doWork', b);
          const shareResJL = await share(b)
          console.log(`领取分享后的奖励:${JSON.stringify(shareResJL)}`)
        } else if (item.workStatus === 2) {
          console.log(`分享任务已经做过`)
        }
      }
    }
    for (const task of taskInfo) {
      if (task.mid && task.workStatus === 0) {
        console.log('开始做浏览任务')
        // yield setUserLinkStatus(task.mid);
        const aa = await setUserLinkStatus(task.mid)
        console.log(`aaa${JSON.stringify(aa)}`)
      } else if (task.mid && task.workStatus === 1) {
        console.log(`workStatus === 1开始领取浏览后的奖励:mid:${task.mid}`)
        const receiveAwardRes = await receiveAward(task.mid)
        console.log(`领取浏览任务奖励成功：${JSON.stringify(receiveAwardRes)}`)
      } else if (task.mid && task.workStatus === 2) {
        console.log('所有的浏览任务都做完了')
      }
    }
    resolve()
  })
}

function harvest() {
  console.log(`收获的操作:${JSON.stringify(userInfo)}\n`)
  if (!userInfo) return
  const data = {
    'source': 2,
    'sharePin': '',
    'userId': userInfo.userInfo,
    'userToken': userInfo.userToken
  }
  return new Promise((rs, rj) => {
    request('harvest', data).then((harvestRes) => {
      if (harvestRes && harvestRes.resultCode === 0 && harvestRes.resultData.code === '200') {
        console.log('收获金果')
        const data = harvestRes.resultData.data
        message += `【距离${data.treeInfo.level + 1}级摇钱树还差】${data.treeInfo.progressLeft}\n`
        fruitTotal = data.treeInfo.fruit
      }
      rs()
      // gen.next();
    })
  })
  // request('harvest', data).then((harvestRes) => {
  //   if (harvestRes.resultCode === 0 && harvestRes.resultData.code === '200') {
  //     let data = harvestRes.resultData.data;
  //     message += `【距离${data.treeInfo.level + 1}级摇钱树还差】${data.treeInfo.progressLeft}\n`;
  //     fruitTotal = data.treeInfo.fruit;
  //     gen.next();
  //   }
  // })
}

// 卖出金果，得到金币
function sell() {
  return new Promise((rs, rj) => {
    const params = {
      'source': 2,
      'riskDeviceParam': {
        'eid': '',
        'dt': '',
        'ma': '',
        'im': '',
        'os': '',
        'osv': '',
        'ip': '',
        'apid': '',
        'ia': '',
        'uu': '',
        'cv': '',
        'nt': '',
        'at': '1',
        'fp': '',
        'token': ''
      }
    }
    params.riskDeviceParam = JSON.stringify(params.riskDeviceParam)// 这一步，不可省略，否则提交会报错（和login接口一样）
    console.log(`目前金果数量${fruitTotal}`)
    if (fruitTotal > 380) {
      request('sell', params).then((sellRes) => {
        console.log(`卖出金果结果:${JSON.stringify(sellRes)}\n`)
        rs()
      })
    } else {
      rs()
    }
    // request('sell', params).then(response => {
    //   rs(response);
    // })
  })
  // request('sell', params).then((sellRes) => {
  //   console.log(`卖出金果结果:${JSON.stringify(sellRes)}\n`)
  //   gen.next();
  // })
}

// 获取金币和金果数量
function myWealth() {
  return new Promise((resolve) => {
    const params = {
      'source': 2,
      'riskDeviceParam': {
        'eid': '',
        'dt': '',
        'ma': '',
        'im': '',
        'os': '',
        'osv': '',
        'ip': '',
        'apid': '',
        'ia': '',
        'uu': '',
        'cv': '',
        'nt': '',
        'at': '1',
        'fp': '',
        'token': ''
      }
    }
    params.riskDeviceParam = JSON.stringify(params.riskDeviceParam)// 这一步，不可省略，否则提交会报错（和login接口一样）
    request('myWealth', params).then(res => {
      if (res && res.resultCode === 0 && res.resultData.code === '200') {
        console.log(`金币数量和金果：：${JSON.stringify(res)}`)
        message += `【我的金果数量】${res.resultData.data.gaAmount}\n`
        message += `【我的金币数量】${res.resultData.data.gcAmount}\n`
      }
      resolve()
    })
  })
}

function sign() {
  console.log('开始三餐签到')
  const data = { 'source': 2, 'workType': 1, 'opType': 2 }
  return new Promise((rs, rj) => {
    request('doWork', data).then(response => {
      rs(response)
    })
  })
}

function signIndex() {
  const params = {
    'source': 0,
    'riskDeviceParam': {
      'eid': '',
      'dt': '',
      'ma': '',
      'im': '',
      'os': '',
      'osv': '',
      'ip': '',
      'apid': '',
      'ia': '',
      'uu': '',
      'cv': '',
      'nt': '',
      'at': '1',
      'fp': '',
      'token': ''
    }
  }
  return new Promise((rs, rj) => {
    request('signIndex', params).then(response => {
      rs(response)
    })
  })
}

function signEveryDay() {
  return new Promise(async(resolve) => {
    const signIndexRes = await signIndex()
    if (signIndexRes.resultCode === 0) {
      console.log(`每日签到条件查询:${signIndexRes.resultData.data.canSign === 2 ? '可以签到' : '已经签到过了'}`)
      if (signIndexRes.resultData && signIndexRes.resultData.data.canSign === 2) {
        console.log('准备每日签到')
        const signOneRes = await signOne(signIndexRes.resultData.data.signDay)
        console.log(`第${signIndexRes.resultData.data.signDay}日签到结果:${JSON.stringify(signOneRes)}`)
        if (signIndexRes.resultData.data.signDay === 7) {
          const getSignAwardRes = await getSignAward()
          console.log(`店铺券（49-10）领取结果：${JSON.stringify(getSignAwardRes)}`)
          if (getSignAwardRes.resultCode === 0 && getSignAwardRes.data.code === 0) {
            message += `【7日签到奖励领取】${getSignAwardRes.datamessage}\n`
          }
        }
      }
    }
    resolve()
  })
}

function signOne(signDay) {
  const params = {
    'source': 0,
    'signDay': signDay,
    'riskDeviceParam': {
      'eid': '',
      'dt': '',
      'ma': '',
      'im': '',
      'os': '',
      'osv': '',
      'ip': '',
      'apid': '',
      'ia': '',
      'uu': '',
      'cv': '',
      'nt': '',
      'at': '1',
      'fp': '',
      'token': ''
    }
  }
  return new Promise((rs, rj) => {
    request('signOne', params).then(response => {
      rs(response)
    })
  })
}

// 领取七日签到后的奖励(店铺优惠券)
function getSignAward() {
  const params = {
    'source': 2,
    'awardType': 2,
    'deviceRiskParam': 1,
    'riskDeviceParam': {
      'eid': '',
      'dt': '',
      'ma': '',
      'im': '',
      'os': '',
      'osv': '',
      'ip': '',
      'apid': '',
      'ia': '',
      'uu': '',
      'cv': '',
      'nt': '',
      'at': '1',
      'fp': '',
      'token': ''
    }
  }
  return new Promise((rs, rj) => {
    request('getSignAward', params).then(response => {
      rs(response)
    })
  })
}

// 浏览任务
async function setUserLinkStatus(missionId) {
  let index = 0
  do {
    const params = {
      'missionId': missionId,
      'pushStatus': 1,
      'keyValue': index,
      'riskDeviceParam': {
        'eid': '',
        'dt': '',
        'ma': '',
        'im': '',
        'os': '',
        'osv': '',
        'ip': '',
        'apid': '',
        'ia': '',
        'uu': '',
        'cv': '',
        'nt': '',
        'at': '1',
        'fp': '',
        'token': ''
      }
    }
    const response = await request('setUserLinkStatus', params)
    console.log(`missionId为${missionId}：：第${index + 1}次浏览活动完成: ${JSON.stringify(response)}`)
    // if (resultCode === 0) {
    //   let sportRevardResult = await getSportReward();
    //   console.log(`领取遛狗奖励完成: ${JSON.stringify(sportRevardResult)}`);
    // }
    index++
  } while (index < 7) // 不知道结束的条件，目前写死循环7次吧
  console.log('浏览店铺任务结束')
  console.log('开始领取浏览后的奖励')
  const receiveAwardRes = await receiveAward(missionId)
  console.log(`领取浏览任务奖励成功：${JSON.stringify(receiveAwardRes)}`)
  return new Promise((resolve, reject) => {
    resolve(receiveAwardRes)
  })
  // gen.next();
}

// 领取浏览后的奖励
function receiveAward(mid) {
  if (!mid) return
  mid = mid + ''
  const params = {
    'source': 0,
    'workType': 7,
    'opType': 2,
    'mid': mid,
    'riskDeviceParam': {
      'eid': '',
      'dt': '',
      'ma': '',
      'im': '',
      'os': '',
      'osv': '',
      'ip': '',
      'apid': '',
      'ia': '',
      'uu': '',
      'cv': '',
      'nt': '',
      'at': '1',
      'fp': '',
      'token': ''
    }
  }
  return new Promise((rs, rj) => {
    request('doWork', params).then(response => {
      rs(response)
    })
  })
}

function share(data) {
  if (data.opType === 1) {
    console.log(`开始做分享任务\n`)
  } else {
    console.log(`开始做领取分享后的奖励\n`)
  }
  return new Promise((rs, rj) => {
    request('doWork', data).then(response => {
      rs(response)
    })
  })
  // const data = 'reqData={"source":0,"workType":2,"opType":1}';
  // request('doWork', data).then(res => {
  //   console.log(`分享111:${JSON.stringify(res)}`)
  //   setTimeout(() => {
  //     const data2 = 'reqData={"source":0,"workType":2,"opType":2}';
  //     request('doWork', data2).then(res => {
  //       console.log(`分享222:${JSON.stringify(res)}`)
  //     })
  //   }, 2000)
  // })
  // await sleep(3);
}

function msgControl() {
  return new Promise((resolve) => {
    let time = $.getdata($.treeMsgTime) * 1
    time++
    $.setdata(`${time}`, $.treeMsgTime)
    resolve()
  })
}

async function stealFriendFruit() {
  await friendRank()
  if ($.friendRankList && $.friendRankList.length > 0) {
    const canSteal = $.friendRankList.some((item) => {
      const boxShareCode = item.steal
      return (boxShareCode === true)
    })
    if (canSteal) {
      $.amount = 0
      for (const item of $.friendRankList) {
        if (!item.self && item.steal) {
          await friendTreeRoom(item.encryPin)
          const stealFruitRes = await stealFruit(item.encryPin, $.friendTree.stoleInfo)
          if (stealFruitRes && stealFruitRes.resultCode === 0 && stealFruitRes.resultData.code === '200') {
            $.amount += stealFruitRes.resultData.data.amount
          }
        }
      }
      message += `【偷取好友金果】共${$.amount}个\n`
    } else {
      console.log(`今日已偷过好友的金果了，暂无好友可偷，请明天再来\n`)
    }
  } else {
    console.log(`您暂无好友，故跳过`)
  }
}

// 获取好友列表API
async function friendRank() {
  await $.wait(1000) // 歇口气儿, 不然会报操作频繁
  const params = {
    'source': 2,
    'riskDeviceParam': {
      'eid': '',
      'dt': '',
      'ma': '',
      'im': '',
      'os': '',
      'osv': '',
      'ip': '',
      'apid': '',
      'ia': '',
      'uu': '',
      'cv': '',
      'nt': '',
      'at': '1',
      'fp': '',
      'token': ''
    }
  }
  params.riskDeviceParam = JSON.stringify(params.riskDeviceParam)// 这一步，不可省略，否则提交会报错（和login接口一样）
  return new Promise((resolve, reject) => {
    $.post(taskurl('friendRank', params), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n摇钱树京东API请求失败 ‼️‼️')
          console.log(JSON.stringify(err))
          $.logErr(err)
        } else {
          if (data) {
            data = JSON.parse(data)
            $.friendRankList = data.resultData.data
          } else {
            console.log(`京豆api返回数据为空，请检查自身原因`)
          }
        }
      } catch (eor) {
        $.msg('摇钱树-初始化个人信息' + eor.name + '‼️', JSON.stringify(eor), eor.message)
      } finally {
        resolve()
      }
    })
  })
}

// 进入好友房间API
async function friendTreeRoom(friendPin) {
  await $.wait(1000) // 歇口气儿, 不然会报操作频繁
  const params = {
    'source': 2,
    'friendPin': friendPin,
    'riskDeviceParam': {
      'eid': '',
      'dt': '',
      'ma': '',
      'im': '',
      'os': '',
      'osv': '',
      'ip': '',
      'apid': '',
      'ia': '',
      'uu': '',
      'cv': '',
      'nt': '',
      'at': '1',
      'fp': '',
      'token': ''
    }
  }
  params.riskDeviceParam = JSON.stringify(params.riskDeviceParam)// 这一步，不可省略，否则提交会报错（和login接口一样）
  return new Promise((resolve, reject) => {
    $.post(taskurl('friendTree', params), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n摇钱树京东API请求失败 ‼️‼️')
          console.log(JSON.stringify(err))
          $.logErr(err)
        } else {
          if (data) {
            data = JSON.parse(data)
            $.friendTree = data.resultData.data
          } else {
            console.log(`京豆api返回数据为空，请检查自身原因`)
          }
        }
      } catch (eor) {
        $.msg('摇钱树-初始化个人信息' + eor.name + '‼️', JSON.stringify(eor), eor.message)
      } finally {
        resolve()
      }
    })
  })
}

// 偷好友金果API
async function stealFruit(friendPin, stoleId) {
  await $.wait(1000) // 歇口气儿, 不然会报操作频繁
  const params = {
    'source': 2,
    'friendPin': friendPin,
    'stoleId': stoleId,
    'riskDeviceParam': {
      'eid': '',
      'dt': '',
      'ma': '',
      'im': '',
      'os': '',
      'osv': '',
      'ip': '',
      'apid': '',
      'ia': '',
      'uu': '',
      'cv': '',
      'nt': '',
      'at': '1',
      'fp': '',
      'token': ''
    }
  }
  params.riskDeviceParam = JSON.stringify(params.riskDeviceParam)// 这一步，不可省略，否则提交会报错（和login接口一样）
  return new Promise((resolve, reject) => {
    $.post(taskurl('stealFruit', params), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n摇钱树京东API请求失败 ‼️‼️')
          console.log(JSON.stringify(err))
          $.logErr(err)
        } else {
          if (data) {
            data = JSON.parse(data)
          } else {
            console.log(`京豆api返回数据为空，请检查自身原因`)
          }
        }
      } catch (eor) {
        $.msg('摇钱树-初始化个人信息' + eor.name + '‼️', JSON.stringify(eor), eor.message)
      } finally {
        resolve(data)
      }
    })
  })
}

function TotalBean() {
  return new Promise(async resolve => {
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
          if (data) {
            data = JSON.parse(data)
            if (data['retcode'] === 13) {
              $.isLogin = false // cookie过期
              return
            }
            $.nickName = data['base'].nickname
          } else {
            console.log(`京东服务器返回空数据`)
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

async function request(function_id, body = {}) {
  await $.wait(1000) // 歇口气儿, 不然会报操作频繁
  return new Promise((resolve, reject) => {
    $.post(taskurl(function_id, body), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n摇钱树京东API请求失败 ‼️‼️')
          console.log(JSON.stringify(err))
          $.logErr(err)
        } else {
          if (data) {
            data = JSON.parse(data)
          } else {
            console.log(`京豆api返回数据为空，请检查自身原因`)
          }
        }
      } catch (eor) {
        $.msg('摇钱树-初始化个人信息' + eor.name + '‼️', JSON.stringify(eor), eor.message)
      } finally {
        resolve(data)
      }
    })
  })
}

function taskurl(function_id, body) {
  return {
    url: JD_API_HOST + '/' + function_id + '?_=' + new Date().getTime() * 1000,
    body: `reqData=${function_id === 'harvest' || function_id === 'login' || function_id === 'signIndex' || function_id === 'signOne' || function_id === 'setUserLinkStatus' || function_id === 'dayWork' || function_id === 'getSignAward' || function_id === 'sell' || function_id === 'friendRank' || function_id === 'friendTree' || function_id === 'stealFruit' ? encodeURIComponent(JSON.stringify(body)) : JSON.stringify(body)}`,
    headers: {
      'Accept': `application/json`,
      'Origin': `https://uua.jr.jd.com`,
      'Accept-Encoding': `gzip, deflate, br`,
      'Cookie': cookie,
      'Content-Type': `application/x-www-form-urlencoded;charset=UTF-8`,
      'Host': `ms.jr.jd.com`,
      'Connection': `keep-alive`,
      'User-Agent': `jdapp;iPhone;9.0.0;13.4.1;e35caf0a69be42084e3c97eef56c3af7b0262d01;network/4g;ADID/F75E8AED-CB48-4EAC-A213-E8CE4018F214;supportApplePay/3;hasUPPay/0;pushNoticeIsOpen/1;model/iPhone11,8;addressid/2005183373;hasOCPay/0;appBuild/167237;supportBestPay/0;jdSupportDarkMode/0;pv/1287.19;apprpd/MyJD_GameMain;ref/https%3A%2F%2Fuua.jr.jd.com%2Fuc-fe-wxgrowing%2Fmoneytree%2Findex%2F%3Fchannel%3Dyxhd%26lng%3D113.325843%26lat%3D23.204628%26sid%3D2d98e88cf7d182f60d533476c2ce777w%26un_area%3D19_1601_50258_51885;psq/1;ads/;psn/e35caf0a69be42084e3c97eef56c3af7b0262d01|3485;jdv/0|kong|t_1000170135|tuiguang|notset|1593059927172|1593059927;adk/;app_device/IOS;pap/JA2015_311210|9.0.0|IOS 13.4.1;Mozilla/5.0 (iPhone; CPU iPhone OS 13_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1`,
      'Referer': `https://uua.jr.jd.com/uc-fe-wxgrowing/moneytree/index/?channel=yxhd&lng=113.325896&lat=23.204600&sid=2d98e88cf7d182f60d533476c2ce777w&un_area=19_1601_50258_51885`,
      'Accept-Language': `zh-cn`
    }
  }
}
