import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfvgmrecdyyrxvzjmlgp.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmdmdtcmVjZHl5cnh2emptbGdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUxMDcwMiwiZXhwIjoyMDkyMDg2NzAyfQ.ZbU3ddQXQzDbyOFzh5ESqflJISzU8Nr9osjIpKUIu24';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('Starting database migration...');

    // Drop tables in correct order
    console.log('Dropping existing tables...');
    await supabase.rpc('exec', { sql: 'DROP TABLE IF EXISTS patient_emergency_contacts CASCADE;' });
    await supabase.rpc('exec', { sql: 'DROP TABLE IF EXISTS patient_insurance CASCADE;' });
    await supabase.rpc('exec', { sql: 'DROP TABLE IF EXISTS invoices CASCADE;' });
    await supabase.rpc('exec', { sql: 'DROP TABLE IF EXISTS prescriptions CASCADE;' });
    await supabase.rpc('exec', { sql: 'DROP TABLE IF EXISTS appointments CASCADE;' });
    await supabase.rpc('exec', { sql: 'DROP TABLE IF EXISTS staff CASCADE;' });
    await supabase.rpc('exec', { sql: 'DROP TABLE IF EXISTS patients CASCADE;' });

    // Create tables
    console.log('Creating tables...');
    const schemaPath = path.join(process.cwd(), 'lib/db/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = schemaSql.split(';').filter(s => s.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        await supabase.rpc('exec', { sql: statement + ';' });
      }
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
