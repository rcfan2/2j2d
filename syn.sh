#!/usr/bin/env sh

set -e

mkdir -p ~/jd_scripts/logs
cp -f docker-compose.yml ~/jd_scripts/
mv -f crontab_list.sh ~/jd_scripts/my_crontab_list.sh
cd ~/jd_scripts/

docker-compose up -d
docker-compose logs
docker-compose pull

#docker rmi `docker images -q`
#echo "Get docker image"
#docker pull $SOURCE_IMAGE

#echo "设定远程仓库地址..."
#docker exec -i jd_scripts /bin/sh -c "git remote set-url origin $REPO_URL"
#echo "git pull拉取最新代码..."
#docker exec -i jd_scripts /bin/sh -c "git reset --hard origin/master"

docker exec -i jd_scripts /bin/sh -c "git clone $REPO_URL /scriptss"

#for file in `sudo find /var/lib/docker -type f -name "docker_entrypoint.sh"`
#do
#    sudo sed -i "s/npm/#npm/g" $file && sudo sed -i "s/sh -x/#sh/g" $file && sudo sed -i "s/crond/#/g" $file
#    sudo echo "ls -lR" >> $file
#done

#docker images
#docker ps -a
#docker run -i $SOURCE_IMAGE /bin/sh &
#docker exec -i `docker ps | grep jd_scripts | grep -v grep | awk '{print $1}'` /bin/sh -c 'git pull'
#sudo ls -Rl /var/lib/docker

#docker save `docker images | grep latest | grep -v grep | awk '{print $3}'` > ~/jd.tar
#[ ! -e ~/scripts ] && mkdir ~/scripts && tar xvf ~/jd.tar -C ~/scripts

#echo "Find layer"
#for file in `ls ~/scripts`
#do
 # layer_size=`ls -l ~/scripts/$file 2> /dev/null | grep layer | grep -v grep | awk '{print $5}'`
 # [ "$layer_size" -gt 52428800 ] && tar xvf ~/scripts/$file/layer.tar -C ~/scripts/ > /dev/null && break
#done
sudo cp -rf `sudo find /var/lib/docker -type d -name "scriptss" | grep merged` ~/
#cd ~/scripts/scriptss
cd ~/scriptss
SOURCE_BRANCH="master"
#SOURCE_BRANCH=`git branch | awk '{print $2}'`
#UPSTREAM_REPO=`git remote -v | grep origin | grep fetch | awk '{print $2}'`
git remote --verbose

#REPO_URL="git@gitee.com:lxk0301/jd_scripts.git"
#git remote set-url origin $REPO_URL
#git reset --hard
#echo "git pull拉取最新代码..."
#git pull --rebase
git branch -a
echo "Resetting origin to: https://$GITHUB_ACTOR:$GITHUB_TOKEN@github.com/$GITHUB_REPOSITORY"
sudo git remote set-url origin "https://$GITHUB_ACTOR:$GITHUB_TOKEN@github.com/$GITHUB_REPOSITORY"
git remote --verbose

echo "Pushing changings from tmp_upstream to origin"
git push origin "refs/remotes/origin/${SOURCE_BRANCH}:refs/heads/${DESTINATION_BRANCH}" --force

git remote --verbose
