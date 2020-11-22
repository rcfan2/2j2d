/*
脚本：取关京东店铺和商品
更新时间：2020-11-03
因种豆得豆和宠汪汪以及NobyDa大佬的京东签到脚本会关注店铺和商品，故此脚本用来取消已关注的店铺和商品
默认每运行一次脚本取消关注10个商品，10个店铺。可结合boxjs自定义取消多少个（目前测试通过最大数量是一次性取消300个商品无异常，大于300请自行测试，建议尽量不要一次性全部取消以免出现问题）。
建议此脚本运行时间在 种豆得豆和宠汪汪脚本运行之后 再执行
现有功能: 1、取关商品。2、取关店铺。3、匹配到boxjs输入的过滤关键词后，不再进行此商品/店铺后面(包含输入的关键词商品/店铺)的取关。4、支持京东双账号
脚本兼容: Quantumult X, Surge, Loon, JSBox, Node.js
// Quantumult X
[task_local]
#取关京东店铺商品
55 23 * * * https://raw.githubusercontent.com/lxk0301/scripts/master/jd_unsubscribe.js, tag=取关京东店铺商品, enabled=true
// Loon
[Script]
cron "55 23 * * *" script-path=https://raw.githubusercontent.com/lxk0301/scripts/master/jd_unsubscribe.js,tag=取关京东店铺商品
// Surge
取关京东店铺商品 = type=cron,cronexp="55 23 * * *",wake-system=1,timeout=20,script-path=https://raw.githubusercontent.com/lxk0301/scripts/master/jd_unsubscribe.js
 */
