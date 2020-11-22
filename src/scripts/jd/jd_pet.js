/*
东东萌宠 更新地址： https://raw.githubusercontent.com/lxk0301/scripts/master/jd_pet.js
更新时间：2020-11-21
已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js

互助码shareCode请先手动运行脚本查看打印可看到
一天只能帮助5个人。多出的助力码无效

=================================Quantumultx=========================
[task_local]
#东东萌宠
15 6-18/6 * * * https://raw.githubusercontent.com/lxk0301/scripts/master/jd_pet.js, tag=东东萌宠, img-url=https://raw.githubusercontent.com/58xinian/icon/master/jdmc.png, enabled=true

=================================Loon===================================
[Script]
cron "15 6-18/6 * * *" script-path=https://raw.githubusercontent.com/lxk0301/scripts/master/jd_pet.js,tag=东东萌宠

===================================Surge================================
东东萌宠 = type=cron,cronexp="15 6-18/6 * * *",wake-system=1,timeout=120,script-path=https://raw.githubusercontent.com/lxk0301/scripts/master/jd_pet.js

====================================小火箭=============================
东东萌宠 = type=cron,script-path=https://raw.githubusercontent.com/lxk0301/scripts/master/jd_pet.js, cronexpr="15 6-18/6 * * *", timeout=200, enable=true

*/
const { Env } = require('../../utils/Env')
const $ = new Env('东东萌宠')
const cookiesArr = []; let cookie = ''; const jdPetShareArr = []; let isBox = false; let notify; let newShareCodes
// 助力好友分享码(最多5个,否则后面的助力失败),原因:京东农场每人每天只有四次助力机会
// 此此内容是IOS用户下载脚本到本地使用，填写互助码的地方，同一京东账号的好友互助码请使用@符号隔开。
// 下面给出两个账号的填写示例（iOS只支持2个京东账号）
const shareCodes = [ // IOS本地脚本用户这个列表填入你要助力的好友的shareCode
]
let message = ''; let subTitle = ''; let option = {}
const jdNotify = false// 是否关闭通知，false打开通知推送，true关闭通知推送
const JD_API_HOST = 'https://api.m.jd.com/client.action'
let goodsUrl = ''; let taskInfoKey = []
const randomCount = 20
!(async() => {
  await requireConfig()
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
      goodsUrl = ''
      taskInfoKey = []
      option = {}
      await shareCodesFormat()
      await jdPet()
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
  })
  .finally(() => {
    $.done()
  })

async function jdPet() {
  // 查询jd宠物信息
  const initPetTownRes = await request('initPetTown')
  message = `【京东账号${$.index}】${$.nickName}\n`
  if (initPetTownRes.code === '0' && initPetTownRes.resultCode === '0' && initPetTownRes.message === 'success') {
    $.petInfo = initPetTownRes.result
    if ($.petInfo.userStatus === 0) {
      $.msg($.name, '【提示】此账号萌宠活动未开始，请手动去京东APP开启活动\n入口：我的->游戏与互动->查看更多', '', { 'open-url': 'openapp.jdmoble://' })
      return
    }
    goodsUrl = $.petInfo.goodsInfo && $.petInfo.goodsInfo.goodsUrl
    // option['media-url'] = goodsUrl;
    // console.log(`初始化萌宠信息完成: ${JSON.stringify(petInfo)}`);
    if ($.petInfo.petStatus === 5) {
      await slaveHelp()// 可以兑换而没有去兑换,也能继续助力好友
      option['open-url'] = 'openApp.jdMobile://'
      $.msg($.name, `【提醒⏰】${$.petInfo.goodsInfo.goodsName}已可领取`, '请去京东APP或微信小程序查看', option)
      if ($.isNode()) {
        await notify.sendNotify(`${$.name} - 账号${$.index} - ${$.nickName || $.UserName}奖品已可领取`, `京东账号${$.index} ${$.nickName}\n${$.petInfo.goodsInfo.goodsName}已可领取`)
      }
      return
    } else if ($.petInfo.petStatus === 6) {
      await slaveHelp()// 已领取红包,但未领养新的,也能继续助力好友
      option['open-url'] = 'openApp.jdMobile://'
      $.msg($.name, `【提醒⏰】已领取红包,但未继续领养新的物品`, '请去京东APP或微信小程序继续领养', option)
      if ($.isNode()) {
        await notify.sendNotify(`${$.name} - 账号${$.index} - ${$.nickName || $.UserName}奖品已可领取`, `京东账号${$.index} ${$.nickName}\n已领取红包,但未继续领养新的物品`)
      }
      return
    }
    console.log(`\n【您的互助码shareCode】 ${$.petInfo.shareCode}\n`)
    await taskInit()
    if ($.taskInit.resultCode === '9999' || !$.taskInit.result) {
      console.log('初始化任务异常, 请稍后再试')
      return
    }
    $.taskInfo = $.taskInit.result

    await petSport()// 遛弯
    await slaveHelp()// 助力好友
    await masterHelpInit()// 获取助力的信息
    await doTask()// 做日常任务
    await feedPetsAgain()// 再次投食
    await energyCollect()// 收集好感度
    await showMsg()
    console.log('全部任务完成, 如果帮助到您可以点下🌟STAR鼓励我一下, 明天见~')
  } else if (initPetTownRes.code === '0') {
    console.log(`初始化萌宠失败:  ${initPetTownRes.message}`)
  }
}

