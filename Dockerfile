FROM mcr.microsoft.com/playwright:v1.50.0-noble

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm ci

# Bundle app source
COPY . .

# Expose API port
EXPOSE 3001

ENV PORT=3001
ENV NODE_ENV=production

# Start Express server with Playwright & Cron support
CMD ["npm", "run", "server"]
