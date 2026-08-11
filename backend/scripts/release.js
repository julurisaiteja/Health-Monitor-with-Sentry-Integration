#!/usr/bin/env node
/**
 * Backend Sentry Release Script
 * Usage: node scripts/release.js <version>
 */

const { execSync } = require('child_process');
require('dotenv').config();

const version = process.argv[2] || require('./package.json').version;
const appName = 'health-monitor-backend';
const release = `${appName}@${version}`;

const required = ['SENTRY_AUTH_TOKEN', 'SENTRY_ORG', 'SENTRY_PROJECT'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`\n❌ Missing required environment variables:\n  ${missing.join('\n  ')}`);
  process.exit(1);
}

function run(cmd) {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', env: process.env });
}

console.log(`\n🚀 Creating Sentry release: ${release}`);

try {
  run(`npx @sentry/cli releases new "${release}"`);
  try {
    run(`npx @sentry/cli releases set-commits "${release}" --auto`);
  } catch {
    console.warn('⚠️  Could not set commits. Continuing...');
  }
  run(`npx @sentry/cli releases finalize "${release}"`);
  console.log(`\n✅ Backend release ${release} created successfully!\n`);
} catch (err) {
  console.error('\n❌ Release script failed:', err.message);
  process.exit(1);
}
