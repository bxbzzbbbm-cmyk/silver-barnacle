// Local development server for testing the RAM Checker API
// This file is for local dev only; on EdgeOne Makers, cloud-functions/ handles routing.

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const ramOptions = [1024, 512, 2048, 4096, 1536];

const server = http.createServer((req, res) => {
  if (req.url === '/api/get-ram' && req.method === 'GET') {
    const randomIndex = Math.floor(Math.random() * ramOptions.length);
    const ramSize = ramOptions[randomIndex];

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    });
    res.end(JSON.stringify({
      ram_size_mb: ramSize,
      unit: 'MB',
      available_options: ramOptions,
    }));
  } else {
    const filePath = req.url === '/' ? '/index.html' : req.url;
    const fullPath = path.join(__dirname, filePath);

    fs.readFile(fullPath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      } else {
        const ext = path.extname(fullPath);
        const contentTypes = {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
        };
        res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
        res.end(data);
      }
    });
  }
});

server.listen(PORT, () => {
  console.log('RAM Checker server running at http://localhost:' + PORT);
  console.log('API endpoint: http://localhost:' + PORT + '/api/get-ram');
});
