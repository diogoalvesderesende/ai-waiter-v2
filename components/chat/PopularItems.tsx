"use client";

interface PopularItem {
  name: string;
  category: string;
  price: number;
}

interface PopularItemsProps {
  items: PopularItem[];
  onSelect: (item: PopularItem) => void;
}

const FOOD_IMAGES = [
  "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=200&h=200&fit=crop&q=80",
  "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=200&h=200&fit=crop&q=80",
  "https://images.unsplash.com/photo-1541696490-8744a5dc0228?w=200&h=200&fit=crop&q=80",
];

export default function PopularItems({ items, onSelect }: PopularItemsProps) {
  if (items.length === 0) return null;

  return (
    <div className="bg-white px-4 pt-3 pb-2 border-b border-gray-100">
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-500">
          Popular Today
        </p>
        <button className="text-[11px] font-medium text-brand-500 hover:text-brand-600 transition-colors">
          See More
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {items.map((item, i) => (
          <button
            key={`${item.name}-${i}`}
            onClick={() => onSelect(item)}
            className="group flex-shrink-0 w-[130px] text-left"
          >
            <div className="relative h-[100px] rounded-xl overflow-hidden mb-2 shadow-sm">
              <img
                src={FOOD_IMAGES[i % FOOD_IMAGES.length]}
                alt={item.name}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              <span className="absolute top-2 right-2 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                ${item.price.toFixed(2)}
              </span>
            </div>
            <p className="text-xs font-bold text-gray-900 truncate leading-tight">
              {item.name}
            </p>
            <p className="text-[10px] text-gray-400 capitalize truncate mt-0.5">
              {item.category}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
