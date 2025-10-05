FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
# Install dev dependencies so we can run the TypeScript build
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production
# Copy compiled artifacts from build stage
COPY --from=build /app/dist ./dist
EXPOSE 3000
ENV NODE_PATH=/app/dist/src
CMD ["node", "dist/src/index.js"]
