// 助力码辅助生成
class ShareCode {
    constructor(username,
                fruits,
                pet,
                plantBean,
                ddfactory,
                jxfactory,
                jxStory,
                jdSplit) {
        this._username = username
        // 东东农场互助码
        this._fruits = fruits
        // 东东萌宠互助码
        this._pet = pet
        // 种豆得豆互助码
        this._plantBean = plantBean
        // 东东工厂互助码
        this._ddfactory = ddfactory
        // 京喜工厂互助码
        this._jxfactory = jxfactory
        // 京喜故事互助码
        this._jxStory = jxStory
        // 京榜年终奖
        this._jdSplit = jdSplit
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

    get ddfactory() {
        return this._ddfactory
    }

    get jxfactory() {
        return this._jxfactory
    }

    get jxStory() {
        return this._jxStory
    }

    get jdSplit() {
        return this._jdSplit
    }
}

const shareCodes = [
    new ShareCode(
        'jd未知jd',
        'a399af032b1643f3b1359f4f24af39e1',
        'MTE1NDQ5MzYwMDAwMDAwMzcyMTg1MjU=',
        'l4ex6vx6yynouxpqe5pbjoigplsluypljetpovq',
        'P04z54XCjVWnYaS5m9cZz2muSkS_NgjbZnSzA',
        '',
        'hkTxQB0fplkGKTMUStI8zy2BrF74eD2qEOblJdQuHf4=\'',
        ''
    ),
    new ShareCode(
        '遇见3未',
        'd92cbd8f7c0048699452db1fdc24a75b',
        'MTAxODc2NTEzMTAwMDAwMDAyODc2NjM2NQ==',
        'zlmjgctb673yvqj464zq6mwdee',
        'P04z54XCjVWnYaS5mlbSWb51Q',
        'e16R8GB6IJDhjA_VEeKcmw==',
        'b5u67pVlki9FYUQgHeZC1w==',
        'P04z54XCjVUnIaW5mlbSWb51Q'
    ),
    new ShareCode(
        '1jake37',
        'd9e3d1ffadd34ab9b5e990010d258c60',
        'MTE1NDAxNzcwMDAwMDAwMzg2MDE0Njc=',
        '4larfd6ua4ecyw5gp5ojqcdz57wfcewgnlpjfgq',
        '',
        '',
        'ItquS9iMCp53Sr7KAxxxQ2-jcxRVDYlxgbYxVF1LmiU=',
        'P04z54XCjVUnIaW5m9cZySkvzo75xIw9FdCYg'
    ),
    new ShareCode(
        'jd_62433',
        'c162b16c03b846ba9a7cd98448c29025',
        'MTE1NDUwMTI0MDAwMDAwMDM4OTU1ODYx',
        'xmblfgd3rmwo46hdnzy3mnvb7tmnzawk2kmrffi',
        'P04z54XCjVWnYaS5m9cZzKKhB4y_X4oQNFVDw',
        'jxiWiwhUmfE47jIWiiZrYQ==',
        'nkh1dTbkXzO89RvBYiY8nE4qsRgtOGFO3kbYbCGv54Q=',
        'P04z54XCjVUnIaW5m9cZzKKhB4y_btcECPCeA',
    )
]

module.exports = {
    ShareCode,
    shareCodes
}
