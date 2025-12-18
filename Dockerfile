FROM node:20

RUN apt-get update && apt-get install -y \
    sudo \
    git \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN echo 'node ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

# USER node
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
