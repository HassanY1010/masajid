import * as https from 'https';

function check() {
  const url = 'https://masajid-1ggr.onrender.com/api/projects';
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('STATUS:', res.statusCode);
      try {
        const json = JSON.parse(data);
        console.log('PARSED_JSON:', JSON.stringify(json, null, 2));
      } catch (e) {
        console.log('RAW_DATA:', data);
      }
    });
  }).on('error', (e) => console.error('ERROR:', e));
}

check();
