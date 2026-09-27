import { useEffect } from 'react';
import { useNavigation } from '../context/NavigationContext';

export function Payment() {
  const { navigate } = useNavigation();

  useEffect(() => {
    navigate('checkout');
  }, [navigate]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center bg-gray-50 px-4">
      <p className="text-sm font-semibold text-gray-500">Redirecting to checkout…</p>
    </div>
  );
}
