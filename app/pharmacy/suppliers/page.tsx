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
    <div className="min-h-screen bg-gray-100">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Supplier Management
          </h1>

          <p className="text-gray-600 mt-2">
            Manage suppliers and purchase history
          </p>
        </div>

        {/* ADD BUTTON */}
        {!showForm && !selectedSupplier && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Add Supplier
          </button>
        )}

        {/* FORM */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingId ? 'Edit Supplier' : 'Add Supplier'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Supplier Name"
                  value={formData.supplier_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      supplier_name: e.target.value,
                    })
                  }
                  required
                  className="border rounded-lg px-4 py-2"
                />

                <input
                  type="text"
                  placeholder="Contact Person"
                  value={formData.contact_person}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contact_person: e.target.value,
                    })
                  }
                  required
                  className="border rounded-lg px-4 py-2"
                />

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
                  className="border rounded-lg px-4 py-2"
                />

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
                  className="border rounded-lg px-4 py-2"
                />

                <input
                  type="text"
                  placeholder="GST Number"
                  value={formData.gst_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      gst_number: e.target.value,
                    })
                  }
                  className="border rounded-lg px-4 py-2"
                />

                <input
                  type="text"
                  placeholder="Drug License Number"
                  value={formData.drug_license_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      drug_license_number: e.target.value,
                    })
                  }
                  className="border rounded-lg px-4 py-2"
                />

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
                  className="border rounded-lg px-4 py-2"
                />

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
                  className="border rounded-lg px-4 py-2"
                />

                <input
                  type="text"
                  placeholder="Pincode"
                  value={formData.pincode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pincode: e.target.value,
                    })
                  }
                  className="border rounded-lg px-4 py-2"
                />
              </div>

              <textarea
                placeholder="Address"
                rows={3}
                value={formData.address}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: e.target.value,
                  })
                }
                className="w-full border rounded-lg px-4 py-2 mb-4"
              />

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {editingId
                    ? 'Update Supplier'
                    : 'Create Supplier'}
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* LIST */}
        {!selectedSupplier && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <input
                type="text"
                placeholder="Search supplier..."
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
                className="w-full border rounded-lg px-4 py-3 mb-4"
              />

              <div className="bg-white rounded-lg shadow border max-h-[650px] overflow-y-auto">
                {loading ? (
                  <div className="p-6 text-center">
                    Loading...
                  </div>
                ) : filteredSuppliers.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No suppliers found
                  </div>
                ) : (
                  <ul className="divide-y">
                    {filteredSuppliers.map((supplier) => (
                      <li key={supplier.id}>
                        <button
                          onClick={() =>
                            handleViewHistory(supplier)
                          }
                          className="w-full text-left p-4 hover:bg-blue-50"
                        >
                          <h3 className="font-semibold text-gray-900">
                            {supplier.supplier_name}
                          </h3>

                          <p className="text-sm text-gray-600">
                            {supplier.contact_person}
                          </p>

                          <p className="text-sm text-gray-500">
                            {supplier.phone}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-lg shadow p-10 flex items-center justify-center text-gray-500">
              Select supplier to view history
            </div>
          </div>
        )}

        {/* DETAILS */}
        {selectedSupplier && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT PANEL */}
            <div>
              <button
                onClick={closeHistory}
                className="w-full mb-4 px-4 py-2 bg-gray-500 text-white rounded-lg"
              >
                ← Back
              </button>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">
                  Supplier Info
                </h2>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">
                      Supplier Name
                    </p>

                    <p className="font-semibold">
                      {selectedSupplier.supplier_name}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Contact Person
                    </p>

                    <p className="font-semibold">
                      {selectedSupplier.contact_person}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Phone
                    </p>

                    <p className="font-semibold">
                      {selectedSupplier.phone}
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <Link
                    href={`/pharmacy/purchase-orders/create?supplier_id=${selectedSupplier.id}`}
                    className="block text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    📦 Create Purchase Order
                  </Link>

                  <button
                    onClick={() =>
                      handleEdit(selectedSupplier)
                    }
                    className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                  >
                    ✏️ Edit Supplier
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(selectedSupplier.id)
                    }
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    🗑️ Delete Supplier
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="lg:col-span-2 space-y-6">
              {historyLoading ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  Loading history...
                </div>
              ) : supplierHistory ? (
                <>
                  {/* PURCHASE ORDERS */}
                  <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                    <h3 className="text-xl font-bold mb-4">
                      Purchase Orders
                    </h3>

                    {supplierHistory.purchaseOrders.length ===
                    0 ? (
                      <p>No purchase orders found</p>
                    ) : (
                      <div className="space-y-3">
                        {supplierHistory.purchaseOrders.map(
                          (po) => (
                            <div
                              key={po.id}
                              className="border rounded-lg p-4 bg-green-50"
                            >
                              <div className="flex justify-between">
                                <div>
                                  <p className="font-semibold">
                                    {po.invoice_number}
                                  </p>

                                  <p className="text-sm text-gray-600">
                                    ₹
                                    {Number(
                                      po.total_amount
                                    ).toFixed(2)}
                                  </p>

                                  <p className="text-sm text-gray-500">
                                    {new Date(
                                      po.purchase_date
                                    ).toLocaleDateString()}
                                  </p>
                                </div>

                                <span className="text-sm font-semibold">
                                  {po.status}
                                </span>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {/* PURCHASE ITEMS */}
                  <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500 overflow-x-auto">
                    <h3 className="text-xl font-bold mb-4">
                      Purchase Items
                    </h3>

                    {supplierHistory.purchaseItems.length ===
                    0 ? (
                      <p>No purchase items found</p>
                    ) : (
                      <table className="min-w-full border">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left">
                              Medicine
                            </th>

                            <th className="px-4 py-2 text-left">
                              Batch
                            </th>

                            <th className="px-4 py-2 text-left">
                              Qty
                            </th>

                            <th className="px-4 py-2 text-left">
                              Purchase Price
                            </th>

                            <th className="px-4 py-2 text-left">
                              MRP
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {supplierHistory.purchaseItems.map(
                            (item) => (
                              <tr
                                key={item.id}
                                className="border-t"
                              >
                                <td className="px-4 py-2">
                                  {item.product_name}
                                </td>

                                <td className="px-4 py-2">
                                  {item.batch_number}
                                </td>

                                <td className="px-4 py-2">
                                  {item.quantity}
                                </td>

                                <td className="px-4 py-2">
                                  ₹
                                  {Number(
                                    item.purchase_price
                                  ).toFixed(2)}
                                </td>

                                <td className="px-4 py-2">
                                  ₹
                                  {Number(
                                    item.mrp
                                  ).toFixed(2)}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* INVOICES */}
                  <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                    <h3 className="text-xl font-bold mb-4">
                      Supplier Invoices
                    </h3>

                    {supplierHistory.invoices.length ===
                    0 ? (
                      <p>No invoices found</p>
                    ) : (
                      <div className="space-y-3">
                        {supplierHistory.invoices.map(
                          (invoice) => (
                            <div
                              key={invoice.id}
                              className="border rounded-lg p-4 bg-purple-50"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-semibold">
                                    {
                                      invoice.invoice_number
                                    }
                                  </p>

                                  <p className="text-sm text-gray-600">
                                    ₹
                                    {Number(
                                      invoice.total_amount
                                    ).toFixed(2)}
                                  </p>
                                </div>

                                <span className="text-sm font-semibold">
                                  {
                                    invoice.payment_status
                                  }
                                </span>
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