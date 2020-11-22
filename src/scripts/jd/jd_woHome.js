/*
东东小窝
更新时间：2020-11-22 07:36
脚本说明：东东小窝任务，其中有加购，暂未提供关闭选项，使用本脚本会导致购物车中出现各种商品，介意的请停止使用，后期看情况可能会添加关闭加购任务的功能
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
// quantumultx
[task_local]
#东东小窝
11 0 * * * https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/scripts/jd/jd_woHome.js, tag=东东小窝, img-url=https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/image/woHome.png, enabled=true
// Loon
[Script]
cron "11 0 * * *" script-path=https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/scripts/jd/jd_woHome.js,tag=东东小窝
// Surge
东东小窝 = type=cron,cronexp=11 0 * * *,wake-system=1,timeout=20,script-path=https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/scripts/jd/jd_woHome.js
 */
const { Env } = require('../../utils/Env')
const $ = new Env('东东小窝')
// Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = require('../../utils/jdCookie')
// const coinToBeans = $.getdata('coinToBeans') || 20; //
// const STRSPLIT = "|";      //分隔符
// const needSum = false;     //是否需要显示汇总
const printDetail = false// 是否显示出参详情
const funArr = ['', 'createAssistUser', 'clock', 'game', 'followShops', 'browseShops', 'followChannel', 'browseChannels', '', 'purchaseCommodities', 'browseCommodities', 'browseMeetings']
let merge = {}
let token = ''
let userName = ''
// IOS等用户直接用NobyDa的jd cookie
const cookiesArr = []; let cookie = ''
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
} else {
  cookiesArr.push($.getdata('CookieJD'))
  cookiesArr.push($.getdata('CookieJD2'))
}

const JD_API_HOST = `https://lkyl.dianpusoft.cn/api/`
!(async() => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', { 'open-url': 'https://bean.m.jd.com/' })
    return
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    cookie = cookiesArr[i]
    if (cookie) {
      if (i) console.log(`\n***************开始京东账号${i + 1}***************`)
      initial()
      await QueryJDUserInfo()
      if (!merge.enabled) // cookie不可用
      {
        $.setdata('', `CookieJD${i ? i + 1 : ''}`)// cookie失效，故清空cookie。
        $.msg($.name, `【提示】京东账号${i + 1} cookie已过期！请先获取cookie\n直接使用NobyDa的京东签到获取`, 'https://bean.m.jd.com/', { 'open-url': 'https://bean.m.jd.com/' })
        continue
      }
      await encrypt()
      await msgShow()
    }
  }
})()
  .catch((e) => $.logErr(e))
  .finally(() => $.done())

// 获取昵称
function QueryJDUserInfo(timeout = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const url = {
        url: `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
        headers: {
          'Referer': `https://wqs.jd.com/my/iserinfo.html`,
          'Cookie': cookie
        }
      }
      $.get(url, (err, resp, data) => {
        try {
          // if (printDetail) console.log(data)
          data = JSON.parse(data)
          if (data.retcode === 13) {
            merge.enabled = false
            return
          }
          merge.nickname = data.base.nickname
        } catch (e) {
          $.logErr(e, resp)
        } finally {
          resolve()
        }
      })
    }, timeout)
  })
}

