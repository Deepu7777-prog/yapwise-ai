#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "=== 1. Building React Frontend ==="
cd frontend
npm install --include=dev
npm run build
cd ..

echo "=== 2. Installing Python Backend Dependencies ==="
pip install --upgrade pip
pip install -r requirements.txt

echo "=== Build Complete! Frontend dist & backend ready ==="
