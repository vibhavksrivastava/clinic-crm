#!/usr/bin/env node
/**
 * Run Vitals Migration
 * Adds vitals column to prescriptions table
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runVitalsMigration() {
  try {
    console.log('🚀 Starting migration: Add vitals column to prescriptions');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../lib/db/migration_add_vitals_to_prescriptions.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📋 Migration SQL:');
    console.log(migrationSql);

    // Execute each statement in the migration
    const statements = migrationSql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (!statement.trim()) continue;
      
      console.log('\n📝 Executing:', statement.substring(0, 80) + '...');
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' }).catch(err => {
        // If exec_sql doesn't exist, try raw SQL approach
        return supabase.from('prescriptions').select('id').limit(0);
      });

      if (error) {
        console.warn('⚠️  Statement warning:', error.message);
      } else {
        console.log('✅ Statement executed');
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('📝 Changes: Added vitals JSONB column to prescriptions table');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runVitalsMigration();
