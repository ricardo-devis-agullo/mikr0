cd ~/Dev/mikr0
npm run build
cd -
rm -rf node_modules/mikr0/dist
cp -R ~/Dev/mikr0/packages/mikr0/dist node_modules/mikr0