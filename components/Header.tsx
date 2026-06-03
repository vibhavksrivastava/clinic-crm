'use client';

import Link from 'next/link';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  usePathname,
  useRouter,
} from 'next/navigation';

import {
  LayoutDashboard,
  Users,
  CalendarDays,
  ClipboardList,
  Receipt,
  Pill,
  ShoppingCart,
  Menu,
  X,
  Bell,
  Search,
  LogOut,
  ChevronDown,
  Activity,
  Package,
  UserCircle2,
  ShieldCheck,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: any;
}

export default function Header() {
  const router = useRouter();

  const pathname =
    usePathname();

  const [userName, setUserName] =
    useState('');

  const [userRole, setUserRole] =
    useState('');

  const [
    permissions,
    setPermissions,
  ] = useState<string[]>([]);

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  const [
    profileOpen,
    setProfileOpen,
  ] = useState(false);

  const [
    searchOpen,
    setSearchOpen,
  ] = useState(false);

  // -------------------------
  // LOAD USER
  // -------------------------

  useEffect(() => {
    if (
      typeof window ===
      'undefined'
    )
      return;

    const userStr =
      localStorage.getItem(
        'user'
      );

    if (!userStr) return;

    try {
      const user =
        JSON.parse(userStr);

      setUserName(
        user.first_name &&
          user.last_name
          ? `${user.first_name} ${user.last_name}`
          : user.name ||
              user.email ||
              ''
      );

      const role =
        user.roleType ||
        user.role ||
        '';

      setUserRole(role);

      setPermissions(
        user.permissions || []
      );
    } catch (err) {
      console.error(
        'User parse error',
        err
      );
    }
  }, []);

  // -------------------------
  // HELPERS
  // -------------------------

  const hasPermission = (
    permission: string
  ) =>
    permissions.includes(
      permission
    );

  const isActive = (
    href: string
  ) => {
    if (
      href === '/dashboard'
    ) {
      return (
        pathname === href
      );
    }

    return pathname.startsWith(
      href
    );
  };

  // -------------------------
  // LOGOUT
  // -------------------------

  const handleLogout =
    async () => {
      try {
        await fetch(
          '/api/auth/logout',
          {
            method: 'POST',
          }
        );
      } catch {}

      localStorage.removeItem(
        'user'
      );

      localStorage.removeItem(
        'authToken'
      );

      router.push(
        '/login'
      );
    };

  // -------------------------
  // DYNAMIC MENUS
  // -------------------------

  const navLinks:
    NavItem[] =
    useMemo(() => {
      const links:
        NavItem[] = [];

      // Dashboard

      links.push({
        href:
          '/dashboard',
        label:
          'Dashboard',
        icon:
          LayoutDashboard,
      });

      // Patients

      if (
        hasPermission(
          'manage_patients'
        ) ||
        hasPermission(
          'view_patients'
        )
      ) {
        links.push({
          href:
            '/patients',
          label:
            'Patients',
          icon: Users,
        });
      }

      // Appointments

      if (
        hasPermission(
          'manage_appointments'
        ) ||
        hasPermission(
          'view_appointments'
        )
      ) {
        links.push({
          href:
            '/appointments',
          label:
            'Appointments',
          icon:
            CalendarDays,
        });
      }

      // Walkins

      if (
        hasPermission(
          'manage_walkins'
        )
      ) {
        links.push({
          href:
            '/walk-ins',
          label:
            'Walk-ins',
          icon:
            Activity,
        });
      }

      // Prescriptions

      if (
        hasPermission(
          'view_prescriptions'
        ) ||
        hasPermission(
          'manage_prescriptions'
        )
      ) {
        links.push({
          href:
            '/prescriptions',
          label:
            'Prescriptions',
          icon:
            ClipboardList,
        });
      }

      // Billing

      if (
        hasPermission(
          'manage_billing'
        ) ||
        hasPermission(
          'view_billing'
        )
      ) {
        links.push({
          href:
            '/invoicing',
          label:
            'Billing',
          icon:
            Receipt,
        });
      }

      // Pharmacy
            if (
        hasPermission(
          'manage_pharmacy'
        ) ||
        hasPermission(
          'view_pharmacy'
        )
      ) {
        links.push({
          href: '/pharmacy',
          label: 'Pharmacy',
          icon: Pill,
        });
      }

      // Pharmacy Sales

      if (
        hasPermission(
          'dispense_prescriptions'
        ) ||
        hasPermission(
          'manage_pharmacy_sales'
        )
      ) {
        links.push({
          href:
            '/pharmacy/sales',
          label: 'Sales',
          icon:
            ShoppingCart,
        });
      }

      // Inventory

      if (
        hasPermission(
          'manage_pharmacy_stock'
        ) ||
        hasPermission(
          'view_inventory'
        )
      ) {
        links.push({
          href:
            '/pharmacy/inventory',
          label:
            'Inventory',
          icon:
            Package,
        });
      }

      // ADMIN ACCESS

      if (
        userRole ===
          'admin' ||
        hasPermission(
          'manage_roles'
        )
      ) {
        links.push({
          href:
            '/admin/access',
          label:
            'Access',
          icon:
            ShieldCheck,
        });
      }

      return links;
    }, [
      permissions,
      userRole,
    ]);

  // -------------------------
  // JSX
  // -------------------------

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-[1600px] px-3 sm:px-5 lg:px-8">

          <div className="flex h-16 items-center justify-between lg:h-20">

            {/* LEFT */}

            <div className="flex items-center gap-3 lg:gap-10">

              {/* MOBILE MENU */}

              <button
                onClick={() =>
                  setMobileMenuOpen(
                    !mobileMenuOpen
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 lg:hidden"
              >
                {mobileMenuOpen ? (
                  <X size={20} />
                ) : (
                  <Menu size={20} />
                )}
              </button>

              {/* LOGO */}

              <Link
                href="/dashboard"
                className="flex items-center gap-3"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-200">
                  <Pill size={22} />
                </div>

                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">
                    MediCare ERP
                  </h1>

                  <p className="text-xs font-medium text-slate-500">
                    Smart Clinic &
                    Pharmacy System
                  </p>
                </div>
              </Link>

              {/* DESKTOP NAV */}

              <nav className="hidden items-center gap-1 lg:flex">
                {navLinks.map(
                  (item) => {
                    const Icon =
                      item.icon;

                    return (
                      <Link
                        key={
                          item.href
                        }
                        href={
                          item.href
                        }
                        className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition-all ${
                          isActive(
                            item.href
                          )
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <Icon
                          size={
                            17
                          }
                        />

                        <span>
                          {
                            item.label
                          }
                        </span>
                      </Link>
                    );
                  }
                )}
              </nav>

            </div>

            {/* RIGHT */}

            <div className="flex items-center gap-2 sm:gap-3">

              {/* MOBILE SEARCH */}

              <button
                onClick={() =>
                  setSearchOpen(
                    !searchOpen
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 xl:hidden"
              >
                <Search
                  size={18}
                />
              </button>

              {/* NOTIFICATION */}

              <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100">
                <Bell
                  size={18}
                />

                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
              </button>
                            {/* PROFILE */}

              <div className="relative">

                <button
                  onClick={() =>
                    setProfileOpen(
                      !profileOpen
                    )
                  }
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-2 py-2 hover:bg-slate-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
                    <UserCircle2
                      size={22}
                    />
                  </div>

                  <div className="hidden text-left md:block">
                    <p className="max-w-[160px] truncate text-sm font-bold text-slate-800">
                      {userName ||
                        'User'}
                    </p>

                    <p className="text-xs capitalize text-slate-500">
                      {userRole
                        ?.replace(
                          /_/g,
                          ' '
                        )
                        ?.toLowerCase() ||
                        'User'}
                    </p>
                  </div>

                  <ChevronDown
                    size={16}
                    className="hidden text-slate-500 md:block"
                  />
                </button>

                {/* PROFILE DROPDOWN */}

                {profileOpen && (
                  <div className="absolute right-0 mt-3 w-72 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200">

                    <div className="border-b border-slate-100 bg-gradient-to-r from-blue-600 to-cyan-500 p-5 text-white">

                      <div className="flex items-center gap-4">

                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                          <UserCircle2
                            size={
                              30
                            }
                          />
                        </div>

                        <div>
                          <h3 className="text-lg font-bold">
                            {userName ||
                              'User'}
                          </h3>

                          <p className="text-sm capitalize text-blue-100">
                            {userRole
                              ?.replace(
                                /_/g,
                                ' '
                              )
                              ?.toLowerCase()}
                          </p>
                        </div>

                      </div>
                    </div>

                    <div className="p-3">

                      <Link
                        href="/profile"
                        className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                      >
                        <UserCircle2
                          size={18}
                        />
                        My Profile
                      </Link>

                      <button
                        onClick={
                          handleLogout
                        }
                        className="mt-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        <LogOut
                          size={18}
                        />
                        Logout
                      </button>

                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* MOBILE SEARCH */}

          {searchOpen && (
            <div className="pb-4 xl:hidden">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-3.5 text-slate-400"
                />

                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full rounded-2xl border border-slate-200 py-3 pl-12 pr-4 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* MOBILE MENU */}

      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() =>
              setMobileMenuOpen(
                false
              )
            }
          />

          <div className="fixed left-0 top-0 z-50 h-full w-[320px] overflow-y-auto border-r border-slate-200 bg-white shadow-2xl lg:hidden">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 p-5">

              <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
                  <Pill size={24} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    MediCare ERP
                  </h2>

                  <p className="text-xs text-slate-500">
                    Healthcare Platform
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  setMobileMenuOpen(
                    false
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100"
              >
                <X size={20} />
              </button>

            </div>

            {/* USER */}

            <div className="border-b border-slate-200 p-5">

              <div className="flex items-center gap-4">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
                  <UserCircle2
                    size={30}
                  />
                </div>

                <div>
                  <p className="font-bold text-slate-800">
                    {userName ||
                      'User'}
                  </p>

                  <p className="text-sm capitalize text-slate-500">
                    {userRole
                      ?.replace(
                        /_/g,
                        ' '
                      )
                      ?.toLowerCase()}
                  </p>
                </div>

              </div>
            </div>

            {/* NAV */}

            <nav className="space-y-1 p-4">

              {navLinks.map(
                (item) => {
                  const Icon =
                    item.icon;

                  return (
                    <Link
                      key={
                        item.href
                      }
                      href={
                        item.href
                      }
                      onClick={() =>
                        setMobileMenuOpen(
                          false
                        )
                      }
                      className={`flex items-center gap-3 rounded-2xl px-4 py-4 font-semibold transition ${
                        isActive(
                          item.href
                        )
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon
                        size={20}
                      />

                      <span>
                        {
                          item.label
                        }
                      </span>
                    </Link>
                  );
                }
              )}

            </nav>

            {/* FOOTER */}

            <div className="border-t border-slate-200 p-4">

              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(
                    false
                  );
                }}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-red-500 px-4 py-4 font-semibold text-white hover:bg-red-600"
              >
                <LogOut
                  size={18}
                />
                Logout
              </button>

            </div>
          </div>
        </>
      )}
    </>
  );
}