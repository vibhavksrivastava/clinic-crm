'use client';

import Header from '@/components/Header';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboardUrl } from '@/lib/utils/dashboard';

interface Medicine {
  id: string;
  name: string;
  current_stock: number;
  selling_price?: number;
  mrp?: number;
  gst_percent?: number;
}

interface BillItem {
  medicine_id: string;
  medicine_name: string;
  qty: number;
  price: number;
  available_stock: number;
  suggestions: Medicine[];
  showSuggestions: boolean;
}

export default function BillingPage() {

  const router = useRouter();

  const [dashboardUrl] = useState<string>(
    getDashboardUrl()
  );

  const [inventory, setInventory] = useState<
    Medicine[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [generating, setGenerating] =
    useState(false);

  const [items, setItems] = useState<BillItem[]>([
    {
      medicine_id: '',
      medicine_name: '',
      qty: 1,
      price: 0,
      available_stock: 0,
      suggestions: [],
      showSuggestions: false,
    },
  ]);

  // Fetch inventory
  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/medicines');

      const data = await response.json();

      setInventory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(
        'Error fetching medicines:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // Search medicines
  const searchMedicines = (query: string) => {
    if (!query.trim()) return [];

    return inventory
      .filter((med) =>
        med.name
          .toLowerCase()
          .includes(query.toLowerCase())
      )
      .slice(0, 8);
  };

  // Handle medicine typing
  const handleMedicineInput = (
    index: number,
    value: string
  ) => {
    const updated = [...items];

    updated[index].medicine_name = value;

    updated[index].suggestions =
      searchMedicines(value);

    updated[index].showSuggestions = true;

    updated[index].medicine_id = '';

    updated[index].available_stock = 0;

    updated[index].price = 0;

    setItems(updated);
  };

  // Select medicine
  const selectMedicine = (
    index: number,
    medicine: Medicine
  ) => {
    const updated = [...items];

    updated[index] = {
      ...updated[index],
      medicine_id: medicine.id,
      medicine_name: medicine.name,
      qty: 1,
      price:
        medicine.selling_price ||
        medicine.mrp ||
        0,
      available_stock:
        medicine.current_stock,
      suggestions: [],
      showSuggestions: false,
    };

    setItems(updated);
  };

  // Quantity change
  const handleQtyChange = (
    index: number,
    qty: number
  ) => {
    const updated = [...items];

    if (qty > updated[index].available_stock) {
      alert(
        `Only ${updated[index].available_stock} items available in stock`
      );

      return;
    }

    updated[index].qty = qty;

    setItems(updated);
  };

  // Add item
  const addItem = () => {
    setItems([
      ...items,
      {
        medicine_id: '',
        medicine_name: '',
        qty: 1,
        price: 0,
        available_stock: 0,
        suggestions: [],
        showSuggestions: false,
      },
    ]);
  };

  // Remove item
  const removeItem = (index: number) => {
    if (items.length === 1) return;

    setItems(
      items.filter((_, idx) => idx !== index)
    );
  };

  // Totals
  const subtotal = useMemo(() => {
    return items.reduce(
      (sum, item) =>
        sum + item.qty * item.price,
      0
    );
  }, [items]);

  const gst = useMemo(() => {
    return subtotal * 0.05;
  }, [subtotal]);

  const grandTotal = subtotal + gst;

  // Generate Bill
  const generateBill = async () => {
    try {
      setGenerating(true);

      for (const item of items) {
        if (!item.medicine_id) {
          alert(
            'Please select valid medicine'
          );

          return;
        }

        if (
          item.qty > item.available_stock
        ) {
          alert(
            `Insufficient stock for ${item.medicine_name}`
          );

          return;
        }
      }

      // Update stock
      for (const item of items) {
        await fetch(
          '/api/medicines/update-stock',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              medicine_id:
                item.medicine_id,
              quantity_sold: item.qty,
            }),
          }
        );
      }

      alert(
        'Bill generated successfully'
      );

      fetchMedicines();

      // Reset
      setItems([
        {
          medicine_id: '',
          medicine_name: '',
          qty: 1,
          price: 0,
          available_stock: 0,
          suggestions: [],
          showSuggestions: false,
        },
      ]);
    } catch (error) {
      console.error(
        'Error generating bill:',
        error
      );

      alert('Failed to generate bill');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">

          <div>

            <button
              onClick={() =>
                router.push(dashboardUrl)
              }
              className="text-blue-600 hover:text-blue-900 font-semibold mb-2 flex items-center gap-2"
            >
              ← Back to Dashboard
            </button>

            <h1 className="text-4xl font-bold text-gray-900">
              Pharmacy Billing
            </h1>

            <p className="mt-2 text-gray-600">
              Generate pharmacy bills and
              automatically reduce medicine
              inventory stock
            </p>

          </div>

        </div>

        {/* Billing Card */}
        <div className="bg-white rounded-xl shadow border p-6">

          {loading ? (

            <div className="text-center py-10 text-gray-500">
              Loading medicines...
            </div>

          ) : (

            <>
              {/* Items */}
              <div className="space-y-6">

                {items.map((item, idx) => (

                  <div
                    key={idx}
                    className="border rounded-xl p-4 relative bg-gray-50"
                  >

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

                      {/* Medicine Search */}
                      <div className="relative md:col-span-2">

                        <label className="block text-sm font-semibold mb-2">
                          Medicine
                        </label>

                        <input
                          type="text"
                          value={
                            item.medicine_name
                          }
                          onChange={(e) =>
                            handleMedicineInput(
                              idx,
                              e.target.value
                            )
                          }
                          placeholder="Type medicine name..."
                          className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        {/* Suggestions */}
                        {item.showSuggestions &&
                          item.suggestions
                            .length > 0 && (

                            <div className="absolute z-20 bg-white border rounded-lg shadow-lg mt-1 w-full max-h-60 overflow-auto">

                              {item.suggestions.map(
                                (med) => (

                                  <button
                                    key={med.id}
                                    type="button"
                                    onClick={() =>
                                      selectMedicine(
                                        idx,
                                        med
                                      )
                                    }
                                    className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b"
                                  >

                                    <div className="font-medium text-gray-900">
                                      {med.name}
                                    </div>

                                    <div className="text-xs text-gray-500 mt-1">
                                      Stock:{' '}
                                      {
                                        med.current_stock
                                      }{' '}
                                      | Price: ₹
                                      {med.selling_price ||
                                        med.mrp ||
                                        0}
                                    </div>

                                  </button>

                                )
                              )}

                            </div>

                          )}

                      </div>

                      {/* Quantity */}
                      <div>

                        <label className="block text-sm font-semibold mb-2">
                          Quantity
                        </label>

                        <input
                          type="number"
                          min={1}
                          max={
                            item.available_stock
                          }
                          value={item.qty}
                          onChange={(e) =>
                            handleQtyChange(
                              idx,
                              Number(
                                e.target.value
                              )
                            )
                          }
                          className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <p className="text-xs text-gray-500 mt-1">
                          Available:{' '}
                          {
                            item.available_stock
                          }
                        </p>

                      </div>

                      {/* Price */}
                      <div>

                        <label className="block text-sm font-semibold mb-2">
                          Price
                        </label>

                        <input
                          type="number"
                          readOnly
                          value={item.price}
                          className="w-full border rounded-lg px-4 py-2 bg-gray-100"
                        />

                      </div>

                      {/* Total */}
                      <div>

                        <label className="block text-sm font-semibold mb-2">
                          Total
                        </label>

                        <div className="h-[42px] border rounded-lg px-4 flex items-center bg-white font-bold">
                          ₹
                          {(
                            item.qty *
                            item.price
                          ).toFixed(2)}
                        </div>

                      </div>

                    </div>

                    {/* Remove */}
                    {items.length > 1 && (

                      <button
                        onClick={() =>
                          removeItem(idx)
                        }
                        className="mt-4 text-red-600 hover:text-red-800 text-sm font-semibold"
                      >
                        Remove Item
                      </button>

                    )}

                  </div>

                ))}

              </div>

              {/* Footer */}
              <div className="mt-8 border-t pt-6">

                {/* Totals */}
                <div className="max-w-sm ml-auto space-y-3">

                  <div className="flex justify-between">
                    <span>Subtotal</span>

                    <span>
                      ₹
                      {subtotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>GST (5%)</span>

                    <span>
                      ₹{gst.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between text-xl font-bold border-t pt-3">
                    <span>Grand Total</span>

                    <span>
                      ₹
                      {grandTotal.toFixed(2)}
                    </span>
                  </div>

                </div>

                {/* Buttons */}
                <div className="mt-8 flex justify-between items-center">

                  <button
                    onClick={addItem}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold transition"
                  >
                    + Add Item
                  </button>

                  <button
                    onClick={generateBill}
                    disabled={generating}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-8 py-3 rounded-lg font-semibold transition"
                  >
                    {generating
                      ? 'Generating Bill...'
                      : 'Generate Bill'}
                  </button>

                </div>

              </div>

            </>

          )}

        </div>

      </div>

    </div>
  );
}