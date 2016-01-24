server {
        listen pubsub.jsonspace.com:80;

        root /var/www/pubsub.jsonspace.com;
        index index.html index.htm;

        server_name pubsub.jsonspace.com;

        location / {
                # First attempt to serve request as file, then
                # as directory, then fall back to displaying a 404.
                try_files $uri $uri/ =404;
                # Uncomment to enable naxsi on this location
                # include /etc/nginx/naxsi.rules
        }
}
