// 助力码辅助生成
class ShareCode {
    constructor(username, fruits, pet, plantBean, superMarket) {
        this._username = username
        // 东东农场互助码
        this._fruits = fruits
        // 东东萌宠互助码
        this._pet = pet
        // 种豆得豆互助码
        this._plantBean = plantBean
        // 京小超商圈互助码
        this._superMarket = superMarket
    }

    get username() {
        return this._username
    }

    get fruits() {
        return this._fruits
    }

    get pet() {
        return this._pet
    }

    get plantBean() {
        return this._plantBean
    }

    get superMarket() {
        return this._superMarket
    }
}

let FRUITSHARECODES = ''
let PETSHARECODES = ''
let PLANT_BEAN_SHARECODES = ''
let SUPERMARKET_SHARECODES = ''
let shareCodes = [
    new ShareCode('小绵羊酱酱', 'f8df73267c104df2acba96d9378f06c5', 'MTE1NDAxNzYwMDAwMDAwMzkxNzczMTE=', 'e7lhibzb3zek2oioxerjozsro55orxh2yys4ula'),
    new ShareCode('hema3210', '4cbf9b4070b14efa853ee3e3ea0a97db', 'MTE1NDUyMjEwMDAwMDAwNDAwMzgwOTU=', ''),
    new ShareCode('18800659641', '', '', ''),
    new ShareCode('查钧译', '9a07bef4e7ad49ae8fdaf113de817a1b', 'MTE1NDAxNzYwMDAwMDAwMzkxNzczMTE=', ''),
]

// 同一个京东账号的好友互助码用@隔开,不同京东账号互助码用&或者换行隔开
const generate = (type) => {
    let str = ''
    shareCodes.forEach(shareCode => {
        let username = shareCode.username
        shareCodes.forEach((it, index1) => {
            if (it[type]) {
                // 不能助力自己
                if (it.username !== username) {
                    str += it[type]
                    if (index1 < shareCodes.length - 1) {
                        str += '@'
                    }
                }
            }
        })
        // 去除尾部@
        while (str.charAt(str.length - 1) === '@') {
            str = str.substring(0, str.length - 1)
        }
        str += '&'
    })
    // 去除尾部&
    while (str.charAt(str.length - 1) === '&') {
        str = str.substring(0, str.length - 1)
    }
    return str
}

// 东东农场互助码
console.log('=============================================FRUITSHARECODES=================================================')
console.log(generate('fruits'))
console.log('=============================================PETSHARECODES=================================================')
console.log(generate('pet'))
console.log('=============================================PLANT_BEAN_SHARECODES=================================================')
console.log(generate('plantBean'))
console.log('=============================================SUPERMARKET_SHARECODES=================================================')
console.log(generate('superMarket'))
