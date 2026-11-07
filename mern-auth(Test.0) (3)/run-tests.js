#!/usr/bin/env node
/**
 * run-tests.js  – Newman test runner for HustleHub+ API
 * 
 * Usage:
 *   node run-tests.js
 * 
 * Prerequisites:
 *   npm install -g newman newman-reporter-htmlextra
 *   (or: npx newman)
 * 
 * Ensure the server is running on port 5000 before running tests.
 */

const { execSync } = require('child_process');
const path = require('path');

const COLLECTION = path.resolve(__dirname, 'HustleHub_Plus_API.postman_collection.json');
const REPORT_DIR = path.resolve(__dirname, 'test-reports');

// Create reports directory
try {
  require('fs').mkdirSync(REPORT_DIR, { recursive: true });
} catch {}

console.log('\n🧪 Running HustleHub+ API Tests with Newman...\n');
console.log('📦 Collection:', COLLECTION);
console.log('📁 Reports:   ', REPORT_DIR);
console.log('─'.repeat(60));

try {
  execSync(
    `npx newman run "${COLLECTION}" ` +
    `--reporters cli,htmlextra ` +
    `--reporter-htmlextra-export "${REPORT_DIR}/report.html" ` +
    `--reporter-htmlextra-title "HustleHub+ API Test Report" ` +
    `--delay-request 200 ` +
    `--timeout-request 10000`,
    { stdio: 'inherit' }
  );
  console.log('\n✅ All tests completed. HTML report: test-reports/report.html\n');
} catch (err) {
  console.error('\n❌ Some tests failed. Check the report for details.\n');
  process.exit(1);
}
