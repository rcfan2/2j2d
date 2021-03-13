LOG="./`echo "${1}" | awk -F "." '{print $1}'`.log"
cd ~/scripts
node $1 >&1 | tee ${LOG}

# 收集助力码
collectSharecode(){
    echo "${1}：收集新助力码"
    code=`sed -n '/'码】'.*/'p ${1}`
    if [ -z "$code" ]; then
        activity=`sed -n '/配置文件.*/'p "${LOG}" | awk -F "获取" '{print $2}' | awk -F "配置" '{print $1}'`
        name=(`sed -n '/'【京东账号'.*/'p "${LOG}" | grep "开始" | awk -F "开始" '{print $2}' |sed 's/】/（/g'| awk -v ac="$activity" -F "*" '{print $1"）" ac "好友助力码】"}'`)
        code=(`sed -n '/'您的好友助力码为'.*/'p ${1} | awk '{print $2}'`)
        for i in `seq 0 $((${#name[*]}-1))`
        do 
            echo "${name[i]}""${code[i]}" >> ${LOG}1
        done
    else
        echo $code | awk '{for(i=1;i<=NF;i++)print $i}' > ${LOG}1
    fi
}
collectSharecode ${LOG}
cat ${LOG}1
