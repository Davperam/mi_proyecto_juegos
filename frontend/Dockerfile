FROM node:18-alpine

WORKDIR /app

RUN npm install -g @ionic/cli @angular/cli

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8100
CMD ["ionic", "serve", "--external", "--port=8100", "--address=0.0.0.0"]