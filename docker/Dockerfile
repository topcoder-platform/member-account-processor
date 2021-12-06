# Use the base image with Node.js 8.11.3
FROM node:8.16.1

# Copy the current directory into the Docker image
COPY . /member-account-processor

# Set working directory for future use
WORKDIR /member-account-processor

# Install the dependencies from package.json
RUN npm install
CMD npm start