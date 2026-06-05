const https = require('https');
https.get('https://maps.app.goo.gl/AipUucBBovnz24gR8', (res) => {
  console.log(res.headers.location);
});
