'use client';

import Header from '@/components/Header';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

type Product = {
  id: string;
  product_id: string;
  batch_number: string;
  expiry_date: string;
  stock_quantity: number;
  selling_price: number;
  pharmacy_products?: { name: string; gst?: number };
};

type CartItem = {
  inventory_id: string;
  product_id: string;
  product_name: string;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  stock_quantity: number;
  unit_price: number;
  gst_percent: number;
  total_amount: number;
};

type PaymentMethod = 'cash' | 'upi' | 'card';

export default function CreateSalePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    const response = await fetch('/api/pharmacy/inventory');
    const data = await response.json();
    setProducts(Array.isArray(data) ? data : []);
  };

  useEffect(() => { fetchProducts(); }, []);

  const addToCart = (product: Product) => {
    const existing = cart.find((x) => x.inventory_id === product.id);
    const availableStock = Number(product.stock_quantity || 0);
    const existingQty = existing ? Number(existing.quantity || 0) : 0;
    if (existingQty >= availableStock) { alert('Maximum stock reached'); return; }
    if (existing) {
      setCart((prev) => prev.map((item) =>
        item.inventory_id === product.id
          ? { ...item, quantity: item.quantity + 1, total_amount: (item.quantity + 1) * item.unit_price }
          : item
      ));
    } else {
      setCart((prev) => [...prev, {
        inventory_id: product.id,
        product_id: product.product_id,
        product_name: product.pharmacy_products?.name ?? '',
        batch_number: product.batch_number,
        expiry_date: product.expiry_date,
        quantity: 1,
        stock_quantity: product.stock_quantity,
        unit_price: product.selling_price,
        gst_percent: product.pharmacy_products?.gst || 0,
        total_amount: product.selling_price,
      }]);
    }
  };

  const updateQty = (index: number, qty: number) => {
    const item = cart[index];
    if (qty < 1 || qty > item.stock_quantity) {
      if (qty > item.stock_quantity) alert(`Only ${item.stock_quantity} units available`);
      return;
    }
    setCart((prev) => prev.map((x, i) =>
      i === index ? { ...x, quantity: qty, total_amount: qty * x.unit_price } : x
    ));
  };

  const removeItem = (index: number) => setCart((prev) => prev.filter((_, i) => i !== index));

  const { subtotal, gstAmount, grandTotal } = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + Number(item.total_amount || 0), 0);
    const gstAmount = cart.reduce((sum, item) =>
      sum + (Number(item.total_amount || 0) * Number(item.gst_percent || 0)) / 100, 0);
    return { subtotal, gstAmount, grandTotal: subtotal + gstAmount };
  }, [cart]);

  const handleSave = async () => {
    if (cart.length === 0) { alert('Cart is empty'); return; }
    setSaving(true);
    try {
      const response = await fetch('/api/pharmacy/sales/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart, subtotal, gst_amount: gstAmount, total_amount: grandTotal, discount_amount: 0, payment_method: paymentMethod }),
      });
      let data = null;
      try { data = await response.json(); } catch { console.error('Invalid JSON response'); }
      if (!response.ok) throw new Error(data?.error || 'Failed to create sale');
      router.push(`/pharmacy/sales/${data.id}/view`);
    } catch (error) {
      console.error(error);
      alert('Failed to create sale');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = useMemo(() => products.filter((product) => {
    const name = product.pharmacy_products?.name?.toLowerCase() || '';
    const batch = product.batch_number?.toLowerCase() || '';
    const q = search.toLowerCase();
    return name.includes(q) || batch.includes(q);
  }), [products, search]);

  const getStockStatus = (qty: number) => {
    if (qty <= 0) return { label: 'Out of Stock', cls: 'stock-out' };
    if (qty < 10) return { label: `Low · ${qty}`, cls: 'stock-low' };
    return { label: `${qty} in stock`, cls: 'stock-ok' };
  };

  const isMaxAdded = (product: Product) => {
    const existing = cart.find((x) => x.inventory_id === product.id);
    return Number(product.stock_quantity || 0) <= 0 || Number(existing?.quantity || 0) >= Number(product.stock_quantity || 0);
  };

  return (
    <div className="crm-page">
      <Header />
      <style>{`
        :root {
          --navy: #0F1B35;
          --navy-mid: #1E2E50;
          --accent: #2563EB;
          --accent-light: #EFF4FF;
          --accent-dark: #1D4ED8;
          --success: #059669;
          --success-light: #ECFDF5;
          --warning: #D97706;
          --warning-light: #FFFBEB;
          --danger: #DC2626;
          --danger-light: #FEF2F2;
          --surface: #FFFFFF;
          --page-bg: #F3F6FB;
          --border: #E2E8F0;
          --border-mid: #CBD5E1;
          --text-primary: #0F172A;
          --text-secondary: #475569;
          --text-muted: #94A3B8;
          --radius-sm: 6px;
          --radius-md: 10px;
          --radius-lg: 14px;
          --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
          --shadow-md: 0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--page-bg); color: var(--text-primary); font-family: 'Inter', -apple-system, sans-serif; }
        .crm-page { min-height: 100vh; background: var(--page-bg); }
        .page-shell { display: grid; grid-template-columns: 1fr 380px; gap: 20px; padding: 20px 24px 32px; max-width: 1440px; margin: 0 auto; }
        @media (max-width: 1024px) { .page-shell { grid-template-columns: 1fr; } }

        /* PAGE HEADER */
        .page-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; background: var(--surface); border-bottom: 1px solid var(--border); margin-bottom: 0; }
        .page-title { font-size: 17px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 10px; }
        .page-title-icon { width: 32px; height: 32px; border-radius: var(--radius-sm); background: var(--accent-light); display: flex; align-items: center; justify-content: center; }
        .page-title-icon svg { width: 16px; height: 16px; color: var(--accent); }
        .page-breadcrumb { font-size: 13px; color: var(--text-muted); display: flex; align-items: center; gap: 6px; }
        .page-breadcrumb span { color: var(--text-secondary); }

        /* PANEL */
        .panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); overflow: hidden; }
        .panel-header { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
        .panel-title { font-size: 14px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 8px; }
        .panel-title svg { width: 16px; height: 16px; color: var(--text-secondary); }
        .panel-body { padding: 16px 20px; }
        .panel-count { font-size: 12px; font-weight: 500; color: var(--text-muted); background: var(--page-bg); border: 1px solid var(--border); padding: 2px 10px; border-radius: 20px; }

        /* SEARCH */
        .search-wrap { position: relative; }
        .search-wrap svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; color: var(--text-muted); pointer-events: none; }
        .search-input { width: 100%; padding: 9px 12px 9px 36px; font-size: 13.5px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--page-bg); color: var(--text-primary); outline: none; transition: border 0.15s, box-shadow 0.15s; }
        .search-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); background: var(--surface); }
        .search-input::placeholder { color: var(--text-muted); }

        /* PRODUCT GRID */
        .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; padding: 16px 20px; max-height: calc(100vh - 220px); overflow-y: auto; }
        @media (max-width: 768px) { .product-grid { max-height: none; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); } }

        /* PRODUCT CARD */
        .product-card { border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px; cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s; position: relative; background: var(--surface); }
        .product-card:hover { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(37,99,235,0.08); transform: translateY(-1px); }
        .product-card.in-cart { border-color: #93C5FD; background: #F0F7FF; }
        .product-name { font-size: 13.5px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; line-height: 1.3; }
        .product-meta { display: flex; flex-direction: column; gap: 3px; margin-bottom: 10px; }
        .product-meta-row { font-size: 11.5px; color: var(--text-secondary); display: flex; align-items: center; gap: 5px; }
        .product-meta-row svg { width: 11px; height: 11px; color: var(--text-muted); flex-shrink: 0; }
        .product-price { font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 10px; }
        .product-price span { font-size: 12px; font-weight: 400; color: var(--text-muted); }

        /* STOCK BADGE */
        .stock-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 500; padding: 3px 8px; border-radius: 20px; margin-bottom: 10px; }
        .stock-badge::before { content: ''; width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
        .stock-ok { background: var(--success-light); color: #065F46; }
        .stock-ok::before { background: var(--success); }
        .stock-low { background: var(--warning-light); color: #92400E; }
        .stock-low::before { background: var(--warning); }
        .stock-out { background: var(--danger-light); color: #991B1B; }
        .stock-out::before { background: var(--danger); }

        /* ADD BTN */
        .add-btn { width: 100%; padding: 8px 0; font-size: 12.5px; font-weight: 600; border-radius: var(--radius-sm); border: none; cursor: pointer; transition: background 0.15s, transform 0.1s; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .add-btn svg { width: 13px; height: 13px; }
        .add-btn-active { background: var(--accent); color: #fff; }
        .add-btn-active:hover { background: var(--accent-dark); transform: scale(0.98); }
        .add-btn-inactive { background: var(--page-bg); color: var(--text-muted); cursor: not-allowed; border: 1px solid var(--border); }
        .add-btn-maxed { background: #EFF4FF; color: var(--accent); border: 1px solid #BFDBFE; }
        .cart-qty-badge { position: absolute; top: 10px; right: 10px; width: 20px; height: 20px; background: var(--accent); color: #fff; font-size: 11px; font-weight: 700; border-radius: 50%; display: flex; align-items: center; justify-content: center; }

        /* BILLING PANEL */
        .billing-panel { display: flex; flex-direction: column; gap: 0; }
        .cart-list { display: flex; flex-direction: column; gap: 8px; padding: 16px 20px; max-height: 380px; overflow-y: auto; }
        @media (max-width: 1024px) { .cart-list { max-height: none; } }
        .cart-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 40px 20px; color: var(--text-muted); font-size: 13.5px; }
        .cart-empty svg { width: 40px; height: 40px; opacity: 0.3; }

        /* CART ITEM */
        .cart-item { border: 1px solid var(--border); border-radius: var(--radius-md); padding: 12px 14px; background: var(--surface); }
        .cart-item-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
        .cart-item-name { font-size: 13px; font-weight: 600; color: var(--text-primary); line-height: 1.3; }
        .cart-item-batch { font-size: 11.5px; color: var(--text-muted); margin-top: 2px; }
        .remove-btn { width: 26px; height: 26px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--surface); color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.15s, color 0.15s, border-color 0.15s; }
        .remove-btn:hover { background: var(--danger-light); color: var(--danger); border-color: #FCA5A5; }
        .remove-btn svg { width: 13px; height: 13px; }
        .cart-item-bottom { display: flex; align-items: center; justify-content: space-between; gap: 10px; }

        /* QTY CONTROL */
        .qty-control { display: flex; align-items: center; gap: 6px; }
        .qty-btn { width: 28px; height: 28px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--page-bg); color: var(--text-primary); font-size: 16px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1; transition: background 0.1s, border-color 0.1s; }
        .qty-btn:hover { background: var(--border); border-color: var(--border-mid); }
        .qty-input { width: 48px; height: 28px; text-align: center; font-size: 13px; font-weight: 600; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); color: var(--text-primary); outline: none; }
        .qty-input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(37,99,235,0.1); }
        .cart-item-price { text-align: right; }
        .cart-item-unit { font-size: 11.5px; color: var(--text-muted); }
        .cart-item-total { font-size: 14px; font-weight: 700; color: var(--text-primary); }

        /* SUMMARY */
        .summary-section { padding: 16px 20px; border-top: 1px solid var(--border); }
        .summary-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; padding: 5px 0; color: var(--text-secondary); }
        .summary-row.total { font-size: 16px; font-weight: 700; color: var(--text-primary); border-top: 1px solid var(--border); margin-top: 6px; padding-top: 12px; }
        .summary-label { display: flex; align-items: center; gap: 6px; }

        /* PAYMENT */
        .payment-section { padding: 16px 20px; border-top: 1px solid var(--border); }
        .section-label { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; }
        .payment-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .pay-btn { padding: 10px 0; border-radius: var(--radius-md); border: 1.5px solid var(--border); background: var(--surface); cursor: pointer; transition: all 0.15s; font-size: 12.5px; font-weight: 600; color: var(--text-secondary); display: flex; flex-direction: column; align-items: center; gap: 5px; }
        .pay-btn svg { width: 18px; height: 18px; }
        .pay-btn:hover { border-color: var(--border-mid); background: var(--page-bg); }
        .pay-btn.active-cash { border-color: var(--success); background: var(--success-light); color: #065F46; }
        .pay-btn.active-upi { border-color: var(--accent); background: var(--accent-light); color: #1E3A8A; }
        .pay-btn.active-card { border-color: #7C3AED; background: #F5F3FF; color: #4C1D95; }

        /* GENERATE BTN */
        .generate-section { padding: 16px 20px; border-top: 1px solid var(--border); }
        .generate-btn { width: 100%; padding: 13px; border-radius: var(--radius-md); border: none; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 8px; letter-spacing: 0.01em; }
        .generate-btn svg { width: 16px; height: 16px; }
        .generate-btn-active { background: linear-gradient(135deg, #2563EB, #1D4ED8); color: #fff; box-shadow: 0 4px 14px rgba(37,99,235,0.35); }
        .generate-btn-active:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(37,99,235,0.4); }
        .generate-btn-active:active { transform: scale(0.98); }
        .generate-btn-disabled { background: var(--page-bg); color: var(--text-muted); border: 1px solid var(--border); cursor: not-allowed; }
        .generate-btn-loading { background: var(--accent); color: #fff; opacity: 0.8; cursor: wait; }

        /* SCROLLBAR */
        .product-grid::-webkit-scrollbar, .cart-list::-webkit-scrollbar { width: 4px; }
        .product-grid::-webkit-scrollbar-thumb, .cart-list::-webkit-scrollbar-thumb { background: var(--border-mid); border-radius: 10px; }
        .product-grid::-webkit-scrollbar-track, .cart-list::-webkit-scrollbar-track { background: transparent; }

        /* EMPTY STATE */
        .empty-search { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; color: var(--text-muted); font-size: 13.5px; gap: 8px; }
        .empty-search svg { width: 44px; height: 44px; opacity: 0.25; }

        /* GST CHIP */
        .gst-chip { display: inline-flex; align-items: center; font-size: 10.5px; font-weight: 600; color: #7C3AED; background: #F5F3FF; border: 1px solid #DDD6FE; border-radius: 4px; padding: 2px 6px; margin-top: 4px; }
      `}</style>

      {/* Page-level header row */}
      <div className="page-header">
        <div className="page-title">
          <div className="page-title-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          New Sales Invoice
        </div>
        <div className="page-breadcrumb">
          <span>Pharmacy</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          <span>Sales</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          Create Invoice
        </div>
      </div>

      <div className="page-shell">
        {/* LEFT: PRODUCTS */}
        <div>
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" /><path d="M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z" />
                </svg>
                Medicines &amp; Inventory
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="panel-count">{filteredProducts.length} items</span>
                <div className="search-wrap" style={{ width: 260 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                  <input className="search-input" type="text" placeholder="Search medicine or batch…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="empty-search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                No medicines found for "{search}"
              </div>
            ) : (
              <div className="product-grid">
                {filteredProducts.map((product) => {
                  const stock = Number(product.stock_quantity || 0);
                  const status = getStockStatus(stock);
                  const maxed = isMaxAdded(product);
                  const inCart = cart.find((x) => x.inventory_id === product.id);
                  return (
                    <div key={product.id} className={`product-card${inCart ? ' in-cart' : ''}`}>
                      {inCart && <div className="cart-qty-badge">{inCart.quantity}</div>}
                      <div className="product-name">{product.pharmacy_products?.name}</div>
                      <div className="product-meta">
                        <div className="product-meta-row">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                          Batch: {product.batch_number}
                        </div>
                        <div className="product-meta-row">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                          Exp: {product.expiry_date}
                        </div>
                      </div>
                      <div className="product-price">₹{product.selling_price} <span>/ unit</span></div>
                      {product.pharmacy_products?.gst ? <div className="gst-chip">GST {product.pharmacy_products.gst}%</div> : null}
                      <div style={{ margin: '8px 0' }}>
                        <span className={`stock-badge ${status.cls}`}>{status.label}</span>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        disabled={maxed}
                        className={`add-btn ${stock <= 0 ? 'add-btn-inactive' : maxed ? 'add-btn-maxed' : 'add-btn-active'}`}
                      >
                        {stock <= 0 ? (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>
                            Out of Stock
                          </>
                        ) : maxed ? (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                            Max Added
                          </>
                        ) : (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            Add to Cart
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: BILLING */}
        <div>
          <div className="panel billing-panel">
            <div className="panel-header">
              <div className="panel-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
                Billing Cart
              </div>
              {cart.length > 0 && (
                <span className="panel-count">{cart.length} item{cart.length > 1 ? 's' : ''}</span>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="cart-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61H19a2 2 0 001.99-1.82l1.38-9.17H5.82" />
                </svg>
                No items added yet.<br />Select medicines from the left panel.
              </div>
            ) : (
              <div className="cart-list">
                {cart.map((item, index) => (
                  <div key={index} className="cart-item">
                    <div className="cart-item-top">
                      <div>
                        <div className="cart-item-name">{item.product_name}</div>
                        <div className="cart-item-batch">Batch: {item.batch_number}</div>
                      </div>
                      <button className="remove-btn" onClick={() => removeItem(index)} title="Remove item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    </div>
                    <div className="cart-item-bottom">
                      <div className="qty-control">
                        <button className="qty-btn" onClick={() => updateQty(index, item.quantity - 1)}>−</button>
                        <input
                          type="number"
                          className="qty-input"
                          min={1}
                          max={item.stock_quantity}
                          value={item.quantity}
                          onChange={(e) => updateQty(index, Number(e.target.value))}
                        />
                        <button className="qty-btn" onClick={() => updateQty(index, item.quantity + 1)}>+</button>
                      </div>
                      <div className="cart-item-price">
                        <div className="cart-item-unit">₹{item.unit_price} × {item.quantity}</div>
                        <div className="cart-item-total">₹{Number(item.total_amount).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SUMMARY */}
            <div className="summary-section">
              <div className="summary-row">
                <span className="summary-label">Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 14l2 2 4-4" /><path d="M21 10V8a2 2 0 00-1.07-1.77l-7-3.5a2 2 0 00-1.86 0l-7 3.5A2 2 0 002 8v8a2 2 0 001.07 1.77l7 3.5a2 2 0 001.86 0l7-3.5A2 2 0 0022 16v-2" /></svg>
                  GST
                </span>
                <span>₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="summary-row" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                <span>Discount</span>
                <span>—</span>
              </div>
              <div className="summary-row total">
                <span>Grand Total</span>
                <span style={{ color: 'var(--accent)', fontSize: 18 }}>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* PAYMENT METHOD */}
            <div className="payment-section">
              <div className="section-label">Payment Method</div>
              <div className="payment-grid">
                <button onClick={() => setPaymentMethod('cash')} className={`pay-btn${paymentMethod === 'cash' ? ' active-cash' : ''}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                  </svg>
                  Cash
                </button>
                <button onClick={() => setPaymentMethod('upi')} className={`pay-btn${paymentMethod === 'upi' ? ' active-upi' : ''}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                  UPI
                </button>
                <button onClick={() => setPaymentMethod('card')} className={`pay-btn${paymentMethod === 'card' ? ' active-card' : ''}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                  Card
                </button>
              </div>
            </div>

            {/* GENERATE */}
            <div className="generate-section">
              <button
                onClick={handleSave}
                disabled={saving || cart.length === 0}
                className={`generate-btn ${saving ? 'generate-btn-loading' : cart.length === 0 ? 'generate-btn-disabled' : 'generate-btn-active'}`}
              >
                {saving ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" /><line x1="4.93" y1="19.07" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.07" y2="4.93" /></svg>
                    Processing…
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                    Generate Invoice
                  </>
                )}
              </button>
              <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
