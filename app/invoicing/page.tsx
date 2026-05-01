'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import { useState, useEffect } from 'react';

interface Invoice {
  id: string;
  patient_id: string;
  appointment_id?: string;
  amount: number;
  status: string;
  due_date: string;
  paid_date?: string;
  created_at: string;
  notes?: string;
  patients?: { first_name: string; last_name: string; phone?: string; email?: string; date_of_birth?: string };
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
}

export default function InvoicingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState({
    patient_id: '',
    appointment_id: '',
    amount: '',
    due_date: '',
    status: 'pending',
    paid_date: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invoicesRes, patientsRes] = await Promise.all([
        fetch('/api/invoices'),
        fetch('/api/patients'),
      ]);

      const invoicesData = await invoicesRes.json();
      const patientsData = await patientsRes.json();

      setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
      setPatients(Array.isArray(patientsData) ? patientsData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch appointments for a specific patient
  const fetchPatientAppointments = async (patientId: string) => {
    try {
      const response = await fetch(`/api/appointments?patient_id=${patientId}`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return [];
    }
  };

  const handlePatientChange = async (patientId: string) => {
    setFormData({ ...formData, patient_id: patientId, appointment_id: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/invoices?id=${editingId}` : '/api/invoices';

      const payload: any = {
        patient_id: formData.patient_id,
        amount: parseFloat(formData.amount),
        due_date: formData.due_date,
        status: formData.status,
      };

      if (formData.status === 'paid' && formData.paid_date) {
        payload.paid_date = formData.paid_date;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        resetForm();
        fetchData();
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setFormData({
      patient_id: invoice.patient_id,
      appointment_id: invoice.appointment_id || '',
      amount: invoice.amount.toString(),
      due_date: invoice.due_date.split('T')[0],
      status: invoice.status,
      paid_date: invoice.paid_date ? invoice.paid_date.split('T')[0] : '',
      notes: invoice.notes || '',
    });
    setEditingId(invoice.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await fetch(`/api/invoices?id=${id}`, { method: 'DELETE' });
        fetchData();
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      patient_id: '',
      appointment_id: '',
      amount: '',
      due_date: '',
      status: 'pending',
      paid_date: '',
      notes: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);
  const pendingAmount = totalAmount - paidAmount;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Invoicing & Billing</h1>
          <p className="mt-2 text-gray-600">Manage patient invoices and payments</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm font-medium">Total Billed</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">${totalAmount.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <p className="text-gray-600 text-sm font-medium">Paid</p>
            <p className="text-3xl font-bold text-green-600 mt-2">${paidAmount.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <p className="text-gray-600 text-sm font-medium">Outstanding</p>
            <p className="text-3xl font-bold text-red-600 mt-2">${pendingAmount.toFixed(2)}</p>
          </div>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            + Create Invoice
          </button>
        )}

        {showForm && (
          <div className="mb-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingId ? 'Edit Invoice' : 'Create New Invoice'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <select
                  value={formData.patient_id}
                  onChange={(e) => handlePatientChange(e.target.value)}
                  required
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  required
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  placeholder="Add any notes about this invoice..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {formData.status === 'paid' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={formData.paid_date}
                    onChange={(e) => setFormData({ ...formData, paid_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
                >
                  {editingId ? 'Update Invoice' : 'Create Invoice'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-400 text-white font-semibold rounded-lg hover:bg-gray-500 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No invoices found</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Patient</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Due Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Created</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">
                      {invoice.patients?.first_name} {invoice.patients?.last_name}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">${invoice.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(invoice.due_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          invoice.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : invoice.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : invoice.status === 'overdue'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEdit(invoice)}
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(invoice.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-8 text-center text-gray-600">
          <p>Total Invoices: {invoices.length}</p>
        </div>

        {/* Invoice Print Template Modal */}
        {selectedInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="bg-blue-600 px-8 py-4 flex justify-between items-center rounded-t-lg">
                <h2 className="text-2xl font-bold text-white">Invoice</h2>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-white hover:text-gray-200 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* Invoice Content */}
              <div id={`invoice-${selectedInvoice.id}`} className="p-8">
                {/* Clinic Header */}
                <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
                  <h1 className="text-3xl font-bold text-gray-900">Clinic Management System</h1>
                  <p className="text-gray-600 mt-1">123 Medical Center, Healthcare City</p>
                  <p className="text-gray-600">Phone: +91 1234567890 | Email: clinic@clinic.com</p>
                </div>

                {/* Invoice Details */}
                <div className="mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Invoice Details</h3>
                      <table className="w-full text-sm">
                        <tbody>
                          <tr>
                            <td className="py-1 text-gray-600">Invoice No:</td>
                            <td className="py-1 font-semibold">{selectedInvoice.id.slice(0, 8).toUpperCase()}</td>
                          </tr>
                          <tr>
                            <td className="py-1 text-gray-600">Date:</td>
                            <td className="py-1">{new Date(selectedInvoice.created_at).toLocaleDateString()}</td>
                          </tr>
                          <tr>
                            <td className="py-1 text-gray-600">Due Date:</td>
                            <td className="py-1">{new Date(selectedInvoice.due_date).toLocaleDateString()}</td>
                          </tr>
                          <tr>
                            <td className="py-1 text-gray-600">Status:</td>
                            <td className="py-1">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                selectedInvoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                                selectedInvoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {selectedInvoice.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Patient Details</h3>
                      <table className="w-full text-sm">
                        <tbody>
                          <tr>
                            <td className="py-1 text-gray-600">Name:</td>
                            <td className="py-1 font-semibold">{selectedInvoice.patients?.first_name} {selectedInvoice.patients?.last_name}</td>
                          </tr>
                          <tr>
                            <td className="py-1 text-gray-600">Phone:</td>
                            <td className="py-1">{selectedInvoice.patients?.phone || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td className="py-1 text-gray-600">Email:</td>
                            <td className="py-1">{selectedInvoice.patients?.email || 'N/A'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Amount Section */}
                <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg text-gray-700">Total Amount:</span>
                    <span className="text-3xl font-bold text-blue-600">${selectedInvoice.amount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Notes */}
                {selectedInvoice.notes && (
                  <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="text-sm font-semibold text-gray-900 mb-2">Notes</div>
                    <div className="text-sm text-gray-700">{selectedInvoice.notes}</div>
                  </div>
                )}

                {/* Payment Info */}
                {selectedInvoice.status === 'paid' && selectedInvoice.paid_date && (
                  <div className="mb-6 bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="text-sm font-semibold text-green-900">✓ Payment Received on {new Date(selectedInvoice.paid_date).toLocaleDateString()}</div>
                  </div>
                )}

                {/* Footer */}
                <div className="border-t-2 border-gray-300 pt-4 mt-6">
                  <div className="text-center text-xs text-gray-500">
                    <p>Thank you for choosing our clinic!</p>
                    <p>Please keep this invoice for your records.</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition text-sm"
                  >
                    🖨️ Print
                  </button>
                  <button
                    onClick={() => {
                      handleEdit(selectedInvoice);
                      setSelectedInvoice(null);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition text-sm"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => {
                      handleDelete(selectedInvoice.id);
                      setSelectedInvoice(null);
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition text-sm"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
