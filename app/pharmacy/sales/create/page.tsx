'use client';

import Header from '@/components/Header';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateSalePage() {
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);

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

    if (existing) {
      setCart((prev) =>
        prev.map((item) =>
          item.inventory_id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total_amount:
                  (item.quantity + 1) * item.unit_price,
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
          product_name: product.pharmacy_products?.name,
          batch_number: product.batch_number,
          expiry_date: product.expiry_date,
          quantity: 1,
          unit_price: product.selling_price,
          gst_percent:
            product.pharmacy_products?.gst || 0,
          total_amount: product.selling_price,
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

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main className="grid grid-cols-1 gap-6 p-4 md:grid-cols-3 md:p-6">
        <div className="rounded-2xl bg-white p-4 shadow-sm md:col-span-2">
          <h2 className="mb-4 text-xl font-bold">
            Medicines
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {products.map((product) => (
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

                <p className="mt-2 text-lg font-bold text-green-600">
                  ₹{product.selling_price}
                </p>

                <button
                  onClick={() => addToCart(product)}
                  className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-2 text-white"
                >
                  Add
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
                className="rounded-xl border p-3"
              >
                <h3 className="font-semibold">
                  {item.product_name}
                </h3>

                <p className="text-sm text-gray-500">
                  Batch: {item.batch_number}
                </p>

                <div className="mt-2 flex items-center justify-between">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => {
                      const qty = Number(e.target.value);

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
                    }}
                    className="w-20 rounded-lg border p-2"
                  />

                  <p className="font-bold text-green-600">
                    ₹{item.total_amount}
                  </p>
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

            <select
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value)
              }
              className="w-full rounded-xl border p-3"
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
            </select>

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
