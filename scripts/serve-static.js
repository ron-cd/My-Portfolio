#!/usr/bin/env node
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');

const root = path.resolve(__dirname, '..');
const port = Number(process.argv[2]) || 4173;
const host = '127.0.0.1';

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${host}`);
  const pathname = decodeURIComponent(url.pathname);
  const target = path.resolve(root, pathname === '/' ? 'index.html' : pathname.slice(1));

  if (!target.startsWith(root)) {
    send(res, 403, 'Forbidden');
    return;
  }

  fs.readFile(target, (error, data) => {
    if (error) {
      send(res, 404, 'Not found');
      return;
    }

    send(res, 200, data, types[path.extname(target)] || 'application/octet-stream');
  });
});

server.listen(port, host, () => {
  console.log(`Serving http://${host}:${port}/`);
});
