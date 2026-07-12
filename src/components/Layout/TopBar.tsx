import { Truck, Banknote, RotateCcw, ShieldCheck, Settings } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';

export function TopBar() {
  const { navigate } = useNavigation();

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
          <button
            onClick={() => navigate('admin-login')}
            className="flex-shrink-0 flex items-center gap-1 text-gray-500 hover:text-orange-400 transition-colors ml-2"
            title="Admin Panel"
          >
            <Settings size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
