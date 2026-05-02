import { NextRequest, NextResponse } from 'next/server';

/**
 * Health Check Endpoint
 * Verifies database schema and auto-creates missing columns
 * GET /api/health/schema
 */

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }

    // Check schema and attempt to fix missing columns
    const issues = [];
    const fixes = [];

    // Test 1: Check if prescriptions.vitals column exists
    try {
      // Try to query prescriptions with vitals column
      const response = await fetch(
        `${supabaseUrl}/rest/v1/prescriptions?select=id,vitals&limit=0`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.status === 400 || response.status === 500) {
        const error = await response.text();
        if (error.includes('vitals')) {
          issues.push('Missing vitals column in prescriptions table');
          
          // Attempt to fix by running migration
          try {
            const migResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify({
                sql: 'ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS vitals JSONB DEFAULT NULL;'
              })
            });

            if (migResponse.ok) {
              fixes.push('Added vitals column to prescriptions');
            }
          } catch (e) {
            console.log('Could not auto-fix vitals column');
          }
        }
      }
    } catch (e) {
      console.log('Schema check failed:', e);
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        url: supabaseUrl?.split('.')[0] + '...',
        issues,
        fixes,
        next_steps: issues.length > 0 ? [
          'Run: curl -X POST http://localhost:3000/api/admin/migrations -H "Authorization: Bearer migration-secret-key"',
          'Or use Supabase SQL Editor to run: ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS vitals JSONB DEFAULT NULL;'
        ] : ['All schemas look good!']
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
