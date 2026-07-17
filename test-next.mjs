import http from 'http';

const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';

const payload = `--${boundary}\r
Content-Disposition: form-data; name="1_$ACTION_ID_1c1102f43d04d80a1df27756e2978be71a172776"\r
\r
\r
--${boundary}\r
Content-Disposition: form-data; name="email"\r
\r
realtest@focus.ai\r
--${boundary}\r
Content-Disposition: form-data; name="password"\r
\r
SecurePassword123!\r
--${boundary}\r
Content-Disposition: form-data; name="displayName"\r
\r
Real Test\r
--${boundary}--\r
`;

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/signup',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Next-Action': '1c1102f43d04d80a1df27756e2978be71a172776',
    'Origin': 'http://localhost:3000',
    'Host': 'localhost:3000',
    'Accept': 'text/x-component'
  }
}, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    console.log(`Body:`, body);
  });
});

req.on('error', console.error);
req.write(payload);
req.end();
