# Local Setup

To contribute you will first need to fork the repo and make some adjustments to
get it up and running on your local machine. Below are the steps to follow for you to get Overlayed to run on your local machine.

# Prerequisites

- Rust
- Node
- pnpm

### 1. Fork & clone the repo

Follow https://docs.github.com/en/get-started/quickstart/fork-a-repo

### 2. Install the deps

From the root of the monorepo run.

```sh
pnpm install
```

### 3. Start the desktop app

From the root of the monorepo run
```sh
pnpm start --filter=desktop
```

### Running the Web & API 
Since the API uses github API you'll need to create a `apps/web/.dev.vars` that has a `GITHUB_TOKEN` (github personal access toke).

Then you'd run something like this to start both `api` and `web`.
```
pnpm start --filter=web --filter=api
```

If you want to use a mocked response you can run this command in the `apps/web` directory.

```
pnpm start:mocked

```

### 4. Building the latest version locally
```
pnpm build:desktop
```

### 5. Building the canary version locally
```
pnpm build:canary
```
