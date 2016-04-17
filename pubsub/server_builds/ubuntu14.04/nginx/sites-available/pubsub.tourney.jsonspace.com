# http server at port 80
server {
  listen 0.0.0.0:80;
  server_name pubsub.tourney.jsonspace.com;
  ## redirect http to https ##
  rewrite ^ https://$server_name$request_uri? permanent;
}

server {
  listen 0.0.0.0:443 ssl;
  server_name pubsub.tourney.jsonspace.com;

  ssl_certificate      /srv/pubsub.tourney.jsonspace.com.pem;
  ssl_certificate_key  /srv/pubsub.tourney.jsonspace.com.key;

  ssl_session_cache shared:SSL:1m;
  ssl_session_timeout 86400s;

  # ssl_ciphers  HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers   on;
  ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
  ssl_ciphers ECDH+AESGCM:DH+AESGCM:ECDH+AES256:DH+AES256:ECDH+AES128:DH+AES:ECDH+3DES:DH+3DES:RSA+AESGCM:RSA+AES:RSA+3DES:!aNULL:!MD5:!DSS;

  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_read_timeout 86400s;

  # no security problem here, since / is alway passed to upstream
  root /tmp;
  location / {
    proxy_pass http://localhost:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";

    proxy_set_header Host $http_host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Scheme $scheme;
  }
  # what to serve if upstream is not available or crashes
  error_page 500 502 503 504 /media/50x.html;

}

