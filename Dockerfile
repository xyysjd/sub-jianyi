FROM node:16-alpine

WORKDIR /usr/src/app

# 安装依赖并清理缓存
COPY package*.json ./
RUN npm install --production && npm cache clean --force

# 将应用代码复制到容器中
COPY . .

# 创建上传目录
RUN mkdir -p uploads

EXPOSE 3000

# 启动应用
CMD ["node", "app.js"]
