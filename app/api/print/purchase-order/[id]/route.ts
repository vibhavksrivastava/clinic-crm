import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

import { getSessionFromRequest } from '@/lib/auth';
import { supabase } from '@/lib/db/client';
import { buffer } from 'stream/consumers';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    console.log('PRINT PO ID:', id);
    // =====================================================
    // FETCH PURCHASE ORDER
    // =====================================================

    let query = supabase
      .from('pharmacy_purchase_orders')
      .select(`
        *,
        supplier:pharmacy_suppliers (
          id,
          supplier_name,
          phone,
          email,
          address
        ),
        items:pharmacy_purchase_items (
          id,
          product_id,
          quantity,
          purchase_price,
          total_amount,
          item_status,
          product:pharmacy_products(
        id,
        name,
        gst
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
    console.log('QUERY:', query);
    console.log('PO ID:', id);
    console.log('Session Org:', session.organizationId);
    console.log('Session Branch:', session.branchId);
    const { data: po, error } = await query.single();

        console.log('PO RESULT:', po);
        console.log('PO ERROR:', error);


    if (error || !po) {
      return NextResponse.json(
        { error: 'Purchase Order not found' },
        { status: 404 }
      );
    }

    // =====================================================
    // FETCH CLINIC INFO
    // =====================================================

    let clinic: any = null;

    try {
      const { data } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', session.organizationId)
        .maybeSingle();

      clinic = data;
    } catch {
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
  <div class="title">
    ${clinic?.name || 'Clinic Management System'}
  </div>

  <div>
    ${clinic?.address || ''}
  </div>

  <div>
    ${clinic?.phone || ''}
  </div>
</div>

<h2 style="text-align: center;">Purchase Order</h2>

<div class="section">

  <div class="row">
    <div>
      <span class="label">PO No:</span>
      ${po.po_number || po.id}
      (${po.status})
    </div>

    <div>
      <span class="label">Date:</span>
      ${new Date(po.created_at).toLocaleDateString('en-IN')}
    </div>
  </div>

</div>

<div class="section">

  <h3>Supplier Details</h3>

  <p><strong>Name:</strong> ${po.supplier?.supplier_name || '-'}</p>
  <p><strong>Phone:</strong> ${po.supplier?.phone || '-'}</p>
  <p><strong>Email:</strong> ${po.supplier?.email || '-'}</p>
  <p><strong>Address:</strong> ${po.supplier?.address || '-'}</p>

</div>

<div class="section">

  <h3>Items</h3>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Item</th>
        <th>Qty</th>
        <th>Rate</th>
        <th>GST</th>
        <th>GST Amount</th>
        <th>Total</th>
      </tr>
    </thead>

    <tbody>
      ${
        (po.items || [])
          .map(
            (item: any, index: number) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.product?.name || item.product_id}</td>
          <td>${item.quantity}</td>
          <td>₹${Number(item.purchase_price || 0).toFixed(2)}</td>
          <td>${Number(item.product?.gst || 0).toFixed(2)}%</td>
          <td>₹${Number((item.purchase_price * item.quantity * item.product?.gst)/100|| 0).toFixed(2)}</td>
          <td>₹${Number(item.total_amount || 0).toFixed(2)}</td>
        </tr>
      `
          )
          .join('')
      }
    </tbody>
  </table>

</div>

<div class="section">

  <h3>Summary</h3>

  <table>
    <tbody>

      <tr>
        <td>Subtotal</td>
        <td style="text-align:right">
          ₹${Number(po.subtotal || 0).toFixed(2)}
        </td>
      </tr>

      <tr>
        <td>Tax</td>
        <td style="text-align:right">
          ₹${Number(po.gst_amount || 0).toFixed(2)}
        </td>
      </tr>

      <tr>
        <td><strong>Total</strong></td>
        <td style="text-align:right">
          <strong>₹${Number(po.total_amount || 0).toFixed(2)}</strong>
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
    // GENERATE PDF
    // =====================================================

    const browser = await puppeteer.launch({
      headless: true
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: 'domcontentloaded'
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true
    });
   const buffer = new Uint8Array(pdf);

    await browser.close();

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition':
          `inline; filename=po-${po.po_number || id}.pdf`
      }
    });

  } catch (error) {
    console.error('PO PDF ERROR:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : String(error)
      },
      { status: 500 }
    );
  }
}