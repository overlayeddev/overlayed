#!/bin/bash

## This script is used to sign the windows binaries using the codesigner docker image
# op run --env-file .env -- ./scripts/sign-windows.sh

# absolute path from relative
abosolute_path=$(realpath "binaries")

docker run -it --rm -v "${abosolute_path}:/code/binaries" ghcr.io/sslcom/codesigner:latest batch_sign \
  -username="$ES_USERNAME" \
  -password="$ES_PASSWORD" \
  -credential_id="$ES_CREDENTIAL_ID" \
  -totp_secret="$ES_TOTP_SECRET" \
  -input_dir_path="/code/binaries" \
  -output_dir_path="/code/binaries/signed"
