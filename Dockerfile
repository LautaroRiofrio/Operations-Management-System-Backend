FROM node:18

WORKDIR /app

ENV TZ=America/Argentina/Buenos_Aires

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000 5555

CMD ["npm", "run", "dev"]
