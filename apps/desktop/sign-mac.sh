#!/bin/bash

# run this script with
# op run --env-file .env -- ./sign-mac.sh

env | rg APPLE_

# sign
codesign --force -s "$APPLE_SIGNING_IDENTITY" --options=runtime --deep src-tauri/target/release/bundle/macos/overlayed.app -v

# store creds
xcrun notarytool store-credentials "notarytool-profile" --apple-id "$APPLE_ID" --team-id="$APPLE_TEAM_ID" --password "$APPLE_PASSWORD"

# zip the app
cd src-tauri/target/release/bundle/macos
zip -r overlayed-aarch64-apple-darwin.zip overlayed.app

# notarize the app in the zip
xcrun notarytool submit "overlayed-aarch64-apple-darwin.zip" --keychain-profile "notarytool-profile" --wait
