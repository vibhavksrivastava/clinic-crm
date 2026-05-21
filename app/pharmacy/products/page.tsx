'use client';

import { useEffect, useMemo, useState } from 'react';

import Header from '@/components/Header';

import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Package2,
  Pill,
  BadgeIndianRupee,
  AlertTriangle,
  Boxes,
  Activity,
  ChevronRight,
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
  is_active: true,
};

export default function PharmacyProductsPage() {
  const [medicines, setMedicines] = useState<
    Medicine[]
  >([]);

  const [loading, setLoading] =
    useState(false);

  const [search, setSearch] =
    useState('');

  const [openModal, setOpenModal] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [saving, setSaving] =
    useState(false);

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
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<
          HTMLSelectElement
        >
      | React.ChangeEvent<HTMLTextAreaElement>
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
      setSaving(true);

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

      const data =
        await response.json();

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

      alert('Failed to save product');
    } finally {
      setSaving(false);
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

      alert('Failed to delete');
    }
  };

  // ================= FILTER =================

  const filteredMedicines =
    medicines.filter((medicine) => {
      const value =
        search.toLowerCase();

      return (
        medicine.name
          ?.toLowerCase()
          .includes(value) ||
        medicine.category
          ?.toLowerCase()
          .includes(value) ||
        medicine.sku
          ?.toLowerCase()
          .includes(value)
      );
    });

  // ================= STATS =================

  const stats = useMemo(() => {
    const totalProducts =
      medicines.length;

    const activeProducts =
      medicines.filter(
        (m) => m.is_active
      ).length;

    const lowStockProducts =
      medicines.filter(
        (m) =>
          Number(
            m.reorder_level || 0
          ) > 20
      ).length;

    const inventoryValue =
      medicines.reduce(
        (sum, item) =>
          sum +
          Number(
            item.cost_price || 0
          ),
        0
      );

    return {
      totalProducts,
      activeProducts,
      lowStockProducts,
      inventoryValue,
    };
  }, [medicines]);

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <Header />

      <main className="p-4 md:p-6">
        {/* TOP HERO */}

        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6 text-white shadow-2xl md:p-8">
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-indigo-400/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-4 flex items-center gap-2 text-sm text-blue-100">
                <span>
                  Pharmacy
                </span>

                <ChevronRight size={16} />

                <span>
                  Inventory
                </span>

                <ChevronRight size={16} />

                <span className="font-semibold text-white">
                  Products
                </span>
              </div>

              <h1 className="text-3xl font-bold md:text-5xl">
                Pharmacy Products
              </h1>

              <p className="mt-3 max-w-2xl text-sm text-blue-100 md:text-base">
                Advanced medicine
                inventory management
                with pricing, GST,
                stock control and
                product lifecycle
                tracking.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingId(null);

                setFormData(initialForm);

                setOpenModal(true);
              }}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 font-semibold text-slate-900 shadow-xl transition hover:scale-[1.02]"
            >
              <Plus size={20} />

              Add New Product
            </button>
          </div>
        </div>

        {/* STATS */}

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Total Products
                </p>

                <h3 className="mt-2 text-3xl font-bold text-gray-900">
                  {
                    stats.totalProducts
                  }
                </h3>
              </div>

              <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                <Boxes size={24} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Active Products
                </p>

                <h3 className="mt-2 text-3xl font-bold text-emerald-600">
                  {
                    stats.activeProducts
                  }
                </h3>
              </div>

              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <Activity size={24} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Reorder Alerts
                </p>

                <h3 className="mt-2 text-3xl font-bold text-orange-500">
                  {
                    stats.lowStockProducts
                  }
                </h3>
              </div>

              <div className="rounded-2xl bg-orange-100 p-3 text-orange-700">
                <AlertTriangle
                  size={24}
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Inventory Value
                </p>

                <h3 className="mt-2 text-3xl font-bold text-violet-600">
                  ₹
                  {stats.inventoryValue.toFixed(
                    0
                  )}
                </h3>
              </div>

              <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
                <BadgeIndianRupee
                  size={24}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH + FILTER */}

        <div className="mt-6 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-xl">
              <Search
                size={20}
                className="absolute left-4 top-4 text-gray-400"
              />

              <input
                type="text"
                placeholder="Search by product name, category or SKU..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-12 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700">
                {
                  filteredMedicines.length
                }{' '}
                Products
              </div>

              <div className="rounded-2xl bg-emerald-100 px-4 py-3 text-sm font-medium text-emerald-700">
                Live Inventory
              </div>
            </div>
          </div>
        </div>

        {/* TABLE */}

        <div className="mt-6 overflow-hidden rounded-[32px] bg-white shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Product Catalog
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Manage medicine
                pricing, GST,
                reorder levels and
                availability
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr className="text-sm text-slate-600">
                  <th className="px-6 py-4 text-left font-semibold">
                    Product
                  </th>

                  <th className="px-6 py-4 text-left font-semibold">
                    Category
                  </th>

                  <th className="px-6 py-4 text-left font-semibold">
                    SKU / HSN
                  </th>

                  <th className="px-6 py-4 text-left font-semibold">
                    Pricing
                  </th>

                  <th className="px-6 py-4 text-left font-semibold">
                    GST
                  </th>

                  <th className="px-6 py-4 text-left font-semibold">
                    Reorder
                  </th>

                  <th className="px-6 py-4 text-left font-semibold">
                    Status
                  </th>

                  <th className="px-6 py-4 text-center font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-16 text-center text-gray-500"
                    >
                      Loading
                      products...
                    </td>
                  </tr>
                ) : filteredMedicines.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-16 text-center"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div className="mb-4 rounded-full bg-slate-100 p-5">
                          <Package2
                            size={36}
                            className="text-slate-500"
                          />
                        </div>

                        <h3 className="text-lg font-semibold text-gray-800">
                          No Products
                          Found
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          Add your
                          first pharmacy
                          product to
                          begin inventory
                          management
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMedicines.map(
                    (medicine) => (
                      <tr
                        key={
                          medicine.id
                        }
                        className="border-t border-gray-100 transition hover:bg-blue-50/40"
                      >
                        {/* PRODUCT */}

                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                              <Pill
                                size={22}
                              />
                            </div>

                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {
                                  medicine.name
                                }
                              </h3>

                              <p className="mt-1 max-w-xs text-xs text-gray-500">
                                {medicine.description ||
                                  'No description'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* CATEGORY */}

                        <td className="px-6 py-5">
                          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                            {medicine.category ||
                              'General'}
                          </span>
                        </td>

                        {/* SKU */}

                        <td className="px-6 py-5">
                          <div className="space-y-1">
                            <div className="font-medium text-gray-800">
                              {medicine.sku ||
                                '--'}
                            </div>

                            <div className="text-xs text-gray-500">
                              HSN:{' '}
                              {medicine.hsn_code ||
                                '--'}
                            </div>
                          </div>
                        </td>

                        {/* PRICE */}

                        <td className="px-6 py-5">
                          <div className="space-y-1">
                            <div className="font-bold text-gray-900">
                              ₹
                              {
                                medicine.unit_price
                              }
                            </div>

                            <div className="text-xs text-gray-500">
                              Cost ₹
                              {medicine.cost_price ||
                                0}
                            </div>
                          </div>
                        </td>

                        {/* GST */}

                        <td className="px-6 py-5">
                          <span className="rounded-xl bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700">
                            {
                              medicine.gst
                            }
                            %
                          </span>
                        </td>

                        {/* REORDER */}

                        <td className="px-6 py-5">
                          <div
                            className={`inline-flex rounded-xl px-3 py-2 text-xs font-semibold ${
                              Number(
                                medicine.reorder_level
                              ) > 20
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {
                              medicine.reorder_level
                            }{' '}
                            Units
                          </div>
                        </td>

                        {/* STATUS */}

                        <td className="px-6 py-5">
                          <span
                            className={`rounded-full px-4 py-2 text-xs font-semibold ${
                              medicine.is_active
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {medicine.is_active
                              ? 'Active'
                              : 'Inactive'}
                          </span>
                        </td>

                        {/* ACTIONS */}

                        <td className="px-6 py-5">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() =>
                                handleEdit(
                                  medicine
                                )
                              }
                              className="rounded-2xl bg-blue-100 p-3 text-blue-700 transition hover:scale-105 hover:bg-blue-200"
                            >
                              <Edit
                                size={18}
                              />
                            </button>

                            <button
                              onClick={() =>
                                handleDelete(
                                  medicine.id
                                )
                              }
                              className="rounded-2xl bg-red-100 p-3 text-red-700 transition hover:scale-105 hover:bg-red-200"
                            >
                              <Trash2
                                size={18}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL */}

        {openModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-[32px] bg-white shadow-2xl">
              {/* HEADER */}

              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-8 py-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingId
                      ? 'Edit Product'
                      : 'Create Product'}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Manage pharmacy
                    inventory product
                    details
                  </p>
                </div>

                <button
                  onClick={() =>
                    setOpenModal(false)
                  }
                  className="rounded-2xl bg-slate-100 p-3 transition hover:bg-slate-200"
                >
                  <X size={20} />
                </button>
              </div>

              {/* BODY */}

              <div className="grid grid-cols-1 gap-8 p-8 lg:grid-cols-2">
                {/* LEFT */}

                <div className="space-y-5">
                  <div className="rounded-3xl border border-gray-100 bg-slate-50 p-6">
                    <h3 className="mb-5 text-lg font-bold text-gray-900">
                      Product Details
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Product Name
                        </label>

                        <input
                          type="text"
                          name="name"
                          value={
                            formData.name
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="Enter medicine name"
                          className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Description
                        </label>

                        <textarea
                          name="description"
                          value={
                            formData.description ||
                            ''
                          }
                          onChange={
                            handleChange
                          }
                          rows={4}
                          placeholder="Enter product description"
                          className="w-full rounded-2xl border border-gray-200 bg-white p-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-gray-700">
                            Category
                          </label>

                          <input
                            type="text"
                            name="category"
                            value={
                              formData.category ||
                              ''
                            }
                            onChange={
                              handleChange
                            }
                            placeholder="Tablet"
                            className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-semibold text-gray-700">
                            Barcode
                          </label>

                          <input
                            type="text"
                            name="barcode"
                            value={
                              formData.barcode ||
                              ''
                            }
                            onChange={
                              handleChange
                            }
                            placeholder="Barcode"
                            className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT */}

                <div className="space-y-5">
                  <div className="rounded-3xl border border-gray-100 bg-slate-50 p-6">
                    <h3 className="mb-5 text-lg font-bold text-gray-900">
                      Pricing & Tax
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          SKU
                        </label>

                        <input
                          type="text"
                          name="sku"
                          value={
                            formData.sku ||
                            ''
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="SKU"
                          className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          HSN Code
                        </label>

                        <input
                          type="text"
                          name="hsn_code"
                          value={
                            formData.hsn_code ||
                            ''
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="HSN"
                          className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Selling Price
                        </label>

                        <input
                          type="number"
                          name="unit_price"
                          value={
                            formData.unit_price
                          }
                          onChange={
                            handleChange
                          }
                          className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Cost Price
                        </label>

                        <input
                          type="number"
                          name="cost_price"
                          value={
                            formData.cost_price ||
                            0
                          }
                          onChange={
                            handleChange
                          }
                          className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          GST %
                        </label>

                        <input
                          type="number"
                          name="gst"
                          value={
                            formData.gst ||
                            0
                          }
                          onChange={
                            handleChange
                          }
                          className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Reorder Level
                        </label>

                        <input
                          type="number"
                          name="reorder_level"
                          value={
                            formData.reorder_level
                          }
                          onChange={
                            handleChange
                          }
                          className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    <div className="mt-5">
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Product Status
                      </label>

                      <select
                        name="is_active"
                        value={
                          formData.is_active
                            ? 'true'
                            : 'false'
                        }
                        onChange={(e) =>
                          setFormData(
                            (
                              prev
                            ) => ({
                              ...prev,
                              is_active:
                                e.target
                                  .value ===
                                'true',
                            })
                          )
                        }
                        className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="true">
                          Active
                        </option>

                        <option value="false">
                          Inactive
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* PREVIEW */}

                  <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-blue-100">
                          Preview
                        </p>

                        <h3 className="mt-2 text-2xl font-bold">
                          {formData.name ||
                            'Product Name'}
                        </h3>

                        <p className="mt-1 text-sm text-blue-100">
                          {formData.category ||
                            'Category'}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white/20 p-3">
                        <Pill
                          size={28}
                        />
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-4">
                      <div className="rounded-2xl bg-white/10 p-4">
                        <div className="text-xs text-blue-100">
                          Price
                        </div>

                        <div className="mt-1 text-lg font-bold">
                          ₹
                          {
                            formData.unit_price
                          }
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white/10 p-4">
                        <div className="text-xs text-blue-100">
                          GST
                        </div>

                        <div className="mt-1 text-lg font-bold">
                          {formData.gst}%
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white/10 p-4">
                        <div className="text-xs text-blue-100">
                          Reorder
                        </div>

                        <div className="mt-1 text-lg font-bold">
                          {
                            formData.reorder_level
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER */}

              <div className="sticky bottom-0 flex items-center justify-end gap-4 border-t border-gray-100 bg-white px-8 py-6">
                <button
                  onClick={() =>
                    setOpenModal(false)
                  }
                  className="rounded-2xl border border-gray-200 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? 'Saving Product...'
                    : editingId
                    ? 'Update Product'
                    : 'Create Product'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}