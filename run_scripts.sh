SCRIPT_NAME=`echo "${1}" | awk -F "." '{print $1}'`
LOG="./${SCRIPT_NAME}.log"

REPO_URL="https://github.com/tracefish/ds"
REPO_BRANCH="sc"
git clone -b "$REPO_BRANCH" $REPO_URL ~/ds

cd ~/scripts

# 修改东东农场
if [ "$SCRIPT_NAME" == "jd_fruit" ]; then
    sed -i "s/let shareCodes =/let shareCodesss =/g" `ls -l |grep -v ^d|awk '{print $9}'`
    sed -i "1i\let shareCodes = ['$MY_SHARECODES']" ./jd_fruit.js
fi

# logDir="~/ds"
# ############# 长期活动 #############
# jdDreamFactoryShareCodes.js
# jdFactoryShareCodes.js
# jdFruitShareCodes.js
# jdJxncShareCodes.js
# jdPetShareCodes.js
# jdPlantBeanShareCodes.js

# #东东农场
# autoHelp "${1}" "${logDir}/${LOG}" "FRUITSHARECODES"

# #东东萌宠
# autoHelp "${1}" "${logDir}/${LOG}" "PETSHARECODES"

# #种豆得豆
# autoHelp "${1}" "${logDir}/${LOG}" "PLANT_BEAN_SHARECODES"

# #京喜工厂
# autoHelp "${1}" "${logDir}/${LOG}" "DREAM_FACTORY_SHARE_CODES"

# #东东工厂
# autoHelp "${1}" "${logDir}/${LOG}" "DDFACTORY_SHARECODES"

# #crazyJoy
# autoHelp "${1}" "${logDir}/${LOG}" "JDJOY_SHARECODES"

# #京喜财福岛
# autoHelp "${1}" "${logDir}/${LOG}" "JDCFD_SHARECODES"

# #京喜农场
# autoHelp "${1}" "${logDir}/${LOG}" "JXNC_SHARECODES"

# #京东赚赚
# autoHelp "${1}" "${logDir}/${LOG}" "JDZZ_SHARECODES"

# #口袋书店
# autoHelp "${1}" "${logDir}/${LOG}" "BOOKSHOP_SHARECODES"

# #领现金
# autoHelp "${1}" "${logDir}/${LOG}" "JD_CASH_SHARECODES"

# #闪购盲盒
# autoHelp "${1}" "${logDir}/${LOG}" "JDSGMH_SHARECODES"

echo "开始运行"
node $1 >&1 | tee ${LOG}

# 格式化助力码
autoHelp(){
# $1 脚本文件
# $2 助力码文件所在
# $3 助力码名称
    SGMH_SHARECODES=(`cat "$2" | while read LINE; do echo $LINE; done | awk -F "】" '{print $2}'`)
    sc_list=($1)
    f_shcode=""
    for ee in `seq 1 ${#sc_list[*]}`
    do 
        sc_list+=(${sc_list[0]})
        unset sc_list[0]
        sc_list=(${sc_list[*]})
        f_shcode="$f_shcode""`echo ${sc_list[*]:0} | awk '{for(i=1;i<=NF;i++) {if(i==NF) printf $i"&";else printf $i"@"}}'`"
    done
    sed -i "2i\process.env.${1} = $f_shcode" "./$1"

}


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

echo "上传助力码文件"
cd ~/ds
echo "Resetting origin to: https://$GITHUB_ACTOR:$GITHUB_TOKEN@github.com/$GITHUB_REPOSITORY"
sudo git remote set-url origin "https://$GITHUB_ACTOR:$GITHUB_TOKEN@github.com/$GITHUB_REPOSITORY"

echo "强制覆盖原文件"
mv -v ~/scripts/${LOG}1 ./${LOG}
git config --global user.email "tracefish@qq.com"
git config --global user.name "tracefish"
git add .
git commit -m "update ${SCRIPT_NAME} `date +%Y%m%d%H%M%S`"

echo "Pushing changings from tmp_upstream to origin"
sudo git push origin "$REPO_BRANCH:$REPO_BRANCH" --force
