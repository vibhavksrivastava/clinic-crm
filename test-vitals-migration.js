#!/usr/bin/env node

/**
 * Quick Vitals Migration Test
 * Run this to apply the vitals column migration to Supabase
 */

const https = require('https');

const MIGRATION_KEY = 'migration-secret-key';
const API_URL = 'http://localhost:3000/api/admin/migrations';

console.log('🚀 Vitals Migration Test');
console.log('=======================\n');

// Test 1: Check if dev server is running
console.log('1️⃣  Checking if dev server is running...');
const checkServer = () => {
  return new Promise((resolve) => {
    https.get('https://localhost:3000/api/admin/migrations', { rejectUnauthorized: false }, (res) => {
      resolve(res.statusCode !== 404);
    }).on('error', () => {
      resolve(false);
    });
  });
};

// Test 2: Call migration API
const runMigration = async () => {
  console.log('\n2️⃣  Running migration via API endpoint...');
  console.log(`   URL: ${API_URL}`);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MIGRATION_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok) {
      console.log('\n✅ Migration Successful!');
      console.log('📝 Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('\n⚠️  Migration returned status:', response.status);
      console.log('📝 Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('\n❌ Error calling migration API:', error.message);
    console.log('\n💡 Make sure the dev server is running:');
    console.log('   npm run dev');
  }
};

// Test 3: Show manual SQL for Supabase
const showManualSQL = () => {
  console.log('\n3️⃣  Manual SQL for Supabase SQL Editor:');
  console.log('   ====================================');
  console.log(`
   -- Add vitals column to prescriptions
   ALTER TABLE prescriptions
   ADD COLUMN IF NOT EXISTS vitals JSONB DEFAULT NULL;
   
   -- Create index for vitals queries
   CREATE INDEX IF NOT EXISTS idx_prescriptions_vitals 
   ON prescriptions USING GIN (vitals);
  `);
};

// Run the tests
(async () => {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('\n⚠️  Dev server appears to be down.');
    console.log('   Start it with: npm run dev\n');
  }

  await runMigration();
  showManualSQL();

  console.log('\n📖 Full guide available in: VITALS_MIGRATION_FIX.md\n');
})();
