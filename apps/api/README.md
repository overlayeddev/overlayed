# api

A CF worker that's is a REST API for handling updates, artifact stuff, and authentication.

`api.overlayed.dev`

> By default wrangler dev runs in local development mode. In this mode, all operations performed by your local worker will operate against local storage on your machine. Use wrangler dev --remote if you want R2 operations made during development to be performed against a real R2 bucket.

So if you want to test against the prod r2 bucket you need to run with `--remote`.

### Running locally

You will need a to create an `.dev.vars` with the following:

```
# Github PAT to allow you to fetch the artifacts for updating
GITHUB_TOKEN=""

# Not really needed as I don't test auth locally ATM
CLIENT_ID=""
CLIENT_SECRET=""
```
