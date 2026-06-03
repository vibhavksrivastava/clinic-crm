'use client';

import Header from '@/components/Header';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import {
  Search,
  ShoppingCart,
  User,
  Phone,
  Mail,
  MapPin,
  Plus,
  Minus,
  Trash2,
  Receipt,
  CreditCard,
  Wallet,
  Smartphone,
  Package,
  Calendar,
  BadgeIndianRupee,
  FileText,
  Pill,
  Loader2,
  RefreshCcw,
  Link,
  PackageCheck,
} from 'lucide-react';

type Product = {
  id: string;
  product_id: string;
  batch_number: string;
  expiry_date: string;
  stock_quantity: number;
  selling_price: number;
  pharmacy_products?: {
    name: string;
    gst?: number;
    category?: string;
  };
};

type CartItem = {
  inventory_id: string;
  product_id: string;
  product_name: string;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  stock_quantity: number;
  unit_price: number;
  gst_percent: number;
  total_amount: number;
};

type PaymentMethod =
  | 'cash'
  | 'upi'
  | 'card';

export default function CreateSalePage() {
  const router = useRouter();

  const [products, setProducts] =
    useState<Product[]>([]);

  const [search, setSearch] =
    useState('');

  const [cart, setCart] = useState<
    CartItem[]
  >([]);

  const [saving, setSaving] =
    useState(false);

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('cash');

  // CUSTOMER DETAILS
  const [customerName, setCustomerName] =
    useState('');

  const [customerPhone, setCustomerPhone] =
    useState('');

  const [customerEmail, setCustomerEmail] =
    useState('');

  const [customerAddress, setCustomerAddress] =
    useState('');

  const [doctorName, setDoctorName] =
    useState('');

  const [notes, setNotes] = useState('');

  // ================= FETCH PRODUCTS =================
  const fetchProducts = async () => {
    try {
      const response = await fetch(
        '/api/pharmacy/inventory'
      );

      const data = await response.json();

      setProducts(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ================= FILTER PRODUCTS =================
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const query =
        search.toLowerCase();

      return (
        product.pharmacy_products?.name
          ?.toLowerCase()
          .includes(query) ||
        product.batch_number
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [products, search]);

  // ================= ADD TO CART =================
  const addToCart = (
    product: Product
  ) => {
    const existing = cart.find(
      (item) =>
        item.inventory_id === product.id
    );

    const available =
      Number(
        product.stock_quantity || 0
      );

    if (
      existing &&
      existing.quantity >= available
    ) {
      alert('Maximum stock reached');
      return;
    }

    if (existing) {
      setCart((prev) =>
        prev.map((item) =>
          item.inventory_id === product.id
            ? {
                ...item,
                quantity:
                  item.quantity + 1,
                total_amount:
                  (item.quantity + 1) *
                  item.unit_price,
              }
            : item
        )
      );
    } else {
      setCart((prev) => [
        ...prev,
        {
          inventory_id: product.id,
          product_id:
            product.product_id,
          product_name:
            product
              .pharmacy_products
              ?.name || '',
          batch_number:
            product.batch_number,
          expiry_date:
            product.expiry_date,
          quantity: 1,
          stock_quantity:
            product.stock_quantity,
          unit_price:
            product.selling_price,
          gst_percent:
            product
              .pharmacy_products
              ?.gst || 0,
          total_amount:
            product.selling_price,
        },
      ]);
    }
  };

  // ================= UPDATE QTY =================
  const updateQty = (
    index: number,
    qty: number
  ) => {
    const item = cart[index];

    if (
      qty < 1 ||
      qty > item.stock_quantity
    ) {
      return;
    }

    setCart((prev) =>
      prev.map((x, i) =>
        i === index
          ? {
              ...x,
              quantity: qty,
              total_amount:
                qty * x.unit_price,
            }
          : x
      )
    );
  };

  // ================= REMOVE ITEM =================
  const removeItem = (
    index: number
  ) => {
    setCart((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  // ================= TOTALS =================
  const {
    subtotal,
    gstAmount,
    grandTotal,
    totalItems,
  } = useMemo(() => {
    const subtotal = cart.reduce(
      (sum, item) =>
        sum +
        Number(item.total_amount || 0),
      0
    );

    const gstAmount = cart.reduce(
      (sum, item) =>
        sum +
        (Number(
          item.total_amount || 0
        ) *
          Number(
            item.gst_percent || 0
          )) /
          100,
      0
    );

    const totalItems = cart.reduce(
      (sum, item) =>
        sum + item.quantity,
      0
    );

    return {
      subtotal,
      gstAmount,
      grandTotal:
        subtotal + gstAmount,
      totalItems,
    };
  }, [cart]);

  // ================= SAVE =================
  const handleSave = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        '/api/pharmacy/sales/create',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            items: cart,

            subtotal,

            gst_amount: gstAmount,

            total_amount:
              grandTotal,

            discount_amount: 0,

            payment_method:
              paymentMethod,

            customer: {
              name: customerName,
              phone:
                customerPhone,
              email:
                customerEmail,
              address:
                customerAddress,
            },

            doctor_name:
              doctorName,

            notes,
          }),
        }
      );

      const data =
        await response.json();
      console.log('Create response:', data);
      if (!response.ok) {
        throw new Error(
          data.error ||
            'Failed to create invoice'
        );
      }

            if (!data?.sale?.id) {
        console.error('Sale ID missing', data);
        return;
      }

      router.push(
        `/pharmacy/sales/${data.sale.id}/view`
      );
    } catch (error) {
      console.error(error);

      alert(
        'Failed to create invoice'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">

      <main className="max-w-7xl mx-auto px-4 py-8">


        {/* ================= HEADER ================= */}
                {/* HERO */}      

        {/* PAGE HEADER */}
        <div className="mb-6 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                  <Receipt size={24} />
                </div>

                <div>
                  <h1 className="text-3xl font-bold">
                    Create Sales Invoice
                  </h1>

                  <p className="mt-1 text-sm text-blue-100">
                    Generate pharmacy
                    invoice and manage
                    billing professionally
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                <p className="text-xs text-blue-100">
                  Items
                </p>

                <h3 className="mt-1 text-2xl font-bold">
                  {totalItems}
                </h3>
              </div>

              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                <p className="text-xs text-blue-100">
                  Products
                </p>

                <h3 className="mt-1 text-2xl font-bold">
                  {
                    filteredProducts.length
                  }
                </h3>
              </div>

              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                <p className="text-xs text-blue-100">
                  Total
                </p>

                <h3 className="mt-1 text-2xl font-bold">
                  ₹
                  {grandTotal.toFixed(
                    0
                  )}
                </h3>
              </div>
            </div>
          </div>
        </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/pharmacy"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Back
            </Link>
          </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_430px]">
          {/* LEFT SIDE */}
          <div className="space-y-6">
            {/* CUSTOMER DETAILS */}
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                    <User size={20} />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">
                      Customer / Patient
                      Details
                    </h2>

                    <p className="text-sm text-slate-500">
                      Optional patient
                      information
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Customer Name
                  </label>

                  <div className="relative">
                    <User
                      size={16}
                      className="absolute left-3 top-3.5 text-slate-400"
                    />

                    <input
                      type="text"
                      value={
                        customerName
                      }
                      onChange={(e) =>
                        setCustomerName(
                          e.target.value
                        )
                      }
                      placeholder="Enter customer name"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 outline-none transition focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Phone Number
                  </label>

                  <div className="relative">
                    <Phone
                      size={16}
                      className="absolute left-3 top-3.5 text-slate-400"
                    />

                    <input
                      type="text"
                      value={
                        customerPhone
                      }
                      onChange={(e) =>
                        setCustomerPhone(
                          e.target.value
                        )
                      }
                      placeholder="Mobile number"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 outline-none transition focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email
                  </label>

                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3 top-3.5 text-slate-400"
                    />

                    <input
                      type="email"
                      value={
                        customerEmail
                      }
                      onChange={(e) =>
                        setCustomerEmail(
                          e.target.value
                        )
                      }
                      placeholder="Email address"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 outline-none transition focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Doctor Name
                  </label>

                  <div className="relative">
                    <Pill
                      size={16}
                      className="absolute left-3 top-3.5 text-slate-400"
                    />

                    <input
                      type="text"
                      value={
                        doctorName
                      }
                      onChange={(e) =>
                        setDoctorName(
                          e.target.value
                        )
                      }
                      placeholder="Referring doctor"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 outline-none transition focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Address
                  </label>

                  <div className="relative">
                    <MapPin
                      size={16}
                      className="absolute left-3 top-3.5 text-slate-400"
                    />

                    <textarea
                      rows={2}
                      value={
                        customerAddress
                      }
                      onChange={(e) =>
                        setCustomerAddress(
                          e.target.value
                        )
                      }
                      placeholder="Customer address"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 outline-none transition focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* PRODUCT SECTION */}
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                      <Package size={20} />
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold text-slate-800">
                        Medicines &
                        Inventory
                      </h2>

                      <p className="text-sm text-slate-500">
                        Select products to
                        create invoice
                      </p>
                    </div>
                  </div>

                  <div className="relative w-full lg:w-80">
                    <Search
                      size={18}
                      className="absolute left-3 top-3.5 text-slate-400"
                    />

                    <input
                      type="text"
                      value={search}
                      onChange={(e) =>
                        setSearch(
                          e.target.value
                        )
                      }
                      placeholder="Search medicines..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 outline-none transition focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map(
                  (product) => {
                    const cartItem =
                      cart.find(
                        (item) =>
                          item.inventory_id ===
                          product.id
                      );

                    const outOfStock =
                      Number(
                        product.stock_quantity
                      ) <= 0;

                    return (
                      <div
                        key={product.id}
                        className={`rounded-3xl border p-4 transition-all ${
                          cartItem
                            ? 'border-blue-300 bg-blue-50'
                            : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md'
                        }`}
                      >
                        <div className="mb-4 flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-800">
                              {
                                product
                                  .pharmacy_products
                                  ?.name
                              }
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                              Batch:{' '}
                              {
                                product.batch_number
                              }
                            </p>
                          </div>

                          {cartItem && (
                            <div className="rounded-full bg-blue-600 px-2 py-1 text-xs font-bold text-white">
                              {
                                cartItem.quantity
                              }
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            Exp:{' '}
                            {
                              product.expiry_date
                            }
                          </div>

                          <div className="flex items-center gap-2">
                            <Package size={14} />
                            Stock:{' '}
                            {
                              product.stock_quantity
                            }
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <div>
                            <h3 className="text-2xl font-bold text-slate-800">
                              ₹
                              {
                                product.selling_price
                              }
                            </h3>

                            <p className="text-xs text-slate-500">
                              GST{' '}
                              {product
                                .pharmacy_products
                                ?.gst || 0}
                              %
                            </p>
                          </div>

                          <button
                            onClick={() =>
                              addToCart(
                                product
                              )
                            }
                            disabled={
                              outOfStock
                            }
                            className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                              outOfStock
                                ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            <Plus size={16} />
                            Add
                          </button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="sticky top-4 h-fit">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              {/* HEADER */}
              <div className="border-b border-slate-100 bg-slate-50 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-orange-100 p-3 text-orange-700">
                      <ShoppingCart size={20} />
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold text-slate-800">
                        Billing Cart
                      </h2>

                      <p className="text-sm text-slate-500">
                        {cart.length} items
                        added
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CART */}
              <div className="max-h-[420px] overflow-y-auto p-5">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <ShoppingCart
                      size={48}
                      className="mb-4 text-slate-300"
                    />

                    <h3 className="font-semibold text-slate-700">
                      Cart is empty
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Add medicines to
                      create invoice
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map(
                      (item, index) => (
                        <div
                          key={index}
                          className="rounded-2xl border border-slate-200 p-4"
                        >
                          <div className="mb-3 flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-slate-800">
                                {
                                  item.product_name
                                }
                              </h3>

                              <p className="text-xs text-slate-500">
                                Batch:{' '}
                                {
                                  item.batch_number
                                }
                              </p>
                            </div>

                            <button
                              onClick={() =>
                                removeItem(
                                  index
                                )
                              }
                              className="rounded-xl bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                            >
                              <Trash2
                                size={15}
                              />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  updateQty(
                                    index,
                                    item.quantity -
                                      1
                                  )
                                }
                                className="rounded-xl border border-slate-200 p-2 hover:bg-slate-100"
                              >
                                <Minus
                                  size={14}
                                />
                              </button>

                              <div className="w-12 rounded-xl border border-slate-200 bg-slate-50 py-2 text-center font-semibold">
                                {
                                  item.quantity
                                }
                              </div>

                              <button
                                onClick={() =>
                                  updateQty(
                                    index,
                                    item.quantity +
                                      1
                                  )
                                }
                                className="rounded-xl border border-slate-200 p-2 hover:bg-slate-100"
                              >
                                <Plus
                                  size={14}
                                />
                              </button>
                            </div>

                            <div className="text-right">
                              <p className="text-xs text-slate-500">
                                ₹
                                {
                                  item.unit_price
                                }{' '}
                                ×{' '}
                                {
                                  item.quantity
                                }
                              </p>

                              <h3 className="font-bold text-slate-800">
                                ₹
                                {Number(
                                  item.total_amount
                                ).toFixed(
                                  2
                                )}
                              </h3>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* SUMMARY */}
              <div className="border-t border-slate-100 bg-slate-50 p-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                      Subtotal
                    </span>

                    <span className="font-medium">
                      ₹
                      {subtotal.toFixed(
                        2
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                      GST
                    </span>

                    <span className="font-medium">
                      ₹
                      {gstAmount.toFixed(
                        2
                      )}
                    </span>
                  </div>

                  <div className="border-t border-slate-200 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-slate-800">
                        Grand Total
                      </span>

                      <span className="text-2xl font-bold text-blue-700">
                        ₹
                        {grandTotal.toFixed(
                          2
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PAYMENT */}
              <div className="border-t border-slate-100 p-5">
                <label className="mb-3 block text-sm font-semibold text-slate-700">
                  Payment Method
                </label>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() =>
                      setPaymentMethod(
                        'cash'
                      )
                    }
                    className={`rounded-2xl border p-3 transition ${
                      paymentMethod ===
                      'cash'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Wallet
                      size={18}
                      className="mx-auto mb-1"
                    />

                    <p className="text-xs font-semibold">
                      Cash
                    </p>
                  </button>

                  <button
                    onClick={() =>
                      setPaymentMethod(
                        'upi'
                      )
                    }
                    className={`rounded-2xl border p-3 transition ${
                      paymentMethod ===
                      'upi'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Smartphone
                      size={18}
                      className="mx-auto mb-1"
                    />

                    <p className="text-xs font-semibold">
                      UPI
                    </p>
                  </button>

                  <button
                    onClick={() =>
                      setPaymentMethod(
                        'card'
                      )
                    }
                    className={`rounded-2xl border p-3 transition ${
                      paymentMethod ===
                      'card'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard
                      size={18}
                      className="mx-auto mb-1"
                    />

                    <p className="text-xs font-semibold">
                      Card
                    </p>
                  </button>
                </div>
              </div>

              {/* NOTES */}
              <div className="border-t border-slate-100 p-5">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Notes
                </label>

                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) =>
                    setNotes(
                      e.target.value
                    )
                  }
                  placeholder="Additional notes..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </div>

              {/* BUTTON */}
              <div className="border-t border-slate-100 p-5">
                <button
                  onClick={handleSave}
                  disabled={
                    saving ||
                    cart.length === 0
                  }
                  className={`flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-sm font-semibold transition ${
                    saving ||
                    cart.length === 0
                      ? 'cursor-not-allowed bg-slate-200 text-slate-500'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg hover:scale-[1.01]'
                  }`}
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Creating Invoice...
                    </>
                  ) : (
                    <>
                      <FileText
                        size={18}
                      />
                      Generate Invoice
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}