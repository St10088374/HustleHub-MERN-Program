const fs = require('fs');
const path = require('path');
const selfsigned = require('selfsigned');

const certDir = path.join(__dirname, 'certs');
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
}

const keyPath = path.join(certDir, 'server.key');
const certPath = path.join(certDir, 'server.cert');

async function generate() {
  console.log('⚙️ Generating self-signed SSL certificates for localhost HTTPS...');
  const attrs = [{ name: 'commonName', value: 'localhost' }];
  const pems = await selfsigned.generate(attrs, { days: 365 });

  fs.writeFileSync(keyPath, pems.private);
  fs.writeFileSync(certPath, pems.cert);
  console.log('✅ Generated server.key and server.cert successfully in server/certs/');
}

generate().catch((err) => {
  console.error('Failed to generate certificates:', err);
  process.exit(1);
});
