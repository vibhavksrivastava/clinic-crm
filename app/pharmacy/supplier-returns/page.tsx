'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Eye,
  Pencil,
  RefreshCcw,
  Plus,
} from 'lucide-react';

interface SupplierReturn {
  id: string;
  return_number: string;
  return_date: string;
  supplier_name: string;
  grn_number: string;
  total_amount: number;
  gst_amount: number;
  status: string;
}

export default function SupplierReturnsPage() {
  const [returns, setReturns] = useState<
    SupplierReturn[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState('');

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        '/api/pharmacy/supplier-returns'
      );

      const data = await res.json();

      setReturns(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReturns = useMemo(() => {
    return returns.filter((item) => {
      const q = search.toLowerCase();

      return (
        item.return_number
          ?.toLowerCase()
          .includes(q) ||
        item.supplier_name
          ?.toLowerCase()
          .includes(q) ||
        item.grn_number
          ?.toLowerCase()
          .includes(q)
      );
    });
  }, [returns, search]);

  const deleteReturn = async (
    id: string
  ) => {
    if (
      !confirm(
        'Delete supplier return?'
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        `/api/pharmacy/supplier-returns?id=${id}`,
        {
          method: 'DELETE',
        }
      );

      if (!res.ok) {
        const err =
          await res.json();

        alert(
          err.error ||
            'Failed to delete'
        );

        return;
      }

      fetchReturns();
    } catch (error) {
      console.error(error);
    }
  };

  const getStatusClass = (
    status: string
  ) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-700';

      case 'Cancelled':
        return 'bg-red-100 text-red-700';

      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <div className="space-y-6 p-6">

      {/* Header */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Supplier Returns
          </h1>

          <p className="text-sm text-gray-500">
            Manage supplier returns
          </p>
        </div>

        <button
          onClick={fetchReturns}
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2"
        >
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      {/* Search */}

      <div className="relative max-w-md">
        <Search
          size={18}
          className="absolute left-3 top-3 text-gray-400"
        />

        <input
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          placeholder="Search..."
          className="w-full rounded-lg border py-2 pl-10 pr-4"
        />
      </div>

      {/* Table */}

      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="overflow-x-auto">

          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">
                  Return No
                </th>

                <th className="p-3 text-left">
                  Date
                </th>

                <th className="p-3 text-left">
                  Supplier
                </th>

                <th className="p-3 text-left">
                  GRN No
                </th>

                <th className="p-3 text-right">
                  Amount
                </th>

                <th className="p-3 text-center">
                  Status
                </th>

                <th className="p-3 text-center">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-6 text-center"
                  >
                    Loading...
                  </td>
                </tr>
              ) : filteredReturns.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-6 text-center"
                  >
                    No supplier returns found
                  </td>
                </tr>
              ) : (
                filteredReturns.map(
                  (item) => (
                    <tr
                      key={item.id}
                      className="border-t"
                    >
                      <td className="p-3 font-medium">
                        {
                          item.return_number
                        }
                      </td>

                      <td className="p-3">
                        {new Date(
                          item.return_date
                        ).toLocaleDateString()}
                      </td>

                      <td className="p-3">
                        {
                          item.supplier_name
                        }
                      </td>

                      <td className="p-3">
                        {item.grn_number}
                      </td>

                      <td className="p-3 text-right">
                        ₹
                        {Number(
                          item.total_amount ||
                            0
                        ).toFixed(2)}
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/pharmacy/supplier-returns/${item.id}`}
                            className="rounded p-2 hover:bg-gray-100"
                          >
                            <Eye
                              size={16}
                            />
                          </Link>

                          <Link
                            href={`/pharmacy/supplier-returns/${item.id}/edit`}
                            className="rounded p-2 hover:bg-gray-100"
                          >
                            <Pencil
                              size={16}
                            />
                          </Link>

                          <button
                            onClick={() =>
                              deleteReturn(
                                item.id
                              )
                            }
                            className="rounded p-2 text-red-600 hover:bg-red-50"
                          >
                            Delete
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
    </div>
  );
}