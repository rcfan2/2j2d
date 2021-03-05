#!/bin/bash

set -e
SC_LOG="sharecode.log"
LOCATION_LOG="sctipts.md"
echo "获得本目录下各脚本位置"
git clone $REPO_URL -b $BRANCH ~/repo
cd ~/repo/.github/workflows

echo "### 活动脚本位置" > ~/$LOCATION_LOG
for file in `ls ./`; do
  isScript=`cat "$file" | grep "jd*.js"`
  if [ -n "$isScript" ]; then
    echo -e "$file" >> ~/$LOCATION_LOG
    echo \`\`\` >> ~/$LOCATION_LOG
    echo "$isScript" >> ~/$LOCATION_LOG
    echo \`\`\` >> ~/$LOCATION_LOG
  fi
done

echo "开始更新助力码"
cd  ~/scripts
node ./jd_get_share_code.js > ~/$SC_LOG
sed -i 's/京东农场/东东农场/g' ~/$SC_LOG
sed -i 's/种豆得豆/京东种豆得豆/g' ~/$SC_LOG
cat ~/$SC_LOG
echo "克隆指定仓库分支"
git clone -b $DESTINATION_BRANCH $REPO_URL ~/ds
cd ~/ds
echo "Resetting origin to: https://$GITHUB_ACTOR:$GITHUB_TOKEN@github.com/$GITHUB_REPOSITORY"
sudo git remote set-url origin "https://$GITHUB_ACTOR:$GITHUB_TOKEN@github.com/$GITHUB_REPOSITORY"

echo "强制覆盖原文件"
mv -f ~/sharecode.log ./$SC_LOG
mv -v ~/$LOCATION_LOG./$LOCATION_LOG
git config --global user.email "tracefish@qq.com"
git config --global user.name "tracefish"
git add .
git commit -m "update `date +%Y%m%d`"

echo "Pushing changings from tmp_upstream to origin"
sudo git push origin "${SOURCE_BRANCH}:${DESTINATION_BRANCH}" --force 
