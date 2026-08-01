FROM nginx:alpine

COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY app/ /usr/share/nginx/html/
