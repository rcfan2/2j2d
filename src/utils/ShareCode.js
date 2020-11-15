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

const shareCodes = [
  new ShareCode('小绵羊酱酱', 'f8df73267c104df2acba96d9378f06c5', 'MTE1NDAxNzYwMDAwMDAwMzkxNzczMTE=', 'e7lhibzb3zek2oioxerjozsro55orxh2yys4ula'),
  new ShareCode('18800659641', '987ee04888b64f0597b13049853caca4', 'MTE1NDAxNzgwMDAwMDAwNDAwMzg2Mjk=', 'bknudbr7e4sqwbhh4kxjg7vthwtj3ctybaw66uy'),
  new ShareCode('高敏', '32b5348df6374239964194e187fa187c', 'MTE1NDUwMTI0MDAwMDAwMDQwNDcxOTYx', 'mv3riww4sqy5f53abjy63rud3qz6gsx6f7h3czq'),
  new ShareCode('查钧译', '9a07bef4e7ad49ae8fdaf113de817a1b', 'MTE1NDUyMjEwMDAwMDAwNDAwMTQ1NjM=', 'mlrdw3aw26j3xhxesrqelkqhmqott5jmflm63ha'),
  new ShareCode('刘奕', '800d1ec39dbd473bbcf2f35667b78b02', 'MTAxODc2NTEzNTAwMDAwMDAyOTAxMTkwMQ==', 'q74cnfebbilqdntxbtix6cx5a4'),
  new ShareCode('查钧译的老婆', 'c168e10ee28248e79defbf76bd098e35', 'MTE1NDQ5OTIwMDAwMDAwNDAxNjc4MzU=', 'mlrdw3aw26j3wscxylsmq7u37f2s7oeysmjexxa'),
  new ShareCode('刘奕1', 'd241a66537244934ba66d40701231a82', 'MTE1NDAxNzgwMDAwMDAwNDAzMDE1Mzk=', '4npkonnsy7xi3utpy37pb3qc2vwdg4im4ts6rfa'),
  new ShareCode('hema3210', '4cbf9b4070b14efa853ee3e3ea0a97db', 'MTE1NDUyMjEwMDAwMDAwNDAwMzgwOTU=', 'lqvulo4mnacvkub4mrvr2u3qba')
]

module.exports = {
  ShareCode,
  shareCodes
}
