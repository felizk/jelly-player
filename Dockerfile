FROM  node:alpine as build-env
WORKDIR /App
COPY . ./

RUN yarn global add @quasar/cli
RUN yarn install
RUN quasar build

FROM nginx
RUN rm /etc/nginx/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build-env /App/dist/spa /config/nginx/html
COPY --from=build-env /App/nginx.conf /etc/nginx/nginx.conf
