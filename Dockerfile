FROM node:18-alpine as development

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install

COPY . .

EXPOSE 3030

CMD [ "yarn", "dev" ]

# Build stage
FROM node:21-alpine as build

WORKDIR /app

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Install ALL dependencies, including dev dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the application code
COPY . .

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