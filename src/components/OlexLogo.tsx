import React from 'react';

interface OlexLogoProps {
  className?: string;
  size?: number | string;
  showGlow?: boolean;
  inverted?: boolean;
}

export function OlexLogo({
  className = 'w-10 h-12',
  size,
  showGlow = false,
}: OlexLogoProps) {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <div
      style={style}
      className={`relative inline-flex items-center justify-center select-none ${
        showGlow ? 'filter drop-shadow-[0_0_16px_rgba(34,197,94,0.7)]' : ''
      } ${className}`}
    >
      <svg
        viewBox="0 0 200 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="pinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#24c04f" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>

          {/* Mask for the circular cutout portal */}
          <mask id="pinCutoutMask">
            {/* White keeps outer shape */}
            <rect width="200" height="240" fill="white" />
            {/* Black circle punches the inner hole */}
            <circle cx="100" cy="96" r="50" fill="black" />
          </mask>
        </defs>

        {/* 1. Outer Map Pin Shell with Circular Cutout hole */}
        <path
          d="M 100 12
             C 48 12 15 54 15 106
             C 15 152 76 208 97 232
             C 99 234 101 234 103 232
             C 124 208 185 152 185 106
             C 185 54 152 12 100 12 Z"
          fill="url(#pinGrad)"
          mask="url(#pinCutoutMask)"
        />

        {/* 2. Inner Circular Arch Background (transparent / dark space cutout) */}
        <circle cx="100" cy="96" r="49" fill="#000000" fillOpacity="0.85" />

        {/* 3. The Winding Green Highway Road that loops through the portal */}
        {/* Starts inside the arch at right, swings left into distance, curves down-center and exits right */}
        <path
          d="M 140 70
             C 118 70 95 76 72 88
             C 65 92 64 97 68 102
             C 73 108 82 110 90 114
             C 108 122 126 135 138 152
             C 152 172 156 195 156 202
             L 142 208
             C 138 190 125 168 110 152
             C 95 136 78 126 68 116
             C 58 106 58 92 68 82
             C 88 64 120 58 148 64 Z"
          fill="#16a34a"
        />

        {/* Main curved road body matching exact user artwork */}
        <path
          d="M 66 90
             C 90 70 125 68 146 72
             C 136 78 112 82 98 90
             C 78 100 66 116 68 138
             C 70 162 90 190 110 216
             C 114 220 120 226 122 228
             L 100 232
             C 80 206 54 168 52 136
             C 50 112 56 98 66 90 Z"
          fill="#1ea34b"
        />

        {/* Full sweeping highway strip from user's logo */}
        <path
          d="M 144 72
             C 112 72 90 84 80 96
             C 70 108 72 122 80 138
             C 92 160 118 188 140 214
             L 158 206
             C 134 176 112 152 102 132
             C 94 118 96 106 104 96
             C 114 86 130 80 144 76 Z"
          fill="#22c55e"
        />

        {/* Dashed White Road Center Dividers (4 progressive dashes that follow the curve) */}
        {/* Dash 1 - Upper distance */}
        <path
          d="M 112 81 C 106 83 100 86 96 89"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Dash 2 - Middle curve */}
        <path
          d="M 90 99 C 88 104 88 110 90 116"
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Dash 3 - Forward sweep */}
        <path
          d="M 97 128 C 102 136 108 146 114 156"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Dash 4 - Lower foreground highway */}
        <path
          d="M 124 172 C 130 182 138 194 144 204"
          stroke="#ffffff"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
