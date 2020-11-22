/*
京东金融领白条券
更新时间：2020-11-13 08:30
[task_local]
# 京东金融领白条券  9点执行（非天天领券要9点开始领）
0 9 * * * https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/scripts/jd/jd_baiTiao.js, tag=京东白条, img-url=https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/image/baitiao.png, enabled=true
*/
const { Env } = require('../../utils/Env')
const $ = new Env('天天领白条券')
const jdCookieNode = require('../../utils/jdCookie.js')
// 直接用NobyDa的jd cookie
const cookiesArr = []
let cookie = ''
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
} else {
  cookiesArr.push($.getdata('CookieJD'))
  cookiesArr.push($.getdata('CookieJD2'))
}
const JR_API_HOST = 'https://jrmkt.jd.com/activity/newPageTake/takePrize'
const prize =
  // 每日领随机白条券
  [
    { name: `prizeDaily`, desc: `天天领`, id: `Q72m9P5k3K94223q5k5O1w228U2S8B040D2B9qt` },
    // 周一领
    { name: `prizeMonday`, desc: `周一领`, id: `Q1295372232228280029Aw` },
    // 周二领
    { name: `prizeTuesday`, desc: `周二领`, id: `Q9293947555491r1b3U870x0D2V95X` },
    // 周三领
    { name: `prizeWednesday`, desc: `周三领`, id: `Q8299679592g5N1Y1r3j8X0004269Ll` },
    // 周四领
    { name: `prizeThursday`, desc: `周四领`, id: `X9D2l0f0P8S31154947512923QU` },
    // 每周五领55-5券
    { name: `prizeFriday`, desc: `周五领`, id: `Q529284818011r8O2Y8L07082T9kE` },
    // 周六领
    { name: `prizeSaturday`, desc: `周六领`, id: `i9200831161952186922QB` },
    // 周六领2
    { name: `prizeSaturday2`, desc: `周六领`, id: `Q4295706b5Q9t2D6F181k3x8Q0v0W2e9JK` }
  ]

!(async() => {
  if (!cookiesArr[0]) {
    $.msg($.name, '提示：请先获取cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', { 'open-url': 'https://bean.m.jd.com/' })
    return
  }

  for (let i = 0; i < prize.length; i++) {
    prize[i].body = `activityId=${prize[i].id}&eid=${randomWord(false, 90).toUpperCase()}&fp=${randomWord(false, 32).toLowerCase()}`
  }

  for (let i = 0; i < cookiesArr.length; i++) {
    cookie = cookiesArr[i]
    if (cookie) {
      $.prize = { addMsg: `` }
      const date = new Date()
      await takePrize(prize[0])
      if ($.prize['prizeDaily'].respCode === '00001') {
        $.msg($.name, '提示：请先获取cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', { 'open-url': 'https://bean.m.jd.com/' })
        continue
      }
      if (date.getDay() !== 0) {
        await takePrize(prize[date.getDay()], 820) // 延迟执行，防止提示活动火爆
        if (date.getDay() === 6) await takePrize(prize[7], 820) // 第二个周六券
      }
      if (date.getDay() === 0) {
        $.prize.addMsg = `提醒：请于今天使用周日专享白条券\n`
      }
      await queryMissionWantedDetail()
      await msgShow()
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
  })
  .finally(() => {
    $.done()
  })

function takePrize(prize, timeout = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const url = {
        url: JR_API_HOST,
        body: prize.body,
        headers: {
          'Cookie': cookie,
          'X-Requested-With': `XMLHttpRequest`,
          'Accept': `application/json, text/javascript, */*; q=0.01`,
          'Origin': `https://jrmkt.jd.com`,
          'Accept-Encoding': `gzip, deflate, br`,
          'Content-Type': `application/x-www-form-urlencoded;charset=UTF-8`,
          'Host': `jrmkt.jd.com`,
          'Connection': `keep-alive`,
          'Referer': `https://jrmkt.jd.com/ptp/wl/vouchers.html?activityId=${prize.id}`,
          'Accept-Language': `zh-cn`
        }
      }
      // eslint-disable-next-line handle-callback-err
      $.post(url, (err, resp, data) => {
        try {
          data = JSON.parse(data)
          $.prize[prize.name] = data
          $.prize[prize.name].desc = prize.desc
        } catch (e) {
          $.logErr(e, resp)
        } finally {
          resolve()
        }
      })
    }, timeout)
  })
}

