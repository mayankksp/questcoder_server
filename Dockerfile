# Set the base image
FROM node:14

# Set the working directory in the Docker image
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies in the Docker image
RUN npm install

# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source inside Docker image (copy rest of the application code)
COPY . .

# Your app binds to port 8080 so you'll use the EXPOSE instruction to have it mapped by the Docker daemon
EXPOSE 8080

# Define the command to run your app using CMD which defines your runtime
CMD [ "npm", "start" ]
