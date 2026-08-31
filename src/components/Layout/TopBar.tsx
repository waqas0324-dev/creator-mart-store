import { Truck, Banknote, RotateCcw, ShieldCheck } from 'lucide-react';

export function TopBar() {
  return (
    <div className="bg-gray-900 text-white text-xs py-2">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1">
            {[
              { Icon: Truck, text: 'FREE DELIVERY ALL OVER PAKISTAN' },
              { Icon: Banknote, text: 'CASH ON DELIVERY AVAILABLE' },
              { Icon: RotateCcw, text: '7 DAYS EASY RETURN POLICY' },
              { Icon: ShieldCheck, text: '100% ORIGINAL PRODUCTS' },
            ].map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5">
                <Icon size={13} className="text-orange-400" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
