FROM node:16-alpine
WORKDIR /app
COPY modem_scrape.js package.json /app/
RUN npm install --no-optional --no-audit --no-fund
CMD ["node", "modem_scrape.js"]
