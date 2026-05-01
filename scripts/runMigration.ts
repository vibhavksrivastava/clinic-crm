#!/usr/bin/env node
/**
 * Migration Runner - Applies pending migrations
 * Usage: npx ts-node scripts/runMigration.ts
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfvgmrecdyyrxvzjmlgp.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmdmdtcmVjZHl5cnh2emptbGdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUxMDcwMiwiZXhwIjoyMDkyMDg2NzAyfQ.ZbU3ddQXQzDbyOFzh5ESqflJISzU8Nr9osjIpKUIu24';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 Starting migration: Add appointment_type to appointments table');

    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'lib/db/migration_add_appointment_type.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration using raw SQL
    const { data, error } = await supabase.rpc('exec', { sql: migrationSql });

    if (error) {
      console.error('❌ Migration error:', error);
      process.exit(1);
    }

    console.log('✅ Migration applied successfully!');
    console.log('📝 Changes: Added appointment_type column to appointments table');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
