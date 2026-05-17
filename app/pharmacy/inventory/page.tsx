'use client';

import Header from '@/components/Header';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboardUrl } from '@/lib/utils/dashboard';
import {
  AlertTriangle,
  Package,
  Search,
  CalendarDays,
  IndianRupee,
} from 'lucide-react';

interface InventoryItem {
  id: string;

  batch_number?: string;

  expiry_date?: string;

  purchase_price?: number;

  selling_price?: number;

  stock_quantity: number;

  minimum_stock?: number;

  pharmacy_products?: {
    id: string;

    name: string;

    sku?: string;

    category?: string;

    gst_percent?: number;

    unit?: string;
  };
}

type FilterType =
  | 'all'
  | 'low_stock'
  | 'out_of_stock'
  | 'near_expiry';

export default function InventoryPage() {
  const router = useRouter();

  const [inventory, setInventory] = useState<
    InventoryItem[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');

  const [selectedFilter, setSelectedFilter] =
    useState<FilterType>('all');

  const dashboardUrl = getDashboardUrl();

  // ================= FETCH =================
  const fetchInventory = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        '/api/pharmacy/inventory'
      );

      const data = await response.json();

      setInventory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(
        'Error fetching inventory:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // ================= COUNTS =================
  const totalItems = inventory.length;

  const lowStockCount = inventory.filter(
    (item) =>
      item.stock_quantity > 0 &&
      item.stock_quantity <=
        (item.minimum_stock || 10)
  ).length;

  const outOfStockCount = inventory.filter(
    (item) => item.stock_quantity === 0
  ).length;

  const nearExpiryCount = inventory.filter((item) => {
    if (!item.expiry_date) return false;

    const expiryDate = new Date(item.expiry_date);

    const today = new Date();

    const diffDays =
      (expiryDate.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24);

    return diffDays <= 30;
  }).length;

  // ================= INVENTORY VALUE =================
  const inventoryValue = inventory.reduce(
    (sum, item) =>
      sum +
      (item.purchase_price || 0) *
        item.stock_quantity,
    0
  );

  // ================= FILTER =================
  const filteredInventory = useMemo(() => {
    let filtered = inventory;

    // Search
    filtered = filtered.filter((item) => {
      const productName =
        item.pharmacy_products?.name?.toLowerCase() ||
        '';

      const sku =
        item.pharmacy_products?.sku?.toLowerCase() ||
        '';

      const batch =
        item.batch_number?.toLowerCase() || '';

      return (
        productName.includes(search.toLowerCase()) ||
        sku.includes(search.toLowerCase()) ||
        batch.includes(search.toLowerCase())
      );
    });

    // Filter
    switch (selectedFilter) {
      case 'low_stock':
        return filtered.filter(
          (item) =>
            item.stock_quantity > 0 &&
            item.stock_quantity <=
              (item.minimum_stock || 10)
        );

      case 'out_of_stock':
        return filtered.filter(
          (item) => item.stock_quantity === 0
        );

      case 'near_expiry':
        return filtered.filter((item) => {
          if (!item.expiry_date) return false;

          const expiryDate = new Date(
            item.expiry_date
          );

          const today = new Date();

          const diffDays =
            (expiryDate.getTime() -
              today.getTime()) /
            (1000 * 60 * 60 * 24);

          return diffDays <= 30;
        });

      default:
        return filtered;
    }
  }, [inventory, selectedFilter, search]);

  // ================= CARD STYLE =================
  const getCardClass = (
    filter: FilterType,
    activeColor: string
  ) => {
    return `
      rounded-2xl border-2 p-5 shadow-sm cursor-pointer transition-all
      ${
        selectedFilter === filter
          ? `${activeColor} border-blue-600 scale-[1.02]`
          : 'bg-white border-transparent hover:border-gray-300'
      }
    `;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main className="p-4 md:p-6">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <button
              onClick={() =>
                router.push(dashboardUrl)
              }
              className="mb-3 text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              ← Back To Dashboard
            </button>

            <h1 className="text-3xl font-bold text-gray-900">
              Pharmacy Inventory
            </h1>

            <p className="mt-1 text-gray-500">
              Manage medicine batches, stock &
              expiry tracking
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
          {/* Total */}
          <div
            onClick={() =>
              setSelectedFilter('all')
            }
            className={getCardClass(
              'all',
              'bg-blue-50'
            )}
          >
            <div className="flex items-center justify-between">
              <Package className="text-blue-600" />

              <span className="text-xs text-gray-500">
                Total
              </span>
            </div>

            <h2 className="mt-4 text-3xl font-bold">
              {totalItems}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Inventory Items
            </p>
          </div>

          {/* Low Stock */}
          <div
            onClick={() =>
              setSelectedFilter('low_stock')
            }
            className={getCardClass(
              'low_stock',
              'bg-yellow-50'
            )}
          >
            <div className="flex items-center justify-between">
              <AlertTriangle className="text-yellow-600" />

              <span className="text-xs text-gray-500">
                Low Stock
              </span>
            </div>

            <h2 className="mt-4 text-3xl font-bold text-yellow-700">
              {lowStockCount}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Reorder Required
            </p>
          </div>

          {/* Out Of Stock */}
          <div
            onClick={() =>
              setSelectedFilter('out_of_stock')
            }
            className={getCardClass(
              'out_of_stock',
              'bg-red-50'
            )}
          >
            <div className="flex items-center justify-between">
              <Package className="text-red-600" />

              <span className="text-xs text-gray-500">
                Empty
              </span>
            </div>

            <h2 className="mt-4 text-3xl font-bold text-red-700">
              {outOfStockCount}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Out Of Stock
            </p>
          </div>

          {/* Near Expiry */}
          <div
            onClick={() =>
              setSelectedFilter('near_expiry')
            }
            className={getCardClass(
              'near_expiry',
              'bg-orange-50'
            )}
          >
            <div className="flex items-center justify-between">
              <CalendarDays className="text-orange-600" />

              <span className="text-xs text-gray-500">
                Expiry
              </span>
            </div>

            <h2 className="mt-4 text-3xl font-bold text-orange-700">
              {nearExpiryCount}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Expiring Soon
            </p>
          </div>

          {/* Inventory Value */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <IndianRupee className="text-green-600" />

              <span className="text-xs text-gray-500">
                Value
              </span>
            </div>

            <h2 className="mt-4 text-2xl font-bold text-green-700">
              ₹{inventoryValue.toFixed(2)}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Total Inventory Value
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-3 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search medicine, SKU or batch..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {loading ? (
            <div className="p-10 text-center text-gray-500">
              Loading inventory...
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              No inventory found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-4 text-left text-sm font-semibold">
                      Medicine
                    </th>

                    <th className="px-4 py-4 text-left text-sm font-semibold">
                      SKU
                    </th>

                    <th className="px-4 py-4 text-left text-sm font-semibold">
                      Batch
                    </th>

                    <th className="px-4 py-4 text-left text-sm font-semibold">
                      Expiry
                    </th>

                    <th className="px-4 py-4 text-left text-sm font-semibold">
                      Stock
                    </th>

                    <th className="px-4 py-4 text-left text-sm font-semibold">
                      Min Stock
                    </th>

                    <th className="px-4 py-4 text-left text-sm font-semibold">
                      Purchase
                    </th>

                    <th className="px-4 py-4 text-left text-sm font-semibold">
                      Selling
                    </th>

                    <th className="px-4 py-4 text-left text-sm font-semibold">
                      GST
                    </th>

                    <th className="px-4 py-4 text-left text-sm font-semibold">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredInventory.map((item) => {
                    const isLowStock =
                      item.stock_quantity > 0 &&
                      item.stock_quantity <=
                        (item.minimum_stock || 10);

                    const isOutOfStock =
                      item.stock_quantity === 0;

                    const isNearExpiry =
                      item.expiry_date
                        ? new Date(
                            item.expiry_date
                          ).getTime() -
                            new Date().getTime() <=
                          30 *
                            24 *
                            60 *
                            60 *
                            1000
                        : false;

                    return (
                      <tr
                        key={item.id}
                        className="border-t border-gray-100 hover:bg-gray-50"
                      >
                        {/* Medicine */}
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {
                                item
                                  .pharmacy_products
                                  ?.name
                              }
                            </p>

                            <p className="text-xs text-gray-500">
                              {
                                item
                                  .pharmacy_products
                                  ?.category
                              }
                            </p>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {
                            item.pharmacy_products
                              ?.sku
                          }
                        </td>

                        {/* Batch */}
                        <td className="px-4 py-4 text-sm font-medium text-gray-700">
                          {item.batch_number || '-'}
                        </td>

                        {/* Expiry */}
                        <td className="px-4 py-4 text-sm">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              isNearExpiry
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {item.expiry_date ||
                              '-'}
                          </span>
                        </td>

                        {/* Stock */}
                        <td
                          className={`px-4 py-4 text-sm font-bold ${
                            isOutOfStock
                              ? 'text-red-700'
                              : isLowStock
                              ? 'text-yellow-700'
                              : 'text-green-700'
                          }`}
                        >
                          {item.stock_quantity}
                        </td>

                        {/* Min */}
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {item.minimum_stock ||
                            10}
                        </td>

                        {/* Purchase */}
                        <td className="px-4 py-4 text-sm text-gray-700">
                          ₹
                          {item.purchase_price ||
                            0}
                        </td>

                        {/* Selling */}
                        <td className="px-4 py-4 text-sm text-gray-700">
                          ₹
                          {item.selling_price ||
                            0}
                        </td>

                        {/* GST */}
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {item.pharmacy_products
                            ?.gst_percent || 0}
                          %
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          {isOutOfStock ? (
                            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                              Out Of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                              Low Stock
                            </span>
                          ) : (
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                              Available
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}