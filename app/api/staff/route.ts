import { supabase } from '@/lib/db/client';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

type StaffUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  specialization?: string;
  organization_id: string;
  branch_id?: string;
  role_id?: string;
  role?: {
    role_type: string;
    name: string;
  };
};

type StaffResponse = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
};
/* =========================================
   GET STAFF
========================================= */
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get('role');

    let query = supabase
      .from('users')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        specialization,
        organization_id,
        branch_id,
        role_id,
        role:roles!users_role_id_fkey (
          role_type,
          name
        )
      `)
      .eq(
        'organization_id',
        session.organizationId
      );

    // Optional branch filter
    if (session.branchId) {
      query = query.eq(
        'branch_id',
        session.branchId
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error(
        'STAFF API ERROR:',
        error
      );

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    let formatted: StaffResponse[] = (
  data || []
).map((u: any) => ({
  id: u.id,
  first_name: u.first_name,
  last_name: u.last_name,
  email: u.email,
  role: u.role?.role_type || '',
}));

if (roleFilter) {
  formatted = formatted.filter(
    (u: StaffResponse) =>
      u.role === roleFilter
  );
}
    
    // Filter doctor / pharmacist / etc

    if (roleFilter) {
  formatted = formatted.filter(
    (u: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      role: string;
    }) =>
      u.role === roleFilter
  );
}

    return NextResponse.json(
      formatted
    );
  } catch (err: any) {
    console.error(
      'GET STAFF ERROR:',
      err
    );

    return NextResponse.json(
      {
        error:
          err.message ||
          'Server error',
      },
      { status: 500 }
    );
  }
}

/* =========================================
   CREATE STAFF
========================================= */
export async function POST(
  request: NextRequest
) {
  try {
    const userContext =
      await getSessionFromRequest(
        request
      );

    if (!userContext) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body =
      await request.json();

    const {
      first_name,
      last_name,
      email,
      phone,
      specialization,
      role_id,
    } = body;

    if (
      !first_name ||
      !last_name ||
      !role_id
    ) {
      return NextResponse.json(
        {
          error:
            'first_name, last_name and role_id are required',
        },
        { status: 400 }
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from('users')
      .insert({
        first_name,
        last_name,
        email,
        phone,
        specialization,
        role_id,
        organization_id:
          userContext.organizationId,
        branch_id:
          userContext.branchId ||
          null,
        user_status:
          'active',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      data,
      { status: 201 }
    );
  } catch (error) {
    console.error(
      'Error creating staff:',
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create staff',
      },
      { status: 500 }
    );
  }
}

/* =========================================
   UPDATE STAFF
========================================= */
export async function PUT(
  request: NextRequest
) {
  try {
    const userContext =
      await getSessionFromRequest(
        request
      );

    if (!userContext) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const id =
      searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          error:
            'Staff ID required',
        },
        { status: 400 }
      );
    }

    const body =
      await request.json();

    const {
      first_name,
      last_name,
      email,
      phone,
      specialization,
      role_id,
    } = body;

    const {
      data,
      error,
    } = await supabase
      .from('users')
      .update({
        first_name,
        last_name,
        email,
        phone,
        specialization,
        role_id,
        updated_at:
          new Date().toISOString(),
      })
      .eq('id', id)
      .eq(
        'organization_id',
        userContext.organizationId
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      data
    );
  } catch (error) {
    console.error(
      'Error updating staff:',
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update staff',
      },
      { status: 500 }
    );
  }
}

/* =========================================
   DELETE STAFF
========================================= */
export async function DELETE(
  request: NextRequest
) {
  try {
    const userContext =
      await getSessionFromRequest(
        request
      );

    if (!userContext) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const id =
      searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          error:
            'Staff ID required',
        },
        { status: 400 }
      );
    }

    const { error } =
      await supabase
        .from('users')
        .delete()
        .eq('id', id)
        .eq(
          'organization_id',
          userContext.organizationId
        );

    if (error) throw error;

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      'Error deleting staff:',
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to delete staff',
      },
      { status: 500 }
    );
  }
}