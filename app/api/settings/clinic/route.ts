import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session =
      await getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: organization, error: orgError } =
      await supabase
        .from('organizations')
        .select(`
          id,
          name,
          logo_url,
          address,
          city,
          country,
          postal_code,
          phone,
          email,
          website
        `)
        .eq('id', session.organizationId)
        .single();

    if (orgError) {
      return NextResponse.json(
        { error: orgError.message },
        { status: 500 }
      );
    }

    let branch = null;

    if (session.branchId) {
      const {
        data: branchData
      } = await supabase
        .from('branches')
        .select(`
          id,
          name,
          address,
          city,
          country,
          postal_code,
          phone,
          email
        `)
        .eq('id', session.branchId)
        .single();

      branch = branchData;
    }

    return NextResponse.json({
      organization_name: organization.name,
      logo_url: organization.logo_url,
      website: organization.website,

      branch_name:
        branch?.name || '',

      address:
        branch?.address ||
        organization.address,

      city:
        branch?.city ||
        organization.city,

      country:
        branch?.country ||
        organization.country,

      postal_code:
        branch?.postal_code ||
        organization.postal_code,

      phone:
        branch?.phone ||
        organization.phone,

      email:
        branch?.email ||
        organization.email
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          'Failed to fetch clinic settings'
      },
      {
        status: 500
      }
    );
  }
}