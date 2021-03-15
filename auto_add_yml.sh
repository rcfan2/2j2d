cd ~
git clone https://github.com/tracefish/ds ./ds
cd ./ds
git checkout sc

ex_list=(`cat ./scripts.md | grep -v "*" | grep jd_`)
# 忽略列表
ig_list=(jd_family jd_delCoupon jd_get_share_code jd_jxnc)
al_list=(${ex_list[*]} ${ig_list[*]})
echo "${al_list[*]}"
grep_list=`echo ${al_list[*]} | awk '{for(i=1;i<=NF;i++) print $i".*"}'`
git checkout jd
non_list=(`cat ./docker/crontab_list.sh | grep "jd"| grep -Ev "$grep_list"`)
echo "$non_list"