// 登录
function login(timeout = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const url = {
        url: `${JD_API_HOST}user-info/login`,
        headers: {
          'Origin': `https://lkyl.dianpusoft.cn`,
          'Cookie': cookie,
          'Connection': `keep-alive`,
          'Content-Type': `application/json`,
          'Referer': `https://lkyl.dianpusoft.cn/client/?lkEPin=`,
          'Host': `lkyl.dianpusoft.cn`,
          'Accept-Encoding': `gzip, deflate, br`,
          'Accept-Language': `zh-cn`
        },
        body: `{"body": {"client": 2,"userName": "${userName}"}}`
      }
      $.post(url, async(err, resp, data) => {
        try {
          if (printDetail) console.log(data)
          data = JSON.parse(data)
          if (data.head.code === 200) {
            token = data.head.token
            await queryByUserId()
            if (merge.newUser) return
            await queryDraw()
            await queryAllTaskInfo()
            await queryByUserId()
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

function queryByUserId(timeout = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const url = {
        url: `${JD_API_HOST}ssjj-wo-home-info/queryByUserId/2?body=%7B%7D`,
        headers: {
          'Origin': `https://lkyl.dianpusoft.cn`,
          'Cookie': cookie,
          'Connection': `keep-alive`,
          'Content-Type': `application/json`,
          'Referer': `https://lkyl.dianpusoft.cn/client/?lkEPin=`,
          'Host': `lkyl.dianpusoft.cn`,
          'Accept-Encoding': `gzip, deflate, br`,
          'Accept-Language': `zh-cn`,
          'token': token
        }
      }
      $.get(url, async(err, resp, data) => {
        try {
          if (printDetail) console.log(data)
          data = JSON.parse(data)
          if (!data.body.id) {
            merge.newUser = true
          }
          if (typeof (merge.start) === 'undefined') {
            merge.start = data.body.woB
          } else {
            merge.end = data.body.woB
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

function queryAllTaskInfo(type = '', timeout = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const url = {
        url: `${JD_API_HOST}ssjj-task-info/queryAllTaskInfo/2?body=%7B%7D`,
        headers: {
          'Origin': `https://lkyl.dianpusoft.cn`,
          'Cookie': cookie,
          'Connection': `keep-alive`,
          'Content-Type': `application/json`,
          'Referer': `https://lkyl.dianpusoft.cn/client/?lkEPin=`,
          'Host': `lkyl.dianpusoft.cn`,
          'Accept-Encoding': `gzip, deflate, br`,
          'Accept-Language': `zh-cn`,
          'token': token
        }
      }
      $.get(url, async(err, resp, data) => {
        try {
          if (printDetail) console.log(data)
          data = JSON.parse(data)
          if (data.head.code === 200) {
            for (const i in data.body) {
              if (type !== '' && data.body[i].ssjjTaskInfo.type !== type) continue
              console.log(`${data.body[i].ssjjTaskInfo.type}-${data.body[i].ssjjTaskInfo.name}`)
              if (data.body[i].doneNum < (data.body[i].ssjjTaskInfo.awardOfDayNum || 1)) {
                if (data.body[i].browseId) {
                  await task_record(funArr[data.body[i].ssjjTaskInfo.type], `${data.body[i].ssjjTaskInfo.id}/${data.body[i].browseId}`)
                  await queryAllTaskInfo(data.body[i].ssjjTaskInfo.type)
                  continue
                }
                if ([2, 4, 9].includes(data.body[i].ssjjTaskInfo.type)) {
                  await task_record(funArr[data.body[i].ssjjTaskInfo.type], data.body[i].ssjjTaskInfo.id)
                  continue
                }
                if (data.body[i].ssjjTaskInfo.type === 3) {
                  for (let j = data.body[i].doneNum; j < (data.body[i].ssjjTaskInfo.awardOfDayNum || 1); j++) {
                    await task_record(funArr[data.body[i].ssjjTaskInfo.type], `${j + 1}/${data.body[i].ssjjTaskInfo.id}`)
                  }
                  continue
                }
                if (data.body[i].ssjjTaskInfo.type === 1) {
                  await task_record(funArr[data.body[i].ssjjTaskInfo.type], `1330242324682383362/${data.body[i].ssjjTaskInfo.id}`)
                  continue
                }
                await queryDoneTaskRecord(data.body[i].ssjjTaskInfo.type, data.body[i].ssjjTaskInfo.id)
              } else {
                console.log('已完成')
              }
              // if (data.body[i].ssjjTaskInfo.type == 6) {
              //  await queryChannelsList(data.body[i].ssjjTaskInfo.id)
              //   continue
              // }
              // for (let j = data.body[i].doneNum; j < (data.body[i].ssjjTaskInfo.awardOfDayNum||1);j++) {
              //  await queryDoneTaskRecord(data.body[i].ssjjTaskInfo.type,data.body[i].ssjjTaskInfo.id)
              // }
            }
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

function queryDoneTaskRecord(type, id, timeout = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const url = {
        url: `${JD_API_HOST}ssjj-task-record/queryDoneTaskRecord/${type}/${id}?body=%7B%7D`,
        headers: {
          'Origin': `https://lkyl.dianpusoft.cn`,
          'Cookie': cookie,
          'Connection': `keep-alive`,
          'Content-Type': `application/json`,
          'Referer': `https://lkyl.dianpusoft.cn/client/?lkEPin=`,
          'Host': `lkyl.dianpusoft.cn`,
          'Accept-Encoding': `gzip, deflate, br`,
          'Accept-Language': `zh-cn`,
          'token': token
        }
      }
      $.get(url, async(err, resp, data) => {
        try {
          if (printDetail) console.log(data)
          data = JSON.parse(data)
          if (type === 9) {
            // await queryCommoditiesListByTaskId(id,data.body||[],type)
          }
          await queryChannelsList(id, data.body || [], type)
        } catch (e) {
          $.logErr(e, resp)
        } finally {
          resolve()
        }
      })
    }, timeout)
  })
}

function queryChannelsList(id, list, type, timeout = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const url = {
        url: `${JD_API_HOST}ssjj-task-channels/queryChannelsList/${id}?body=%7B%7D`,
        headers: {
          'Origin': `https://lkyl.dianpusoft.cn`,
          'Cookie': cookie,
          'Connection': `keep-alive`,
          'Content-Type': `application/json`,
          'Referer': `https://lkyl.dianpusoft.cn/client/?lkEPin=`,
          'Host': `lkyl.dianpusoft.cn`,
          'Accept-Encoding': `gzip, deflate, br`,
          'Accept-Language': `zh-cn`,
          'token': token
        }
      }
      $.get(url, async(err, resp, data) => {
        try {
          if (printDetail) console.log(data)
          data = JSON.parse(data)
          // console.log(data.head.msg)
          for (const i in data.body) {
            if (list.includes(data.body[i].id)) continue
            if (type === 6) await task_record(funArr[type], `${data.body[i].id}/${id}`)
            if (type === 7) await task_record(funArr[type], `${id}/${data.body[i].id}`)
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

// 做任务
function task_record(functionid, id, timeout = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const url = {
        url: `${JD_API_HOST}ssjj-task-record/${functionid}/${id}/?body=%7B%7D`,
        headers: {
          'Origin': `https://lkyl.dianpusoft.cn`,
          'Cookie': cookie,
          'Connection': `keep-alive`,
          'Content-Type': `application/json`,
          'Referer': `https://lkyl.dianpusoft.cn/client/?lkEPin=`,
          'Host': `lkyl.dianpusoft.cn`,
          'Accept-Encoding': `gzip, deflate, br`,
          'Accept-Language': `zh-cn`,
          'token': token
        }
      }
      // console.log(url.url)
      $.get(url, async(err, resp, data) => {
        try {
          if (printDetail) console.log(data)
          data = JSON.parse(data)
          console.log(data.head.msg)
        } catch (e) {
          $.logErr(e, resp)
        } finally {
          resolve()
        }
      })
    }, timeout)
  })
}

// 查询抽奖
function queryDraw(timeout = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const url = {
        url: `${JD_API_HOST}ssjj-draw-center/queryDraw?body=%7B%7D`,
        headers: {
          'Origin': `https://lkyl.dianpusoft.cn`,
          'Cookie': cookie,
          'Connection': `keep-alive`,
          'Content-Type': `application/json`,
          'Referer': `https://lkyl.dianpusoft.cn/client/?lkEPin=`,
          'Host': `lkyl.dianpusoft.cn`,
          'Accept-Encoding': `gzip, deflate, br`,
          'Accept-Language': `zh-cn`,
          'token': token
        }
      }
      $.get(url, async(err, resp, data) => {
        try {
          if (printDetail) console.log(data)
          data = JSON.parse(data)
          if (data.body.freeDrawCount > 0) {
            console.log('开始免费抽奖')
            await draw(data.body.center.id)
          } else {
            merge.draw.notify = '免费抽奖次数已用完'
            console.log('免费抽奖次数已用完')
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

// 抽奖
function draw(id, timeout = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const url = {
        url: `${JD_API_HOST}ssjj-draw-record/draw/${id}?body=%7B%7D`,
        headers: {
          'Origin': `https://lkyl.dianpusoft.cn`,
          'Cookie': cookie,
          'Connection': `keep-alive`,
          'Content-Type': `application/json`,
          'Referer': `https://lkyl.dianpusoft.cn/client/?lkEPin=`,
          'Host': `lkyl.dianpusoft.cn`,
          'Accept-Encoding': `gzip, deflate, br`,
          'Accept-Language': `zh-cn`,
          'token': token
        }
      }
      $.get(url, async(err, resp, data) => {
        try {
          if (printDetail) console.log(data)
          data = JSON.parse(data)
          console.log(typeof data.body !== 'undefined' ? data.body.name : data.head.msg)
          merge.draw.notify = typeof data.body !== 'undefined' ? data.body.name : data.head.msg
        } catch (e) {
          $.logErr(e, resp)
        } finally {
          resolve()
        }
      })
    }, timeout)
  })
}

// 获取userName
function encrypt(timeout = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const url = {
        url: `https://jdhome.m.jd.com/saas/framework/encrypt/pin?appId=6d28460967bda11b78e077b66751d2b0`,
        headers: {
          'Origin': `https://jdhome.m.jd.com`,
          'Cookie': cookie,
          'Connection': `keep-alive`,
          'Accept': `application/json`,
          'Referer': `https://jdhome.m.jd.com/dist/taro/index.html/`,
          'Host': `jdhome.m.jd.com`,
          'Accept-Encoding': `gzip, deflate, br`,
          'Accept-Language': `zh-cn`
        }
      }
      $.post(url, async(err, resp, data) => {
        try {
          if (printDetail) console.log(data)
          data = JSON.parse(data)
          if (data.success) {
            userName = data.data
            await login()
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

// 初始化
function initial() {
  merge = {
    nickname: '',
    enabled: true,
    newUser: false,
    // blueCoin: {prizeDesc : "收取|蓝币|个",isNumber : true},  //定义 动作|奖励名称|奖励单位   是否是数字 消失位数
    jdBeans: { prizeDesc: '兑换|京豆|个', isNumber: true, fixed: 0 },
    draw: { prizeDesc: '免费抽奖', isNumber: false }
  }
  for (const i in merge) {
    merge[i].success = 0
    merge[i].fail = 0
    merge[i].prizeCount = 0
    merge[i].notify = ''
    merge[i].show = true
  }
  // merge.jdBeans.show =Boolean(coinToBeans);
}

// 通知
function msgShow() {
  let message = ''
  const url = { 'open-url': `openjd://virtual?params=%7B%20%22category%22:%20%22jump%22,%20%22des%22:%20%22m%22,%20%22url%22:%20%22${encodeURIComponent('https://lkyl.dianpusoft.cn/client/?lkEPin=' + userName + '&token=' + token)}%22%20%7D` }
  const title = `京东账号：${merge.nickname}`
  if (merge.end) {
    message += `当前窝币：${merge.end}\n`
    message += merge.end === merge.start ? `` : `本次新增：${merge.end - merge.start}\n`
    message += merge.draw.prizeDesc + '：' + merge.draw.notify + '\n'
    message += `请点击通知跳转至APP查看`
  } else {
    message += `您的账户尚未开通东东小窝，请先点击通知进入开通`
  }
  $.msg($.name, title, message, url)
}

