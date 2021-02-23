#!/bin/sh

docker rmi `docker images -q`

echo "Get docker image"
docker pull lxk0301/jd_scripts
docker save `docker images | grep latest | grep -v grep | awk '{print $3}'` > ~/jd.tar
[ ! -e ~/scripts ] && mkdir ~/scripts && tar xvf ~/jd.tar -C ~/scripts

echo "Find layer"
for file in `ls ~/scripts`
do
  if [ -d "~/scripts/$file" ]; then
  	echo $file 132345
	layer_size=`ls -l ~/scripts/$file | grep layer | grep -v grep | awk '{print $5}'`
	echo $layer_size
	[ "$layer_size" -gt 52428800 ] && tar xvf ~/scripts/$file/layer.tar -C ~/scripts/ && break
  fi
done

echo "Clone origin repository"
git clone https://$GITHUB_ACTOR@github.com/$GITHUB_REPOSITORY ~/repo
cd ~/repo && git checkout -b $destination_branch
sudo rm -rf ~/scripts/scripts/.git
cp -rf ~/scripts/scripts/* ~/repo/

echo "Pushing changings to origin"
git push --set-upstream origin test
