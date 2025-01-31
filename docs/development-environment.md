# Local Setup
1. Clone the [repository](https://github.com/Server-Departementet/Riksdagen).

2. Install dependencies:
```bash
yarn install
```

1. [.env-setup.md](./.env-setup.md)

## Running in development mode
There are two options: single transpile and watch mode.

### Single transpile
Suited for debugging and testing Next. See [package-scripts.md](./package-scripts.md) for more information.

```bash
yarn dev # Also runs Next
```

### Watch mode
Suited for debugging and testing the Node server code. See [package-scripts.md](./package-scripts.md) for more information.

> Warning! The watcher will run the code very often so take care in relation to database and API call rates.

```bash
yarn next:dev # In one terminal
yarn server:dev:watch # In another terminal
```


## Running in production mode
Running in production consists of two steps: building all of it and then running it.

```bash
yarn build
yarn start
```

# Server setup
See [server setup](./server-setup.md) for how to set up the server.

## GitHub workflow
This repository has a [workflow](https://github.com/Server-Departementet/Riksdagen/actions/workflows/deploy-production.yml) ([file](../.github/workflows/deploy-production.yml)) that builds and deploys a branch or tag to the server. After the initial server setup this is the only thing needed to deploy new code.