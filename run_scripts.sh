LOG="./`echo "${1}" | awk -F "." '{print $1}'`.log"
cd ~/scripts
node $1 >&1 | tee ${LOG}

# 收集助力码
collectSharecode(){
    echo "${1}：收集新助力码"
    sed -n '/'码】'.*/'p ${1} >> ${LOG}1
}
collectSharecode ${LOG}
cat ${LOG}1
