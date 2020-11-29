const $ = new Env('中国联通')
const KEY_loginurl = '$_tokenurl_10010'
const KEY_loginheader = '$_tokenheader_10010'
const KEY_signurl = '$_signurl_10010'
const KEY_signheader = '$_signheader_10010'
const KEY_loginlotteryurl = '$_loginlotteryurl_10010'
const KEY_loginlotteryheader = '$_loginlotteryheader_10010'
const KEY_findlotteryurl = '$_findlotteryurl_10010'
const KEY_findlotteryheader = '$_findlotteryheader_10010'
const $golottery = true
const $gosign = true

const signinfo = {}
let VAL_loginurl = $.getdata(KEY_loginurl)
let VAL_loginheader = $.getdata(KEY_loginheader)
let VAL_signurl = $.getdata(KEY_signurl)
let VAL_signheader = $.getdata(KEY_signheader)
let VAL_loginlotteryurl = $.getdata(KEY_loginlotteryurl)
let VAL_loginlotteryheader = $.getdata(KEY_loginlotteryheader)
let VAL_findlotteryurl = $.getdata(KEY_findlotteryurl)
let VAL_findlotteryheader = $.getdata(KEY_findlotteryheader)
let golottery = JSON.parse($.getdata("$_golottery_10010") || $golottery)
let gosign = JSON.parse($.getdata("$_gosign_10010") || $gosign)

;
(sign = async () => {
    $.log(`🔔 ${$.name}`)
    await loginapp()
    if (gosign) await signapp()
    if (golottery) {
        if (VAL_loginlotteryurl && VAL_findlotteryurl) await loginlottery()
        if (signinfo.encryptmobile) {
            await findlottery()
            if (signinfo.findlottery && signinfo.findlottery.acFrequency && signinfo.findlottery.acFrequency.usableAcFreq) {
                for (let i = 0; i < signinfo.findlottery.acFrequency.usableAcFreq; i++) {
                    await lottery()
                }
            }
        }
    }
    await getinfo()
    showmsg()
})()
    .catch((e) => $.log(`❌ ${$.name} 签到失败: ${e}`))
    .finally(() => $.done())

function loginapp() {
    return new Promise((resolve, reject) => {
        const url = {url: VAL_loginurl, headers: JSON.parse(VAL_loginheader)}
        $.post(url, (error, response, data) => {
            try {
                resolve()
            } catch (e) {
                $.msg($.name, `登录结果: 失败`, `说明: ${e}`)
                $.log(`❌ ${$.name} loginapp - 登录失败: ${e}`)
                $.log(`❌ ${$.name} loginapp - response: ${JSON.stringify(response)}`)
                resolve()
            }
        })
    })
}

function signapp() {
    return new Promise((resolve, reject) => {
        if (VAL_signurl.endsWith('.do')) VAL_signurl = VAL_signurl.replace('.do', '')
        const url = {url: 'https://act.10010.com/SigninApp/signin/daySign', headers: JSON.parse(VAL_signheader)}
        $.post(url, (error, response, data) => {
            try {
                signinfo.signapp = JSON.parse(data)
                resolve()
            } catch (e) {
                $.msg($.name, `签到结果: 失败`, `说明: ${e}`)
                $.log(`❌ ${$.name} signapp - 签到失败: ${e}`)
                $.log(`❌ ${$.name} signapp - response: ${JSON.stringify(response)}`)
                resolve()
            }
        })
    })
}

