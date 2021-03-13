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
#echo "修改助力码"
#SGMH_SHARECODES=`(cat ~/sharecode.log | while read LINE; do echo $LINE; done | grep "闪购盲盒"| awk -F "】" '{printf $2"@"}'`)
format_sharecode(){
  sc_list=($1)
  f_shcode=""
  for ee in `seq 1 ${#sc_list[*]}`
  do 
    sc_list+=(${sc_list[0]})
    unset sc_list[0]
    sc_list=(${sc_list[*]})
    f_shcode="$f_shcode""`echo ${sc_list[*]:0} | awk '{for(i=1;i<=NF;i++) {if(i==NF) printf $i"&";else printf $i"@"}}'`"
  done
  return $f_shcode
}
npm install
