'use client';

import { useEffect, useState } from 'react';

import Header from '@/components/Header';

import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
} from 'lucide-react';

interface Medicine {
  id?: string;

  name: string;

  description?: string;

  sku?: string;

  barcode?: string;

  category?: string;

  gst?: number;

  hsn_code?: string;

  unit_price: number;

  cost_price?: number;

  reorder_level: number;

  supplier_id?: string;

  is_active: boolean;
}

const initialForm: Medicine = {
  name: '',

  description: '',

  sku: '',

  barcode: '',

  category: '',

  gst: 0,

  hsn_code: '',

  unit_price: 0,

  cost_price: 0,

  reorder_level: 10,

  supplier_id: '',

  is_active: true,
};

export default function PharmacyProductsPage() {
  const [medicines, setMedicines] = useState<
    Medicine[]
  >([]);

  const [loading, setLoading] =
    useState(false);

  const [search, setSearch] = useState('');

  const [openModal, setOpenModal] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [formData, setFormData] =
    useState<Medicine>(initialForm);

  // ================= FETCH =================
  const fetchMedicines = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        '/api/pharmacy/products'
      );

      const data = await response.json();

      setMedicines(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  // ================= CHANGE =================
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,

      [name]:
        name === 'unit_price' ||
        name === 'cost_price' ||
        name === 'reorder_level' ||
        name === 'gst'
          ? Number(value)
          : value,
    }));
  };

  // ================= SAVE =================
  const handleSubmit = async () => {
    try {
      const method = editingId
        ? 'PUT'
        : 'POST';

      const response = await fetch(
        '/api/pharmacy/products',
        {
          method,

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            ...formData,

            id: editingId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Failed'
        );
      }

      await fetchMedicines();

      setOpenModal(false);

      setEditingId(null);

      setFormData(initialForm);
    } catch (error) {
      console.error(error);
    }
  };

  // ================= EDIT =================
  const handleEdit = (
    medicine: Medicine
  ) => {
    setEditingId(medicine.id || null);

    setFormData(medicine);

    setOpenModal(true);
  };

  // ================= DELETE =================
  const handleDelete = async (
    id?: string
  ) => {
    if (!id) return;

    const confirmDelete = confirm(
      'Delete this product?'
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `/api/pharmacy/products?id=${id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error(
          'Delete failed'
        );
      }

      await fetchMedicines();
    } catch (error) {
      console.error(error);
    }
  };

  // ================= FILTER =================
  const filteredMedicines =
    medicines.filter((medicine) =>
      medicine.name
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main className="p-4 md:p-6">
        {/* TOP */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Pharmacy Products
            </h1>

            <p className="text-sm text-gray-500">
              Manage medicine inventory
            </p>
          </div>

          <button
            onClick={() => {
              setEditingId(null);

              setFormData(initialForm);

              setOpenModal(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-white"
          >
            <Plus size={18} />
            Add Product
          </button>
        </div>

        {/* SEARCH */}
        <div className="mb-6 rounded-2xl bg-white p-4 shadow">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-3 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full rounded-xl border py-3 pl-10 pr-4"
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-2xl bg-white shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-4 text-left">
                    Name
                  </th>

                  <th className="px-4 py-4 text-left">
                    SKU
                  </th>

                  <th className="px-4 py-4 text-left">
                    Category
                  </th>

                  <th className="px-4 py-4 text-left">
                    GST
                  </th>

                  <th className="px-4 py-4 text-left">
                    Price
                  </th>

                  <th className="px-4 py-4 text-left">
                    Reorder
                  </th>

                  <th className="px-4 py-4 text-left">
                    Status
                  </th>

                  <th className="px-4 py-4 text-center">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredMedicines.map(
                  (medicine) => (
                    <tr
                      key={medicine.id}
                      className="border-t"
                    >
                      <td className="px-4 py-4">
                        {medicine.name}
                      </td>

                      <td className="px-4 py-4">
                        {medicine.sku}
                      </td>

                      <td className="px-4 py-4">
                        {medicine.category}
                      </td>

                      <td className="px-4 py-4">
                        {medicine.gst}%
                      </td>

                      <td className="px-4 py-4">
                        ₹
                        {medicine.unit_price}
                      </td>

                      <td className="px-4 py-4">
                        {
                          medicine.reorder_level
                        }
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs ${
                            medicine.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {medicine.is_active
                            ? 'Active'
                            : 'Inactive'}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() =>
                              handleEdit(
                                medicine
                              )
                            }
                            className="rounded-lg bg-blue-100 p-2 text-blue-700"
                          >
                            <Edit size={16} />
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(
                                medicine.id
                              )
                            }
                            className="rounded-lg bg-red-100 p-2 text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL */}
        {openModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-3xl rounded-2xl bg-white p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {editingId
                    ? 'Edit Product'
                    : 'Add Product'}
                </h2>

                <button
                  onClick={() =>
                    setOpenModal(false)
                  }
                >
                  <X />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  value={formData.name}
                  onChange={handleChange}
                  className="rounded-xl border p-3"
                />

                <input
                  type="text"
                  name="sku"
                  placeholder="SKU"
                  value={formData.sku || ''}
                  onChange={handleChange}
                  className="rounded-xl border p-3"
                />

                <input
                  type="text"
                  name="barcode"
                  placeholder="Barcode"
                  value={
                    formData.barcode || ''
                  }
                  onChange={handleChange}
                  className="rounded-xl border p-3"
                />

                <input
                  type="text"
                  name="category"
                  placeholder="Category"
                  value={
                    formData.category || ''
                  }
                  onChange={handleChange}
                  className="rounded-xl border p-3"
                />

                <input
                  type="number"
                  name="gst"
                  placeholder="GST %"
                  value={formData.gst || 0}
                  onChange={handleChange}
                  className="rounded-xl border p-3"
                />

                <input
                  type="text"
                  name="hsn_code"
                  placeholder="HSN Code"
                  value={
                    formData.hsn_code || ''
                  }
                  onChange={handleChange}
                  className="rounded-xl border p-3"
                />

                <input
                  type="number"
                  name="unit_price"
                  placeholder="Unit Price"
                  value={
                    formData.unit_price || 0
                  }
                  onChange={handleChange}
                  className="rounded-xl border p-3"
                />

                <input
                  type="number"
                  name="cost_price"
                  placeholder="Cost Price"
                  value={
                    formData.cost_price || 0
                  }
                  onChange={handleChange}
                  className="rounded-xl border p-3"
                />

                <input
                  type="number"
                  name="reorder_level"
                  placeholder="Reorder Level"
                  value={
                    formData.reorder_level ||
                    10
                  }
                  onChange={handleChange}
                  className="rounded-xl border p-3"
                />

                <select
                  name="is_active"
                  value={
                    formData.is_active
                      ? 'true'
                      : 'false'
                  }
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_active:
                        e.target.value ===
                        'true',
                    }))
                  }
                  className="rounded-xl border p-3"
                >
                  <option value="true">
                    Active
                  </option>

                  <option value="false">
                    Inactive
                  </option>
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() =>
                    setOpenModal(false)
                  }
                  className="rounded-xl border px-5 py-3"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSubmit}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-white"
                >
                  {editingId
                    ? 'Update Product'
                    : 'Save Product'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}