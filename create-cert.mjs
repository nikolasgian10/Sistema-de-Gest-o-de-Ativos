import { exec } from 'child_process';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { networkInterfaces } from 'os';
import forge from 'node-forge';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Get local network IP
function getLocalIP() {
  const interfaces = networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

async function generateCertificate() {
  // Create .cert directory if it doesn't exist
  const certDir = join(__dirname, '.cert');
  await mkdir(certDir, { recursive: true });

  const localIP = getLocalIP();
  console.log(`Generating certificate for localhost, 127.0.0.1, and ${localIP}`);

  // Generate a key pair
  const keys = forge.pki.rsa.generateKeyPair(2048);

  // Create a certificate
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  const attrs = [{
    name: 'commonName',
    value: 'localhost'
  }, {
    name: 'countryName',
    value: 'US'
  }, {
    shortName: 'ST',
    value: 'Virginia'
  }, {
    name: 'localityName',
    value: 'Blacksburg'
  }, {
    name: 'organizationName',
    value: 'Dev Certificate'
  }, {
    shortName: 'OU',
    value: 'Development'
  }];

  cert.setSubject(attrs);
  cert.setIssuer(attrs);

  // Build altNames array with localhost, 127.0.0.1, and local IP
  const altNames = [{
    type: 2,
    value: 'localhost'
  }, {
    type: 7,
    ip: '127.0.0.1'
  }];

  // Add local network IP if different from 127.0.0.1
  if (localIP !== '127.0.0.1') {
    altNames.push({
      type: 7,
      ip: localIP
    });
  }

  cert.setExtensions([{
    name: 'basicConstraints',
    cA: true
  }, {
    name: 'keyUsage',
    keyCertSign: true,
    digitalSignature: true,
    nonRepudiation: true,
    keyEncipherment: true,
    dataEncipherment: true
  }, {
    name: 'extKeyUsage',
    serverAuth: true,
    clientAuth: true
  }, {
    name: 'subjectAltName',
    altNames: altNames
  }]);

  // Self-sign the certificate
  cert.sign(keys.privateKey);

  // Convert to PEM format
  const certPem = forge.pki.certificateToPem(cert);
  const keyPem = forge.pki.privateKeyToPem(keys.privateKey);

  // Write the certificate and private key to files
  await writeFile(join(certDir, 'cert.pem'), certPem);
  await writeFile(join(certDir, 'key.pem'), keyPem);

  console.log('Certificate and private key have been generated!');
}

generateCertificate().catch(console.error);