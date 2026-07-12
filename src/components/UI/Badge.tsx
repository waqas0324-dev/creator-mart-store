interface BadgeProps {
  children: React.ReactNode;
  variant?: 'orange' | 'black' | 'green';
  className?: string;
}

export function Badge({ children, variant = 'orange', className = '' }: BadgeProps) {
  const variants = {
    orange: 'bg-orange-500 text-white',
    black: 'bg-gray-900 text-white',
    green: 'bg-green-600 text-white',
  };
  return (
    <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
