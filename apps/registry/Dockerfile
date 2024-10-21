FROM node:22-slim AS BUILD_IMAGE

RUN mkdir "/app"

WORKDIR "/app"
ADD ["./package.json", "./package-lock.json", "./"]

RUN npm install

ADD ["./", "./"]

EXPOSE 3000
ENTRYPOINT [ "node", "--experimental-strip-types" ,"/app/main.ts" ]