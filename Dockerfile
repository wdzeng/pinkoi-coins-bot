FROM node:16-alpine

COPY dist /app

WORKDIR /app
ENTRYPOINT [ "node", "index.js" ]

LABEL description="Get pinkoi coins everyday."
