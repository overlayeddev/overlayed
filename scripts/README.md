# action scripts

These are scripts that are ran in the `release.yaml`.
You can use `scripts/test.ts` as a test harness to test them locally.

NOTE: make sure to have an `.env` file in the root with a `GITHUB_TOKEN` so that the calls work.


### Testing locally with creds
my strat for running via 1password cli
```
op run --env-file=.env -- npx tsx scripts/test.ts download
```

### Typescript for `scripts/actions'
Right now the biggest blocker is this ticket
https://github.com/actions/github-script/issues/294
