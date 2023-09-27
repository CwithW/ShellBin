#!/bin/sh

# if '/app/data' does not exist, mkdir -p it
if [ ! -d "/app/data" ]; then
    mkdir -p /app/data
fi

# if '/app/config' does not exist, mkdir -p it
if [ ! -d "/app/config" ]; then
    mkdir -p /app/config
fi

# if '/app/config/config.yml' does not exist, polyfill with '/app/config.yml.gen'
if [ ! -f "/app/config/config.yml" ]; then
    cat /app/config.yml.gen > /app/config/config.yml
fi

# if environment variable "USERNAME" exists, replace "username: admin" with "username: THE_VALUE_OF_USERNAME" of config.yml
if [ ! -z "$USERNAME" ]; then
    sed -i "s/username: admin/username: $USERNAME/g" /app/config/config.yml
fi

# if environment variable "PASSWORD" exists, replace "password: admin" with "password: THE_VALUE_OF_PASSWORD" of config.yml
if [ ! -z "$PASSWORD" ]; then
    sed -i "s/password: admin/password: $PASSWORD/g" /app/config/config.yml
fi

# if environment variable "REMOVE_DEAD_AFTER" exists, replace "remove_dead_after: 3600" with "remove_dead_after: THE_VALUE_OF_REMOVE_DEAD_AFTER" of config.yml
if [ ! -z "$REMOVE_DEAD_AFTER" ]; then
    sed -i "s/remove_dead_after: 3600/remove_dead_after: $REMOVE_DEAD_AFTER/g" /app/config/config.yml
fi

# start app
node /app/main.js
