#!/bin/sh
# 多账号并发,不定时
# 变量：要运行的脚本$SCRIPT
#set -e
SCRIPT="$1"
echo "开始多账号并发"
IFS=$'\n'
num=0
JK_LIST=(`echo "$JD_COOKIES" | awk -F "&" '{for(i=1;i<=NF;i++) print $i}'`)
for jk in ${JK_LIST[*]}
do
  cp  -rf ~/scripts ~/scripts${num}
  cd ~/scripts${num}
  sed -i 's/let CookieJDs/let CookieJDss/g' ./jdCookie.js
  echo "$jk"
  sed -i "1i\let CookieJDs = [ '$jk', ]" ./jdCookie.js
  #node "./${SCRIPT}" &
  cd ~
  num=$((num + 1))
done
echo "有账号" "${num}"
#unset IFS
wait
