const fs = require('fs')
const whiteList = [
    'Env.min.js',
    'index.js',
    'j.mr_checkin.js',
    'jdCookie.js',
    'jdDreamFactoryShareCodes.js',
    'jdFactoryShareCodes.js',
    'jdFruitShareCodes.js',
    'jdPetShareCodes.js',
    'jdPlantBeanShareCodes.js',
    'jdSuperMarketShareCodes.js',
    'jd_818.js',
    'jd_collectProduceScore.js',
    'JD_extra_cookie.js',
    'jd_joy_help.js',
    'jd_joy_run.js',
    'jd_mohe.js',
    'jd_petTreasureBox.js',
    'jd_xtg.js',
    'lightning_checkin.js',
    'lxk0301.boxjs.json',
    'package-lock.json',
    'package.json',
    'sendNotify.js',
    'ShareCode.js',
    'shareCodesHelper.js',
    'smzdm_checkin.js',
    'test2.js',
    'v2ex_checkin.js'
]

const scripts = fs.readdirSync('./').filter(it => it.includes('.js'))
// console.log('scripts: ', scripts)
const workflows = fs.readdirSync('./.github/workflows').map(it => it.replace('.yml', ''))
// console.log('workflows: ', workflows)
const conflicts = scripts.filter(it => {
    const name = it.replace('.js', '')
    return !workflows.includes(name) && !whiteList.includes(it)
})

console.log(conflicts)
