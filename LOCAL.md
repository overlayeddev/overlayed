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

### 4. Building the latest version locally
```
pnpm build:desktop
```

### 5. Building the canary version locally
```
pnpm build:canary
```
