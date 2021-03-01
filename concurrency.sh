#!/bin/sh
# 多账号并发,不定时
# 变量：要运行的脚本$SCRIPT
SCRIPT=$1

echo "开始多账号并发"
IFS=$'\n'
num=0
for jk in `echo "$JD_COOKIES" | awk -F "&" '{for(i=1;i<=NF;i++) print $i}'`;do cp  -rf ~/scripts ~/scripts${num} && \
cd ~/scripts${num}
sed -i 's/let CookieJDs/let CookieJDss/g' ./jdCookie.js && \
sed -i "1i\let CookieJDs = [ '$jk', ]" ./jdCookie.js && \
node ./$SCRIPT &
cd ~
num=$((num + 1))
done
unset IFS
wait
