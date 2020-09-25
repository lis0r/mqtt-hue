FROM node:alpine

WORKDIR /app

COPY package.json ./

RUN npm install

COPY index.js ./
COPY config.js ./
COPY hub.js ./
COPY light.js ./
COPY lights.js ./
COPY state.js ./

CMD [ "node", "index.js" ]