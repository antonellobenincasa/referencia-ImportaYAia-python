#!/bin/bash

# Build script for NELLOGISTICS deployment

echo "Building NELLOGISTICS frontend..."
cd frontend
npm install
npm run build
cd ..

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Build complete!"