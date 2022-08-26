FROM node:16-alpine

COPY dist /app

ENV TZ=Asia/Taipei
WORKDIR /app
ENTRYPOINT [ "node", "index.js" ]
