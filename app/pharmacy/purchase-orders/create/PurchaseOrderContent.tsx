'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  useRouter,
  useSearchParams,
} from 'next/navigation';

import Header from '@/components/Header';
import { Link, PackageCheck, ShoppingCart } from 'lucide-react';

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

interface PurchaseItem {
  product_id: string;
  product_name: string;
  quantity: number;
  purchase_price: number;
  mrp: number;
  batch_number: string;
  expiry_date: string;
  gst_percent: number;
  total_amount: number;
  showDropdown?: boolean;
}

export default function PurchaseOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const supplierId =
    searchParams.get('supplier_id');

  const [loading, setLoading] =
    useState(false);

  const [suppliers, setSuppliers] =
    useState<Supplier[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [
    selectedSupplierId,
    setSelectedSupplierId,
  ] = useState('');

  const [formData, setFormData] =
    useState({
      invoice_number: '',
      purchase_date: new Date()
        .toISOString()
        .split('T')[0],
      notes: '',
    });

  const [items, setItems] = useState<
    PurchaseItem[]
  >([
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
      showDropdown: false,
    },
  ]);

  const getAuthHeaders = () => {
    const token =
      localStorage.getItem('authToken');

    return {
      'Content-Type':
        'application/json',
      ...(token && {
        Authorization: `Bearer ${token}`,
      }),
    };
  };

  useEffect(() => {
    fetchSuppliers();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (supplierId) {
      setSelectedSupplierId(
        supplierId
      );
    }
  }, [supplierId]);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch(
        '/api/pharmacy/suppliers',
        {
          headers: getAuthHeaders(),
        }
      );

      const data = await res.json();

      setSuppliers(
        Array.isArray(data)
          ? data
          : []
      );
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
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(error);
    }
  };

  const calculateTotal = (
    item: PurchaseItem
  ) => {
    const qty = Number(
      item.quantity || 0
    );

    const price = Number(
      item.purchase_price || 0
    );

    const gst = Number(
      item.gst_percent || 0
    );

    const base = qty * price;

    return (
      base + (base * gst) / 100
    );
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

    updated[index].total_amount =
      calculateTotal(updated[index]);

    setItems(updated);
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
        showDropdown: false,
      },
    ]);
  };

  const removeItem = (
    index: number
  ) => {
    if (items.length === 1)
      return;

    setItems(
      items.filter(
        (_, i) => i !== index
      )
    );
  };

  const subtotal = useMemo(() => {
    return items.reduce(
      (sum, item) =>
        sum +
        Number(
          item.quantity || 0
        ) *
          Number(
            item.purchase_price || 0
          ),
      0
    );
  }, [items]);

  const gstAmount = useMemo(() => {
    return items.reduce(
      (sum, item) => {
        const base =
          Number(
            item.quantity || 0
          ) *
          Number(
            item.purchase_price || 0
          );

        return (
          sum +
          (base *
            Number(
              item.gst_percent || 0
            )) /
            100
        );
      },
      0
    );
  }, [items]);

  const grandTotal =
    subtotal + gstAmount;

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const orderPayload = {
        supplier_id:
          selectedSupplierId,
        invoice_number:
          formData.invoice_number,
        purchase_date:
          formData.purchase_date,
        notes: formData.notes,
        subtotal,
        gst_amount: gstAmount,
        total_amount: grandTotal,
      };

      const orderRes =
        await fetch(
          '/api/pharmacy/purchase-orders',
          {
            method: 'POST',
            headers:
              getAuthHeaders(),
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
        const itemRes =
          await fetch(
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
                  selectedSupplierId,
              }),
            }
          );

        const itemData =
          await itemRes.json();

        if (!itemRes.ok) {
          alert(
            itemData.error ||
              'Failed to create purchase item'
          );

          return;
        }
      }

      alert(
        'Purchase Order Created Successfully'
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

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* HERO */}
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_25%)]" />

          <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-md">
                <ShoppingCart size={16} />
                Pharmacy Procurement
              </div>

              <h1 className="text-4xl font-bold tracking-tight">
                Create Purchase Order
              </h1>

              <p className="mt-3 max-w-2xl text-base text-blue-100">
              Order supplier purchase with batch, expiry and GST details
              </p>
            </div>
                      <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Total Items
            </p>
            <p className="text-2xl font-bold text-blue-700">
              {items.length}
            </p>
          </div>
          </div>
        </div>
      </div>

        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/pharmacy"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Back
            </Link>
          </div>
          </div>


      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 xl:grid-cols-[1fr_360px]">
        {/* LEFT */}
        <div className="space-y-6">
          {/* PURCHASE DETAILS */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Purchase Details
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage supplier and invoice information
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Supplier
                </label>

                <select
                  value={
                    selectedSupplierId
                  }
                  onChange={(e) => {
                    const supplierId =
                      e.target.value;

                    setSelectedSupplierId(
                      supplierId
                    );

                    if (supplierId) {
                      router.push(
                        `/pharmacy/purchase-orders/create?supplier_id=${supplierId}`
                      );
                    }
                  }}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">
                    Select Supplier
                  </option>

                  {suppliers.map(
                    (supplier) => (
                      <option
                        key={supplier.id}
                        value={
                          supplier.id
                        }
                      >
                        {
                          supplier.supplier_name
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Invoice Number
                </label>

                <input
                  type="text"
                  placeholder="Enter invoice number"
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
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Purchase Date
                </label>

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
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          {/* ITEMS */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Medicines
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add medicines with pricing, GST and stock details
                </p>
              </div>

              <button
                onClick={addItem}
                className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-5 p-6">
              {items.map(
                (item, index) => (
                  <div
                    key={index}
                    className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5"
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-sm font-bold text-white">
                          {index + 1}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900">
                            Medicine Item
                          </p>

                          <p className="text-xs text-slate-500">
                            Add medicine details
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2">
                          <p className="text-xs font-semibold uppercase text-emerald-600">
                            Total
                          </p>

                          <p className="text-lg font-bold text-emerald-700">
                            ₹
                            {Number(
                              item.total_amount
                            ).toFixed(
                              2
                            )}
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            removeItem(
                              index
                            )
                          }
                          disabled={
                            items.length ===
                            1
                          }
                          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition-all hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                      {/* PRODUCT */}
                      <div className="xl:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Medicine
                        </label>

                        <select
                          value={
                            item.product_id
                          }
                          onChange={(e) => {
                            const value =
                              e.target
                                .value;

                            const product =
                              products.find(
                                (
                                  p
                                ) =>
                                  p.id ===
                                  value
                              );

                            const updated =
                              [...items];

                            updated[
                              index
                            ] = {
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

                            updated[
                              index
                            ].total_amount =
                              calculateTotal(
                                updated[
                                  index
                                ]
                              );

                            setItems(
                              updated
                            );
                          }}
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        >
                          <option value="">
                            Select Medicine
                          </option>

                          {products.map(
                            (
                              product
                            ) => (
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
                      </div>

                      {/* QTY */}
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Quantity
                        </label>

                        <input
                          type="number"
                          value={
                            item.quantity
                          }
                          onChange={(e) =>
                            updateItem(
                              index,
                              'quantity',
                              e.target
                                .value
                            )
                          }
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                      </div>

                      {/* PURCHASE PRICE */}
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Purchase Price
                        </label>

                        <input
                          type="number"
                          value={
                            item.purchase_price
                          }
                          onChange={(e) =>
                            updateItem(
                              index,
                              'purchase_price',
                              e.target
                                .value
                            )
                          }
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                      </div>

                      {/* GST */}
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          GST %
                        </label>

                        <input
                          type="number"
                          value={
                            item.gst_percent
                          }
                          onChange={(e) =>
                            updateItem(
                              index,
                              'gst_percent',
                              e.target
                                .value
                            )
                          }
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                      </div>

                      {/* MRP */}
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          MRP
                        </label>

                        <input
                          type="number"
                          value={item.mrp}
                          onChange={(e) =>
                            updateItem(
                              index,
                              'mrp',
                              e.target
                                .value
                            )
                          }
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                      </div>

                      {/* BATCH */}
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Batch Number
                        </label>

                        <input
                          type="text"
                          value={
                            item.batch_number
                          }
                          onChange={(e) =>
                            updateItem(
                              index,
                              'batch_number',
                              e.target
                                .value
                            )
                          }
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                      </div>

                      {/* EXPIRY */}
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Expiry Date
                        </label>

                        <input
                          type="date"
                          value={
                            item.expiry_date
                          }
                          onChange={(e) =>
                            updateItem(
                              index,
                              'expiry_date',
                              e.target
                                .value
                            )
                          }
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* NOTES */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Notes
              </h2>
            </div>

            <div className="p-6">
              <textarea
                rows={5}
                placeholder="Write additional notes..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notes:
                      e.target.value,
                  })
                }
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        {/* RIGHT SUMMARY */}
        <div className="h-fit overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-24">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Order Summary
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Final purchase breakdown
            </p>
          </div>

          <div className="space-y-5 p-6">
            <div className="rounded-3xl bg-slate-50 p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">
                  Subtotal
                </span>

                <span className="text-lg font-bold text-slate-900">
                  ₹
                  {subtotal.toFixed(
                    2
                  )}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">
                  GST
                </span>

                <span className="text-lg font-bold text-slate-900">
                  ₹
                  {gstAmount.toFixed(
                    2
                  )}
                </span>
              </div>

              <div className="my-5 border-t border-dashed border-slate-300" />

              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-slate-900">
                  Grand Total
                </span>

                <span className="text-3xl font-black tracking-tight text-blue-700">
                  ₹
                  {grandTotal.toFixed(
                    2
                  )}
                </span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading
                ? 'Saving Purchase Order...'
                : 'Create Purchase Order'}
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  '/pharmacy/purchase-orders'
                )
              }
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}