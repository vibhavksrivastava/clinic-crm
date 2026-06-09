import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { getSessionFromRequest } from '@/lib/auth';
import puppeteer from 'puppeteer';

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

let query = supabase
  .from('pharmacy_sales')
  .select(`
    *,
    pharmacy_customers (
      id,
      name,
      phone,
      address
    ),
    pharmacy_sale_items (
      *,
      pharmacy_products (
        id,
        name,
        sku
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

const { data: invoice, error } =
  await query.single();

if (error || !invoice) {
  return NextResponse.json(
    {
      error:
        error?.message ||
        'Invoice not found',
    },
    {
      status: 404,
    }
  );
}

const customer =
  invoice.pharmacy_customers;

const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body{
      font-family:Arial,sans-serif;
      padding:20px;
      color:#111;
    }

    .header{
      text-align:center;
      margin-bottom:20px;
    }

    table{
      width:100%;
      border-collapse:collapse;
    }

    th,td{
      border:1px solid #ddd;
      padding:8px;
    }

    th{
      background:#f3f4f6;
    }

    .right{
      text-align:right;
    }

    .summary{
      width:350px;
      margin-left:auto;
      margin-top:20px;
    }

    .summary td{
      border:none;
    }
  </style>
</head>

<body>

  <div class="header">
    <h1>PHARMACY SALES INVOICE</h1>
    <p>${invoice.invoice_number ?? ''}</p>
  </div>

  <div>
    <strong>Customer:</strong>
    ${customer?.name ?? 'Walk-in Customer'}
    <br/>

    <strong>Phone:</strong>
    ${customer?.phone ?? '-'}
    <br/>

    <strong>Address:</strong>
    ${customer?.address ?? '-'}
  </div>

  <br/>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Product</th>
        <th>SKU</th>
        <th>Qty</th>
        <th>Rate</th>
        <th>Total</th>
      </tr>
    </thead>

    <tbody>

      ${invoice.pharmacy_sale_items
        ?.map(
          (item:any,index:number)=>`
          <tr>
            <td>${index + 1}</td>

            <td>
              ${
                item.pharmacy_products
                  ?.name ?? '-'
              }
            </td>

            <td>
              ${
                item.pharmacy_products
                  ?.sku ?? '-'
              }
            </td>

            <td>
              ${item.quantity ?? 0}
            </td>

            <td class="right">
              ₹${Number(
                item.unit_price ?? 0
              ).toFixed(2)}
            </td>

            <td class="right">
              ₹${Number(
                item.total_amount ?? 0
              ).toFixed(2)}
            </td>
          </tr>
        `
        )
        .join('')}

    </tbody>
  </table>

  <table class="summary">

    <tr>
      <td>Total Amount</td>
      <td class="right">
        ₹${Number(
          invoice.total_amount ?? 0
        ).toFixed(2)}
      </td>
    </tr>

    <tr>
      <td>Paid</td>
      <td class="right">
        ₹${Number(
          invoice.paid_amount ?? 0
        ).toFixed(2)}
      </td>
    </tr>

    <tr>
      <td>Balance</td>
      <td class="right">
        ₹${Number(
          invoice.balance_amount ?? 0
        ).toFixed(2)}
      </td>
    </tr>

  </table>

</body>
</html>
`;

const browser =
  await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });

const page =
  await browser.newPage();

await page.setContent(html, {
  waitUntil: 'domcontentloaded',
});

const pdf = await page.pdf({
  format: 'A4',
  printBackground: true,
});

const buffer = new Uint8Array(pdf);

await browser.close();

return new NextResponse(buffer, {
  headers: {
    'Content-Type':
      'application/pdf',
    'Content-Disposition':
      `inline; filename="Invoice-${invoice.invoice_number}.pdf"`,
  },
});

} catch (error: any) {
console.error(error);

return NextResponse.json(
  {
    error:
      error?.message ||
      'Failed to generate PDF',
  },
  {
    status: 500,
  }
);
}
}