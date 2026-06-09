import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

import { getSessionFromRequest } from '@/lib/auth';
import { supabase } from '@/lib/db/client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session =
      await getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // =====================================================
    // FETCH INVOICE
    // =====================================================

    let query = supabase
      .from('invoices')
      .select(`
        *,
        patient:patients (
          id,
          first_name,
          last_name,
          phone
        ),
        appointment:appointments (
          id,
          appointment_date,
          duration_minutes,
          appointment_type,
          status,
          user:user_id (
            first_name,
            last_name,
            specialization
          )
        )
      `)
      .eq('id', id);

    if (session.organizationId) {
      query = query.eq(
        'organization_id',
        session.organizationId
      );
    }

    if (session.branchId) {
      query = query.eq(
        'branch_id',
        session.branchId
      );
    }

    const {
      data: invoice,
      error,
    } = await query.single();

    if (error || !invoice) {
      return NextResponse.json(
        {
          error: 'Invoice not found',
        },
        {
          status: 404,
        }
      );
    }

    // =====================================================
    // FETCH CLINIC INFO
    // =====================================================

    let clinic: any = null;

try {
  const { data, error } = await supabase
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
    .eq('id', session.organizationId)   // ✅ VERY IMPORTANT
    .single();
    console.log('SESSION RAW:', session);
    console.log('Clinic fetch result:', { data, error });
  if (error) {
    console.error('Clinic fetch error:', error);
    clinic = null;
  } else {
    clinic = data;
  }
} catch (err) {
  console.error('Unexpected clinic error:', err);
  clinic = null;
}

    // =====================================================
    // HTML TEMPLATE
    // =====================================================

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>

<style>
@page {
  size: A4;
  margin: 15mm;
}

body{
  font-family: Arial, sans-serif;
  color:#222;
  font-size:12px;
}

.header{
  text-align:center;
  border-bottom:2px solid #000;
  padding-bottom:10px;
  margin-bottom:20px;
}

.title{
  font-size:22px;
  font-weight:bold;
}

.section{
  margin-top:15px;
}

.row{
  display:flex;
  justify-content:space-between;
}

.label{
  font-weight:bold;
}

table{
  width:100%;
  border-collapse:collapse;
  margin-top:15px;
}

th,td{
  border:1px solid #ccc;
  padding:8px;
}

th{
  background:#f5f5f5;
}

.footer{
  margin-top:60px;
  text-align:right;
}

.signature{
  margin-top:40px;
}
</style>
</head>

<body>

<div class="header">
  <img src="${clinic?.logo_url || ''}" alt="Clinic Logo" width="100" height="40" />
  <div class="title">
    ${clinic?.name || 'MediQuick Clinic'}
  </div>

  <div>
    ${clinic?.address || ''}
  </div>

  <div>
    ${clinic?.phone || ''}
  </div>
</div>

<h2>Invoice</h2>

<div class="section">

  <div class="row">
    <div>
      <span class="label">Invoice No:</span>
      ${invoice.id || ''}
    </div>

    <div>
      <span class="label">Date:</span>
      ${new Date(
        invoice.created_at
      ).toLocaleDateString('en-IN')}
    </div>
  </div>

</div>

<div class="section">

  <h3>Patient Details</h3>

  <p>
    <strong>Name:</strong>
    ${invoice.patient?.first_name || ''}
    ${invoice.patient?.last_name || ''}
  </p>

  <p>
    <strong>Phone:</strong>
    ${invoice.patient?.phone || '-'}
  </p>

</div>

<div class="section">

  <h3>Appointment Details</h3>

  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Type</th>
        <th>Doctor</th>
        <th>Status</th>
      </tr>
    </thead>

    <tbody>
      <tr>
        <td>
          ${
            invoice.appointment
              ?.appointment_date
              ? new Date(
                  invoice.appointment.appointment_date
                ).toLocaleDateString('en-IN')
              : '-'
          }
        </td>

        <td>
          ${
            invoice.appointment
              ?.appointment_type || '-'
          }
        </td>

        <td>
          ${
            invoice.appointment?.user
              ? `${invoice.appointment.user.first_name ?? ''} ${invoice.appointment.user.last_name ?? ''}`
              : '-'
          }
        </td>

        <td>
          ${
            invoice.appointment
              ?.status || '-'
          }
        </td>
      </tr>
    </tbody>
  </table>

</div>

<div class="section">

  <h3>Charges</h3>

  <table>
    <tbody>

      <tr>
        <td>Amount</td>
        <td style="text-align:right">
          ₹${Number(invoice.amount || 0).toFixed(2)}
        </td>
      </tr>

      <tr>
        <td>Discount</td>
        <td style="text-align:right">
          ₹${Number(invoice.discount || 0).toFixed(2)}
        </td>
      </tr>

      <tr>
        <td>
          <strong>Total</strong>
        </td>

        <td style="text-align:right">
          <strong>
            ₹${Number(
              invoice.total_amount ||
              invoice.amount ||
              0
            ).toFixed(2)}
          </strong>
        </td>
      </tr>

    </tbody>
  </table>

</div>

<div class="footer">
  <div class="signature">
    Authorized Signature
  </div>
</div>

</body>
</html>
`;

    // =====================================================
    // PDF GENERATION
    // =====================================================

    const browser =
      await puppeteer.launch({
        headless: true
      });

    const page =
      await browser.newPage();

    await page.setContent(
      html,
      //{waitUntil:'networkidle0'}
      {waitUntil:'domcontentloaded'}
    );

    const pdf =
      await page.pdf({
        format: 'A4',
        printBackground: true
      });
    const buffer = new Uint8Array(pdf);
    
    await browser.close();

    return new Response(buffer, {
      headers: {
        'Content-Type':
          'application/pdf',
        'Content-Disposition':
          `inline; filename=invoice-${invoice.id || id}.pdf`
      }
    });

  } catch (error) {
    console.error(
      'PDF ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : String(error)
      },
      {
        status: 500
      }
    );
  }
}