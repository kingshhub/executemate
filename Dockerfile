# Use official Node.js image
FROM node:22

# Set working directory
WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package.json package-lock.json ./

# Install dependencies using npm install (not npm ci)
RUN npm install

# Copy the rest of your project files
COPY . .

# Build your project
RUN npm run build

# Expose port (optional, if your app listens on a port)
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
