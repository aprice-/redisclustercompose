FROM node:alpine

RUN mkdir /discover
WORKDIR /discover

ADD package.json /discover
RUN npm i

ADD index.js /discover

CMD node index.js

EXPOSE 3000

