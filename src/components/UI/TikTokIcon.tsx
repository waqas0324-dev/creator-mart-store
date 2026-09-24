export function TikTokIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="currentColor" className={className} aria-hidden="true">
      <path d="M22.5 8.6c-1.5-1-2.5-2.6-2.7-4.5V3.5h-4.1v18.1c0 1.9-1.5 3.4-3.4 3.4a3.4 3.4 0 0 1-1-6.7c.4-.1.9-.2 1.4-.1v-4.2c-.4 0-.9-.1-1.3-.1a7.5 7.5 0 0 0-7.5 7.5A7.5 7.5 0 0 0 11.4 29c4.1 0 7.5-3.4 7.5-7.5v-9.2a11.1 11.1 0 0 0 6.1 1.8V9.9c-.9 0-1.8-.2-2.5-.5-.1-.3-.1-.6 0-.8z"/>
    </svg>
  );
}
