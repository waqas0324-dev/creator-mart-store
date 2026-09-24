import { BRAND_NAME } from '../../lib/brand';
import { useSiteSettings } from '../../context/SiteSettingsContext';

interface LogoProps {
  /** Overall size of the logo for THIS usage context (navbar vs hero etc.) */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Kept for backward compatibility — the tagline only renders at lg/xl sizes, where there's room to read it */
  showTagline?: boolean;
  className?: string;
}

// Base pixel heights per usage context.
const BASE_HEIGHT_PX: Record<NonNullable<LogoProps['size']>, number> = {
  sm: 24,
  md: 32,
  lg: 64,
  xl: 96,
};

// Global scale dial, set from the Developer Studio ("logo_size" setting) —
// nudges the logo bigger/smaller everywhere at once, on top of each
// context's own base size above.
const GLOBAL_SCALE: Record<string, number> = {
  sm: 0.8,
  md: 1,
  lg: 1.25,
  xl: 1.5,
};

const TEXT_SIZES: Record<NonNullable<LogoProps['size']>, string> = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-3xl',
  xl: 'text-4xl',
};

/**
 * ABR Gadgets logo.
 *
 * If a custom logo was uploaded via the Developer Studio, it's used as-is
 * everywhere (single image, no composite). Otherwise we fall back to the
 * built-in branding: at small/medium sizes (navbar, buttons) just the "ABR"
 * mark graphic next to crisp CSS text "GADGETS" (the full logo file's thin
 * wordmark + tagline become unreadable mush scaled down that far); at large
 * sizes (hero, footer, admin login, print documents) the full original logo
 * image (mark + wordmark + tagline) exactly as designed.
 */
export function Logo({ size = 'md', className = '' }: LogoProps) {
  const { settings } = useSiteSettings();
  const scale = GLOBAL_SCALE[settings.logo_size] ?? 1;
  const heightPx = Math.round(BASE_HEIGHT_PX[size] * scale);

  if (settings.logo_url) {
    return (
      <img
        src={settings.logo_url}
        alt={BRAND_NAME}
        style={{ height: heightPx }}
        className={`w-auto object-contain select-none ${className}`}
        draggable={false}
      />
    );
  }

  if (size === 'lg' || size === 'xl') {
    return (
      <img
        src="/images/logo/abr-gadgets.png"
        alt={BRAND_NAME}
        style={{ height: heightPx }}
        className={`w-auto object-contain select-none ${className}`}
        draggable={false}
      />
    );
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <img
        src="/images/logo/abr-mark.png"
        alt=""
        aria-hidden="true"
        style={{ height: heightPx }}
        className="w-auto object-contain select-none"
        draggable={false}
      />
      <span className={`font-black tracking-wide text-white ${TEXT_SIZES[size]} leading-none`}>
        GADGETS
      </span>
    </div>
  );
}
