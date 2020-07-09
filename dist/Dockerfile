####### Staging #######
# FROM node:10.17-alpine AS staging

# ARG NPM_TOKEN

# WORKDIR /opt/app
# COPY ./app/ ./
# RUN npm i
# RUN npm run compile

####### Production #######
FROM node:10.17-alpine

ARG NPM_TOKEN

WORKDIR /opt/tmp

COPY ./app ./
RUN npm i
RUN npm run compile

WORKDIR /opt/app
RUN cp -r /opt/tmp/build/ ./
RUN cp -r /opt/tmp/config ./config
RUN cp -r /opt/tmp/scripts ./scripts
RUN rm -r /opt/tmp
RUN npm i --production
RUN chmod -R +x /opt/app/scripts

CMD ["/bin/sh", "./scripts/run.sh"]
