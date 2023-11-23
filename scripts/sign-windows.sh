# op run --env-file .env -- ./test.sh
docker run -it --rm -v "./binaries/:/code/binaries" ghcr.io/sslcom/codesigner:latest batch_sign \
  -username=${ES_USERNAME} \
  -password=${ES_PASSWORD} \
  -credential_id=${ES_CREDENTIAL_ID} \
  -totp_secret=${ES_TOTP_SECRET} \
  -input_dir_path="/code/binaries" \
  -output_dir_path="/code/binaries/signed"
