'use client';

interface Props {
  open: boolean;
  onClose: () => void;
  onPay: (amount: number) => void;
}

export default function PaymentModal({ open, onClose, onPay }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded w-[350px]">
        <h2 className="text-lg font-bold mb-4">Record Payment</h2>

        <button
          onClick={() => onPay(500)}
          className="bg-green-600 text-white px-4 py-2 rounded w-full"
        >
          Pay ₹500
        </button>

        <button onClick={onClose} className="mt-2 text-sm w-full">
          Close
        </button>
      </div>
    </div>
  );
}