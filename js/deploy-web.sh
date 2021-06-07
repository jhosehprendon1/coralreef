#!/usr/bin/env bash
echo "Starting to deploy 'proko', bootstrapping..."
yarn bootstrap
echo "Preparing 'common'..."
cd packages/common || exit
yarn prepare
yarn build-css
cd ../proko || exit
echo "Prestarting 'proko'..."
yarn prestart
echo "Building 'proko'..."
# TODO: fix linting errors!
CI=false && yarn build
echo "#done"
