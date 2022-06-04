FROM node:16-alpine

COPY src /app

WORKDIR /app
ENTRYPOINT [ "node", "index.js" ]

LABEL description="Get pinkoi coins everyday."
