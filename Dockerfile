FROM alpine
RUN apk add --no-cache make gcc g++ python3 git nodejs npm yarn libstdc++ chromium

WORKDIR /usr/src/app
COPY --chown=chrome package.json package-lock.json ./
COPY package*.json ./
# COPY index.js ./
RUN npm install
COPY --chown=chrome . ./
# COPY onrun.sh /usr/bin/

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

VOLUME ["/etc/tor", "/var/lib/tor"]

COPY package.json .
COPY package-lock.json .
RUN npm install
# CMD ["google-chrome-stable"]
COPY . .
CMD [ "node", "scraper.js" ]