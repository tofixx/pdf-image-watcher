FROM ubuntu:18.04

RUN apt-get update
RUN apt-get --yes install ghostscript
RUN apt-get --yes install libgs-dev
RUN apt-get --yes install npm
RUN apt-get --yes install nodejs

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

RUN npm test

VOLUME ["/usr/src/app/export_folder", "/usr/src/app/watch_folder"]

CMD [ "npm", "start" ]
