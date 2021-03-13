LOG="./${1}.log"
cd ~/scripts
node $1 >&1 | tee ${LOG}

# 收集助力码
collectSharecode(){
    echo "${1}：收集新助力码"
    sed -n '/'${1}'.*/'p ${1} |  sed 's/京东账号/京东账号 /g' | sed 's/（/ （/g' | sed 's/】/】 /g' | awk '{print $4,$5,$6,$7}' | sort -gk2  | awk '!a[$2" "$3]++{print}' >> ${LOG}1
}
collectSharecode ${LOG}
