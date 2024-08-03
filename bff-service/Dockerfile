# Use the official Node.js image.
FROM node:18

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests.
COPY package*.json ./

# Install production dependencies.
RUN npm install

# Copy the source code into the container.
COPY . .

# Make port 3000 available to the world outside this container.
EXPOSE 3000

# Run the application.
CMD ["node", "server.js"]
