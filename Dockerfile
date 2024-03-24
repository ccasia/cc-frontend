FROM node:20-alpine3.17 as development

WORKDIR /app

COPY package.json ./

RUN yarn install

COPY . .

EXPOSE 3030

CMD [ "yarn", "dev" ]
