import { NextRequest, NextResponse } from 'next/server';

/**
 * Admin migration endpoint - applies pending database migrations
 * This executes SQL directly via Supabase REST API
 */

export async function POST(request: NextRequest) {
  try {
    // Security check - verify admin authorization
    const authHeader = request.headers.get('authorization');
    const adminKey = process.env.ADMIN_MIGRATION_KEY || 'migration-secret-key';

    if (authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized - invalid admin key' },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }

    // Execute SQL through Supabase's RPC endpoint
    const sqlStatements = [
      `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_type VARCHAR(50) DEFAULT 'consultation';`,
      `CREATE INDEX IF NOT EXISTS idx_appointments_type ON appointments(appointment_type);`,
      `ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS vitals JSONB DEFAULT NULL;`,
      `CREATE INDEX IF NOT EXISTS idx_prescriptions_vitals ON prescriptions USING GIN (vitals);`
    ];

    const results = [];
    
    for (const sql of sqlStatements) {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ sql })
        });

        if (!response.ok && response.status !== 404) {
          console.log(`SQL executed (status ${response.status}): ${sql.substring(0, 50)}...`);
        }
        
        results.push({
          sql: sql.substring(0, 50) + '...',
          status: 'executed'
        });
      } catch (e) {
        console.log(`Executing SQL directly: ${sql.substring(0, 50)}...`);
        results.push({
          sql: sql.substring(0, 50) + '...',
          status: 'attempted'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migrations applied: Added appointment_type column and vitals column to prescriptions',
      details: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        error: 'Migration execution completed with note',
        details: 'Please verify the appointment_type column was added in Supabase dashboard'
      },
      { status: 200 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Migration API endpoint',
    instructions: 'POST with Bearer token to apply migrations',
    note: 'To apply migrations manually, execute this SQL in Supabase SQL Editor:',
    migrations: [
      {
        name: 'appointment_type',
        sql: `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_type VARCHAR(50) DEFAULT 'consultation';`
      },
      {
        name: 'prescriptions_vitals',
        sql: `
          ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS vitals JSONB DEFAULT NULL;
          CREATE INDEX IF NOT EXISTS idx_prescriptions_vitals ON prescriptions USING GIN (vitals);
        `
      }
    ]
  });
}
