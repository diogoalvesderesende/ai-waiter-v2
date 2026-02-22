"use client";

interface CartItem {
  itemName: string;
  quantity: number;
  price: number;
}

interface CartReceiptProps {
  items: CartItem[];
  onUpdateCart?: () => void;
}

export default function CartReceipt({ items, onUpdateCart }: CartReceiptProps) {
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="animate-bounce-in my-1 w-full max-w-[300px] rounded-2xl border border-brand-100 bg-white shadow-lg shadow-brand-500/5 overflow-hidden">
      <div className="bg-brand-50 px-4 py-2">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-brand-600">
          Order Summary
        </p>
      </div>

      <div className="px-4 py-3 space-y-2.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-lg">
              🥟
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {item.itemName}
              </p>
              <p className="text-[11px] text-gray-400">Qty: {item.quantity}</p>
            </div>
            <span className="text-sm font-bold text-gray-900 tabular-nums">
              ${(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <div className="mx-4 border-t border-gray-100" />

      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Total
        </span>
        <span className="text-base font-extrabold text-gray-900 tabular-nums">
          ${total.toFixed(2)}
        </span>
      </div>

      {onUpdateCart && (
        <div className="px-4 pb-3">
          <button
            onClick={onUpdateCart}
            className="w-full rounded-xl bg-brand-500 py-2.5 text-xs font-bold text-white hover:bg-brand-600 transition-colors shadow-sm shadow-brand-500/20"
          >
            Update Cart
          </button>
        </div>
      )}
    </div>
  );
}
