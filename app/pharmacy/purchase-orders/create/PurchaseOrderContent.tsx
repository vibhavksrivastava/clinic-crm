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


  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');

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
    fetchSuppliers();
    fetchSupplier();
    fetchProducts();
  }, []);

useEffect(() => {
  if (supplierId) {
    setSelectedSupplierId(supplierId);
  }
}, [supplierId]);

const fetchSuppliers = async () => {
  try {
    const res = await fetch('/api/pharmacy/suppliers');

    const data = await res.json();

    setSuppliers(data || []);
  } catch (error) {
    console.error('Failed to fetch suppliers', error);
  }
};

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
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h1 className="text-3xl font-bold mb-2">
            Create Purchase Order
          </h1>
<div className="mb-6">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Supplier
  </label>

  <select
    value={selectedSupplierId}
    onChange={(e) => {
      const supplierId = e.target.value;

      setSelectedSupplierId(supplierId);

      if (supplierId) {
        router.push(
          `/pharmacy/purchase-orders/create?supplier_id=${supplierId}`
        );
      }
    }}
    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="">Select Supplier</option>

    {suppliers.map((supplier) => (
      <option key={supplier.id} value={supplier.id}>
        {supplier.supplier_name}
      </option>
    ))}
  </select>
</div>

          {/* FORM SECTION */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <input
              type="text"
              placeholder="Invoice Number"
              value={
                formData.invoice_number
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  invoice_number:
                    e.target.value,
                })
              }
              className="border rounded-lg px-4 py-3"
            />

            <input
              type="date"
              value={
                formData.purchase_date
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  purchase_date:
                    e.target.value,
                })
              }
              className="border rounded-lg px-4 py-3"
            />
          </div>

          {/* ITEMS TABLE */}

          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2">
                    Medicine
                  </th>

                  <th className="px-4 py-2">
                    Qty
                  </th>

                  <th className="px-4 py-2">
                    Purchase Price
                  </th>

                  <th className="px-4 py-2">
                    GST %
                  </th>

                  <th className="px-4 py-2">
                    MRP
                  </th>

                  <th className="px-4 py-2">
                    Batch
                  </th>

                  <th className="px-4 py-2">
                    Expiry
                  </th>

                  <th className="px-4 py-2">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {items.map(
                  (item, index) => (
                    <tr
                      key={index}
                      className="border-t"
                    >
                      {/* PRODUCT */}

                      <td className="px-2 py-2">
                        <select
                          value={
                            item.product_id
                          }
                          className="border rounded px-2 py-1 w-full"
                          onChange={(e) => {
                            const value =
                              e.target.value;

                            const product =
                              products.find(
                                (p) =>
                                  p.id ===
                                  value
                              );

                            const updated =
                              [...items];

                            updated[index] = {
                              ...updated[
                                index
                              ],

                              product_id:
                                value,

                              product_name:
                                product?.name ||
                                '',

                              gst_percent:
                                Number(
                                  product?.gst ||
                                    0
                                ),

                              mrp: Number(
                                product?.unit_price ||
                                  0
                              ),
                            };

                            setItems(
                              updated
                            );
                          }}
                        >
                          <option value="">
                            Select
                          </option>

                          {products.map(
                            (product) => (
                              <option
                                key={
                                  product.id
                                }
                                value={
                                  product.id
                                }
                              >
                                {
                                  product.name
                                }
                              </option>
                            )
                          )}
                        </select>
                      </td>

                      {/* QTY */}

                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={
                            item.quantity
                          }
                          onChange={(e) =>
                            updateItem(
                              index,
                              'quantity',
                              e.target.value
                            )
                          }
                          className="border rounded px-2 py-1 w-20"
                        />
                      </td>

                      {/* PURCHASE PRICE */}

                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={
                            item.purchase_price
                          }
                          onChange={(e) =>
                            updateItem(
                              index,
                              'purchase_price',
                              e.target.value
                            )
                          }
                          className="border rounded px-2 py-1 w-28"
                        />
                      </td>

                      {/* GST */}

                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={
                            item.gst_percent
                          }
                          onChange={(e) =>
                            updateItem(
                              index,
                              'gst_percent',
                              e.target.value
                            )
                          }
                          className="border rounded px-2 py-1 w-20"
                        />
                      </td>

                      {/* MRP */}

                      <td className="px-2 py-2">
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
                          className="border rounded px-2 py-1 w-24"
                        />
                      </td>

                      {/* BATCH */}

                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={
                            item.batch_number
                          }
                          onChange={(e) =>
                            updateItem(
                              index,
                              'batch_number',
                              e.target.value
                            )
                          }
                          className="border rounded px-2 py-1 w-28"
                        />
                      </td>

                      {/* EXPIRY */}

                      <td className="px-2 py-2">
                        <input
                          type="date"
                          value={
                            item.expiry_date
                          }
                          onChange={(e) =>
                            updateItem(
                              index,
                              'expiry_date',
                              e.target.value
                            )
                          }
                          className="border rounded px-2 py-1"
                        />
                      </td>

                      {/* TOTAL */}

                      <td className="px-2 py-2 font-semibold">
                        ₹
                        {Number(
                          item.total_amount
                        ).toFixed(2)}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          <button
            onClick={addItem}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            + Add Item
          </button>

          {/* NOTES */}

          <div className="mt-6">
            <textarea
              placeholder="Notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  notes: e.target.value,
                })
              }
              rows={4}
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          {/* TOTALS */}

          <div className="mt-6 flex justify-between items-center">
            <div className="text-xl font-bold">
              <div>
                Subtotal: ₹
                {subtotal.toFixed(2)}
              </div>

              <div>
                GST: ₹
                {gstAmount.toFixed(2)}
              </div>
            </div>

            <div className="text-2xl font-bold">
              Total: ₹
              {grandTotal.toFixed(2)}
            </div>
          </div>

          {/* SUBMIT */}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-6 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            {loading
              ? 'Saving...'
              : 'Create Purchase Order'}
          </button>
        </div>
      </div>
    </div>
  );
}