// 收取所有好感度
async function energyCollect() {
  console.log('开始收取任务奖励好感度')
  const function_id = arguments.callee.name.toString()
  const response = await request(function_id)
  // console.log(`收取任务奖励好感度完成:${JSON.stringify(response)}`);
  if (response.code === '0') {
    message += `【第${response.result.medalNum + 1}块勋章完成进度】${response.result.medalPercent}%，还需收集${response.result.needCollectEnergy}好感\n`
    message += `【已获得勋章】${response.result.medalNum}块，还需收集${response.result.needCollectMedalNum}块即可兑换奖品“${$.petInfo.goodsInfo.goodsName}”\n`
  }
}

// 再次投食
async function feedPetsAgain() {
  const response = await request('initPetTown')// 再次初始化萌宠
  if (response.code === '0' && response.resultCode === '0' && response.message === 'success') {
    $.petInfo = response.result
    const foodAmount = $.petInfo.foodAmount // 剩余狗粮
    if (foodAmount - 100 >= 10) {
      for (let i = 0; i < parseInt((foodAmount - 100) / 10); i++) {
        const feedPetRes = await request('feedPets')
        console.log(`投食feedPetRes`)
        if (feedPetRes.resultCode === 0 && feedPetRes.code === 0) {
          console.log('投食成功')
        }
      }
      const response2 = await request('initPetTown')
      $.petInfo = response2.result
      subTitle = $.petInfo.goodsInfo.goodsName
      // message += `【与爱宠相识】${$.petInfo.meetDays}天\n`;
      // message += `【剩余狗粮】${$.petInfo.foodAmount}g\n`;
    } else {
      console.log('目前剩余狗粮：【' + foodAmount + '】g,不再继续投食,保留部分狗粮用于完成第二天任务')
      subTitle = $.petInfo.goodsInfo.goodsName
      // message += `【与爱宠相识】${$.petInfo.meetDays}天\n`;
      // message += `【剩余狗粮】${$.petInfo.foodAmount}g\n`;
    }
  } else {
    console.log(`初始化萌宠失败:  ${JSON.stringify($.petInfo)}`)
  }
}

async function doTask() {
  const { signInit, threeMealInit, firstFeedInit, feedReachInit, inviteFriendsInit, browseShopsInit, taskList } = $.taskInfo
  for (const item of taskList) {
    if ($.taskInfo[item].finished) {
      console.log(`任务 ${item} 已完成`)
    }
  }
  // 每日签到
  if (signInit && !signInit.finished) {
    await signInitFun()
  }
  // 首次喂食
  if (firstFeedInit && !firstFeedInit.finished) {
    await firstFeedInitFun()
  }
  // 三餐
  if (threeMealInit && !threeMealInit.finished) {
    if (threeMealInit.timeRange === -1) {
      console.log(`未到三餐时间`)
      return
    }
    await threeMealInitFun()
  }
  if (browseShopsInit && !browseShopsInit.finished) {
    await browseShopsInitFun()
  }
  const browseSingleShopInitList = []
  taskList.map((item) => {
    if (item.indexOf('browseSingleShopInit') > -1) {
      browseSingleShopInitList.push(item)
    }
  })
  // 去逛逛好货会场
  for (const item of browseSingleShopInitList) {
    const browseSingleShopInitTask = $.taskInfo[item]
    if (browseSingleShopInitTask && !browseSingleShopInitTask.finished) {
      await browseSingleShopInit(browseSingleShopInitTask)
    }
  }
  if (inviteFriendsInit && !inviteFriendsInit.finished) {
    await inviteFriendsInitFun()
  }
  // 投食10次
  if (feedReachInit && !feedReachInit.finished) {
    await feedReachInitFun()
  }
}

