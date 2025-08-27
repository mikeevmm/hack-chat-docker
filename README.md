# `hack.chat` Docker container

This repository contains a `docker compose` setup that can serve the
[hack.chat][hack.chat] project.

## Deploying

```bash
# Clone the repository
$ git clone https://github.com/mikeevmm/hack-chat-docker hackchat
$ cd hackchat

# Configure port mapping and serve URL in docker-compose.yml
$ editor docker-compose.yml

# Build the container
# (Set CHANNELS='' for the default channels.)
$ ADMIN='admin_password' \
  CHANNELS='first,second,vip' \
  docker compose create chat

# Copy the frontend files
$ docker compose cp chat:/hackchat/client ./client

# Run the backend
$ docker compose up

# Host the frontend files (with Nginx or similar)
```

## Hacks

> [!TIP]
> Read this if you're from the future and this isn't working.

Due to the nature of the source code, making it amenable to containerization
has required some hacks. While these are not too hard to update, significant
changes to the `hack.chat` repository may break the current approach.

Namely, the original repository runs an interactive configuration script right
after `npm install` as a `postinstall` hook. Docker can't deal with this script
correctly. The Dockerfile in this repository overwrites the corresponding
configuration script (`config.js`) with a modified copy that doesn't require
user input. If the original `config.js` is modified substantially, this
overwriting may break the build process.

Furthermore, the provided client files hard-code the backend URL. This breaks
whenever the host port differs from the (hard-coded) container port (6060).
This is currently rectified with a `sed` as part of the build process, so that
the serve URL can be set within the `docker-compose.yml` file. If the
`client.js` file changes substantially, this hack can break.

Finally, the original `hack.chat` repository serves both its websocket backend
and client files with [`pm2`][pm2]; however, it claims in its documentation that
the file server should not be trusted for production deployment. Thus, the
Dockerfile in this repository also overwrites the corresponding configuration
file (`pm2.config.cjs`) so that only the websocket backend is served. If the
original copy of this file changes substantially, Docker may fail to start the
server, or it may not work correctly.

The Docker configuration given here works with `hack.chat`'s commit
[`6915f8a`][6915f8a].

[hack.chat]: https://github.com/hack-chat/main
[6915f8a]: https://github.com/hack-chat/main/commit/6915f8a543e2480f251559a4ad5fde2c2d82bd75
[pm2]: https://pm2.keymetrics.io/
