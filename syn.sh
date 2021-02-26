#!/usr/bin/env sh

set -e

mkdir -p ~/jd_scripts/logs
cp -f docker-compose.yml ~/jd_scripts/
#mv -f crontab_list.sh ~/jd_scripts/my_crontab_list.sh
cd ~/jd_scripts/

docker-compose up -d

echo "git pull拉取最新代码..."
docker exec -i jd_scripts /bin/sh -c "git clone $REPO_URL /scriptss"

sudo cp -rf `sudo find /var/lib/docker -type d -name "scriptss" | grep merged` ~/

cd ~/scriptss
#UPSTREAM_REPO=`git remote -v | grep origin | grep fetch | awk '{print $2}'`
git remote --verbose

echo "Resetting origin to: https://$GITHUB_ACTOR:$GITHUB_TOKEN@github.com/$GITHUB_REPOSITORY"
sudo git remote set-url origin "https://$GITHUB_ACTOR:$GITHUB_TOKEN@github.com/$GITHUB_REPOSITORY"
git remote --verbose

echo "Pushing changings from tmp_upstream to origin"
sudo git push origin "refs/remotes/origin/${SOURCE_BRANCH}:refs/heads/${DESTINATION_BRANCH}" --force

git remote --verbose
