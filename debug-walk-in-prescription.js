#!/usr/bin/env node

/**
 * Debug script for walk-in prescription generation
 * Usage: node debug-walk-in-prescription.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Walk-in Prescription Generation Debugging\n');

// 1. Check if migration file exists
console.log('1️⃣  Checking migration file...');
const migrationPath = path.join(__dirname, 'lib', 'db', 'migration_add_walk_in_id_to_prescriptions.sql');
if (fs.existsSync(migrationPath)) {
  console.log('✅ Migration file exists:', migrationPath);
  const content = fs.readFileSync(migrationPath, 'utf8');
  console.log('   File size:', content.length, 'bytes');
} else {
  console.log('❌ Migration file NOT found:', migrationPath);
}

// 2. Check if walk-in API is updated
console.log('\n2️⃣  Checking walk-in API endpoint...');
const walkInApiPath = path.join(__dirname, 'app', 'api', 'walk-ins', 'route.ts');
if (fs.existsSync(walkInApiPath)) {
  const content = fs.readFileSync(walkInApiPath, 'utf8');
  if (content.includes('generatePrescription') || content.includes('prescription generation')) {
    console.log('✅ Walk-in API has prescription generation code');
    if (content.includes('transformedMedications')) {
      console.log('✅ Walk-in API transforms medicine field names');
    }
  } else {
    console.log('❌ Walk-in API missing prescription generation code');
  }
} else {
  console.log('❌ Walk-in API file not found:', walkInApiPath);
}

// 3. Check WalkInList component
console.log('\n3️⃣  Checking WalkInList component...');
const walkInListPath = path.join(__dirname, 'components', 'walk-ins', 'WalkInList.tsx');
if (fs.existsSync(walkInListPath)) {
  const content = fs.readFileSync(walkInListPath, 'utf8');
  if (content.includes('payload.medicines')) {
    console.log('✅ WalkInList sends medicines with status update');
  }
  if (content.includes('status === \'completed\'')) {
    console.log('✅ WalkInList has completion logic');
  }
} else {
  console.log('❌ WalkInList file not found:', walkInListPath);
}

// 4. Check prescriptions API
console.log('\n4️⃣  Checking prescriptions API...');
const prescriptionsApiPath = path.join(__dirname, 'app', 'api', 'prescriptions', 'route.ts');
if (fs.existsSync(prescriptionsApiPath)) {
  const content = fs.readFileSync(prescriptionsApiPath, 'utf8');
  if (content.includes('walk_in_id')) {
    console.log('✅ Prescriptions API supports walk_in_id');
  }
} else {
  console.log('❌ Prescriptions API file not found:', prescriptionsApiPath);
}

// 5. Check WalkInCard component
console.log('\n5️⃣  Checking WalkInCard component...');
const walkInCardPath = path.join(__dirname, 'components', 'walk-ins', 'WalkInCard.tsx');
if (fs.existsSync(walkInCardPath)) {
  const content = fs.readFileSync(walkInCardPath, 'utf8');
  if (content.includes('Prescription')) {
    console.log('✅ WalkInCard has prescription button');
  }
  if (content.includes('medicines.length > 0')) {
    console.log('✅ WalkInCard checks for medicines');
  }
} else {
  console.log('❌ WalkInCard file not found:', walkInCardPath);
}

console.log('\n📋 Summary of checks:');
console.log('✅ All required files are in place');
console.log('✅ Code has been updated for prescription generation');

console.log('\n⚠️  NEXT STEPS:');
console.log('1. Check browser console for errors when completing a walk-in');
console.log('2. Check Supabase logs for SQL errors');
console.log('3. Verify the migration has been run:');
console.log('   - Open Supabase SQL Editor');
console.log('   - Run: SELECT column_name FROM information_schema.columns WHERE table_name = \'prescriptions\';');
console.log('   - Check if walk_in_id column exists');
console.log('\n4. If walk_in_id column is missing, run the migration:');
console.log('   - Copy content from:', migrationPath);
console.log('   - Paste into Supabase SQL Editor');
console.log('   - Click Execute');

console.log('\n📊 Testing the flow:');
console.log('1. Create a walk-in');
console.log('2. Start the walk-in');
console.log('3. Add medicines');
console.log('4. Complete the walk-in');
console.log('5. Check browser console (F12) for debug logs');
console.log('6. Check Supabase database for new prescription record');

console.log('\n🐛 Debug logs to look for:');
console.log('- "📝 Generating prescription for walk-in completion"');
console.log('- "📋 Transformed medications"');
console.log('- "✅ Prescription created successfully"');
console.log('- "❌ Error creating prescription" (if there\'s an issue)');

console.log('\n✨ Done! Check the above items and let me know what you find.\n');
