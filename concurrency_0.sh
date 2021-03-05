#!/bin/bash
# 多账号并发，在零点准时触发
# 变量：要运行的脚本$SCRIPT
SCRIPT=$1

echo "设置时区"
sudo rm -f /etc/localtime
sudo ln -s /usr/share/zoneinfo/Asia/Shanghai /etc/localtime

echo "开始多账号并发"
IFS=$'\n'
num=0
nextdate=`date +%s%N -d "+1 day 00:00:00"`
JK_LIST=(`echo "$JD_COOKIES" | awk -F "&" '{for(i=1;i<=NF;i++) print $i}'`)
num=0
for jk in ${JK_LIST[*]}
do 
  cp  -rf ~/scripts ~/scripts${num}
  cd ~/scripts${num}
  sed -i 's/let CookieJDs/let CookieJDss/g' ./jdCookie.js
  sed -i "1i\let CookieJDs = [ '$jk', ]" ./jdCookie.js
  (now=`date +%s%N` && delay=`echo "scale=3;$((nextdate-now))/1000000000" | bc` && echo "未到当天零点，等待${delay}秒" && sleep $delay && node ./$SCRIPT)&
  cd ~
  num=$((num + 1))
done
unset IFS
wait
