'use client';

import Header from '@/components/Header';
import { useState } from 'react';

interface Item {
  product_id: string;
  name: string;
  search_text: string;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  purchase_price: number;
  gst: number;
}

export default function PurchasePage() {
  const [items, setItems] = useState<Item[]>([
    {
      product_id: '',
      name: '',
      search_text: '',
      batch_number: '',
      expiry_date: '',
      quantity: 1,
      purchase_price: 0,
      gst: 0,
    },
  ]);

  const [searchResults, setSearchResults] = useState<
    Record<number, any[]>
  >({});

  // 🔍 SEARCH PRODUCTS
  const searchProducts = async (
    searchText: string,
    index: number
  ) => {
    try {
      if (!searchText || searchText.length < 2) {
        setSearchResults((prev) => ({
          ...prev,
          [index]: [],
        }));

        return;
      }

      const res = await fetch(
        `/api/pharmacy/products?q=${encodeURIComponent(
          searchText
        )}`
      );

      const data = await res.json();

      setSearchResults((prev) => ({
        ...prev,
        [index]: Array.isArray(data) ? data : [],
      }));
    } catch (err) {
      console.error('Product search failed:', err);
    }
  };

  // ✅ UPDATE ITEM
  const updateItem = (
    index: number,
    field: keyof Item,
    value: any
  ) => {
    const updated = [...items];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setItems(updated);
  };

  // ✅ SELECT PRODUCT
  const selectProduct = (
    product: any,
    index: number
  ) => {
    const updated = [...items];

    updated[index] = {
      ...updated[index],
      product_id: product.id,
      name: product.name,
      search_text: product.name,
      purchase_price:
        product.cost_price ||
        product.unit_price ||
        0,
      gst: product.gst || 0,
    };

    setItems(updated);

    setSearchResults((prev) => ({
      ...prev,
      [index]: [],
    }));
  };

  // ➕ ADD ROW
  const addRow = () => {
    setItems([
      ...items,
      {
        product_id: '',
        name: '',
        search_text: '',
        batch_number: '',
        expiry_date: '',
        quantity: 1,
        purchase_price: 0,
        gst: 0,
      },
    ]);
  };

  // ❌ REMOVE ROW
  const removeRow = (index: number) => {
    const updated = items.filter(
      (_, i) => i !== index
    );

    setItems(updated);
  };

  // 🧮 TOTAL
  const calculateTotal = () => {
    return items.reduce((acc, item) => {
      const base =
        item.quantity * item.purchase_price;

      const gstAmt =
        (base * item.gst) / 100;

      return acc + base + gstAmt;
    }, 0);
  };

  // 💾 SAVE PURCHASE
  const submitPurchase = async () => {
    try {
      const res = await fetch(
        '/api/pharmacy/purchases',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ items }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error(data);

        alert(data.error || 'Save failed');

        return;
      }

      alert(
        'Purchase saved & stock updated successfully!'
      );

      setItems([
        {
          product_id: '',
          name: '',
          search_text: '',
          batch_number: '',
          expiry_date: '',
          quantity: 1,
          purchase_price: 0,
          gst: 0,
        },
      ]);

      setSearchResults({});
    } catch (err) {
      console.error(err);

      alert('Error saving purchase');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">
          Purchase Entry
        </h1>

        <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-3 text-left">
                  Product
                </th>

                <th className="p-3 text-left">
                  Batch
                </th>

                <th className="p-3 text-left">
                  Expiry
                </th>

                <th className="p-3 text-left">
                  Qty
                </th>

                <th className="p-3 text-left">
                  Price
                </th>

                <th className="p-3 text-left">
                  GST %
                </th>

                <th className="p-3 text-left">
                  Total
                </th>

                <th className="p-3 text-left">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {items.map((item, idx) => (
                <tr
                  key={idx}
                  className="border-b"
                >
                  {/* PRODUCT SEARCH */}
                  <td className="relative p-2">
                    <input
                      type="text"
                      value={item.search_text}
                      onChange={async (e) => {
                        const value =
                          e.target.value;

                        updateItem(
                          idx,
                          'search_text',
                          value
                        );

                        await searchProducts(
                          value,
                          idx
                        );
                      }}
                      placeholder="Search medicine..."
                      className="w-full border rounded-lg px-4 py-2"
                    />

                    {/* DROPDOWN */}
                    {searchResults[idx]?.length >
                      0 && (
                      <div className="absolute z-50 bg-white border rounded-lg shadow-lg w-full max-h-52 overflow-auto">
                        {searchResults[idx].map(
                          (p: any) => (
                            <div
                              key={p.id}
                              onClick={() =>
                                selectProduct(
                                  p,
                                  idx
                                )
                              }
                              className="p-3 hover:bg-gray-100 cursor-pointer border-b"
                            >
                              <div className="font-medium">
                                {p.name}
                              </div>

                              <div className="text-xs text-gray-500">
                                ₹
                                {p.cost_price ||
                                  p.unit_price ||
                                  0}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </td>

                  {/* BATCH */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.batch_number}
                      onChange={(e) =>
                        updateItem(
                          idx,
                          'batch_number',
                          e.target.value
                        )
                      }
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </td>

                  {/* EXPIRY */}
                  <td className="p-2">
                    <input
                      type="date"
                      value={item.expiry_date}
                      onChange={(e) =>
                        updateItem(
                          idx,
                          'expiry_date',
                          e.target.value
                        )
                      }
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </td>

                  {/* QTY */}
                  <td className="p-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          idx,
                          'quantity',
                          Number(e.target.value)
                        )
                      }
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </td>

                  {/* PRICE */}
                  <td className="p-2">
                    <input
                      type="number"
                      value={item.purchase_price}
                      onChange={(e) =>
                        updateItem(
                          idx,
                          'purchase_price',
                          Number(e.target.value)
                        )
                      }
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </td>

                  {/* GST */}
                  <td className="p-2">
                    <div className="px-3 py-2">
                      {item.gst}%
                    </div>
                  </td>

                  {/* TOTAL */}
                  <td className="p-2 font-semibold">
                    ₹
                    {(
                      item.quantity *
                      item.purchase_price *
                      (1 + item.gst / 100)
                    ).toFixed(2)}
                  </td>

                  {/* ACTION */}
                  <td className="p-2">
                    <button
                      onClick={() =>
                        removeRow(idx)
                      }
                      className="bg-red-500 text-white px-3 py-1 rounded"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* FOOTER */}
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={addRow}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg"
            >
              + Add Item
            </button>

            <div className="text-xl font-bold">
              Total: ₹
              {calculateTotal().toFixed(2)}
            </div>
          </div>

          {/* SAVE */}
          <button
            onClick={submitPurchase}
            className="mt-6 w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700"
          >
            Save Purchase & Update Stock
          </button>
        </div>
      </div>
    </div>
  );
}