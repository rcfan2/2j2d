// 助力码辅助生成
class ShareCode {
    constructor(username, fruits, pet, plantBean) {
        this._username = username
        // 东东农场互助码
        this._fruits = fruits
        // 东东萌宠互助码
        this._pet = pet
        // 种豆得豆互助码
        this._plantBean = plantBean
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
}

let shareCodes = [
    new ShareCode('小绵羊酱酱', 'f8df73267c104df2acba96d9378f06c5', 'MTE1NDAxNzYwMDAwMDAwMzkxNzczMTE=', 'e7lhibzb3zek2oioxerjozsro55orxh2yys4ula'),
    new ShareCode('hema3210', '4cbf9b4070b14efa853ee3e3ea0a97db', 'MTE1NDUyMjEwMDAwMDAwNDAwMzgwOTU=', 'lqvulo4mnacvkub4mrvr2u3qba'),
    new ShareCode('18800659641', '987ee04888b64f0597b13049853caca4', 'MTE1NDAxNzgwMDAwMDAwNDAwMzg2Mjk=', 'bknudbr7e4sqwbhh4kxjg7vthwtj3ctybaw66uy'),
    new ShareCode('查钧译', '9a07bef4e7ad49ae8fdaf113de817a1b', 'MTE1NDUyMjEwMDAwMDAwNDAwMTQ1NjM=', 'mlrdw3aw26j3xhxesrqelkqhmqott5jmflm63ha'),
    new ShareCode('刘奕', '800d1ec39dbd473bbcf2f35667b78b02', 'MTAxODc2NTEzNTAwMDAwMDAyOTAxMTkwMQ==', 'q74cnfebbilqdntxbtix6cx5a4'),
    new ShareCode('查钧译的老婆', '', '', 'mlrdw3aw26j3wscxylsmq7u37f2s7oeysmjexxa'),
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
