FROM node:bookworm AS build
USER node

WORKDIR /hackchat
RUN git clone https://github.com/hack-chat/main.git .
COPY config.js scripts/config.js
RUN npm install

FROM node:slim AS run
USER node

COPY --from=build --chown=node /hackchat /hackchat
COPY pm2.config.cjs /hackchat/pm2.config.cjs

WORKDIR /hackchat
RUN npm install fs-extra && sed -i -e "s/renameSync/moveSync/g" /hackchat/node_modules/hackchat-server/src/serverLib/ImportsManager.js

ARG SERVEPATH="localhost:8903"
RUN sed -i "s/var wsPath = ':6060';/var wsPath = '${SERVEPATH}';/g" /hackchat/client/client.js

EXPOSE 6060
CMD node_modules/pm2/bin/pm2 startOrReload pm2.config.cjs --no-daemon
