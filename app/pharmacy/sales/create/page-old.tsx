'use client';

import Header from '@/components/Header';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateSalePage() {
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const [cart, setCart] = useState<any[]>([]);

  const [paymentMethod, setPaymentMethod] =
    useState('cash');

  const fetchProducts = async () => {
    const response = await fetch('/api/pharmacy/inventory');

    const data = await response.json();

    setProducts(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addToCart = (product: any) => {
  const existing = cart.find(
    (x) => x.inventory_id === product.id
  );

  // current stock available
  const availableStock = Number(
    product.stock_quantity || product.quantity || 0
  );

  // already added quantity
  const existingQty = existing
    ? Number(existing.quantity || 0)
    : 0;

  // prevent adding more than stock
  if (existingQty >= availableStock) {
    alert('Maximum stock reached');
    return;
  }

  if (existing) {
    setCart((prev) =>
      prev.map((item) =>
        item.inventory_id === product.id
          ? {
              ...item,
              quantity: item.quantity + 1,
              total_amount:
                (item.quantity + 1) *
                item.unit_price,
            }
          : item
      )
    );
  } else {
    setCart((prev) => [
      ...prev,
      {
        inventory_id: product.id,
        product_id: product.product_id,
        product_name:
          product.pharmacy_products?.name,
        batch_number: product.batch_number,
        expiry_date: product.expiry_date,

        quantity: 1,

        stock_quantity:
          product.stock_quantity ||
          product.quantity,

        unit_price: product.selling_price,

        gst_percent:
          product.pharmacy_products?.gst || 0,

        total_amount:
          product.selling_price,
      },
    ]);
  }
};

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.total_amount || 0),
    0
  );

  const gstAmount = cart.reduce(
    (sum, item) =>
      sum +
      (Number(item.total_amount || 0) *
        Number(item.gst_percent || 0)) /
        100,
    0
  );

  const grandTotal = subtotal + gstAmount;

  const handleSave = async () => {
    try {
      const response = await fetch(
        '/api/pharmacy/sales/create',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: cart,
            subtotal,
            gst_amount: gstAmount,
            total_amount: grandTotal,
            discount_amount: 0,
            payment_method: paymentMethod,
          }),
        }
      );

      let data = null;

    try {
    data = await response.json();
    } catch (err) {
    console.error('Invalid JSON response');
    }

    if (!response.ok) {
    throw new Error(
        data?.error || 'Failed to create sale'
    );
    }

      router.push(`/pharmacy/sales/${data.id}/view`);
    } catch (error) {
      console.error(error);
      alert('Failed to create sale');
    }
  };

  const filteredProducts = products.filter((product) => {
  const medicineName =
    product.pharmacy_products?.name?.toLowerCase() || '';

  const batch =
    product.batch_number?.toLowerCase() || '';

  const searchText = search.toLowerCase();

  return (
    medicineName.includes(searchText) ||
    batch.includes(searchText)
  );
});

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main className="grid grid-cols-1 gap-6 p-4 md:grid-cols-3 md:p-6">
        <div className="rounded-2xl bg-white p-4 shadow-sm md:col-span-2">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <h2 className="text-xl font-bold">
    Medicines
  </h2>

  <input
    type="text"
    placeholder="Search medicine or batch..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="w-full sm:w-80 rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
  />
</div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="rounded-xl border p-4"
              >
                <h3 className="font-bold">
                  {product.pharmacy_products?.name}
                </h3>

                <p className="text-sm text-gray-500">
                  Batch: {product.batch_number}
                </p>

                <p className="text-sm text-gray-500">
                  Expiry: {product.expiry_date}
                </p>

                <p className="text-sm text-gray-500">
                  Stock: {product.stock_quantity || 0}
                </p>
<div className="mt-2 flex items-center justify-between">
  <span
    className={`rounded-full px-2 py-1 text-xs font-semibold ${
      Number(product.stock_quantity || 0) <= 0
        ? 'bg-red-100 text-red-600'
        : Number(product.stock_quantity || 0) < 10
        ? 'bg-yellow-100 text-yellow-700'
        : 'bg-green-100 text-green-700'
    }`}
  >
    {Number(product.stock_quantity || 0) <= 0
      ? 'Out of Stock'
      : Number(product.stock_quantity || 0) < 10
      ? `Low Stock (${product.stock_quantity})`
      : `In Stock (${product.stock_quantity})`}
  </span>
</div>
                <button
  onClick={() => addToCart(product)}
  disabled={
    (() => {
      const existing = cart.find(
        (x) => x.inventory_id === product.id
      );

      const availableStock = Number(
        product.stock_quantity ||
          product.quantity ||
          0
      );

      return (
        availableStock <= 0 ||
        Number(existing?.quantity || 0) >=
          availableStock
      );
    })()
  }
  className={`mt-4 w-full rounded-xl px-4 py-2 text-white ${
    (() => {
      const existing = cart.find(
        (x) => x.inventory_id === product.id
      );

      const availableStock = Number(
        product.stock_quantity ||
          product.quantity ||
          0
      );

      return (
        availableStock <= 0 ||
        Number(existing?.quantity || 0) >=
          availableStock
      );
    })()
      ? 'bg-gray-400 cursor-not-allowed'
      : 'bg-blue-600 hover:bg-blue-700'
  }`}
