#!/usr/bin/env sh
echo "拉取源码"
git clone -b jd https://github.com/tracefish/ds.git ~/scripts
cd  ~/scripts
echo "修改源码"
sed -i "s/indexOf('GITHUB')/indexOf('GOGOGOGO')/g" `ls -l |grep -v ^d|awk '{print $9}'`
sed -i 's/indexOf("GITHUB")/indexOf("GOGOGOGO")/g' `ls -l |grep -v ^d|awk '{print $9}'`
echo "修改文件"
git clone -b sc https://github.com/tracefish/ds.git ./sharecode
sed -i '2i\process.env.SHARE_CODE_FILE = ".\/sharecode\/sharecode.log";' ./utils/jdShareCodes.js
npm install
