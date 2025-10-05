// Ensures node_modules/react-native/types/tsconfig.json doesn't include "include" which causes noisy editor diagnostics
const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'node_modules', 'react-native', 'types', 'tsconfig.json');
try {
  if (!fs.existsSync(target)) {
    console.log('[fix-rn-tsconfig] target not found:', target);
    process.exit(0);
  }
  const raw = fs.readFileSync(target, 'utf8');
  let json = {};
  try { json = JSON.parse(raw); } catch (e) { console.warn('[fix-rn-tsconfig] failed to parse JSON', e); process.exit(0); }

  // Remove include if present and ensure files exists
  if (json.include) {
    delete json.include;
  }
  if (!json.files) {
    json.files = [];
  }

  fs.writeFileSync(target, JSON.stringify(json, null, 2) + '\n', 'utf8');
  console.log('[fix-rn-tsconfig] fixed', target);
} catch (e) {
  console.error('[fix-rn-tsconfig] error', e);
}
