cd ~/Dev/mikro
npm run build
cd -
rm -rf node_modules/mikr0/dist
cp -R ~/Dev/mikro/packages/mikro/dist node_modules/mikr0