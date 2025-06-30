# Use the official Node.js 18 LTS image as the base image.
FROM node:18-slim

# Set the working directory in the container.
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available) to the working directory.
# This helps in leveraging Docker layer caching for npm install.
COPY package*.json ./

# Install application dependencies.
RUN npm install

# Copy the rest of the application source code to the working directory.
COPY . .

# The application listens on port 3000 as defined in app.js.
# Cloud Run automatically handles port mapping, but it's good practice to expose it.
EXPOSE 3000

# Define the command to run your application.
CMD [ "node", "app.js" ]

