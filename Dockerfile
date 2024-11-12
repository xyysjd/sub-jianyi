# 使用更小的 Node.js 镜像
FROM node:16-alpine

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install && npm cache clean --force
COPY . .

RUN mkdir -p uploads
EXPOSE 3000

CMD ["node", "app.js"]
