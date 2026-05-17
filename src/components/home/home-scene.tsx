'use client'

const ORION_STARS = [
  { id: 'betelgeuse', x: 22, y: 18, size: 14, color: '#f5b2a3' },
  { id: 'bellatrix', x: 78, y: 20, size: 11, color: '#dce7fb' },
  { id: 'alnitak', x: 38, y: 40, size: 10, color: '#dae8fb' },
  { id: 'alnilam', x: 50, y: 44, size: 11, color: '#eef3ff' },
  { id: 'mintaka', x: 62, y: 38, size: 10, color: '#f5f8ff' },
  { id: 'saiph', x: 34, y: 74, size: 10, color: '#f6dfcf' },
  { id: 'rigel', x: 74, y: 70, size: 14, color: '#a2caf5' },
  { id: 'meissa', x: 49, y: 7, size: 8, color: '#ddf0fb' },
  { id: 'hatysa', x: 49, y: 55, size: 7, color: '#e6f1fb' },
  { id: 'theta-orionis', x: 51, y: 66, size: 8, color: '#f9edf1' },
] as const

const STAR_LINKS = [
  ['betelgeuse', 'bellatrix'],
  ['betelgeuse', 'alnitak'],
  ['bellatrix', 'mintaka'],
  ['alnitak', 'alnilam'],
  ['alnilam', 'mintaka'],
  ['alnitak', 'saiph'],
  ['mintaka', 'rigel'],
  ['betelgeuse', 'meissa'],
  ['bellatrix', 'meissa'],
  ['alnilam', 'hatysa'],
  ['hatysa', 'theta-orionis'],
] as const

const BACKGROUND_STARS = [
  { id: 'bg-1', x: 9, y: 16, size: 2.2 },
  { id: 'bg-2', x: 15, y: 74, size: 2.4 },
  { id: 'bg-3', x: 28, y: 10, size: 1.8 },
  { id: 'bg-4', x: 85, y: 14, size: 2.2 },
  { id: 'bg-5', x: 91, y: 32, size: 2 },
  { id: 'bg-6', x: 81, y: 82, size: 2.6 },
  { id: 'bg-7', x: 11, y: 53, size: 1.8 },
  { id: 'bg-8', x: 39, y: 87, size: 1.6 },
] as const

const NEBULA_POINTS = [
  { id: 'n-1', x: 47, y: 57, radius: 14, opacity: 0.36, color: '#ffb1b8' },
  { id: 'n-2', x: 53, y: 60, radius: 18, opacity: 0.24, color: '#f1a4b3' },
  { id: 'n-3', x: 50, y: 67, radius: 11, opacity: 0.26, color: '#ffc5cb' },
  { id: 'n-4', x: 46, y: 64, radius: 8, opacity: 0.22, color: '#f7c1c7' },
] as const

const starLookup = Object.fromEntries(ORION_STARS.map((star) => [star.id, star]))

export function HomeScene() {
  return (
    <div
      className="flex h-full w-full items-center justify-center px-4 py-12 sm:px-8"
      aria-hidden="true"
    >
      <div className="relative aspect-[1.2/1] w-full max-w-4xl">
        <svg
          viewBox="0 0 100 84"
          className="h-full w-full overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="home-orion-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            <radialGradient id="home-nebula-warm" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffb1b8" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#ffb1b8" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="home-nebula-cool" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#d8e6ff" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#d8e6ff" stopOpacity="0" />
            </radialGradient>
            <filter id="home-soft-blur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.6" />
            </filter>
          </defs>

          <ellipse cx="50" cy="42" rx="44" ry="28" fill="url(#home-nebula-cool)" opacity="0.58" />
          <ellipse cx="50" cy="58" rx="18" ry="12" fill="url(#home-nebula-warm)" opacity="0.88" />

          {BACKGROUND_STARS.map((star) => (
            <circle
              key={star.id}
              cx={star.x}
              cy={star.y}
              r={star.size}
              fill="#fff9f4"
              opacity="0.72"
            />
          ))}

          {NEBULA_POINTS.map((point) => (
            <circle
              key={point.id}
              cx={point.x}
              cy={point.y}
              r={point.radius}
              fill={point.color}
              opacity={point.opacity}
              filter="url(#home-soft-blur)"
            />
          ))}

          {STAR_LINKS.map(([from, to]) => (
            <line
              key={`${from}-${to}`}
              x1={starLookup[from].x}
              y1={starLookup[from].y}
              x2={starLookup[to].x}
              y2={starLookup[to].y}
              stroke="#fff5f8"
              strokeOpacity="0.34"
              strokeWidth="0.34"
            />
          ))}

          {ORION_STARS.map((star) => (
            <g key={star.id}>
              <circle
                cx={star.x}
                cy={star.y}
                r={star.size * 1.9}
                fill="url(#home-orion-glow)"
                opacity="0.38"
              />
              <circle cx={star.x} cy={star.y} r={star.size} fill={star.color} />
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}
