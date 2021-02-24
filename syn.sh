#!/usr/bin/env sh

set -e
echo "$DESTINATION_BRANCH"

docker rmi `docker images -q`
echo "Get docker image"
docker pull lxk0301/jd_scripts
docker save `docker images | grep latest | grep -v grep | awk '{print $3}'` > ~/jd.tar
[ ! -e ~/scripts ] && mkdir ~/scripts && tar xvf ~/jd.tar -C ~/scripts

echo "Find layer"
for file in `ls ~/scripts`
do
  layer_size=`ls -l ~/scripts/$file 2> /dev/null | grep layer | grep -v grep | awk '{print $5}'`
  [ "$layer_size" -gt 52428800 ] && tar xvf ~/scripts/$file/layer.tar -C ~/scripts/ > /dev/null && break
done

echo "Resetting origin to: https://$GITHUB_ACTOR:$GITHUB_TOKEN@github.com/$GITHUB_REPOSITORY"
git remote set-url origin "https://$GITHUB_ACTOR:$GITHUB_TOKEN@github.com/$GITHUB_REPOSITORY"
git remote --verbose

cd ~/scripts/scripts/ && SOURCE_BRANCH=`git branch | awk '{print $2}'` && UPSTREAM_REPO=`git remote -v | grep origin | grep fetch | awk '{print $2}'`

echo "Clone origin repository"
git clone https://$GITHUB_ACTOR@github.com/$GITHUB_REPOSITORY ~/repo
cd ~/repo && git checkout -b $destination_branch
#sudo rm -rf ~/scripts/scripts/.git
cp -rf ~/scripts/scripts/* ~/repo/

echo "Adding tmp_upstream $UPSTREAM_REPO"
git remote add tmp_upstream "$UPSTREAM_REPO"

echo "Pushing changings from tmp_upstream to origin"
git push origin "refs/remotes/${SOURCE_BRANCH}:refs/heads/${DESTINATION_BRANCH}" --force

if [[ "$SYNC_TAGS" = true ]]; then
  echo "Force syncing all tags"
  git tag -d $(git tag -l) > /dev/null
  git fetch tmp_upstream --tags --quiet
  git push origin --tags --force
fi

echo "Removing tmp_upstream"
git remote rm tmp_upstream
git remote --verbose
