#!/bin/bash

# run this script with
# op run --env-file .env -- ./sign.sh

# build the app
cargo tauri build --target "x86_64-pc-windows-msvc" --bundles "msi,nsis"
cargo tauri build --target "universal-apple-darwin" --bundles "dmg"

# sign
# NOTE: It seems tauri has this logic baked in
#
# codesign --force -s "$APPLE_SIGNING_IDENTITY" --options=runtime --deep src-tauri/target/release/bundle/macos/overlayed.app -v
#
# # store creds
# xcrun notarytool store-credentials "notarytool-profile" --apple-id "$APPLE_ID" --team-id="$APPLE_TEAM_ID" --password "$APPLE_PASSWORD"
#
# # zip the app
# cd src-tauri/target/release/bundle/macos
# zip -r overlayed-aarch64-apple-darwin.zip overlayed.app
#
# # notarize the app in the zip
# xcrun notarytool submit "overlayed-aarch64-apple-darwin.zip" --keychain-profile "notarytool-profile" --wait

# search for all .exe files in the current directory
baseDir="src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis"
windowsBinaries=$(find . -type f -name "overlayed_*.exe")

echo "binary path: ${baseDir}"
# get file from last part of the path
filename=$(basename -- "$windowsBinaries")

echo "Signing: ${filename}"
docker run -it --rm -v "./$baseDir:/code" ghcr.io/sslcom/codesigner:latest sign \
  -username=${ES_USERNAME} \
  -password=${ES_PASSWORD} \
  -credential_id=${ES_CREDENTIAL_ID} \
  -totp_secret=${ES_TOTP_SECRET} \
  -input_file_path="/code/${filename}" \
  -override=true \
  -malware_block=false
