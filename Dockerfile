FROM node:23-alpine As build

WORKDIR /usr/src/app

COPY package*.json package-lock.json ./

RUN npm ci

COPY ./ ./

RUN npm run build


FROM nginx as production

COPY --from=build /usr/src/app/nginx /etc/nginx/conf.d

COPY --from=build /usr/src/app/dist /usr/share/nginx/html

ENTRYPOINT ["nginx", "-g", "daemon off;"]
