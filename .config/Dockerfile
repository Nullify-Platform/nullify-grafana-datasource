ARG grafana_version=latest@sha256:ff5bd4b4c7d93e50e9fbda1a12f376097bf1b2b48aeb5cac3c0490d69a451c9e
ARG grafana_image=grafana-enterprise

FROM grafana/${grafana_image}:${grafana_version}

# Make it as simple as possible to access the grafana instance for development purposes
# Do NOT enable these settings in a public facing / production grafana instance
ENV GF_AUTH_ANONYMOUS_ORG_ROLE "Admin"
ENV GF_AUTH_ANONYMOUS_ENABLED "true"
ENV GF_AUTH_BASIC_ENABLED "false"
# Set development mode so plugins can be loaded without the need to sign
ENV GF_DEFAULT_APP_MODE "development"

# Inject livereload script into grafana index.html
USER root
RUN sed -i 's|</body>|<script src="http://localhost:35729/livereload.js"></script></body>|g' /usr/share/grafana/public/views/index.html
