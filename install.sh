#!/bin/bash

set -e

INSTALL_DIR="/opt/image-converter"
SERVICE_FILE="/etc/systemd/system/image-converter.service"
SERVICE_SOURCE="$(dirname "$0")/image-converter.service"

if [ "$EUID" -ne 0 ]; then 
    echo "error: you cannot perform this operation unless you are root."
    exit 1
fi

cd "$(dirname "$0")"

echo "Installing ffmpeg with npm..."
npm install

if ! go build -o image-converter .; then
    echo "Error building binary"
    exit 1
fi

echo "Installing..."
mkdir -p "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR/node_modules/@ffmpeg"
mkdir -p /var/cache/image-converter/autocert
cp -r public "$INSTALL_DIR/"
cp -r node_modules/@ffmpeg/* "$INSTALL_DIR/node_modules/@ffmpeg/"

cp image-converter /usr/local/bin/
chmod +x /usr/local/bin/image-converter

chmod -R 755 "$INSTALL_DIR"

cp "$SERVICE_SOURCE" "$SERVICE_FILE"

systemctl daemon-reload
systemctl enable image-converter