>
  {(() => {
    const existing = cart.find(
      (x) => x.inventory_id === product.id
    );

    const availableStock = Number(
      product.stock_quantity ||
        product.quantity ||
        0
    );

    return Number(existing?.quantity || 0) >=
      availableStock
      ? 'Max Added'
      : 'Add';
  })()}
</button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">
            Billing Cart
          </h2>

          <div className="space-y-4">
            {cart.map((item, index) => (
 <div
  key={index}
  className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
>
  <div className="flex items-start justify-between gap-3">
    <div>
      <h3 className="font-semibold text-gray-800">
        {item.product_name}
      </h3>

      <p className="text-sm text-gray-500">
        Batch: {item.batch_number}
      </p>
    </div>

    {/* REMOVE BUTTON */}

    <button
      onClick={() => {
        setCart((prev) =>
          prev.filter((_, i) => i !== index)
        );
      }}
      className="rounded-lg bg-red-100 px-3 py-1 text-sm font-medium text-red-600 transition hover:bg-red-200"
    >
      ✕
    </button>
  </div>

  <div className="mt-4 flex items-center justify-between">
    
    {/* QUANTITY */}

    <div className="flex items-center gap-2">
      <button
        onClick={() => {
          setCart((prev) =>
            prev.map((x, i) =>
              i === index
                ? {
                    ...x,
                    quantity:
                      x.quantity > 1
                        ? x.quantity - 1
                        : 1,
                    total_amount:
                      (x.quantity > 1
                        ? x.quantity - 1
                        : 1) * x.unit_price,
                  }
                : x
            )
          );
        }}
        className="h-9 w-9 rounded-lg bg-gray-200 text-lg font-bold"
      >
        -
      </button>

      <input
        type="number"
        min={1}
        value={item.quantity}
onChange={(e) => {
  const qty = Number(e.target.value);

  const maxStock = Number(
    item.stock_quantity || 0
  );

  if (qty > maxStock) {
    alert(
      `Only ${maxStock} stock available`
    );
    return;
  }

  if (qty < 1) {
    return;
  }

  setCart((prev) =>
    prev.map((x, i) =>
      i === index
        ? {
            ...x,
            quantity: qty,
            total_amount:
              qty * x.unit_price,
          }
        : x
    )
  );
}}        className="w-16 rounded-lg border border-gray-300 p-2 text-center"
      />

      <button
        onClick={() => {
          setCart((prev) =>
            prev.map((x, i) =>
              i === index
                ? {
                    ...x,
                    quantity: x.quantity + 1,
                    total_amount:
                      (x.quantity + 1) * x.unit_price,
                  }
                : x
            )
          );
        }}
        className="h-9 w-9 rounded-lg bg-gray-200 text-lg font-bold"
      >
        +
      </button>
    </div>

    {/* PRICE */}

    <div className="text-right">
      <p className="text-sm text-gray-500">
        ₹{item.unit_price} × {item.quantity}
      </p>

      <p className="text-lg font-bold text-green-600">
        ₹{Number(item.total_amount).toFixed(2)}
      </p>
    </div>
  </div>
</div>
            ))}
          </div>

          <div className="mt-6 space-y-3 border-t pt-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span>GST</span>
              <span>₹{gstAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>

<div>
  <p className="mb-3 text-sm font-semibold text-gray-600">
    Payment Method
  </p>

  <div className="grid grid-cols-3 gap-3">
    <button
      type="button"
      onClick={() => setPaymentMethod('cash')}
      className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
        paymentMethod === 'cash'
          ? 'border-green-600 bg-green-600 text-white'
          : 'border-gray-300 bg-white text-gray-700 hover:border-green-400'
      }`}
    >
      💵 Cash
    </button>

    <button
      type="button"
      onClick={() => setPaymentMethod('upi')}
      className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
        paymentMethod === 'upi'
          ? 'border-blue-600 bg-blue-600 text-white'
          : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400'
      }`}
    >
      📱 UPI
    </button>

    <button
      type="button"
      onClick={() => setPaymentMethod('card')}
      className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
        paymentMethod === 'card'
          ? 'border-purple-600 bg-purple-600 text-white'
          : 'border-gray-300 bg-white text-gray-700 hover:border-purple-400'
      }`}
    >
      💳 Card
    </button>
  </div>
</div>
            <button
              onClick={handleSave}
              className="w-full rounded-xl bg-green-600 px-4 py-3 font-semibold text-white"
            >
              Generate Invoice
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
