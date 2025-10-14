const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log('Response body:', chunk);
  });
  res.on('end', () => {
    console.log('No more data in response.');
  });
});

req.on('error', (e) => {
  console.error('Problem with request:', e.message);
});

req.end();
