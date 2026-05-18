'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import { useEffect, useState } from 'react';

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

  const [editingId, setEditingId] = useState<string | null>(null);

  const [selectedSupplier, setSelectedSupplier] =
    useState<Supplier | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  const [historyLoading, setHistoryLoading] = useState(false);

  const [supplierHistory, setSupplierHistory] = useState<{
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
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  // SAFE JSON PARSER
  const safeJson = async (response: Response) => {
    const text = await response.text();

    try {
      return JSON.parse(text);
    } catch (error) {
      console.error('Invalid JSON response:', text);
      return [];
    }
  };

  // FETCH SUPPLIERS
  const fetchSuppliers = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/pharmacy/suppliers', {
        headers: getAuthHeaders(),
      });

      if (response.status === 401) {
        alert('❌ Unauthorized. Please login.');
        return;
      }

      const data = await safeJson(response);

      setSuppliers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  // FETCH HISTORY
  const fetchSupplierHistory = async (supplierId: string) => {
    try {
      setHistoryLoading(true);

      const [ordersRes, itemsRes, invoicesRes] = await Promise.all([
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

        fetch(
          `/api/pharmacy/purchase-invoices?supplier_id=${supplierId}`,
          {
            headers: getAuthHeaders(),
          }
        ),
      ]);

      const purchaseOrders = await safeJson(ordersRes);

      const purchaseItems = await safeJson(itemsRes);

      
      const invoices = Array.isArray(purchaseOrders)?purchaseOrders.filter(
      (po: any) =>
      po.status === 'Received' ||
      po.status === 'partial_received'
      ): [];

      const receivedOrders = invoices;
      const receivedOrderIds = receivedOrders.map(
      (po: any) => po.id
    );
    

      setSupplierHistory({
        purchaseOrders: Array.isArray(purchaseOrders)
          ? purchaseOrders
          : [],

        purchaseItems: Array.isArray(purchaseItems)
        ? purchaseItems.filter((item: any) =>
        receivedOrderIds.includes(
          item.purchase_order_id
        )
      )
    : [],

    invoices: receivedOrders,

      });
    } catch (error) {
      console.error('Error fetching supplier history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // FILTER SUPPLIERS
  const filteredSuppliers = suppliers.filter((supplier) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();

    return (
      supplier.supplier_name.toLowerCase().includes(query) ||
      supplier.contact_person.toLowerCase().includes(query) ||
      supplier.phone.toLowerCase().includes(query) ||
      supplier.id.toLowerCase().includes(query)
    );
  });

  // SAVE SUPPLIER
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const method = editingId ? 'PUT' : 'POST';

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
          `✅ Supplier ${
            editingId ? 'updated' : 'created'
          } successfully`
        );

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

        setEditingId(null);

        setShowForm(false);

        fetchSuppliers();
      } else {
        alert(`❌ ${data.error || 'Failed to save supplier'}`);
      }
    } catch (error) {
      console.error('Error saving supplier:', error);

      alert('❌ Failed to save supplier');
    }
  };

  // EDIT
  const handleEdit = (supplier: Supplier) => {
    setFormData({
      supplier_name: supplier.supplier_name,
      contact_person: supplier.contact_person,
      email: supplier.email,
      phone: supplier.phone,
      gst_number: supplier.gst_number,
      drug_license_number: supplier.drug_license_number,
      city: supplier.city,
      state: supplier.state,
      pincode: supplier.pincode,
      address: supplier.address,
    });

    setEditingId(supplier.id);

    setShowForm(true);
  };

  // DELETE
  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this supplier?')) return;

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
        alert('✅ Supplier deleted');

        fetchSuppliers();

        closeHistory();
      } else {
        alert(`❌ ${data.error || 'Delete failed'}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleViewHistory = (supplier: Supplier) => {
    setSelectedSupplier(supplier);

    fetchSupplierHistory(supplier.id);
  };

  const closeHistory = () => {
    setSelectedSupplier(null);

    setSupplierHistory(null);
  };

  const handleCancel = () => {
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

return (
  <div className="min-h-screen bg-slate-50">
    <Header />

    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">

      {/* PAGE HEADER */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">

        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800">
            Supplier Management
          </h1>

          <p className="text-slate-500 mt-2 text-sm sm:text-base">
            Manage suppliers, purchase orders and invoices
          </p>
        </div>

        {!showForm && !selectedSupplier && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold shadow-sm transition"
          >
            + Add Supplier
          </button>
        )}
      </div>

      {/* FORM */}

      {showForm && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 mb-8">

          <div className="flex items-center justify-between mb-6">

            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                {editingId
                  ? 'Edit Supplier'
                  : 'Add Supplier'}
              </h2>

              <p className="text-slate-500 mt-1">
                Supplier master information
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-5">

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Supplier Name
                </label>

                <input
                  type="text"
                  placeholder="Supplier Name"
                  value={formData.supplier_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      supplier_name:
                        e.target.value,
                    })
                  }
                  required
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Contact Person
                </label>

                <input
                  type="text"
                  placeholder="Contact Person"
                  value={formData.contact_person}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contact_person:
                        e.target.value,
                    })
                  }
                  required
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Email
                </label>

                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      email: e.target.value,
                    })
                  }
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Phone
                </label>

                <input
                  type="text"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone: e.target.value,
                    })
                  }
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  GST Number
                </label>

                <input
                  type="text"
                  placeholder="GST Number"
                  value={formData.gst_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      gst_number:
                        e.target.value,
                    })
                  }
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Drug License Number
                </label>

                <input
                  type="text"
                  placeholder="Drug License Number"
                  value={
                    formData.drug_license_number
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      drug_license_number:
                        e.target.value,
                    })
                  }
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  City
                </label>

                <input
                  type="text"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      city: e.target.value,
                    })
                  }
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  State
                </label>

                <input
                  type="text"
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      state: e.target.value,
                    })
                  }
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Pincode
                </label>

                <input
                  type="text"
                  placeholder="Pincode"
                  value={formData.pincode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pincode:
                        e.target.value,
                    })
                  }
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="mb-6">

              <label className="block text-sm font-medium text-slate-600 mb-2">
                Address
              </label>

              <textarea
                placeholder="Address"
                rows={4}
                value={formData.address}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: e.target.value,
                  })
                }
                className="w-full border border-slate-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-semibold transition"
              >
                {editingId
                  ? 'Update Supplier'
                  : 'Create Supplier'}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                className="w-full sm:w-auto px-6 py-3 bg-slate-500 hover:bg-slate-600 text-white rounded-2xl font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUPPLIER LIST */}

      {!selectedSupplier && (

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT PANEL */}

          <div className="lg:col-span-1">

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4">

              <div className="relative mb-4">

                <input
                  type="text"
                  placeholder="Search supplier..."
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(
                      e.target.value
                    )
                  }
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">

                {loading ? (

                  <div className="text-center py-10 text-slate-500">
                    Loading suppliers...
                  </div>

                ) : filteredSuppliers.length ===
                  0 ? (

                  <div className="text-center py-10 text-slate-500">
                    No suppliers found
                  </div>

                ) : (

                  filteredSuppliers.map(
                    (supplier) => (

                      <button
                        key={supplier.id}
                        onClick={() =>
                          handleViewHistory(
                            supplier
                          )
                        }
                        className="w-full text-left p-4 rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition"
                      >

                        <div className="flex items-start justify-between gap-3">

                          <div>

                            <h3 className="font-bold text-slate-800">
                              {
                                supplier.supplier_name
                              }
                            </h3>

                            <p className="text-sm text-slate-600 mt-1">
                              {
                                supplier.contact_person
                              }
                            </p>

                            <p className="text-sm text-slate-500">
                              {supplier.phone}
                            </p>
                          </div>

                          <div className="text-blue-600 text-sm font-semibold">
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

          {/* RIGHT EMPTY STATE */}

          <div className="lg:col-span-2">

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm h-full min-h-[400px] flex flex-col items-center justify-center text-center p-10">

              <div className="text-6xl mb-5">
                📦
              </div>

              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                Select Supplier
              </h3>

              <p className="text-slate-500 max-w-md">
                Select a supplier from the left panel
                to view purchase orders, invoices
                and supplier details.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUPPLIER DETAILS */}

      {selectedSupplier && (

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* LEFT SIDEBAR */}

          <div className="space-y-4">

            <button
              onClick={closeHistory}
              className="w-full px-5 py-3 bg-slate-500 hover:bg-slate-600 text-white rounded-2xl font-semibold transition"
            >
              ← Back
            </button>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">

              <h2 className="text-2xl font-bold text-slate-800 mb-5">
                Supplier Info
              </h2>

              <div className="space-y-4">

                <div>
                  <p className="text-sm text-slate-500">
                    Supplier Name
                  </p>

                  <p className="font-bold text-slate-800 mt-1">
                    {
                      selectedSupplier.supplier_name
                    }
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Contact Person
                  </p>

                  <p className="font-semibold text-slate-700 mt-1">
                    {
                      selectedSupplier.contact_person
                    }
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Phone
                  </p>

                  <p className="font-semibold text-slate-700 mt-1">
                    {selectedSupplier.phone}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">

                <Link
                  href={`/pharmacy/purchase-orders/create?supplier_id=${selectedSupplier.id}`}
                  className="block text-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold transition"
                >
                  📦 Create Purchase Order
                </Link>

                <button
                  onClick={() =>
                    handleEdit(
                      selectedSupplier
                    )
                  }
                  className="w-full px-5 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl font-semibold transition"
                >
                  ✏️ Edit Supplier
                </button>

                <button
                  onClick={() =>
                    handleDelete(
                      selectedSupplier.id
                    )
                  }
                  className="w-full px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-semibold transition"
                >
                  🗑️ Delete Supplier
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT */}

          <div className="xl:col-span-2 space-y-6">

            {historyLoading ? (

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10 text-center text-slate-500">
                Loading supplier history...
              </div>

            ) : supplierHistory ? (

              <>
                {/* PURCHASE ORDERS */}

                <div className="bg-white rounded-3xl border border-green-200 shadow-sm p-4 sm:p-6">

                  <div className="flex items-center justify-between mb-5">

                    <h3 className="text-2xl font-bold text-slate-800">
                      Purchase Orders
                    </h3>

                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                      {
                        supplierHistory
                          .purchaseOrders
                          .length
                      }{" "}
                      Orders
                    </span>
                  </div>

                  {supplierHistory.purchaseOrders
                    .length === 0 ? (

                    <p className="text-slate-500">
                      No purchase orders found
                    </p>

                  ) : (

                    <div className="space-y-4">

                      {supplierHistory.purchaseOrders.map(
                        (po) => (

                          <div
                            key={po.id}
                            className="border border-slate-200 rounded-2xl p-4 hover:bg-slate-50 transition"
                          >

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                              <div>

                                <p className="font-bold text-slate-800">
                                  {
                                    po.invoice_number
                                  }
                                </p>

                                <p className="text-sm text-slate-500 mt-1">
                                  {new Date(
                                    po.purchase_date
                                  ).toLocaleDateString()}
                                </p>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-4">

                                <div className="font-bold text-green-700">
                                  ₹
                                  {Number(
                                    po.total_amount
                                  ).toFixed(2)}
                                </div>

                                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                                  {po.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* PURCHASE ITEMS */}

                <div className="bg-white rounded-3xl border border-blue-200 shadow-sm p-4 sm:p-6">

                  <h3 className="text-2xl font-bold text-slate-800 mb-5">
                    Purchase Items
                  </h3>

                  {supplierHistory.purchaseItems
                    .length === 0 ? (

                    <p className="text-slate-500">
                      No purchase items found
                    </p>

                  ) : (

                    <div className="space-y-4">

                      {supplierHistory.purchaseItems.map(
                        (item) => (

                          <div
                            key={item.id}
                            className="border border-slate-200 rounded-2xl p-4"
                          >

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                              <div>

                                <h4 className="font-bold text-slate-800">
                                  {
                                    item.product_name
                                  }
                                </h4>

                                <p className="text-sm text-slate-500 mt-1">
                                  Batch:{" "}
                                  {
                                    item.batch_number
                                  }
                                </p>
                              </div>

                              <div className="grid grid-cols-2 sm:flex gap-4 text-sm">

                                <div>
                                  <p className="text-slate-500">
                                    Qty
                                  </p>

                                  <p className="font-semibold">
                                    {
                                      item.quantity
                                    }
                                  </p>
                                </div>

                                <div>
                                  <p className="text-slate-500">
                                    Purchase
                                  </p>

                                  <p className="font-semibold">
                                    ₹
                                    {Number(
                                      item.purchase_price
                                    ).toFixed(2)}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-slate-500">
                                    MRP
                                  </p>

                                  <p className="font-semibold text-green-700">
                                    ₹
                                    {Number(
                                      item.mrp
                                    ).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* INVOICES */}

                <div className="bg-white rounded-3xl border border-purple-200 shadow-sm p-4 sm:p-6">

                  <div className="flex items-center justify-between mb-5">

                    <h3 className="text-2xl font-bold text-slate-800">
                      Supplier Invoices
                    </h3>

                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                      {
                        supplierHistory.invoices
                          .length
                      }{" "}
                      Invoices
                    </span>
                  </div>

                  {supplierHistory.invoices
                    .length === 0 ? (

                    <p className="text-slate-500">
                      No invoices found
                    </p>

                  ) : (

                    <div className="space-y-4">

                      {supplierHistory.invoices.map(
                        (invoice) => (

                          <div
                            key={invoice.id}
                            className="border border-slate-200 rounded-2xl p-4"
                          >

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                              <div>

                                <h4 className="font-bold text-slate-800">
                                  {
                                    invoice.invoice_number
                                  }
                                </h4>

                                <p className="text-sm text-slate-500 mt-1">
                                  Payment Status
                                </p>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-4">

                                <div className="font-bold text-purple-700">
                                  ₹
                                  {Number(
                                    invoice.total_amount
                                  ).toFixed(2)}
                                </div>

                                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold">
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
                  )}
                </div>
              </>

            ) : null}
          </div>
        </div>
      )}
    </div>
  </div>
);
}