const { Env } = require('../../utils/Env')
const $ = new Env('取关京东店铺和商品')
// Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = require('../../utils/jdCookie')
const notify = require('../../utils/sendNotify')

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
const jdNotify = $.getdata('jdUnsubscribeNotify')// 是否关闭通知，false打开通知推送，true关闭通知推送
let goodPageSize = $.getdata('jdUnsubscribePageSize') || 20// 运行一次取消多少个已关注的商品。数字0表示不取关任何商品
let shopPageSize = $.getdata('jdUnsubscribeShopPageSize') || 20// 运行一次取消多少个已关注的店铺。数字0表示不取关任何店铺
let stopGoods = $.getdata('jdUnsubscribeStopGoods') || ''// 遇到此商品不再进行取关，此处内容需去商品详情页（自营处）长按拷贝商品信息
let stopShop = $.getdata('jdUnsubscribeStopShop') || ''// 遇到此店铺不再进行取关，此处内容请尽量从头开始输入店铺名称
const JD_API_HOST = 'https://wq.jd.com/fav'
!(async() => {
  if (!cookiesArr[0]) {
    $.msg('【京东账号一】取关京东店铺商品失败', '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', { 'open-url': 'https://bean.m.jd.com/' })
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
      await requireConfig()
      await jdUnsubscribe()
      await showMsg()
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
  })
  .finally(() => {
    $.done()
  })

async function jdUnsubscribe(doubleKey) {
  await Promise.all([
    unsubscribeGoods(doubleKey),
    unsubscribeShops()
  ])
  await Promise.all([
    getFollowShops(),
    getFollowGoods()
  ])
}

function showMsg() {
  if (!jdNotify || jdNotify === 'false') {
    $.msg($.name, ``, `【京东账号${$.index}】${$.nickName}\n【已取消关注店铺】${$.unsubscribeShopsCount}个\n【已取消关注商品】${$.unsubscribeGoodsCount}个\n【还剩关注店铺】${$.shopsTotalNum}个\n【还剩关注商品】${$.goodsTotalNum}个\n`)
  } else {
    $.log(`\n【京东账号${$.index}】${$.nickName}\n【已取消关注店铺】${$.unsubscribeShopsCount}个\n【已取消关注商品】${$.unsubscribeGoodsCount}个\n【还剩关注店铺】${$.shopsTotalNum}个\n【还剩关注商品】${$.goodsTotalNum}个\n`)
  }
}

function unsubscribeGoods() {
  return new Promise(async(resolve) => {
    const followGoods = await getFollowGoods()
    if (followGoods.iRet === '0') {
      let count = 0
      $.unsubscribeGoodsCount = count
      if ((goodPageSize * 1) !== 0) {
        if (followGoods.totalNum > 0) {
          for (const item of followGoods.data) {
            console.log(`是否匹配：：${item.commTitle.indexOf(stopGoods.replace(/\ufffc|\s*/g, ''))}`)

            if (stopGoods && item.commTitle.indexOf(stopGoods.replace(/\ufffc|\s*/g, '')) === 0) {
              console.log(`匹配到了您设定的商品--${stopGoods}，不在进行取消关注商品`)
              break
            }
            const res = await unsubscribeGoodsFun(item.commId)
            // console.log('取消关注商品结果', res);
            if (res.iRet === 0 && res.errMsg === 'success') {
              console.log(`取消关注商品---${item.commTitle.substring(0, 20).concat('...')}---成功\n`)
              count++
            } else {
              console.log(`取消关注商品---${item.commTitle.substring(0, 20).concat('...')}---失败\n`)
            }
          }
          $.unsubscribeGoodsCount = count
          resolve(count)
        } else {
          resolve(count)
        }
      } else {
        console.log(`\n您设置的是不取关商品\n`)
        resolve(count)
      }
    }
  })
}

function getFollowGoods() {
  return new Promise((resolve) => {
    const option = {
      url: `${JD_API_HOST}/comm/FavCommQueryFilter?cp=1&pageSize=${goodPageSize}&category=0&promote=0&cutPrice=0&coupon=0&stock=0&areaNo=1_72_4139_0&sceneval=2&g_login_type=1&callback=jsonpCBKB&g_ty=ls`,
      headers: {
        'Host': 'wq.jd.com',
        'Accept': '*/*',
        'Connection': 'keep-alive',
        'Cookie': cookie,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1',
        'Accept-Language': 'zh-cn',
        'Referer': 'https://wqs.jd.com/my/fav/goods_fav.shtml?ptag=37146.4.1&sceneval=2&jxsid=15963530166144677970',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    }
    $.get(option, (err, resp, data) => {
      try {
        data = JSON.parse(data.slice(14, -13))
        $.goodsTotalNum = data.totalNum
        // console.log('data', data.data.length)
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data)
      }
    })
  })
}

function unsubscribeGoodsFun(commId) {
  return new Promise(resolve => {
    const option = {
      url: `${JD_API_HOST}/comm/FavCommDel?commId=${commId}&_=${Date.now()}&sceneval=2&g_login_type=1&callback=jsonpCBKP&g_ty=ls`,
      headers: {
        'Host': 'wq.jd.com',
        'Accept': '*/*',
        'Connection': 'keep-alive',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1',
        'Referer': 'https://wqs.jd.com/my/fav/goods_fav.shtml?ptag=37146.4.1&sceneval=2&jxsid=15963530166144677970',
        'Cookie': cookie,
        'Accept-Language': 'zh-cn',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    }
    $.get(option, (err, resp, data) => {
      try {
        data = JSON.parse(data.slice(14, -13).replace(',}', '}'))
        // console.log('data', data);
        // console.log('data', data.errMsg);
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data)
      }
    })
  })
}

function unsubscribeShops() {
  return new Promise(async(resolve) => {
    const followShops = await getFollowShops()
    if (followShops.iRet === '0') {
      let count = 0
      $.unsubscribeShopsCount = count
      if ((shopPageSize * 1) !== 0) {
        if (followShops.totalNum > 0) {
          for (const item of followShops.data) {
            if (stopShop && (item.shopName && item.shopName.indexOf(stopShop.replace(/\s*/g, '')) > -1)) {
              console.log(`匹配到了您设定的店铺--${item.shopName}，不在进行取消关注店铺`)
              break
            }
            const res = await unsubscribeShopsFun(item.shopId)
            // console.log('取消关注店铺结果', res);
            if (res.iRet === '0') {
              console.log(`取消已关注店铺---${item.shopName}----成功\n`)
              count++
            } else {
              console.log(`取消已关注店铺---${item.shopName}----失败\n`)
            }
          }
          $.unsubscribeShopsCount = count
          resolve(count)
        } else {
          resolve(count)
        }
      } else {
        console.log(`\n您设置的是不取关店铺\n`)
        resolve(count)
      }
    }
  })
}

function getFollowShops() {
  return new Promise((resolve) => {
    const option = {
      url: `${JD_API_HOST}/shop/QueryShopFavList?cp=1&pageSize=${shopPageSize}&sceneval=2&g_login_type=1&callback=jsonpCBKA&g_ty=ls`,
      headers: {
        'Host': 'wq.jd.com',
        'Accept': '*/*',
        'Connection': 'keep-alive',
        'Cookie': cookie,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1',
        'Accept-Language': 'zh-cn',
        'Referer': 'https://wqs.jd.com/my/fav/shop_fav.shtml?sceneval=2&jxsid=15963530166144677970&ptag=7155.1.9',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    }
    $.get(option, (err, resp, data) => {
      try {
        data = JSON.parse(data.slice(14, -13))
        $.shopsTotalNum = data.totalNum
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data)
      }
    })
  })
}

function unsubscribeShopsFun(shopId) {
  return new Promise(resolve => {
    const option = {
      url: `${JD_API_HOST}/shop/DelShopFav?shopId=${shopId}&_=${Date.now()}&sceneval=2&g_login_type=1&callback=jsonpCBKG&g_ty=ls`,
      headers: {
        'Host': 'wq.jd.com',
        'Accept': '*/*',
        'Connection': 'keep-alive',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1',
        'Referer': 'https://wqs.jd.com/my/fav/shop_fav.shtml?sceneval=2&jxsid=15960121319555534107&ptag=7155.1.9',
        'Cookie': cookie,
        'Accept-Language': 'zh-cn',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    }
    $.get(option, (err, resp, data) => {
      try {
        data = JSON.parse(data.slice(14, -13))
      } catch (e) {
        $.logErr(e, resp)
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

function requireConfig() {
  return new Promise(resolve => {
    if ($.isNode() && process.env.UN_SUBSCRIBES) {
      if (process.env.UN_SUBSCRIBES.indexOf('&') > -1) {
        $.UN_SUBSCRIBES = process.env.UN_SUBSCRIBES.split('&')
      } else if (process.env.UN_SUBSCRIBES.indexOf('\n') > -1) {
        $.UN_SUBSCRIBES = process.env.UN_SUBSCRIBES.split('\n')
      } else if (process.env.UN_SUBSCRIBES.indexOf('\\n') > -1) {
        $.UN_SUBSCRIBES = process.env.UN_SUBSCRIBES.split('\\n')
      } else {
        $.UN_SUBSCRIBES = process.env.UN_SUBSCRIBES.split()
      }
      console.log(`您secret设置的取关参数:\n${JSON.stringify($.UN_SUBSCRIBES)}`)
      goodPageSize = $.UN_SUBSCRIBES[0] || goodPageSize
      shopPageSize = $.UN_SUBSCRIBES[1] || shopPageSize
      stopGoods = $.UN_SUBSCRIBES[2] || stopGoods
      stopShop = $.UN_SUBSCRIBES[3] || stopShop
    }
    resolve()
  })
}
