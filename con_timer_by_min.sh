#!/bin/bash
# 多账号并发，默认在零点准时触发
# 变量：要运行的脚本$SCRIPT
# $2 小于等于五分钟，需要设置定时在上一个小时触发
SCRIPT=$1
min=${2}
hour=`date +%H`
if [ $min -le 5 ]; then
  hour = $((hour + 1))
fi
timer="${hour}:${min}:00"
echo "设置时区"
sudo rm -f /etc/localtime
sudo ln -s /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
echo "$timer"
echo "开始多账号并发"
IFS=$'\n'
num=0
[ "$timer" = "00:00:00" ] && nextdate=`date +%s%N -d "+1 day $timer"` || nextdate=`date +%s%N -d "$timer"`
JK_LIST=(`echo "$JD_COOKIES" | awk -F "&" '{for(i=1;i<=NF;i++) print $i}'`)
num=0
for jk in ${JK_LIST[*]}
do 
  cp  -rf ~/scripts ~/scripts${num}
  cd ~/scripts${num}
  sed -i 's/let CookieJDs/let CookieJDss/g' ./jdCookie.js
  sed -i "1i\let CookieJDs = [ '$jk', ]" ./jdCookie.js
  now=`date +%s%N` && delay=`echo "scale=3;$((nextdate-now))/1000000000" | bc`
  ([ $nextdate -gt $now ] && echo "未到当天${timer}，等待${delay}秒" && sleep $delay; node ./$SCRIPT) &
  cd ~
  num=$((num + 1))
done
unset IFS
wait
