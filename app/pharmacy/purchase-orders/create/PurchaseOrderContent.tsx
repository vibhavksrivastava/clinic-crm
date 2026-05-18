'use client';

import { useEffect, useState } from 'react';
import {
  useRouter,
  useSearchParams,
} from 'next/navigation';

import Header from '@/components/Header';

interface Supplier {
  id: string;
  supplier_name: string;
}

interface Product {
  id: string;
  name: string;
  gst?: number;
  unit_price?: number;
}

export default function PurchaseOrderContent() {
  const router = useRouter();

  const searchParams = useSearchParams();

  const supplierId =
    searchParams.get('supplier_id');

  const [loading, setLoading] =
    useState(false);

  const [supplier, setSupplier] =
    useState<Supplier | null>(null);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [formData, setFormData] =
    useState({
      invoice_number: '',
      purchase_date: new Date()
        .toISOString()
        .split('T')[0],
      notes: '',
    });

  const [items, setItems] = useState([
    {
      product_id: '',
      product_name: '',
      quantity: 1,
      purchase_price: 0,
      mrp: 0,
      batch_number: '',
      expiry_date: '',
      gst_percent: 0,
      total_amount: 0,
    },
  ]);

  const getAuthHeaders = () => {
    const token =
      localStorage.getItem('authToken');

    return {
      'Content-Type': 'application/json',
      ...(token && {
        Authorization: `Bearer ${token}`,
      }),
    };
  };

  useEffect(() => {
    fetchSupplier();
    fetchProducts();
  }, []);

  const fetchSupplier = async () => {
    try {
      const res = await fetch(
        '/api/pharmacy/suppliers',
        {
          headers: getAuthHeaders(),
        }
      );

      const data = await res.json();

      const found = data.find(
        (s: Supplier) =>
          s.id === supplierId
      );

      setSupplier(found || null);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(
        '/api/pharmacy/products',
        {
          headers: getAuthHeaders(),
        }
      );

      const data = await res.json();

      setProducts(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(error);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        product_id: '',
        product_name: '',
        quantity: 1,
        purchase_price: 0,
        mrp: 0,
        batch_number: '',
        expiry_date: '',
        gst_percent: 0,
        total_amount: 0,
      },
    ]);
  };

  const updateItem = (
    index: number,
    field: string,
    value: any
  ) => {
    const updated = [...items];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    const qty = Number(
      updated[index].quantity || 0
    );

    const price = Number(
      updated[index].purchase_price || 0
    );

    const gst = Number(
      updated[index].gst_percent || 0
    );

    const baseAmount = qty * price;

    const gstAmount =
      (baseAmount * gst) / 100;

    updated[index].total_amount =
      baseAmount + gstAmount;

    setItems(updated);
  };

  const subtotal = items.reduce(
    (sum, item) =>
      sum +
      Number(item.quantity || 0) *
        Number(item.purchase_price || 0),
    0
  );

  const gstAmount = items.reduce(
    (sum, item) => {
      const qty = Number(
        item.quantity || 0
      );

      const price = Number(
        item.purchase_price || 0
      );

      const gst = Number(
        item.gst_percent || 0
      );

      return (
        sum +
        (qty * price * gst) / 100
      );
    },
    0
  );

  const grandTotal =
    subtotal + gstAmount;

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const orderPayload = {
        supplier_id: supplierId,

        invoice_number:
          formData.invoice_number,

        purchase_date:
          formData.purchase_date,

        notes: formData.notes,

        subtotal,

        gst_amount: gstAmount,

        total_amount: grandTotal,
      };

      const orderRes = await fetch(
        '/api/pharmacy/purchase-orders',
        {
          method: 'POST',

          headers: getAuthHeaders(),

          body: JSON.stringify(
            orderPayload
          ),
        }
      );

      const orderData =
        await orderRes.json();

      if (!orderRes.ok) {
        alert(
          orderData.error ||
            'Failed to create order'
        );

        return;
      }

      for (const item of items) {
        const itemRes = await fetch(
          '/api/pharmacy/purchase-items',
          {
            method: 'POST',

            headers:
              getAuthHeaders(),

            body: JSON.stringify({
              ...item,

              purchase_order_id:
                orderData.id,

              supplier_id:
                supplierId,
            }),
          }
        );

        const itemData =
          await itemRes.json();

        if (!itemRes.ok) {
          console.error(itemData);

          alert(
            itemData.error ||
              'Failed to create purchase item'
          );

          return;
        }
      }

      alert(
        '✅ Purchase order created'
      );

      router.push(
        '/pharmacy/purchase-orders'
      );
    } catch (error) {
      console.error(error);

      alert(
        'Failed to create purchase order'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="min-h-screen bg-slate-50">
    <Header />

    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

        {/* HEADER */}

        <div className="border-b border-slate-200 px-4 sm:px-6 py-5">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Create Purchase Order
          </h1>

          <p className="text-slate-500 mt-2 text-sm sm:text-base">
            Supplier:
            <span className="font-semibold text-slate-700 ml-1">
              {supplier?.supplier_name || 'Loading...'}
            </span>
          </p>
        </div>

        <div className="p-4 sm:p-6">

          {/* FORM SECTION */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Invoice Number
              </label>

              <input
                type="text"
                placeholder="Enter invoice number"
                value={formData.invoice_number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    invoice_number: e.target.value,
                  })
                }
                className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Purchase Date
              </label>

              <input
                type="date"
                value={formData.purchase_date}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    purchase_date: e.target.value,
                  })
                }
                className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* DESKTOP TABLE */}

          <div className="hidden lg:block overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left">Medicine</th>
                  <th className="px-4 py-3 text-left">Qty</th>
                  <th className="px-4 py-3 text-left">Purchase Price</th>
                  <th className="px-4 py-3 text-left">GST %</th>
                  <th className="px-4 py-3 text-left">MRP</th>
                  <th className="px-4 py-3 text-left">Batch</th>
                  <th className="px-4 py-3 text-left">Expiry</th>
                  <th className="px-4 py-3 text-left">Total</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item, index) => (
                  <tr
                    key={index}
                    className="border-t border-slate-200"
                  >
                    {/* PRODUCT */}

                    <td className="px-3 py-3 min-w-[220px]">
                      <select
                        value={item.product_id}
                        className="w-full border rounded-lg px-3 py-2"
                        onChange={(e) => {
                          const value = e.target.value;

                          const product = products.find(
                            (p) => p.id === value
                          );

                          const updated = [...items];

                          updated[index] = {
                            ...updated[index],
                            product_id: value,
                            product_name:
                              product?.name || '',
                            gst_percent: Number(
                              product?.gst || 0
                            ),
                            mrp: Number(
                              product?.unit_price || 0
                            ),
                          };

                          setItems(updated);
                        }}
                      >
                        <option value="">
                          Select Medicine
                        </option>

                        {products.map((product) => (
                          <option
                            key={product.id}
                            value={product.id}
                          >
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* QTY */}

                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            index,
                            'quantity',
                            e.target.value
                          )
                        }
                        className="w-20 border rounded-lg px-3 py-2"
                      />
                    </td>

                    {/* PURCHASE PRICE */}

                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={item.purchase_price}
                        onChange={(e) =>
                          updateItem(
                            index,
                            'purchase_price',
                            e.target.value
                          )
                        }
                        className="w-28 border rounded-lg px-3 py-2"
                      />
                    </td>

                    {/* GST */}

                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={item.gst_percent}
                        onChange={(e) =>
                          updateItem(
                            index,
                            'gst_percent',
                            e.target.value
                          )
                        }
                        className="w-20 border rounded-lg px-3 py-2"
                      />
                    </td>

                    {/* MRP */}

                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={item.mrp}
                        onChange={(e) =>
                          updateItem(
                            index,
                            'mrp',
                            e.target.value
                          )
                        }
                        className="w-24 border rounded-lg px-3 py-2"
                      />
                    </td>

                    {/* BATCH */}

                    <td className="px-3 py-3">
                      <input
                        type="text"
                        value={item.batch_number}
                        onChange={(e) =>
                          updateItem(
                            index,
                            'batch_number',
                            e.target.value
                          )
                        }
                        className="w-28 border rounded-lg px-3 py-2"
                      />
                    </td>

                    {/* EXPIRY */}

                    <td className="px-3 py-3">
                      <input
                        type="date"
                        value={item.expiry_date}
                        onChange={(e) =>
                          updateItem(
                            index,
                            'expiry_date',
                            e.target.value
                          )
                        }
                        className="border rounded-lg px-3 py-2"
                      />
                    </td>

                    {/* TOTAL */}

                    <td className="px-3 py-3 font-semibold text-green-700">
                      ₹{Number(item.total_amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS */}

          <div className="lg:hidden space-y-4">
            {items.map((item, index) => (
              <div
                key={index}
                className="border border-slate-200 rounded-2xl p-4 shadow-sm bg-white"
              >
                <div className="space-y-3">

                  <select
                    value={item.product_id}
                    className="w-full border rounded-xl px-4 py-3"
                    onChange={(e) => {
                      const value = e.target.value;

                      const product = products.find(
                        (p) => p.id === value
                      );

                      const updated = [...items];

                      updated[index] = {
                        ...updated[index],
                        product_id: value,
                        product_name:
                          product?.name || '',
                        gst_percent: Number(
                          product?.gst || 0
                        ),
                        mrp: Number(
                          product?.unit_price || 0
                        ),
                      };

                      setItems(updated);
                    }}
                  >
                    <option value="">
                      Select Medicine
                    </option>

                    {products.map((product) => (
                      <option
                        key={product.id}
                        value={product.id}
                      >
                        {product.name}
                      </option>
                    ))}
                  </select>

                  <div className="grid grid-cols-2 gap-3">

                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          index,
                          'quantity',
                          e.target.value
                        )
                      }
                      className="border rounded-xl px-4 py-3"
                    />

                    <input
                      type="number"
                      placeholder="Purchase Price"
                      value={item.purchase_price}
                      onChange={(e) =>
                        updateItem(
                          index,
                          'purchase_price',
                          e.target.value
                        )
                      }
                      className="border rounded-xl px-4 py-3"
                    />

                    <input
                      type="number"
                      placeholder="GST %"
                      value={item.gst_percent}
                      onChange={(e) =>
                        updateItem(
                          index,
                          'gst_percent',
                          e.target.value
                        )
                      }
                      className="border rounded-xl px-4 py-3"
                    />

                    <input
                      type="number"
                      placeholder="MRP"
                      value={item.mrp}
                      onChange={(e) =>
                        updateItem(
                          index,
                          'mrp',
                          e.target.value
                        )
                      }
                      className="border rounded-xl px-4 py-3"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Batch Number"
                    value={item.batch_number}
                    onChange={(e) =>
                      updateItem(
                        index,
                        'batch_number',
                        e.target.value
                      )
                    }
                    className="w-full border rounded-xl px-4 py-3"
                  />

                  <input
                    type="date"
                    value={item.expiry_date}
                    onChange={(e) =>
                      updateItem(
                        index,
                        'expiry_date',
                        e.target.value
                      )
                    }
                    className="w-full border rounded-xl px-4 py-3"
                  />

                  <div className="flex justify-between items-center pt-2">
                    <span className="font-medium text-slate-500">
                      Total
                    </span>

                    <span className="text-lg font-bold text-green-700">
                      ₹{Number(item.total_amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ADD BUTTON */}

          <button
            onClick={addItem}
            className="mt-5 w-full sm:w-auto px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition"
          >
            + Add Item
          </button>

          {/* NOTES */}

          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Notes
            </label>

            <textarea
              placeholder="Add notes..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  notes: e.target.value,
                })
              }
              rows={4}
              className="w-full border border-slate-300 rounded-xl px-4 py-3"
            />
          </div>

          {/* TOTALS */}

          <div className="mt-6 bg-slate-100 rounded-2xl p-5 flex flex-col sm:flex-row justify-between gap-4">
            <div className="space-y-1">
              <div className="text-slate-600">
                Subtotal:
                <span className="font-semibold ml-2">
                  ₹{subtotal.toFixed(2)}
                </span>
              </div>

              <div className="text-slate-600">
                GST:
                <span className="font-semibold ml-2">
                  ₹{gstAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="text-2xl font-bold text-green-700">
              Total: ₹{grandTotal.toFixed(2)}
            </div>
          </div>

          {/* SUBMIT */}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-6 w-full sm:w-auto px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition"
          >
            {loading
              ? 'Saving...'
              : 'Create Purchase Order'}
          </button>
        </div>
      </div>
    </div>
  </div>
);
}