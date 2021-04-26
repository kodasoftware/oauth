####### Build #######
FROM node:10.17 AS build

WORKDIR /opt/app

COPY . .

RUN npm set progress=false && \
    npm config set depth 0
RUN npm i
RUN npm run compile


####### Runtime #######
FROM node:10.17 AS runtime

WORKDIR /opt/app

RUN ls

COPY --from=build /opt/app/build/ ./

RUN ls

RUN npm set progress=false && \
    npm config set depth 0 && \
    npm i --production
RUN chmod -R +x /opt/app/scripts

RUN ls

CMD ["/bin/sh", "./scripts/run.sh"]
