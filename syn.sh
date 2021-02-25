#!/usr/bin/env sh

set -e

mkdir -p ~/jd_scripts/logs
cp -f docker-compose.yml ~/jd_scripts/
mv -f crontab_list.sh ~/jd_scripts/my_crontab_list.sh
cd ~/jd_scripts/
#docker rmi `docker images -q`
#echo "Get docker image"
#docker pull $SOURCE_IMAGE
docker-compose up -d
docker-compose logs
docker-compose pull

echo "设定远程仓库地址..."
docker exec -i jd_scripts /bin/sh -c "git remote set-url origin $REPO_URL"
echo "git pull拉取最新代码..."
docker exec -i jd_scripts /bin/sh -c "git reset --hard origin/master"

docker exec -i jd_scripts /bin/sh -c "git pull --rebase 2> /dev/null"
docker images
#docker save `docker images | grep latest | grep -v grep | awk '{print $3}'` > ~/jd.tar
#[ ! -e ~/scripts ] && mkdir ~/scripts && tar xvf ~/jd.tar -C ~/scripts

#echo "Find layer"
#for file in `ls ~/scripts`
#do
#  layer_size=`ls -l ~/scripts/$file 2> /dev/null | grep layer | grep -v grep | awk '{print $5}'`
#  [ "$layer_size" -gt 52428800 ] && tar xvf ~/scripts/$file/layer.tar -C ~/scripts/ > /dev/null && break
#done

cd ~/scripts/scripts/
SOURCE_BRANCH=`git branch | awk '{print $2}'`
#UPSTREAM_REPO=`git remote -v | grep origin | grep fetch | awk '{print $2}'`
git remote --verbose

#REPO_URL="git@gitee.com:lxk0301/jd_scripts.git"
#git remote set-url origin $REPO_URL
#git reset --hard
#echo "git pull拉取最新代码..."
#git pull --rebase

echo "Resetting origin to: https://$GITHUB_ACTOR:$GITHUB_TOKEN@github.com/$GITHUB_REPOSITORY"
git remote set-url origin "https://$GITHUB_ACTOR:$GITHUB_TOKEN@github.com/$GITHUB_REPOSITORY"
git remote --verbose

echo "Pushing changings from tmp_upstream to origin"
git push origin "refs/remotes/origin/${SOURCE_BRANCH}:refs/heads/${DESTINATION_BRANCH}" --force

git remote --verbose
