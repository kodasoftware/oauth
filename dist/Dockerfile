####### Build #######
FROM node:10.17 AS build

WORKDIR /opt/app

COPY ./app/ ./

RUN npm set progress=false && \
    npm config set depth 0
RUN npm i
RUN npm run compile


####### Runtime #######
FROM node:10.17 AS runtime

WORKDIR /opt/app

COPY --from=build /opt/app/build/ ./

RUN npm set progress=false && \
    npm config set depth 0 && \
    npm i --production
RUN chmod -R +x /opt/app/scripts

CMD ["/bin/sh", "./scripts/run.sh"]
