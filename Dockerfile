# Använd en lättvikts-version av Node.js
FROM node:20-alpine

# Sätt arbetsmappen i containern
WORKDIR /app

# Kopiera package.json för api
COPY api/package*.json ./
RUN npm install

# Kopiera in resten av api-koden
COPY api/ .

# Berätta för Cloud Run vilken port vi lyssnar på
ENV PORT=8080
EXPOSE 8080

# Starta servern
CMD ["npx", "tsx", "src/index.ts"]