// 好友助力信息
async function masterHelpInit() {
  const res = await request(arguments.callee.name.toString())
  // console.log(`助力信息: ${JSON.stringify(res)}`);
  if (res.code === '0' && res.resultCode === '0') {
    if (res.result.masterHelpPeoples && res.result.masterHelpPeoples.length >= 5) {
      if (!res.result.addedBonusFlag) {
        console.log('开始领取额外奖励')
        const getHelpAddedBonusResult = await request('getHelpAddedBonus')
        console.log(`领取30g额外奖励结果：【${getHelpAddedBonusResult.message}】`)
        message += `【额外奖励${getHelpAddedBonusResult.result.reward}领取】${getHelpAddedBonusResult.message}\n`
      } else {
        console.log('已经领取过5好友助力额外奖励')
        message += `【额外奖励】已领取\n`
      }
    } else {
      console.log('助力好友未达到5个')
      message += `【额外奖励】领取失败，原因：给您助力的人未达5个\n`
    }
    if (res.result.masterHelpPeoples && res.result.masterHelpPeoples.length > 0) {
      console.log('帮您助力的好友的名单开始')
      let str = ''
      res.result.masterHelpPeoples.map((item, index) => {
        if (index === (res.result.masterHelpPeoples.length - 1)) {
          str += item.nickName || '匿名用户'
        } else {
          str += (item.nickName || '匿名用户') + '，'
        }
      })
      message += `【助力您的好友】${str}\n`
    }
  }
}

/**
 * 助力好友, 暂时支持一个好友, 需要拿到shareCode
 * shareCode为你要助力的好友的
 * 运行脚本时你自己的shareCode会在控制台输出, 可以将其分享给他人
 */
async function slaveHelp() {
  let helpPeoples = ''
  for (const code of newShareCodes) {
    console.log(`开始助力京东账号${$.index} - ${$.nickName}的好友: ${code}`)
    if (!code) continue
    const response = await request(arguments.callee.name.toString(), { 'shareCode': code })
    if (response.code === '0' && response.resultCode === '0') {
      if (response.result.helpStatus === 0) {
        console.log('已给好友: 【' + response.result.masterNickName + '】助力')
        helpPeoples += response.result.masterNickName + '，'
      } else if (response.result.helpStatus === 1) {
        // 您今日已无助力机会
        console.log(`助力好友${response.result.masterNickName}失败，您今日已无助力机会`)
        break
      } else if (response.result.helpStatus === 2) {
        // 该好友已满5人助力，无需您再次助力
        console.log(`该好友${response.result.masterNickName}已满5人助力，无需您再次助力`)
      } else {
        console.log(`助力其他情况：${JSON.stringify(response)}`)
      }
    } else {
      console.log(`助理好友结果: ${response.message}`)
    }
  }
  if (helpPeoples && helpPeoples.length > 0) {
    message += `【您助力的好友】${helpPeoples.substr(0, helpPeoples.length - 1)}\n`
  }
}

// 遛狗, 每天次数上限10次, 随机给狗粮, 每次遛狗结束需调用getSportReward领取奖励, 才能进行下一次遛狗
async function petSport() {
  console.log('开始遛弯')
  let times = 1
  const code = 0
  let resultCode = 0
  do {
    const response = await request(arguments.callee.name.toString())
    console.log(`第${times}次遛狗完成: ${JSON.stringify(response)}`)
    resultCode = response.resultCode
    if (resultCode === 0) {
      const sportRevardResult = await request('getSportReward')
      console.log(`领取遛狗奖励完成: ${JSON.stringify(sportRevardResult)}`)
    }
    times++
  } while (resultCode === 0 && code === 0)
  if (times > 1) {
    // message += '【十次遛狗】已完成\n';
  }
}

// 初始化任务, 可查询任务完成情况
async function taskInit() {
  console.log('开始任务初始化')
  $.taskInit = await request(arguments.callee.name.toString(), { 'version': 1 })
}

// 每日签到, 每天一次
async function signInitFun() {
  console.log('准备每日签到')
  const response = await request('getSignReward')
  console.log(`每日签到结果: ${JSON.stringify(response)}`)
  if (response.code === '0' && response.resultCode === '0') {
    console.log(`【每日签到成功】奖励${response.result.signReward}g狗粮\n`)
    // message += `【每日签到成功】奖励${response.result.signReward}g狗粮\n`;
  } else {
    console.log(`【每日签到】${response.message}\n`)
    // message += `【每日签到】${response.message}\n`;
  }
}

