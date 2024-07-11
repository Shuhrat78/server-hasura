FROM node:dubnium-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn add dotenv
RUN yarn install

COPY . .
ADD . .

# RUN yarn build

EXPOSE 3000

# USER node

CMD ["node", "index.js"]