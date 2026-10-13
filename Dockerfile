FROM  node:22-alpine as build-env
WORKDIR /App
COPY . ./

RUN yarn global add @quasar/cli
RUN yarn install
RUN quasar build -m pwa

FROM nginx
RUN rm /etc/nginx/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build-env /App/dist/pwa /config/nginx/html
COPY --from=build-env /App/nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s CMD curl -fsS -o /dev/null http://127.0.0.1:8080/ || exit 1
