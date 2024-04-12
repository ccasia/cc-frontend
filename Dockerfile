FROM node:21-bookworm-slim as development

WORKDIR /app

COPY package.json ./

RUN yarn install

COPY . .

EXPOSE 3030

CMD [ "yarn", "dev" ]
