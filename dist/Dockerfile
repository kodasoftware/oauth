####### Staging #######
FROM node:10.17-alpine AS staging

ARG NPM_TOKEN

WORKDIR /opt/app
COPY ./app/ ./
RUN npm set progress=false && \
    npm config set depth 0 && \
    npm install
RUN npm run compile


####### Production #######
FROM node:10.17-alpine

ARG NPM_TOKEN

WORKDIR /opt/app
COPY --from=staging /opt/app/build/ ./
COPY --from=staging /opt/app/config ./config
COPY --from=staging /opt/app/scripts ./scripts
RUN npm set progress=false && \
    npm config set depth 0 && \
    npm i --production && \
    npm cache clean
RUN chmod -R +x /opt/app/scripts

CMD ["/bin/sh", "./scripts/run.sh"]
