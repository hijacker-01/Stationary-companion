#!/bin/bash
set -e

echo "==> [1/6] Installing & testing backend..."
cd backend && npm install && npm test
cd ..

echo "==> [2/6] Installing & building frontend..."
cd frontend && npm install && npm run build
cd ..

echo "==> [3/6] Installing electron dependencies..."
cd electron && npm install

echo "==> [4/6] Packaging the installer (electron-builder)..."
env -u GH_TOKEN npm run dist

echo "==> [5/6] Locating the built installer..."
ls -la dist/ | grep -iE "\.exe|\.dmg|\.appimage" || (echo "❌ No installer found in dist/ — build did not actually produce output" && exit 1)

echo "==> [6/6] DONE."
echo "The installer is in electron/dist/"
cd ..
