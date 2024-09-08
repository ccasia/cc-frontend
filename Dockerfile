# Build stage
FROM node:21-bookworm-slim as build

WORKDIR /app

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Install ALL dependencies, including dev dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Explicitly install terser
RUN yarn add --dev terser

# Build the application
RUN yarn build

# Production stage
FROM node:21-bookworm-slim

WORKDIR /app

# Copy built assets from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/yarn.lock ./yarn.lock

# Install only production dependencies
RUN yarn install --frozen-lockfile --production

# Expose the port your app runs on
EXPOSE 3030

# Start the app
CMD ["yarn", "start"]