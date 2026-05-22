'use client';

/**
 * AppStoreBadges — renders official-style "Download on the App Store" and
 * "Get it on Google Play" badges. Each badge only renders if its
 * corresponding flag in MOBILE_APP_LINKS is enabled (env-flagged), so we
 * can ship the UI to production before the apps are approved.
 *
 * Brand compliance:
 *   - Apple's "Available on the App Store" guidelines:
 *     https://developer.apple.com/app-store/marketing/guidelines/
 *     Required: black pill with rounded corners, Apple logo, "Download on
 *     the App Store" wordmark. Min height 40px. Don't recolor or
 *     distort.
 *   - Google Play badge guidelines:
 *     https://play.google.com/intl/en_us/badges/
 *     Required: black pill, Play triangle in brand colors, "GET IT ON"
 *     small text + "Google Play" wordmark. Don't recolor.
 *
 * We render inline SVG so the badges are pixel-perfect at any size and
 * don't require asset hosting.
 */

import { MOBILE_APP_LINKS } from '@/lib/mobile-app-config';

type Size = 'sm' | 'md' | 'lg';

const sizeMap: Record<Size, { h: string; gap: string }> = {
  sm: { h: 'h-10', gap: 'gap-2' }, // 40px tall — Apple minimum
  md: { h: 'h-12', gap: 'gap-3' }, // 48px tall — default
  lg: { h: 'h-14', gap: 'gap-3' }, // 56px tall — hero use
};

type Props = {
  size?: Size;
  className?: string;
  /**
   * Where the badges are placed — used for analytics tagging only.
   */
  placement?: string;
};

export default function AppStoreBadges({
  size = 'md',
  className = '',
  placement = 'unknown',
}: Props) {
  const { ios, android } = MOBILE_APP_LINKS;

  // If neither is live, render nothing — keeps the page clean pre-launch.
  if (!ios.enabled && !android.enabled) return null;

  const { h, gap } = sizeMap[size];

  return (
    <div className={`flex flex-wrap items-center ${gap} ${className}`}>
      {ios.enabled && (
        <a
          href={ios.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={ios.label}
          data-analytics-placement={placement}
          data-analytics-platform="ios"
          className={`${h} inline-flex items-center transition-transform hover:scale-[1.03] focus:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#635bff] rounded-lg`}
        >
          <AppleBadgeSvg className="h-full w-auto" />
        </a>
      )}
      {android.enabled && (
        <a
          href={android.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={android.label}
          data-analytics-placement={placement}
          data-analytics-platform="android"
          className={`${h} inline-flex items-center transition-transform hover:scale-[1.03] focus:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#635bff] rounded-lg`}
        >
          <GooglePlayBadgeSvg className="h-full w-auto" />
        </a>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Apple "Download on the App Store" badge                             */
/* viewBox 120 x 40 — preserves Apple's official aspect ratio          */
/* ------------------------------------------------------------------ */
function AppleBadgeSvg({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 40"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
    >
      <rect width="120" height="40" rx="6" fill="#000" />
      <rect
        x="0.5"
        y="0.5"
        width="119"
        height="39"
        rx="5.5"
        fill="none"
        stroke="#A6A6A6"
        strokeWidth="1"
        opacity="0.4"
      />
      {/* Apple logo */}
      <path
        d="M22.93 20.18c-.02-2.46 2.01-3.65 2.1-3.71-1.15-1.68-2.94-1.91-3.58-1.94-1.52-.15-2.97.9-3.74.9-.78 0-1.97-.88-3.24-.86-1.66.03-3.21.97-4.07 2.46-1.74 3.01-.44 7.46 1.24 9.9.83 1.2 1.81 2.53 3.1 2.49 1.25-.05 1.72-.8 3.23-.8 1.5 0 1.93.8 3.24.78 1.34-.02 2.19-1.21 3-2.41.95-1.39 1.34-2.74 1.36-2.81-.03-.01-2.6-1-2.64-3.99zm-2.46-7.34c.69-.84 1.16-2 1.03-3.16-1 .04-2.21.66-2.93 1.49-.64.74-1.21 1.93-1.06 3.06 1.12.09 2.27-.57 2.96-1.39z"
        fill="#fff"
      />
      {/* Download on the */}
      <text
        x="34"
        y="16"
        fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif"
        fontSize="7"
        fill="#fff"
      >
        Download on the
      </text>
      {/* App Store */}
      <text
        x="34"
        y="30"
        fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif"
        fontSize="15"
        fontWeight="600"
        fill="#fff"
      >
        App Store
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Google "Get it on Google Play" badge                                */
/* viewBox 135 x 40 — preserves Google's official aspect ratio         */
/* ------------------------------------------------------------------ */
function GooglePlayBadgeSvg({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 135 40"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
    >
      <rect width="135" height="40" rx="6" fill="#000" />
      <rect
        x="0.5"
        y="0.5"
        width="134"
        height="39"
        rx="5.5"
        fill="none"
        stroke="#A6A6A6"
        strokeWidth="1"
        opacity="0.4"
      />

      {/* Play triangle — official 4-color gradient mark */}
      <g transform="translate(10, 10)">
        <defs>
          <linearGradient id="playGradTop" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00A0FF" />
            <stop offset="100%" stopColor="#00E2FF" />
          </linearGradient>
          <linearGradient id="playGradRight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFCE00" />
            <stop offset="100%" stopColor="#FFBD00" />
          </linearGradient>
          <linearGradient id="playGradBottom" x1="0" y1="0" x2="1" y2="-1">
            <stop offset="0%" stopColor="#FF3A44" />
            <stop offset="100%" stopColor="#C31162" />
          </linearGradient>
          <linearGradient id="playGradLeft" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00A070" />
            <stop offset="100%" stopColor="#00F076" />
          </linearGradient>
        </defs>
        {/* top wedge */}
        <path d="M0.3 0.3 L10.4 10.0 L13.0 7.4 Z" fill="url(#playGradTop)" />
        {/* right wedge */}
        <path d="M13.0 7.4 L16.5 9.4 C17.2 9.8 17.2 10.2 16.5 10.6 L13.0 12.6 L10.4 10.0 Z" fill="url(#playGradRight)" />
        {/* bottom wedge */}
        <path d="M0.3 19.7 L10.4 10.0 L13.0 12.6 Z" fill="url(#playGradBottom)" />
        {/* left wedge */}
        <path d="M0.3 0.3 L0.3 19.7 L10.4 10.0 Z" fill="url(#playGradLeft)" />
      </g>

      {/* GET IT ON */}
      <text
        x="34"
        y="16"
        fontFamily="'Roboto', 'Helvetica Neue', Arial, sans-serif"
        fontSize="6.5"
        fill="#fff"
        letterSpacing="0.3"
      >
        GET IT ON
      </text>
      {/* Google Play */}
      <text
        x="34"
        y="30"
        fontFamily="'Roboto', 'Helvetica Neue', Arial, sans-serif"
        fontSize="15"
        fontWeight="500"
        fill="#fff"
      >
        Google Play
      </text>
    </svg>
  );
}