function loginlottery() {
    return new Promise((resolve, reject) => {
        const url = {url: VAL_loginlotteryurl, headers: JSON.parse(VAL_loginlotteryheader)}
        $.get(url, (error, response, data) => {
            try {
                const encryptmobileMatch = data.match(/encryptmobile=([^('|")]*)/)
                if (encryptmobileMatch) {
                    signinfo.encryptmobile = encryptmobileMatch[1]
                } else {
                    $.msg($.name, `获取抽奖令牌: 失败`, `说明: ${e}`)
                    $.log(`❌ ${$.name} loginlottery - 获取抽奖令牌失败: ${e}`)
                    $.log(`❌ ${$.name} loginlottery - response: ${JSON.stringify(response)}`)
                }
                resolve()
            } catch (e) {
                $.msg($.name, `登录抽奖: 失败`, `说明: ${e}`)
                $.log(`❌ ${$.name} loginlottery - 登录抽奖失败: ${e}`)
                $.log(`❌ ${$.name} loginlottery - response: ${JSON.stringify(response)}`)
                resolve()
            }
        })
    })
}

function findlottery() {
    return new Promise((resolve, reject) => {
        VAL_findlotteryurl = VAL_findlotteryurl.replace(/encryptmobile=[^(&|$)]*/, `encryptmobile=${signinfo.encryptmobile}`)
        VAL_findlotteryurl = VAL_findlotteryurl.replace(/mobile=[^(&|$)]*/, `mobile=${signinfo.encryptmobile}`)
        const url = {url: VAL_findlotteryurl, headers: JSON.parse(VAL_findlotteryheader)}
        $.get(url, (error, response, data) => {
            try {
                signinfo.findlottery = JSON.parse(data)
                resolve()
            } catch (e) {
                $.msg($.name, `获取抽奖次数: 失败`, `说明: ${e}`)
                $.log(`❌ ${$.name} findlottery - 获取抽奖次数失败: ${e}`)
                $.log(`❌ ${$.name} findlottery - response: ${JSON.stringify(response)}`)
                resolve()
            }
        })
    })
}

function lottery() {
    return new Promise((resolve, reject) => {
        const url = {
            url: `https://m.client.10010.com/dailylottery/static/doubleball/choujiang?usernumberofjsp=${signinfo.encryptmobile}`,
            headers: JSON.parse(VAL_loginlotteryheader)
        }
        url.headers['Referer'] = `https://m.client.10010.com/dailylottery/static/doubleball/firstpage?encryptmobile=${signinfo.encryptmobile}`
        $.post(url, (error, response, data) => {
            try {
                signinfo.lotterylist = signinfo.lotterylist ? signinfo.lotterylist : []
                signinfo.lotterylist.push(JSON.parse(data))
                resolve()
            } catch (e) {
                $.msg($.name, `抽奖结果: 失败`, `说明: ${e}`)
                $.log(`❌ ${$.name} lottery - 抽奖失败: ${e}`)
                $.log(`❌ ${$.name} lottery - response: ${JSON.stringify(response)}`)
                resolve()
            }
        })
    })
}

function gettel() {
    const reqheaders = JSON.parse(VAL_signheader)
    const reqreferer = reqheaders.Referer
    const reqCookie = reqheaders.Cookie
    let tel = ''
    if (reqreferer.indexOf(`desmobile=`) >= 0) tel = reqreferer.match(/desmobile=(.*?)(&|$)/)[1]
    if (tel == '' && reqCookie.indexOf(`u_account=`) >= 0) tel = reqCookie.match(/u_account=(.*?);/)[1]
    return tel
}


function getinfo() {
    return new Promise((resolve, reject) => {
        const url = {
            url: `https://m.client.10010.com/mobileService/home/queryUserInfoSeven.htm?version=iphone_c@7.0403&desmobiel=${gettel()}&showType=3`,
            headers: {"Cookie": JSON.parse(VAL_loginheader)["Cookie"]}
        }
        $.get(url, (error, response, data) => {
            try {
                signinfo.info = JSON.parse(data)
                resolve()
            } catch (e) {
                $.msg($.name, `获取余量: 失败`, `说明: ${e}`)
                $.log(`❌ ${$.name} getinfo - 获取余量失败: ${e}`)
                $.log(`❌ ${$.name} getinfo - response: ${JSON.stringify(response)}`)
                resolve()
            }
        })
    })
}

function showmsg() {
    let subTitle = ''
    let detail = ''
    console.log(signinfo)
    // 签到结果
    if (gosign == true) {
        if (signinfo.signapp.status == '0000') {
            subTitle = `签到: 成功 `
            detail = `积分: +${signinfo.signapp.data.prizeCount}, 成长值: +${signinfo.signapp.data.growthV}, 鲜花: +${signinfo.signapp.data.flowerCount}`
        } else if (signinfo.signapp.status == '0002') {
            subTitle = `签到: 重复 `
        } else {
            subTitle = `签到: 失败 `
            $.log(`❌ ${$.name} signapp - response: ${JSON.stringify(signinfo.signapp)}`)
        }
    }

    if (signinfo.info.code == 'Y') {
        // 基本信息
        detail = detail ? `${detail}\n` : ``
        const traffic = signinfo.info.data.dataList[0]
        const flow = signinfo.info.data.dataList[1]
        const voice = signinfo.info.data.dataList[2]
        const credit = signinfo.info.data.dataList[3]
        const back = signinfo.info.data.dataList[4]
        const money = signinfo.info.data.dataList[5]
        detail = `${traffic.remainTitle}: ${traffic.number}${traffic.unit}, ${flow.remainTitle}: ${flow.number}${flow.unit}, ${voice.remainTitle}: ${voice.number}${voice.unit}, ${credit.remainTitle}: ${credit.number}${credit.unit}, ${back.remainTitle}: ${back.number}${back.unit}, ${money.remainTitle}: ${money.number}${money.unit}`
    } else {
        $.log(`❌ ${$.name} signapp - response: ${JSON.stringify(signinfo.info)}`)
    }

    if (golottery == true) {
        if (signinfo.findlottery && signinfo.findlottery.acFrequency && signinfo.lotterylist) {
            subTitle += `抽奖: ${signinfo.findlottery.acFrequency.usableAcFreq}次`
            detail += '\n查看详情\n'

            for (let i = 0; i < signinfo.findlottery.acFrequency.usableAcFreq; i++) {
                detail += `\n抽奖 (${i + 1}): ${signinfo.lotterylist[i].RspMsg}`
            }
        } else {
            $.log(`❌ ${$.name} signapp - response: ${JSON.stringify(signinfo.findlottery)}`)
        }
    }

    $.msg($.name, subTitle, detail)
}

function Env(t, e) {
    class s {
        constructor(t) {
            this.env = t
        }

        send(t, e = "GET") {
            t = "string" == typeof t ? {url: t} : t;
            let s = this.get;
            return "POST" === e && (s = this.post), new Promise((e, i) => {
                s.call(this, t, (t, s, o) => {
                    t ? i(t) : e(s)
                })
            })
        }

        get(t) {
            return this.send.call(this.env, t)
        }

        post(t) {
            return this.send.call(this.env, t, "POST")
        }
    }

    return new class {
        constructor(t, e) {
            this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `\ud83d\udd14${this.name}, \u5f00\u59cb!`)
        }

        isNode() {
            return "undefined" != typeof module && !!module.exports
        }

        isQuanX() {
            return "undefined" != typeof $task
        }

        isSurge() {
            return "undefined" != typeof $httpClient && "undefined" == typeof $loon
        }

        isLoon() {
            return "undefined" != typeof $loon
        }

        toObj(t, e = null) {
            try {
                return JSON.parse(t)
            } catch {
                return e
            }
        }

        toStr(t, e = null) {
            try {
                return JSON.stringify(t)
            } catch {
                return e
            }
        }

        getjson(t, e) {
            let s = e;
            const i = this.getdata(t);
            if (i) try {
                s = JSON.parse(this.getdata(t))
            } catch {
            }
            return s
        }

        setjson(t, e) {
            try {
                return this.setdata(JSON.stringify(t), e)
            } catch {
                return !1
            }
        }

        getScript(t) {
            return new Promise(e => {
                this.get({url: t}, (t, s, i) => e(i))
            })
        }

        runScript(t, e) {
            return new Promise(s => {
                let i = this.getdata("@$_boxjs_userCfgs.httpapi");
                i = i ? i.replace(/\n/g, "").trim() : i;
                let o = this.getdata("@$_boxjs_userCfgs.httpapi_timeout");
                o = o ? 1 * o : 20, o = e && e.timeout ? e.timeout : o;
                const [r, h] = i.split("@"), a = {
                    url: `http://${h}/v1/scripting/evaluate`,
                    body: {script_text: t, mock_type: "cron", timeout: o},
                    headers: {"X-Key": r, Accept: "*/*"}
                };
                this.post(a, (t, e, i) => s(i))
            }).catch(t => this.logErr(t))
        }

        loaddata() {
            if (!this.isNode()) return {};
            {
                this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path");
                const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile),
                    s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e);
                if (!s && !i) return {};
                {
                    const i = s ? t : e;
                    try {
                        return JSON.parse(this.fs.readFileSync(i))
                    } catch (t) {
                        return {}
                    }
                }
            }
        }

        writedata() {
            if (this.isNode()) {
                this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path");
                const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile),
                    s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), o = JSON.stringify(this.data);
                s ? this.fs.writeFileSync(t, o) : i ? this.fs.writeFileSync(e, o) : this.fs.writeFileSync(t, o)
            }
        }

        lodash_get(t, e, s) {
            const i = e.replace(/\[(\d+)\]/g, ".$1").split(".");
            let o = t;
            for (const t of i) if (o = Object(o)[t], void 0 === o) return s;
            return o
        }

        lodash_set(t, e, s) {
            return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t)
        }

        getdata(t) {
            let e = this.getval(t);
            if (/^@/.test(t)) {
                const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), o = s ? this.getval(s) : "";
                if (o) try {
                    const t = JSON.parse(o);
                    e = t ? this.lodash_get(t, i, "") : e
                } catch (t) {
                    e = ""
                }
            }
            return e
        }

        setdata(t, e) {
            let s = !1;
            if (/^@/.test(e)) {
                const [, i, o] = /^@(.*?)\.(.*?)$/.exec(e), r = this.getval(i),
                    h = i ? "null" === r ? null : r || "{}" : "{}";
                try {
                    const e = JSON.parse(h);
                    this.lodash_set(e, o, t), s = this.setval(JSON.stringify(e), i)
                } catch (e) {
                    const r = {};
                    this.lodash_set(r, o, t), s = this.setval(JSON.stringify(r), i)
                }
            } else s = this.setval(t, e);
            return s
        }

        getval(t) {
            return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null
        }

        setval(t, e) {
            return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null
        }

        initGotEnv(t) {
            this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar))
        }

        get(t, e = (() => {
        })) {
            t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon() ? $httpClient.get(t, (t, s, i) => {
                !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i)
            }) : this.isQuanX() ? $task.fetch(t).then(t => {
                const {statusCode: s, statusCode: i, headers: o, body: r} = t;
                e(null, {status: s, statusCode: i, headers: o, body: r}, r)
            }, t => e(t)) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => {
                try {
                    const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();
                    this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar
                } catch (t) {
                    this.logErr(t)
                }
            }).then(t => {
                const {statusCode: s, statusCode: i, headers: o, body: r} = t;
                e(null, {status: s, statusCode: i, headers: o, body: r}, r)
            }, t => e(t)))
        }

        post(t, e = (() => {
        })) {
            if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) $httpClient.post(t, (t, s, i) => {
                !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i)
            }); else if (this.isQuanX()) t.method = "POST", $task.fetch(t).then(t => {
                const {statusCode: s, statusCode: i, headers: o, body: r} = t;
                e(null, {status: s, statusCode: i, headers: o, body: r}, r)
            }, t => e(t)); else if (this.isNode()) {
                this.initGotEnv(t);
                const {url: s, ...i} = t;
                this.got.post(s, i).then(t => {
                    const {statusCode: s, statusCode: i, headers: o, body: r} = t;
                    e(null, {status: s, statusCode: i, headers: o, body: r}, r)
                }, t => e(t))
            }
        }

        time(t) {
            let e = {
                "M+": (new Date).getMonth() + 1,
                "d+": (new Date).getDate(),
                "H+": (new Date).getHours(),
                "m+": (new Date).getMinutes(),
                "s+": (new Date).getSeconds(),
                "q+": Math.floor(((new Date).getMonth() + 3) / 3),
                S: (new Date).getMilliseconds()
            };
            /(y+)/.test(t) && (t = t.replace(RegExp.$1, ((new Date).getFullYear() + "").substr(4 - RegExp.$1.length)));
            for (let s in e) new RegExp("(" + s + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? e[s] : ("00" + e[s]).substr(("" + e[s]).length)));
            return t
        }

        msg(e = t, s = "", i = "", o) {
            const r = t => {
                if (!t || !this.isLoon() && this.isSurge()) return t;
                if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? {"open-url": t} : void 0;
                if ("object" == typeof t) {
                    if (this.isLoon()) {
                        let e = t.openUrl || t["open-url"], s = t.mediaUrl || t["media-url"];
                        return {openUrl: e, mediaUrl: s}
                    }
                    if (this.isQuanX()) {
                        let e = t["open-url"] || t.openUrl, s = t["media-url"] || t.mediaUrl;
                        return {"open-url": e, "media-url": s}
                    }
                }
            };
            this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, r(o)) : this.isQuanX() && $notify(e, s, i, r(o)));
            let h = ["", "==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];
            h.push(e), s && h.push(s), i && h.push(i), console.log(h.join("\n")), this.logs = this.logs.concat(h)
        }

        log(...t) {
            t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator))
        }

        logErr(t, e) {
            const s = !this.isSurge() && !this.isQuanX() && !this.isLoon();
            s ? this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t.stack) : this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t)
        }

        wait(t) {
            return new Promise(e => setTimeout(e, t))
        }

        done(t = {}) {
            const e = (new Date).getTime(), s = (e - this.startTime) / 1e3;
            this.log("", `\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t)
        }
    }(t, e)
}
