FROM node:20

WORKDIR /app

COPY ./src/package*.json ./
RUN npm install
