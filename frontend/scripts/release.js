#!/usr/bin/env node
/**
 * Sentry Release Script
 * Usage: node scripts/release.js <version>
 * Example: node scripts/release.js 1.0.0
 *
 * Required environment variables:
 *   SENTRY_AUTH_TOKEN  - Your Sentry auth token
 *   SENTRY_ORG         - Your Sentry organization slug
 *   SENTRY_PROJECT     - Your Sentry project slug
 */

const { execSync } = require('child_process');
const path = require('path');

const version = process.argv[2] || require('./package.json').version;
const appName = 'health-monitor-frontend';
const release = `${appName}@${version}`;
const distDir = path.join(__dirname, '..', 'dist');

// Validate environment variables
const required = ['SENTRY_AUTH_TOKEN', 'SENTRY_ORG', 'SENTRY_PROJECT'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`\n❌ Missing required environment variables:\n  ${missing.join('\n  ')}`);
  console.error('\nPlease set these in your .env file or shell environment.\n');
  process.exit(1);
}

function run(cmd) {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', env: process.env });
}

console.log(`\n🚀 Creating Sentry release: ${release}`);
console.log(`   Org: ${process.env.SENTRY_ORG}`);
console.log(`   Project: ${process.env.SENTRY_PROJECT}`);

try {
  // 1. Create the release in Sentry
  run(`npx @sentry/cli releases new "${release}"`);

  // 2. Associate commits with this release
  try {
    run(`npx @sentry/cli releases set-commits "${release}" --auto`);
  } catch {
    console.warn('⚠️  Could not set commits (git history may not be linked). Continuing...');
  }

  // 3. Upload source maps
  run(`npx @sentry/cli releases files "${release}" upload-sourcemaps "${distDir}" --rewrite --url-prefix "~/assets"`);

  // 4. Finalize the release
  run(`npx @sentry/cli releases finalize "${release}"`);

  // 5. Mark deployment
  try {
    run(`npx @sentry/cli releases deploys "${release}" new -e ${process.env.NODE_ENV || 'production'}`);
  } catch {
    console.warn('⚠️  Could not create deployment. Continuing...');
  }

  console.log(`\n✅ Sentry release ${release} created and source maps uploaded successfully!\n`);
} catch (err) {
  console.error('\n❌ Release script failed:', err.message);
  process.exit(1);
}
