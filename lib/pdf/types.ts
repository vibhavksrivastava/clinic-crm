export interface InvoiceItem {
  product_name: string
  batch_number?: string
  quantity: number
  rate: number
  gst_percent: number
  amount: number
}

export interface InvoiceData {
  invoice_number: string
  invoice_date: string

  customer_name: string
  customer_phone?: string

  subtotal: number
  cgst: number
  sgst: number
  igst: number

  discount: number
  grand_total: number

  items: InvoiceItem[]

  clinic: {
    name: string
    branch_name: string
    address: string
    phone: string
    email?: string
    gst_number?: string
    logo_url?: string
  }
}