'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Search,
  Phone,
  Mail,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  FileText,
  Package,
  Receipt,
  Loader2,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';

interface Supplier {
  id: string;
  supplier_name: string;
  contact_person: string;
  email: string;
  phone: string;
  gst_number: string;
  drug_license_number: string;
  city: string;
  state: string;
  pincode: string;
  address: string;
  created_at: string;
}

interface PurchaseOrder {
  id: string;
  supplier_id: string;
  invoice_number: string;
  purchase_date: string;
  payment_status: string;
  status: string;
  subtotal: number;
  gst_amount: number;
  total_amount: number;
  created_at: string;
}

interface PurchaseItem {
  id: string;
  purchase_order_id: string;
  product_name: string;
  batch_number: string;
  quantity: number;
  purchase_price: number;
  mrp: number;
  expiry_date?: string;
}

interface SupplierInvoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  payment_status: string;
  created_at: string;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [selectedSupplier, setSelectedSupplier] =
    useState<Supplier | null>(null);

  const [searchQuery, setSearchQuery] =
    useState('');

  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [supplierHistory, setSupplierHistory] =
    useState<{
      purchaseOrders: PurchaseOrder[];
      purchaseItems: PurchaseItem[];
      invoices: SupplierInvoice[];
    } | null>(null);

  const [formData, setFormData] = useState({
    supplier_name: '',
    contact_person: '',
    email: '',
    phone: '',
    gst_number: '',
    drug_license_number: '',
    city: '',
    state: '',
    pincode: '',
    address: '',
  });

  const getAuthHeaders = () => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('authToken')
        : null;

    return {
      'Content-Type': 'application/json',
      ...(token && {
        Authorization: `Bearer ${token}`,
      }),
    };
  };

  const safeJson = async (response: Response) => {
    const text = await response.text();

    try {
      return JSON.parse(text);
    } catch (error) {
      console.error('Invalid JSON response:', text);
      return [];
    }
  };

  // ================= FETCH SUPPLIERS =================

  const fetchSuppliers = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        '/api/pharmacy/suppliers',
        {
          headers: getAuthHeaders(),
        }
      );

      const data = await safeJson(response);

      setSuppliers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(
        'Error fetching suppliers:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // ================= FETCH HISTORY =================

  const fetchSupplierHistory = async (
    supplierId: string
  ) => {
    try {
      setHistoryLoading(true);

      const [ordersRes, itemsRes] =
        await Promise.all([
          fetch(
            `/api/pharmacy/purchase-orders?supplier_id=${supplierId}`,
            {
              headers: getAuthHeaders(),
            }
          ),

          fetch(
            `/api/pharmacy/purchase-items?supplier_id=${supplierId}`,
            {
              headers: getAuthHeaders(),
            }
          ),
        ]);

      const purchaseOrders = await safeJson(
        ordersRes
      );

      const purchaseItems = await safeJson(
        itemsRes
      );

      const receivedOrders = Array.isArray(
        purchaseOrders
      )
        ? purchaseOrders.filter(
            (po: any) =>
              po.status === 'Received' ||
              po.status ===
                'partial_received'
          )
        : [];

      const receivedOrderIds =
        receivedOrders.map((po: any) => po.id);

      setSupplierHistory({
        purchaseOrders: Array.isArray(
          purchaseOrders
        )
          ? purchaseOrders
          : [],

        purchaseItems: Array.isArray(
          purchaseItems
        )
          ? purchaseItems.filter(
              (item: any) =>
                receivedOrderIds.includes(
                  item.purchase_order_id
                )
            )
          : [],

        invoices: receivedOrders,
      });
    } catch (error) {
      console.error(
        'Error fetching supplier history:',
        error
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // ================= FILTER =================

  const filteredSuppliers = useMemo(() => {
    if (!searchQuery.trim()) return suppliers;

    const query = searchQuery.toLowerCase();

    return suppliers.filter((supplier) => {
      return (
        supplier.supplier_name
          .toLowerCase()
          .includes(query) ||
        supplier.contact_person
          .toLowerCase()
          .includes(query) ||
        supplier.phone
          .toLowerCase()
          .includes(query) ||
        supplier.city
          .toLowerCase()
          .includes(query)
      );
    });
  }, [suppliers, searchQuery]);

  // ================= STATS =================

  const totalSuppliers = suppliers.length;

  const totalCities = new Set(
    suppliers.map((s) => s.city)
  ).size;

  const suppliersWithGST = suppliers.filter(
    (s) => s.gst_number
  ).length;

  // ================= SAVE =================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      const method = editingId
        ? 'PUT'
        : 'POST';

      const url = editingId
        ? `/api/pharmacy/suppliers?id=${editingId}`
        : '/api/pharmacy/suppliers';

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      const data = await safeJson(response);

      if (response.ok) {
        alert(
          `Supplier ${
            editingId
              ? 'updated'
              : 'created'
          } successfully`
        );

        resetForm();

        fetchSuppliers();
      } else {
        alert(
          data.error ||
            'Failed to save supplier'
        );
      }
    } catch (error) {
      console.error(error);

      alert('Failed to save supplier');
    }
  };

  // ================= EDIT =================

  const handleEdit = (
    supplier: Supplier
  ) => {
    setFormData({
      supplier_name:
        supplier.supplier_name,
      contact_person:
        supplier.contact_person,
      email: supplier.email,
      phone: supplier.phone,
      gst_number:
        supplier.gst_number,
      drug_license_number:
        supplier.drug_license_number,
      city: supplier.city,
      state: supplier.state,
      pincode: supplier.pincode,
      address: supplier.address,
    });

    setEditingId(supplier.id);

    setShowForm(true);
  };

  // ================= DELETE =================

  const handleDelete = async (
    id: string
  ) => {
    if (
      !window.confirm(
        'Delete this supplier?'
      )
    )
      return;

    try {
      const response = await fetch(
        `/api/pharmacy/suppliers?id=${id}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }
      );

      const data = await safeJson(response);

      if (response.ok) {
        alert('Supplier deleted');

        fetchSuppliers();

        closeHistory();
      } else {
        alert(
          data.error || 'Delete failed'
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ================= HELPERS =================

  const handleViewHistory = (
    supplier: Supplier
  ) => {
    setSelectedSupplier(supplier);

    fetchSupplierHistory(supplier.id);
  };

  const closeHistory = () => {
    setSelectedSupplier(null);

    setSupplierHistory(null);
  };

  const resetForm = () => {
    setShowForm(false);

    setEditingId(null);

    setFormData({
      supplier_name: '',
      contact_person: '',
      email: '',
      phone: '',
      gst_number: '',
      drug_license_number: '',
      city: '',
      state: '',
      pincode: '',
      address: '',
    });
  };

  const formatCurrency = (
    amount: number
  ) => {
    return `₹${Number(amount || 0).toFixed(
      2
    )}`;
  };

  const getStatusClass = (
    status: string
  ) => {
    switch (status?.toLowerCase()) {
      case 'received':
        return 'bg-emerald-100 text-emerald-700';

      case 'pending':
        return 'bg-amber-100 text-amber-700';

      case 'partial_received':
        return 'bg-blue-100 text-blue-700';

      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="p-4 md:p-6">
      
        {/* ================= HEADER ================= */}
        
        {/* HERO */}
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_25%)]" />

          <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-md">
                <Building2 size={16} />
                Pharmacy Management System
              </div>

              <h1 className="text-4xl font-bold tracking-tight">
                Supplier Management
              </h1>

              <p className="mt-3 max-w-2xl text-base text-blue-100">
                Manage distributors,
              invoices, purchase orders
              and supplier performance.
              </p>
            </div>

            
          {!showForm &&
            !selectedSupplier && (
              <button
                onClick={() =>
                  setShowForm(true)
                }
                className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 font-semibold text-slate-900 transition hover:scale-[1.02]"
              >
                <Plus size={18} />
                Add Supplier
              </button>
            )}
          </div>
        </div>
        {/* ================= STATS ================= */}

        {!selectedSupplier && (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                  <Building2 size={22} />
                </div>

                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Total
                </span>
              </div>

              <h2 className="mt-5 text-3xl font-bold text-slate-900">
                {totalSuppliers}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Registered Suppliers
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                  <ShieldCheck size={22} />
                </div>

                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  GST
                </span>
              </div>

              <h2 className="mt-5 text-3xl font-bold text-slate-900">
                {suppliersWithGST}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                GST Verified
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-purple-100 p-3 text-purple-700">
                  <MapPin size={22} />
                </div>

                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Cities
                </span>
              </div>

              <h2 className="mt-5 text-3xl font-bold text-slate-900">
                {totalCities}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Supplier Locations
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-sm">
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-white/10 p-3">
                  <Receipt size={22} />
                </div>

                <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                  Active
                </span>
              </div>

              <h2 className="mt-5 text-3xl font-bold">
                {
                  filteredSuppliers.length
                }
              </h2>

              <p className="mt-1 text-sm text-slate-300">
                Search Results
              </p>
            </div>
          </div>
        )}

        {/* ================= FORM ================= */}

        {showForm && (
          <div className="mb-8 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {editingId
                    ? 'Edit Supplier'
                    : 'Create Supplier'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Maintain supplier
                  profile and licensing
                  details
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl border border-slate-300 px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {[
                  {
                    label:
                      'Supplier Name',
                    key: 'supplier_name',
                    type: 'text',
                    required: true,
                  },
                  {
                    label:
                      'Contact Person',
                    key: 'contact_person',
                    type: 'text',
                    required: true,
                  },
                  {
                    label: 'Email',
                    key: 'email',
                    type: 'email',
                  },
                  {
                    label: 'Phone',
                    key: 'phone',
                    type: 'text',
                  },
                  {
                    label:
                      'GST Number',
                    key: 'gst_number',
                    type: 'text',
                  },
                  {
                    label:
                      'Drug License Number',
                    key:
                      'drug_license_number',
                    type: 'text',
                  },
                  {
                    label: 'City',
                    key: 'city',
                    type: 'text',
                  },
                  {
                    label: 'State',
                    key: 'state',
                    type: 'text',
                  },
                  {
                    label: 'Pincode',
                    key: 'pincode',
                    type: 'text',
                  },
                ].map((field) => (
                  <div
                    key={field.key}
                  >
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      {field.label}
                    </label>

                    <input
                      type={field.type}
                      required={
                        field.required
                      }
                      value={
                        formData[
                          field.key as keyof typeof formData
                        ]
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [field.key]:
                            e.target.value,
                        })
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Address
                </label>

                <textarea
                  rows={4}
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  className="rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                  {editingId
                    ? 'Update Supplier'
                    : 'Save Supplier'}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= LIST VIEW ================= */}

        {!selectedSupplier && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            {/* LEFT PANEL */}

            <div className="xl:col-span-4">
              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="relative mb-5">
                  <Search
                    size={18}
                    className="absolute left-4 top-3.5 text-slate-400"
                  />

                  <input
                    type="text"
                    placeholder="Search suppliers..."
                    value={searchQuery}
                    onChange={(e) =>
                      setSearchQuery(
                        e.target.value
                      )
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="max-h-[720px] space-y-3 overflow-y-auto pr-1">
                  {loading ? (
                    <div className="flex items-center justify-center py-16 text-slate-500">
                      <Loader2 className="mr-2 animate-spin" />
                      Loading suppliers...
                    </div>
                  ) : filteredSuppliers.length ===
                    0 ? (
                    <div className="py-16 text-center text-slate-500">
                      No suppliers found
                    </div>
                  ) : (
                    filteredSuppliers.map(
                      (supplier) => (
                        <button
                          key={
                            supplier.id
                          }
                          onClick={() =>
                            handleViewHistory(
                              supplier
                            )
                          }
                          className="w-full rounded-3xl border border-slate-200 bg-white p-5 text-left transition hover:border-blue-300 hover:bg-blue-50"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <h3 className="truncate text-lg font-bold text-slate-900">
                                {
                                  supplier.supplier_name
                                }
                              </h3>

                              <p className="mt-1 text-sm text-slate-600">
                                {
                                  supplier.contact_person
                                }
                              </p>

                              <div className="mt-4 space-y-2">
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                  <Phone size={14} />
                                  {
                                    supplier.phone
                                  }
                                </div>

                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                  <MapPin size={14} />
                                  {
                                    supplier.city
                                  }
                                  ,{' '}
                                  {
                                    supplier.state
                                  }
                                </div>
                              </div>
                            </div>

                            <div className="rounded-2xl bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                              View
                            </div>
                          </div>
                        </button>
                      )
                    )
                  )}
                </div>
              </div>
            </div>

            {/* EMPTY STATE */}

            <div className="xl:col-span-8">
              <div className="flex min-h-[720px] flex-col items-center justify-center rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-sm">
                <div className="mb-5 rounded-full bg-blue-100 p-6 text-blue-700">
                  <Building2 size={50} />
                </div>

                <h2 className="text-3xl font-bold text-slate-900">
                  Supplier Dashboard
                </h2>

                <p className="mt-3 max-w-lg text-slate-500">
                  Select a supplier from
                  the left panel to view
                  invoices, purchase
                  orders, product history
                  and supplier analytics.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================= DETAILS VIEW ================= */}

        {selectedSupplier && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            {/* SIDEBAR */}

            <div className="space-y-5 xl:col-span-4">
              <button
                onClick={closeHistory}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
              >
                <ArrowLeft size={18} />
                Back To Suppliers
              </button>

              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-4">
                  <div className="rounded-3xl bg-blue-100 p-4 text-blue-700">
                    <Building2 size={30} />
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {
                        selectedSupplier.supplier_name
                      }
                    </h2>

                    <p className="text-sm text-slate-500">
                      Supplier Profile
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Contact Person
                    </p>

                    <p className="mt-1 font-semibold text-slate-800">
                      {
                        selectedSupplier.contact_person
                      }
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Phone size={16} />
                      {
                        selectedSupplier.phone
                      }
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-slate-700">
                      <Mail size={16} />
                      {selectedSupplier.email ||
                        '-'}
                    </div>

                    <div className="mt-3 flex items-start gap-2 text-slate-700">
                      <MapPin
                        size={16}
                        className="mt-0.5"
                      />

                      <span>
                        {
                          selectedSupplier.city
                        }
                        ,{' '}
                        {
                          selectedSupplier.state
                        }
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      GST Number
                    </p>

                    <p className="mt-1 font-semibold text-slate-800">
                      {
                        selectedSupplier.gst_number
                      }
                    </p>

                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Drug License
                    </p>

                    <p className="mt-1 font-semibold text-slate-800">
                      {
                        selectedSupplier.drug_license_number
                      }
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Link
                    href={`/pharmacy/purchase-orders/create?supplier_id=${selectedSupplier.id}`}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                  >
                    <Plus size={18} />
                    Create PO
                  </Link>

                  <button
                    onClick={() =>
                      handleEdit(
                        selectedSupplier
                      )
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 font-semibold text-white transition hover:bg-amber-600"
                  >
                    <Pencil size={18} />
                    Edit Supplier
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(
                        selectedSupplier.id
                      )
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700"
                  >
                    <Trash2 size={18} />
                    Delete Supplier
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT CONTENT */}

            <div className="space-y-6 xl:col-span-8">
              {historyLoading ? (
                <div className="rounded-[28px] border border-slate-200 bg-white p-20 text-center shadow-sm">
                  <Loader2 className="mx-auto mb-4 animate-spin text-slate-500" />

                  <p className="text-slate-500">
                    Loading supplier
                    history...
                  </p>
                </div>
              ) : supplierHistory ? (
                <>
                  {/* PURCHASE ORDERS */}

                  <div className="rounded-[28px] border border-emerald-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                          <FileText size={22} />
                        </div>

                        <div>
                          <h3 className="text-2xl font-bold text-slate-900">
                            Purchase Orders
                          </h3>

                          <p className="text-sm text-slate-500">
                            Supplier PO
                            history
                          </p>
                        </div>
                      </div>

                      <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700">
                        {
                          supplierHistory
                            .purchaseOrders
                            .length
                        }{' '}
                        Orders
                      </span>
                    </div>

                    <div className="space-y-4">
                      {supplierHistory.purchaseOrders.map(
                        (po) => (
                          <div
                            key={po.id}
                            className="rounded-3xl border border-slate-200 p-5 transition hover:bg-slate-50"
                          >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                              <div>
                                <h4 className="text-lg font-bold text-slate-900">
                                  {
                                    po.invoice_number
                                  }
                                </h4>

                                <p className="mt-1 text-sm text-slate-500">
                                  {new Date(
                                    po.purchase_date
                                  ).toLocaleDateString()}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-4">
                                <div className="text-xl font-bold text-emerald-700">
                                  {formatCurrency(
                                    po.total_amount
                                  )}
                                </div>

                                <span
                                  className={`rounded-full px-4 py-2 text-sm font-semibold ${getStatusClass(
                                    po.status
                                  )}`}
                                >
                                  {
                                    po.status
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* PURCHASE ITEMS */}

                  <div className="rounded-[28px] border border-blue-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                        <Package size={22} />
                      </div>

                      <div>
                        <h3 className="text-2xl font-bold text-slate-900">
                          Purchase Items
                        </h3>

                        <p className="text-sm text-slate-500">
                          Recently purchased
                          products
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {supplierHistory.purchaseItems.map(
                        (item) => (
                          <div
                            key={item.id}
                            className="rounded-3xl border border-slate-200 p-5"
                          >
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                              <div>
                                <h4 className="text-lg font-bold text-slate-900">
                                  {
                                    item.product_name
                                  }
                                </h4>

                                <p className="mt-1 text-sm text-slate-500">
                                  Batch:{' '}
                                  {
                                    item.batch_number
                                  }
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-4 lg:flex">
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                  <p className="text-xs text-slate-400">
                                    Qty
                                  </p>

                                  <p className="font-bold text-slate-800">
                                    {
                                      item.quantity
                                    }
                                  </p>
                                </div>

                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                  <p className="text-xs text-slate-400">
                                    Purchase
                                  </p>

                                  <p className="font-bold text-slate-800">
                                    {formatCurrency(
                                      item.purchase_price
                                    )}
                                  </p>
                                </div>

                                <div className="rounded-2xl bg-emerald-50 px-4 py-3">
                                  <p className="text-xs text-emerald-500">
                                    MRP
                                  </p>

                                  <p className="font-bold text-emerald-700">
                                    {formatCurrency(
                                      item.mrp
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* INVOICES */}

                  <div className="rounded-[28px] border border-purple-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-purple-100 p-3 text-purple-700">
                          <CreditCard size={22} />
                        </div>

                        <div>
                          <h3 className="text-2xl font-bold text-slate-900">
                            Supplier Invoices
                          </h3>

                          <p className="text-sm text-slate-500">
                            Invoice & payment
                            tracking
                          </p>
                        </div>
                      </div>

                      <span className="rounded-full bg-purple-100 px-4 py-2 text-sm font-bold text-purple-700">
                        {
                          supplierHistory
                            .invoices
                            .length
                        }{' '}
                        Invoices
                      </span>
                    </div>

                    <div className="space-y-4">
                      {supplierHistory.invoices.map(
                        (invoice) => (
                          <div
                            key={invoice.id}
                            className="rounded-3xl border border-slate-200 p-5"
                          >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                              <div>
                                <h4 className="text-lg font-bold text-slate-900">
                                  {
                                    invoice.invoice_number
                                  }
                                </h4>

                                <p className="mt-1 text-sm text-slate-500">
                                  Payment Status
                                </p>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="text-xl font-bold text-purple-700">
                                  {formatCurrency(
                                    invoice.total_amount
                                  )}
                                </div>

                                <span className="rounded-full bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-700">
                                  {
                                    invoice.payment_status
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}