FROM  node:alpine as build-env
WORKDIR /App
COPY . ./

RUN yarn global add @quasar/cli
RUN yarn install
RUN quasar build -m pwa

FROM nginx
RUN rm /etc/nginx/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build-env /App/dist/pwa /config/nginx/html
COPY --from=build-env /App/nginx.conf /etc/nginx/nginx.conf