// 三餐签到, 每天三段签到时间
async function threeMealInitFun() {
  console.log('准备三餐签到')
  const response = await request('getThreeMealReward')
  console.log(`三餐签到结果: ${JSON.stringify(response)}`)
  if (response.code === '0' && response.resultCode === '0') {
    console.log(`【定时领狗粮】获得${response.result.threeMealReward}g\n`)
    // message += `【定时领狗粮】获得${response.result.threeMealReward}g\n`;
  } else {
    console.log(`【定时领狗粮】${response.message}\n`)
    // message += `【定时领狗粮】${response.message}\n`;
  }
}

// 浏览指定店铺 任务
async function browseSingleShopInit(item) {
  console.log(`开始做 ${item.title} 任务， ${item.desc}`)
  const body = { 'index': item['index'], 'version': 1, 'type': 1 }
  const body2 = { 'index': item['index'], 'version': 1, 'type': 2 }
  const response = await request('getSingleShopReward', body)
  // console.log(`点击进去response::${JSON.stringify(response)}`);
  if (response.code === '0' && response.resultCode === '0') {
    const response2 = await request('getSingleShopReward', body2)
    // console.log(`浏览完毕领取奖励:response2::${JSON.stringify(response2)}`);
    if (response2.code === '0' && response2.resultCode === '0') {
      console.log(`【浏览指定店铺】获取${response2.result.reward}g\n`)
      // message += `【浏览指定店铺】获取${response2.result.reward}g\n`;
    }
  }
}

// 浏览店铺任务, 任务可能为多个? 目前只有一个
async function browseShopsInitFun() {
  console.log('开始浏览店铺任务')
  let times = 0
  let resultCode = 0
  let code = 0
  do {
    const response = await request('getBrowseShopsReward')
    console.log(`第${times}次浏览店铺结果: ${JSON.stringify(response)}`)
    code = response.code
    resultCode = response.resultCode
    times++
  } while (resultCode === 0 && code === 0 && times < 5)
  console.log('浏览店铺任务结束')
}

// 首次投食 任务
function firstFeedInitFun() {
  console.log('首次投食任务合并到10次喂食任务中\n')
}

// 邀请新用户
async function inviteFriendsInitFun() {
  console.log('邀请新用户功能未实现')
  if ($.taskInfo.inviteFriendsInit.status === 1 && $.taskInfo.inviteFriendsInit.inviteFriendsNum > 0) {
    // 如果有邀请过新用户,自动领取60gg奖励
    const res = await request('getInviteFriendsReward')
    if (res.code === 0 && res.resultCode === 0) {
      console.log(`领取邀请新用户奖励成功,获得狗粮现有狗粮${$.taskInfo.inviteFriendsInit.reward}g，${res.result.foodAmount}g`)
      message += `【邀请新用户】获取狗粮${$.taskInfo.inviteFriendsInit.reward}g\n`
    }
  }
}

/**
 * 投食10次 任务
 */
async function feedReachInitFun() {
  console.log('投食任务开始...')
  const finishedTimes = $.taskInfo.feedReachInit.hadFeedAmount / 10 // 已经喂养了几次
  let needFeedTimes = 10 - finishedTimes // 还需要几次
  let tryTimes = 20 // 尝试次数
  do {
    console.log(`还需要投食${needFeedTimes}次`)
    const response = await request('feedPets')
    console.log(`本次投食结果: ${JSON.stringify(response)}`)
    if (response.resultCode === 0 && response.code === 0) {
      needFeedTimes--
    }
    if (response.resultCode === 3003 && response.code === 0) {
      console.log('剩余狗粮不足, 投食结束')
      needFeedTimes = 0
    }
    tryTimes--
  } while (needFeedTimes > 0 && tryTimes > 0)
  console.log('投食任务结束...\n')
}

async function showMsg() {
  let ctrTemp
  if ($.isNode() && process.env.PET_NOTIFY_CONTROL) {
    ctrTemp = `${process.env.PET_NOTIFY_CONTROL}` === 'false'
  } else if ($.getdata('jdPetNotify')) {
    ctrTemp = $.getdata('jdPetNotify') === 'false'
  } else {
    ctrTemp = `${jdNotify}` === 'false'
  }
  // jdNotify = `${notify.petNotifyControl}` === 'false' && `${jdNotify}` === 'false' && $.getdata('jdPetNotify') === 'false';
  if (ctrTemp) {
    $.msg($.name, subTitle, message, option)
    if ($.isNode()) {
      await notify.sendNotify(`${$.name} - 账号${$.index} - ${$.nickName}`, `${subTitle}\n${message}`)
    }
  } else {
    $.log(`\n${message}\n`)
  }
}

