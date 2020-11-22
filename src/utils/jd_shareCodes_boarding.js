// 京东助力码上车
const BASE_BOARDING_URL = 'http://api.turinglabs.net/api/v1/jd/@type/create/@shareCode'
const TIMEOUT = 2000
const moment = require('moment')

const { Env } = require('./Env')
const $ = new Env('助力码上车')
const notify = require('./sendNotify')
const { shareCodes } = require('./ShareCode')

const shareCodeMap = {
  bean: shareCodes.map(it => it.plantBean),
  farm: shareCodes.map(it => it.fruits),
  pet: shareCodes.map(it => it.pet)
}

const SHARE_CODE_DESC = {
  'bean': '种豆得豆',
  'farm': '东东农场',
  'pet': '东东萌宠'
}

const taskurl = (url) => {
  return {
    'url': url,
    'headers': {
      'accept': '*/*',
      'accept-encoding': 'gzip, deflate, br',
      'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
      'referer': 'http://api.turinglabs.net/',
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1 Edg/84.0.4147.125'
    }
  }
}

/**
 * 上车
 * @param shareCode 助力码
 * @param type 类型
 * @return {Promise<void>}
 */
const boarding = (shareCode, type) => {
  const url = BASE_BOARDING_URL
    .replace('@type', type)
    .replace('@shareCode', shareCode)
  return new Promise((resolve) => {
    $.get(taskurl(url), (err, resp, data) => {
      if (err) {
        $.logErr(err, resp)
      }
      try {
        data = JSON.parse(data)
        if (data.code === 200) {
          const msg = `助力码[${shareCode}]上车成功，上车时间：${moment().format('yyyy-MM-DD HH:mm:ss')}`
          $.msg(msg)
          message += `${msg}\n`
        } else {
          const msg = `助力码[${shareCode}]上车失败，原因：${data.message}`
          message += `${msg}\n`
          $.msg(msg)
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data)
      }
    })
  })
}

let title = ''
let message = ''

!(async() => {
  const types = Object.keys(shareCodeMap)
  for (let i = 0; i < types.length; i++) {
    const type = types[i]
    const taskName = SHARE_CODE_DESC[type]
    const shareCodes = shareCodeMap[type]
    if (shareCodes) {
      $.msg(`您提供了[${taskName}]的${shareCodes.length}个助力码，开始上车`)
      title = `${taskName} - \n`
      message = ''
      for (let j = 0; j < shareCodes.length; j++) {
        const shareCode = shareCodes[j]
        await boarding(shareCode, type)
        console.log('等待2s。。。')
        // 延时2s
        setTimeout(__ => __, TIMEOUT)
      }
      await notify.sendNotify(title, message)
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
  })
  .finally(() => {
    $.done()
  })
