const fs = require('fs');
const https = require('https');
const jwt = require('jsonwebtoken');

const spreadsheetId = process.argv[2];
const credentialFile = process.argv[3] || 'wapu_google_credential_import.local.json';

if (!spreadsheetId) {
  console.error('Usage: node test_google_sheet_access.js <spreadsheetId>');
  process.exit(1);
}

const imported = JSON.parse(fs.readFileSync(credentialFile, 'utf8'));
const data = imported[0].data;
const privateKey = data.privateKey.replace(/\\n/g, '\n');
const now = Math.floor(Date.now() / 1000);
const assertion = jwt.sign(
  {
    iss: data.email,
    sub: data.email,
    scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.metadata.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  },
  privateKey,
  { algorithm: 'RS256' },
);

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let chunks = '';
      res.on('data', (chunk) => {
        chunks += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`${res.statusCode}: ${chunks}`));
          return;
        }
        resolve(JSON.parse(chunks));
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

(async () => {
  const tokenBody = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  }).toString();

  const token = await request(
    {
      method: 'POST',
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(tokenBody),
      },
    },
    tokenBody,
  );

  const metadata = await request({
    method: 'GET',
    hostname: 'sheets.googleapis.com',
    path: `/v4/spreadsheets/${spreadsheetId}?includeGridData=false`,
    headers: { Authorization: `Bearer ${token.access_token}` },
  });

  console.log(JSON.stringify({
    title: metadata.properties?.title,
    sheets: metadata.sheets?.map((sheet) => ({
      title: sheet.properties?.title,
      sheetId: sheet.properties?.sheetId,
      rowCount: sheet.properties?.gridProperties?.rowCount,
      columnCount: sheet.properties?.gridProperties?.columnCount,
    })),
  }, null, 2));
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