function readShareCode() {
  return new Promise(resolve => {
    $.get({ url: `http://api.turinglabs.net/api/v1/jd/pet/read/${randomCount}/` }, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (data) {
            console.log(`随机取个${randomCount}码放到您固定的互助码后面`)
            data = JSON.parse(data)
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

function shareCodesFormat() {
  return new Promise(async resolve => {
    // console.log(`第${$.index}个京东账号的助力码:::${jdPetShareArr[$.index - 1]}`)
    newShareCodes = []
    if (jdPetShareArr[$.index - 1]) {
      newShareCodes = jdPetShareArr[$.index - 1].split('@')
    } else {
      console.log(`由于您第${$.index}个京东账号未提供shareCode,将采纳本脚本自带的助力码\n`)
      const tempIndex = $.index > shareCodes.length ? (shareCodes.length - 1) : ($.index - 1)
      if (shareCodes[tempIndex]) {
        newShareCodes = shareCodes[tempIndex].split('@')
      }
    }
    const readShareCodeRes = await readShareCode()
    if (readShareCodeRes && readShareCodeRes.code === 200) {
      // newShareCodes = newShareCodes.concat(readShareCodeRes.data || []);
      newShareCodes = [...new Set([...newShareCodes, ...(readShareCodeRes.data || [])])]
    }
    console.log(`第${$.index}个京东账号将要助力的好友${JSON.stringify(newShareCodes)}`)
    resolve()
  })
}

function requireConfig() {
  return new Promise(resolve => {
    console.log('开始获取东东萌宠配置文件\n')
    notify = require('../../utils/sendNotify')
    // Node.js用户请在jdCookie.js处填写京东ck;
    const jdCookieNode = $.isNode() ? require('../../utils/jdCookie') : ''
    const jdPetShareCodes = $.isNode() ? require('./jdPetShareCodes.js') : ''
    // IOS等用户直接用NobyDa的jd cookie
    if ($.isNode()) {
      Object.keys(jdCookieNode).forEach((item) => {
        if (jdCookieNode[item]) {
          cookiesArr.push(jdCookieNode[item])
        }
      })
      if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') {
        console.log = () => {
        }
      }
    } else {
      cookiesArr.push(...[$.getdata('CookieJD'), $.getdata('CookieJD2')])
    }
    console.log(`共${cookiesArr.length}个京东账号\n`)
    if ($.isNode()) {
      Object.keys(jdPetShareCodes).forEach((item) => {
        if (jdPetShareCodes[item]) {
          jdPetShareArr.push(jdPetShareCodes[item])
        }
      })
    } else {
      const boxShareCodeArr = ['jd_pet1', 'jd_pet2', 'jd_pet3', 'jd_pet4', 'jd_pet5']
      const boxShareCodeArr2 = ['jd2_pet1', 'jd2_pet2', 'jd2_pet3', 'jd2_pet4', 'jd2_pet5']
      const isBox1 = boxShareCodeArr.some((item) => {
        const boxShareCode = $.getdata(item)
        return (boxShareCode !== undefined && boxShareCode !== null && boxShareCode !== '')
      })
      const isBox2 = boxShareCodeArr2.some((item) => {
        const boxShareCode = $.getdata(item)
        return (boxShareCode !== undefined && boxShareCode !== null && boxShareCode !== '')
      })
      isBox = isBox1 || isBox2
      if (isBox1) {
        const temp = []
        for (const item of boxShareCodeArr) {
          if ($.getdata(item)) {
            temp.push($.getdata(item))
          }
        }
        jdPetShareArr.push(temp.join('@'))
      }
      if (isBox2) {
        const temp = []
        for (const item of boxShareCodeArr2) {
          if ($.getdata(item)) {
            temp.push($.getdata(item))
          }
        }
        jdPetShareArr.push(temp.join('@'))
      }
    }
    // console.log(`jdPetShareArr::${JSON.stringify(jdPetShareArr)}`)
    // console.log(`jdPetShareArr账号长度::${jdPetShareArr.length}`)
    console.log(`您提供了${jdPetShareArr.length}个账号的东东萌宠助力码\n`)
    resolve()
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

// 请求
async function request(function_id, body = {}) {
  await $.wait(3000) // 歇口气儿, 不然会报操作频繁
  return new Promise((resolve, reject) => {
    $.get(taskUrl(function_id, body), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n东东萌宠: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err))
          $.logErr(err)
        } else {
          data = JSON.parse(data)
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data)
      }
    })
  })
}

function taskUrl(function_id, body = {}) {
  return {
    url: `${JD_API_HOST}?functionId=${function_id}&appid=wh5&loginWQBiz=pet-town&body=${escape(JSON.stringify(body))}`,
    headers: {
      Cookie: cookie,
      UserAgent: `Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1`
    }
  }
}