function queryMissionWantedDetail(timeout = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const url = {
        url: `https://ms.jr.jd.com/gw/generic/mission/h5/m/queryMissionWantedDetail?reqData=%7B%22playId%22:%2281%22,%22channelCode%22:%22MISSIONCENTER%22,%22timeStamp%22:%2${$.time(`yyyy-MM-ddTHH:mm:ss.SZ`)}%22%7D`,
        headers: {
          'Cookie': cookie,
          'Origin': `https://m.jr.jd.com`,
          'Connection': `keep-alive`,
          'Accept': `application/json`,
          'Referer': `https://m.jr.jd.com/member/task/RewardDetail/?playId=81&platformCode=MISSIONCENTER&channel=baitiao&jrcontainer=h5&jrcloseweb=false`,
          'Host': `ms.jr.jd.com`,
          'Accept-Encoding': `gzip, deflate, br`,
          'Accept-Language': `zh-cn`
        }
      }
      // eslint-disable-next-line handle-callback-err
      $.post(url, async(err, resp, data) => {
        try {
          data = JSON.parse(data)
          switch (data.resultData.data.mission.status) {
            case -1 :
              $.prize.addMsg += `周任务：${data.resultData.data.mission.name}`
              await receivePlay(data.resultData.data.mission.missionId)
              break
            case 0 : // 2已完成  -1未领取  0已领取
              $.prize.addMsg += `周任务：完成进度${data.resultData.data.mission.scheduleNowValue || 0}/${data.resultData.data.mission.scheduleTargetValue}，剩余数量：${data.resultData.data.residueAwardNum || `未知`}\n`
              break
            case 1 : //
              $.prize.addMsg += `周任务：完成进度${data.resultData.data.mission.scheduleNowValue || 0}/${data.resultData.data.mission.scheduleTargetValue}，剩余数量：${data.resultData.data.residueAwardNum || `未知`}\n`
              break
          }
        } catch (e) {
          $.logErr(e, resp)
        } finally {
          resolve()
        }
      })
    }, timeout)
  })
}

function receivePlay(missionId, timeout = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const url = {
        url: `https://ms.jr.jd.com/gw/generic/mission/h5/m/receivePlay?reqData=%7B%22playId%22:%2281%22,%22channelCode%22:%22MISSIONCENTER%22,%22playType%22:1,%22missionId%22:${missionId},%22timeStamp%22:%22${$.time(`yyyy-MM-ddTHH:mm:ss.SZ`)}%22%7D`,
        headers: {
          'Cookie': cookie,
          'Origin': `https://m.jr.jd.com`,
          'Connection': `keep-alive`,
          'Accept': `application/json`,
          'Referer': `https://m.jr.jd.com/member/task/RewardDetail/?playId=81&platformCode=MISSIONCENTER&channel=baitiao&jrcontainer=h5&jrcloseweb=false`,
          'Host': `ms.jr.jd.com`,
          'Accept-Encoding': `gzip, deflate, br`,
          'Accept-Language': `zh-cn`
        }
      }
      // eslint-disable-next-line handle-callback-err
      $.post(url, (err, resp, data) => {
        try {
          data = JSON.parse(data)
          $.prize.addMsg += `-${data.resultData.msg.replace(`该任务`, ``)}\n`
        } catch (e) {
          $.logErr(e, resp)
        } finally {
          resolve()
        }
      })
    }, timeout)
  })
}

function randomWord(randomFlag, min, max) {
  let str = ''
  let range = min
  const arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
  // 随机产生
  if (randomFlag) {
    range = Math.round(Math.random() * (max - min)) + min
  }
  for (let i = 0; i < range; i++) {
    const pos = Math.round(Math.random() * (arr.length - 1))
    str += arr[pos]
  }
  return str
}

function msgShow() {
  const url = { 'open-url': 'jdmobile://share?jumpType=7&jumpUrl=https%3A%2F%2Fm.jr.jd.com%2Fmember%2Fmc%2F%23%2Fhome' }
  $.message = ''
  for (const i in $.prize) {
    if (typeof ($.prize[i]) !== 'object') continue
    if ($.message === '') $.message = `用户名：${$.prize[i].nickName}\n`
    if ($.prize[i].respCode === '00000') {
      $.message += `${$.prize[i].desc}：${$.prize[i].prizeModels[0].prizeName + $.prize[i].prizeModels[0].prizeAward}\n`
    } else {
      $.message += `${$.prize[i].desc}：${typeof ($.prize[i].failDesc) === 'undefined' ? $.prize[i].respDesc : $.prize[i].failDesc}\n`
    }
  }
  $.message += $.prize.addMsg ? $.prize.addMsg : ''
  $.msg($.name, '', `${$.message.substr(0, $.message.length - 1)}`, url)
}
