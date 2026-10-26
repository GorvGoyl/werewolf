import type { ReactNode } from "react"

// Full-color pictures for roles, phases and actions, drawn on a 64px grid for this app.
// Gradient ids are unique per drawing, so two copies on one screen don't clash.
export type ArtIds = { id: (key: string) => string; url: (key: string) => string }

type Art = (ids: ArtIds) => ReactNode

function round(n: number): number {
  return Math.round(n * 100) / 100
}

function point(x: number, y: number, radius: number, degrees: number): string {
  const angle = (degrees * Math.PI) / 180
  return `${round(x + radius * Math.cos(angle))} ${round(y + radius * Math.sin(angle))}`
}

// A four-point twinkle
function sparkle(x: number, y: number, r: number): string {
  const k = r * 0.22
  const p = (dx: number, dy: number) => `${round(x + dx)} ${round(y + dy)}`
  return `M${p(0, -r)}Q${p(k, -k)} ${p(r, 0)}Q${p(k, k)} ${p(0, r)}Q${p(-k, k)} ${p(-r, 0)}Q${p(-k, -k)} ${p(0, -r)}Z`
}

// A five-point star
function star(x: number, y: number, r: number): string {
  const points: string[] = []
  for (let i = 0; i < 10; i++) {
    let radius = r * 0.45
    if (i % 2 === 0) radius = r
    points.push(point(x, y, radius, i * 36 - 90))
  }
  return `M${points.join("L")}Z`
}

// Pointed rays around a center, each one [direction in degrees, length]
function rays(x: number, y: number, inner: number, spread: number, spikes: Array<[number, number]>): string {
  return spikes
    .map(
      ([degrees, length]) =>
        `M${point(x, y, inner, degrees - spread)}L${point(x, y, length, degrees)}L${point(x, y, inner, degrees + spread)}Z`,
    )
    .join("")
}

const SUN_LONG_RAYS = rays(32, 32, 15, 10, [
  [-90, 30.5],
  [-30, 30.5],
  [30, 30.5],
  [90, 30.5],
  [150, 30.5],
  [210, 30.5],
])

const SUN_SHORT_RAYS = rays(32, 32, 15, 9, [
  [-60, 25.5],
  [0, 25.5],
  [60, 25.5],
  [120, 25.5],
  [180, 25.5],
  [240, 25.5],
])

const DAWN_RAYS = rays(32, 44, 18, 8, [
  [-165, 25],
  [-140, 30],
  [-115, 25],
  [-90, 31],
  [-65, 25],
  [-40, 30],
  [-15, 25],
])

const SMALL_SUN_RAYS = rays(20, 30.5, 4.3, 16, [
  [-90, 6.8],
  [-45, 6.8],
  [0, 6.8],
  [45, 6.8],
  [90, 6.8],
  [135, 6.8],
  [180, 6.8],
  [225, 6.8],
])

const MOON =
  "M36 5C22 7 12 18.5 12 32.5 12 47.6 24.4 60 39.5 60c7.4 0 14.1-2.9 19-7.7-2.3.6-4.7.9-7.2.9-15.1 0-27.3-12.2-27.3-27.3C24 16.6 28.6 9.4 36 5Z"

type Fur = { ear: string; inner: string; head: string; light: string; mask: string; eye: string; brow: number }

const GRAY_FUR: Fur = {
  ear: "#6f7891",
  inner: "#f4a9ba",
  head: "#959eb4",
  light: "#e8ebf2",
  mask: "#606981",
  eye: "#fcd34d",
  brow: 2.6,
}

const WHITE_FUR: Fur = {
  ear: "#c2c8d6",
  inner: "#f4a9ba",
  head: "#eceef5",
  light: "#ffffff",
  mask: "#cdd2de",
  eye: "#a78bfa",
  brow: 1.8,
}

// A snarling wolf, front on: pointed ears, fur tufts on the cheeks, fangs
function wolfHead(fur: Fur): ReactNode {
  return (
    <>
      <path
        fill={fur.ear}
        d="M9 31C7 21 8 11 12 3c6 4 12 9 17 15Zm46 0c2-10 1-20-3-28-6 4-12 9-17 15Z"
      />
      <path
        fill={fur.inner}
        d="M13.5 24c-.6-5.5 0-10.5 1.8-14.5 3 2.4 5.8 5 8.2 7.8Zm37 0c.6-5.5 0-10.5-1.8-14.5-3 2.4-5.8 5-8.2 7.8Z"
      />
      <path
        fill={fur.head}
        d="M32 13c7 0 13 3 16.5 7.5L57 31l-4 2 7 8-9 2-7 10c-3 4-8 7-12 7s-9-3-12-7l-7-10-9-2 7-8-4-2 8.5-10.5C19 16 25 13 32 13Z"
      />
      <path
        fill={fur.light}
        d="M20 53l-7-10-6-1.5 7-4.5c4 1.5 8 3 11.5 3.5L29 35h6l3.5 5.5c3.5-.5 7.5-2 11.5-3.5l7 4.5-6 1.5-7 10c-3 4-8 7-12 7s-9-3-12-7Z"
      />
      <path
        fill={fur.mask}
        d="M32 13c3.5 0 6.5.8 9 2.2L35.5 33 32 37l-3.5-4L23 15.2c2.5-1.4 5.5-2.2 9-2.2Z"
      />
      <path
        fill={fur.eye}
        d="M15.5 28.5c4-1.8 9-.6 13 4.5-5 1.6-10.2.6-13-4.5Zm33 0c-4-1.8-9-.6-13 4.5 5 1.6 10.2.6 13-4.5Z"
      />
      <ellipse
        fill="#1c1f2e"
        cx="23"
        cy="31"
        rx="1.4"
        ry="2.3"
      />
      <ellipse
        fill="#1c1f2e"
        cx="41"
        cy="31"
        rx="1.4"
        ry="2.3"
      />
      <path
        fill="none"
        stroke="#2c3244"
        strokeWidth={fur.brow}
        strokeLinecap="round"
        d="M14 23l15 5m21-5-15 5"
      />
      <path
        fill="#1c1f2e"
        d="M26.5 41c0-2.2 2.6-3 5.5-3s5.5.8 5.5 3c0 2.6-3.2 5-5.5 5s-5.5-2.4-5.5-5Z"
      />
      <ellipse
        fill="#fff"
        fillOpacity=".5"
        cx="29.8"
        cy="40"
        rx="1.6"
        ry="1"
      />
      <path
        fill="#9f1239"
        d="M24.5 49c3 1.2 5.5 1.5 7.5-.5 2 2 4.5 1.7 7.5.5-1 4.5-4 7.5-7.5 7.5s-6.5-3-7.5-7.5Z"
      />
      <ellipse
        fill="#fb7185"
        cx="32"
        cy="54.4"
        rx="3"
        ry="1.7"
      />
      <path
        fill="#fff"
        d="M26.5 49.6l1.6 4.4 1.4-4Zm11 0-1.6 4.4-1.4-4Z"
      />
    </>
  )
}

export const ART = {
  // Roles
  wolf: () => wolfHead(GRAY_FUR),
  queenWolf: () => (
    <>
      {wolfHead(WHITE_FUR)}
      <path
        fill="none"
        stroke="#2c3244"
        strokeWidth="1.3"
        strokeLinecap="round"
        d="M15.6 28.6l-2.8-.9m3.9-.5-2-1.8m33.7 3.2 2.8-.9m-3.9-.5 2-1.8"
      />
      <path
        fill="#fbbf24"
        d="M20 19 18.5 5l7 6 6.5-9.5 6.5 9.5 7-6L44 19Z"
      />
      <path
        fill="#f59e0b"
        d="M20.3 15h23.4l.3 4.2H20Z"
      />
      <circle
        fill="#ef4444"
        cx="32"
        cy="17.1"
        r="1.8"
      />
      <circle
        fill="#3b82f6"
        cx="25.6"
        cy="17.1"
        r="1.2"
      />
      <circle
        fill="#3b82f6"
        cx="38.4"
        cy="17.1"
        r="1.2"
      />
      <path
        fill="#fde68a"
        d="M18.5 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm13.5-3.2a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4ZM45.5 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"
      />
    </>
  ),
  babyWolf: () => (
    <>
      <path
        fill="#a8917b"
        d="M12 30C9.5 21 11 13 15.5 7.5c5 2.5 9.5 6.5 12 11.5Zm40 0c2.5-9 1-17-3.5-22.5-5 2.5-9.5 6.5-12 11.5Z"
      />
      <path
        fill="#f8b4c4"
        d="M15.5 24c-.8-4.5 0-9 1.8-12 2.6 1.8 5 4.3 6.5 7Zm33 0c.8-4.5 0-9-1.8-12-2.6 1.8-5 4.3-6.5 7Z"
      />
      <path
        fill="#c4ad96"
        d="M32 15c11.5 0 20 7.5 21.5 18l4.5 4-5 2c-1.5 10-10 17-21 17s-19.5-7-21-17l-5-2 4.5-4C12 22.5 20.5 15 32 15Z"
      />
      <path
        fill="#8a7360"
        d="M28.5 15.5c1-2.8 2.4-4.6 4.6-6 .1 2.2.9 3.8 2.6 5.8Z"
      />
      <path
        fill="#f5eadc"
        d="M18.5 45c-2-5 .5-9.5 5.5-9.5 3.5 0 5.5 2 8 2s4.5-2 8-2c5 0 7.5 4.5 5.5 9.5-2.5 6-7.5 9.5-13.5 9.5s-11-3.5-13.5-9.5Z"
      />
      <circle
        fill="#2a2030"
        cx="23"
        cy="30"
        r="4.3"
      />
      <circle
        fill="#2a2030"
        cx="41"
        cy="30"
        r="4.3"
      />
      <path
        fill="#fff"
        d="M24.6 26.8a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2Zm18 0a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2ZM21.7 31.1a.7.7 0 1 1 0 1.4.7.7 0 0 1 0-1.4Zm18 0a.7.7 0 1 1 0 1.4.7.7 0 0 1 0-1.4Z"
      />
      <ellipse
        fill="#fb7185"
        fillOpacity=".45"
        cx="16.5"
        cy="40"
        rx="3"
        ry="1.8"
      />
      <ellipse
        fill="#fb7185"
        fillOpacity=".45"
        cx="47.5"
        cy="40"
        rx="3"
        ry="1.8"
      />
      <path
        fill="#2a2030"
        d="M28 40.5c0-1.6 2-2.2 4-2.2s4 .6 4 2.2c0 1.8-2.2 3.5-4 3.5s-4-1.7-4-3.5Z"
      />
      <path
        fill="#fb7185"
        d="M29.8 47.2h4.4v2c0 1.4-1 2.5-2.2 2.5s-2.2-1.1-2.2-2.5Z"
      />
      <path
        fill="none"
        stroke="#6b5444"
        strokeWidth="1.6"
        strokeLinecap="round"
        d="M27.5 46.5c1.8 1.6 3.6 1.4 4.5-.6.9 2 2.7 2.2 4.5.6"
      />
    </>
  ),
  courtesan: () => (
    <>
      <path
        fill="#7c2d12"
        d="M15.5 40C13 26 19.5 14 32 14s19 12 16.5 26c-.9 5-3.5 8-6.5 9.5H22c-3-1.5-5.6-4.5-6.5-9.5Z"
      />
      <circle
        fill="#9a3412"
        cx="32"
        cy="10.5"
        r="7"
      />
      <path
        fill="#f8cfb0"
        d="M27.5 41h9v5c3 2 6 3 8.5 3.5L44 56H20l-1-6.5c2.5-.5 5.5-1.5 8.5-3.5Z"
      />
      <path
        fill="#e0a07c"
        d="M27.5 41h9v3.5c-2.8 1.6-6.2 1.6-9 0Z"
      />
      <path
        fill="#be185d"
        d="M8 64c0-8.5 6-14 14-15.5 2.5 3.2 6 4.7 10 4.7s7.5-1.5 10-4.7c8 1.5 14 7 14 15.5Z"
      />
      <ellipse
        fill="#f8cfb0"
        cx="32"
        cy="33"
        rx="10.5"
        ry="12.5"
      />
      <path
        fill="#9a3412"
        d="M21.3 32c-.6-9.6 4.6-15.5 11.7-15.5 6.6 0 11 4.7 11 11.5-4.8-1.1-9.8-4-13-8.5-2.2 5.2-5.5 9.5-9.7 12.5Z"
      />
      <path
        fill="#16a34a"
        d="M42 25.5c2.5-.3 5 .6 6.6 2.6-2.6.6-5 0-6.6-2.6Zm-3-9c-.7-2.4-.2-4.9 1.4-6.7.8 2.5.3 4.9-1.4 6.7Z"
      />
      <circle
        fill="#e11d48"
        cx="44"
        cy="19"
        r="6"
      />
      <path
        fill="none"
        stroke="#9f1239"
        strokeWidth="1.4"
        strokeLinecap="round"
        d="M44 19.6c-1 0-1.6-.7-1.6-1.4 0-1 .9-1.7 1.9-1.7 1.5 0 2.5 1.2 2.5 2.6 0 2-1.6 3.4-3.5 3.4-2.1 0-3.7-1.7-3.7-3.8"
      />
      <ellipse
        fill="#c084fc"
        fillOpacity=".55"
        cx="27.5"
        cy="31.2"
        rx="3.3"
        ry="1.8"
      />
      <ellipse
        fill="#c084fc"
        fillOpacity=".55"
        cx="36.5"
        cy="31.2"
        rx="3.3"
        ry="1.8"
      />
      <path
        fill="#fff"
        d="M24.6 33c1.3-1.5 4.5-1.5 5.8 0-1.3 1.3-4.5 1.3-5.8 0Zm9 0c1.3-1.5 4.5-1.5 5.8 0-1.3 1.3-4.5 1.3-5.8 0Z"
      />
      <circle
        fill="#3b1d2a"
        cx="27.5"
        cy="33"
        r="1.3"
      />
      <circle
        fill="#3b1d2a"
        cx="36.5"
        cy="33"
        r="1.3"
      />
      <path
        fill="none"
        stroke="#3b1d2a"
        strokeWidth="1.3"
        strokeLinecap="round"
        d="M30.4 32.9c-1.3-1.5-4.5-1.5-5.8 0l-1.3-1.1m10.3 1.1c1.3-1.5 4.5-1.5 5.8 0l1.3-1.1"
      />
      <ellipse
        fill="#fb7185"
        fillOpacity=".4"
        cx="24.3"
        cy="38"
        rx="2.6"
        ry="1.5"
      />
      <ellipse
        fill="#fb7185"
        fillOpacity=".4"
        cx="39.7"
        cy="38"
        rx="2.6"
        ry="1.5"
      />
      <path
        fill="#e11d48"
        d="M28.6 40.6c1.3-1 2.4-.8 3.4-.2 1-.6 2.1-.8 3.4.2-.9 1.9-2.2 2.7-3.4 2.7s-2.5-.8-3.4-2.7Z"
      />
      <circle
        fill="#3b1d2a"
        cx="37.6"
        cy="41.2"
        r=".75"
      />
      <circle
        fill="#fde68a"
        cx="21.4"
        cy="38.6"
        r="1.7"
      />
      <circle
        fill="#fde68a"
        cx="42.6"
        cy="38.6"
        r="1.7"
      />
      <path
        fill="none"
        stroke="#fde68a"
        strokeWidth="1.2"
        d="M27.2 47c1.3 2.2 2.9 3.3 4.8 3.3s3.5-1.1 4.8-3.3"
      />
      <circle
        fill="#e11d48"
        cx="32"
        cy="50.6"
        r="1.5"
      />
    </>
  ),
  wizard: () => (
    <>
      <path
        fill="#f1f5f9"
        d="M15.5 36c0 11.5 5.5 21 16.5 27 11-6 16.5-15.5 16.5-27-4.5 3.8-10 5.5-16.5 5.5S20 39.8 15.5 36Z"
      />
      <path
        fill="none"
        stroke="#cbd5e1"
        strokeWidth="1.5"
        strokeLinecap="round"
        d="M24.5 45c.5 4 2.3 8 5 11.5m10-11.5c-.5 4-2.3 8-5 11.5M32 47v10.5"
      />
      <ellipse
        fill="#f8cfb0"
        cx="32"
        cy="34.5"
        rx="12"
        ry="9.5"
      />
      <path
        fill="#4f46e5"
        d="M16.5 24c5-6.5 9-13.5 14-18.5 4-4 9-4.5 13.5-2-4 1-6 3.5-5.7 7 .7 5 4 10 8.7 13.5Z"
      />
      <path
        fill="#3730a3"
        d="M38.8 10.5c.7 5 4 10 8.7 13.5h-7c-2.6-4.4-3.9-9.4-3.5-14.4Z"
      />
      <path
        fill="#fde047"
        d={`${star(28.5, 15, 3.8)}${sparkle(35, 8.5, 1.8)}${sparkle(34.5, 19.5, 1.7)}`}
      />
      <ellipse
        fill="#3730a3"
        cx="32"
        cy="24.5"
        rx="22"
        ry="4.2"
      />
      <path
        fill="#fbbf24"
        d="M18.4 21c8.6 2.4 18.6 2.4 27.2 0l1.2 2.8c-9.5 2.7-20 2.7-29.6 0Z"
      />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        d="M22.8 31.5c2-2 5-2 7-.5m5 0c2-1.5 5-1.5 7 .5"
      />
      <circle
        fill="#1e1b4b"
        cx="26.5"
        cy="34.6"
        r="1.5"
      />
      <circle
        fill="#1e1b4b"
        cx="37.5"
        cy="34.6"
        r="1.5"
      />
      <ellipse
        fill="#f0a184"
        cx="32"
        cy="37.6"
        rx="2.8"
        ry="2.3"
      />
      <path
        fill="#e2e8f0"
        d="M32 40.5c-3-1.6-7.5-1-9.6 2.4 3-.5 6 .5 9.6-.5 3.6 1 6.6 0 9.6.5-2.1-3.4-6.6-4-9.6-2.4Z"
      />
    </>
  ),
  seer: ({ id, url }) => (
    <>
      <defs>
        <radialGradient
          id={id("ball")}
          cx=".38"
          cy=".32"
          r=".78">
          <stop
            offset="0"
            stopColor="#f5f0ff"
          />
          <stop
            offset=".35"
            stopColor="#c4b5fd"
          />
          <stop
            offset=".75"
            stopColor="#8b5cf6"
          />
          <stop
            offset="1"
            stopColor="#5b21b6"
          />
        </radialGradient>
      </defs>
      <path
        fill="#d97706"
        d="M17 51c3 2 27 2 30 0l3.5 7.5c.6 1.5-.5 3.5-2.2 3.5H15.7c-1.7 0-2.8-2-2.2-3.5Z"
      />
      <path
        fill="#92400e"
        d="M13.7 58h36.6l.2.5c.6 1.5-.5 3.5-2.2 3.5H15.7c-1.7 0-2.8-2-2.2-3.5Z"
      />
      <ellipse
        fill="#fbbf24"
        cx="32"
        cy="50.5"
        rx="15"
        ry="3.5"
      />
      <circle
        fill={url("ball")}
        cx="32"
        cy="28"
        r="21"
      />
      <path
        fill="none"
        stroke="#fff"
        strokeOpacity=".35"
        strokeWidth="2"
        strokeLinecap="round"
        d="M16 35c5 5 13 6 20 2m9-17c-3-4-8-6-13-5"
      />
      <path
        fill="#fff"
        d="M19 29c4-6 9-8.5 13-8.5s9 2.5 13 8.5c-4 6-9 8.5-13 8.5s-9-2.5-13-8.5Z"
      />
      <circle
        fill="#0891b2"
        cx="32"
        cy="29"
        r="5.6"
      />
      <circle
        fill="#0f172a"
        cx="32"
        cy="29"
        r="2.6"
      />
      <circle
        fill="#fff"
        cx="34"
        cy="27"
        r="1.4"
      />
      <ellipse
        fill="#fff"
        fillOpacity=".75"
        cx="22"
        cy="15.5"
        rx="5"
        ry="2.8"
        transform="rotate(-35 22 15.5)"
      />
      <path
        fill="#fde047"
        d={`${sparkle(54, 9, 4.5)}${sparkle(9, 17, 3.2)}${sparkle(57, 38, 2.6)}`}
      />
    </>
  ),
  villager: () => (
    <>
      <path
        fill="none"
        stroke="#92400e"
        strokeWidth="3.2"
        strokeLinecap="round"
        d="M53 62 55.5 24"
      />
      <path
        fill="none"
        stroke="#cbd5e1"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M49.5 13v8.5c0 2.2 2.6 3.5 6 3.5s6-1.3 6-3.5V13m-6-2v14"
      />
      <path
        fill="#2563eb"
        d="M7 64c0-9 6.5-15 15-16.5 2 2.6 5 4 8 4s6-1.4 8-4C46.5 49 53 55 53 64Z"
      />
      <path
        fill="#93c5fd"
        d="M22 47.5c2 2.6 5 4 8 4s6-1.4 8-4l2.4 1-5 6.5-5.4-3-5.4 3-5-6.5Z"
      />
      <path
        fill="#e3a57a"
        d="M25.5 40h9v8c-1.2 1.4-2.8 2.2-4.5 2.2s-3.3-.8-4.5-2.2Z"
      />
      <circle
        fill="#f2c094"
        cx="30"
        cy="33"
        r="11"
      />
      <path
        fill="#78350f"
        d="M19 31c0-3 1-5.5 3-7.5h16c2 2 3 4.5 3 7.5-2-2-3.5-2.5-5-2.5H24c-1.5 0-3 .5-5 2.5Z"
      />
      <path
        fill="#facc15"
        d="M18.5 24c0-9 5-14.5 11.5-14.5S41.5 15 41.5 24Z"
      />
      <path
        fill="none"
        stroke="#ca8a04"
        strokeWidth="1.2"
        strokeLinecap="round"
        d="M24 13.5c.8 1.2 1.2 2.4 1.3 3.5M30 11v6m6-3.5c-.8 1.2-1.2 2.4-1.3 3.5"
      />
      <path
        fill="#dc2626"
        d="M19.6 17h20.8c.5 1.2.8 2.5 1 4H18.6c.2-1.5.5-2.8 1-4Z"
      />
      <ellipse
        fill="#eab308"
        cx="30"
        cy="24.5"
        rx="18"
        ry="4"
      />
      <circle
        fill="#3b2416"
        cx="25.8"
        cy="33"
        r="1.4"
      />
      <circle
        fill="#3b2416"
        cx="34.2"
        cy="33"
        r="1.4"
      />
      <ellipse
        fill="#f87171"
        fillOpacity=".4"
        cx="22.8"
        cy="37"
        rx="2.4"
        ry="1.5"
      />
      <ellipse
        fill="#f87171"
        fillOpacity=".4"
        cx="37.2"
        cy="37"
        rx="2.4"
        ry="1.5"
      />
      <path
        fill="none"
        stroke="#8b3a1e"
        strokeWidth="1.6"
        strokeLinecap="round"
        d="M26.5 38.5c2 1.8 5 1.8 7 0"
      />
    </>
  ),

  // Who's playing, and the role cards
  users: () => (
    <>
      <path
        fill="#ec4899"
        d="M3 52c0-9 5.5-15 13-15s13 6 13 15Z"
      />
      <circle
        fill="#f2c094"
        cx="16"
        cy="25"
        r="7.5"
      />
      <path
        fill="#7c2d12"
        d="M8.5 24.5c0-5 3.3-8 7.5-8s7.5 3 7.5 8c-1.8-2-4.4-3-7.5-3s-5.7 1-7.5 3Z"
      />
      <path
        fill="#14b8a6"
        d="M35 52c0-9 5.5-15 13-15s13 6 13 15Z"
      />
      <circle
        fill="#c68642"
        cx="48"
        cy="25"
        r="7.5"
      />
      <path
        fill="#3f2a1d"
        d="M40.5 24.5c0-5 3.3-8 7.5-8s7.5 3 7.5 8c-1.8-2-4.4-3-7.5-3s-5.7 1-7.5 3Z"
      />
      <path
        fill="#8b5cf6"
        stroke="#0c0e22"
        strokeWidth="2.5"
        d="M14.5 62c0-11.5 7.5-19 17.5-19s17.5 7.5 17.5 19Z"
      />
      <circle
        fill="#f8cfb0"
        stroke="#0c0e22"
        strokeWidth="2.5"
        cx="32"
        cy="29.5"
        r="9.5"
      />
      <path
        fill="#f59e0b"
        d="M22.5 29c0-6.5 4.3-10 9.5-10s9.5 3.5 9.5 10c-2.3-2.7-5.6-4.2-9.5-4.2s-7.2 1.5-9.5 4.2Z"
      />
      <path
        fill="#3b2416"
        d="M28.8 30a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Zm6.4 0a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4ZM13.8 25.3a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8Zm4.4 0a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8Zm27.6 0a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8Zm4.4 0a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8Z"
      />
      <path
        fill="none"
        stroke="#8b3a1e"
        strokeWidth="1.5"
        strokeLinecap="round"
        d="M29 35c1.8 1.5 4.2 1.5 6 0"
      />
    </>
  ),
  cards: () => (
    <>
      <g transform="rotate(-15 21 36)">
        <rect
          fill="#be123c"
          x="7"
          y="15"
          width="28"
          height="40"
          rx="4.5"
        />
        <rect
          fill="none"
          stroke="#fda4af"
          strokeOpacity=".7"
          strokeWidth="1.5"
          x="10"
          y="18"
          width="22"
          height="34"
          rx="2.5"
        />
        <path
          fill="#fff1f2"
          d="M14.5 29l1-7.5 4.5 4.2h2l4.5-4.2 1 7.5-1.8 7.3L21 41l-4.7-4.7Z"
        />
        <path
          fill="#be123c"
          d="M17.4 30.2l3 1.3-3 .9Zm7.2 0-3 1.3 3 .9Z"
        />
      </g>
      <g transform="rotate(12 43 34)">
        <rect
          fill="#fdf6e3"
          x="29"
          y="12"
          width="28"
          height="40"
          rx="4.5"
        />
        <rect
          fill="none"
          stroke="#d6c39a"
          strokeWidth="1.5"
          x="32"
          y="15"
          width="22"
          height="34"
          rx="2.5"
        />
        <circle
          fill="#2563eb"
          cx="43"
          cy="27"
          r="5"
        />
        <path
          fill="#2563eb"
          d="M34.5 42c0-5.5 3.8-9 8.5-9s8.5 3.5 8.5 9Z"
        />
      </g>
    </>
  ),

  // Night and day
  moon: ({ id, url }) => (
    <>
      <defs>
        <linearGradient
          id={id("moon")}
          x1="0"
          y1="0"
          x2="1"
          y2="1">
          <stop
            offset="0"
            stopColor="#fef9c3"
          />
          <stop
            offset="1"
            stopColor="#facc15"
          />
        </linearGradient>
      </defs>
      <path
        fill={url("moon")}
        d={MOON}
      />
      <path
        fill="#ca8a04"
        fillOpacity=".4"
        d="M20.5 35a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm8.5 13.3a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4ZM18.5 24.4a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2Z"
      />
      <path
        fill="#fef3c7"
        d={`${sparkle(46, 17, 6)}${sparkle(55, 33, 3.6)}${sparkle(38.5, 29, 2.6)}`}
      />
    </>
  ),
  sunrise: ({ id, url }) => (
    <>
      <defs>
        <linearGradient
          id={id("sun")}
          x1="0"
          y1="0"
          x2="0"
          y2="1">
          <stop
            offset="0"
            stopColor="#fef08a"
          />
          <stop
            offset="1"
            stopColor="#f97316"
          />
        </linearGradient>
      </defs>
      <path
        fill="#fb923c"
        d={DAWN_RAYS}
      />
      <path
        fill={url("sun")}
        d="M16 44a16 16 0 0 1 32 0Z"
      />
      <path
        fill="#5b21b6"
        d="M2 44h60v13c0 1.7-1.3 3-3 3H5c-1.7 0-3-1.3-3-3Z"
      />
      <path
        fill="none"
        stroke="#fb923c"
        strokeWidth="2.6"
        strokeLinecap="round"
        d="M20 49h24m-19 4.8h14m-10 4.4h6"
      />
    </>
  ),
  sun: ({ id, url }) => (
    <>
      <defs>
        <radialGradient
          id={id("sun")}
          cx=".4"
          cy=".38"
          r=".7">
          <stop
            offset="0"
            stopColor="#fef9c3"
          />
          <stop
            offset=".55"
            stopColor="#fde047"
          />
          <stop
            offset="1"
            stopColor="#f59e0b"
          />
        </radialGradient>
      </defs>
      <path
        fill="#f97316"
        d={SUN_LONG_RAYS}
      />
      <path
        fill="#fbbf24"
        d={SUN_SHORT_RAYS}
      />
      <circle
        fill={url("sun")}
        cx="32"
        cy="32"
        r="15"
      />
      <path
        fill="none"
        stroke="#fff"
        strokeOpacity=".6"
        strokeWidth="2.2"
        strokeLinecap="round"
        d="M23.5 27a10 10 0 0 1 6-6"
      />
    </>
  ),
  vote: () => (
    <>
      <path
        fill="#1d4ed8"
        d="M10 30h44v25c0 2.8-2.2 5-5 5H15c-2.8 0-5-2.2-5-5Z"
      />
      <path
        fill="#2563eb"
        d="M10 30h22v30H15c-2.8 0-5-2.2-5-5Z"
      />
      <path
        fill="#93c5fd"
        d="M7 26.5C7 24.6 8.6 23 10.5 23h43c1.9 0 3.5 1.6 3.5 3.5V31H7Z"
      />
      <rect
        fill="#1e3a8a"
        x="19"
        y="25"
        width="26"
        height="3.6"
        rx="1.8"
      />
      <rect
        fill="#fff"
        x="22.5"
        y="3"
        width="19"
        height="24"
        rx="2.5"
      />
      <path
        fill="none"
        stroke="#cbd5e1"
        strokeWidth="1.8"
        strokeLinecap="round"
        d="M26.5 8.5h11"
      />
      <path
        fill="none"
        stroke="#e11d48"
        strokeWidth="3.2"
        strokeLinecap="round"
        d="M27.5 13.5l9 9m0-9-9 9"
      />
      <path
        fill="#fff"
        fillOpacity=".9"
        d={star(32, 45, 7.5)}
      />
    </>
  ),
  trophy: ({ id, url }) => (
    <>
      <defs>
        <linearGradient
          id={id("gold")}
          x1="0"
          y1="0"
          x2="1"
          y2="0">
          <stop
            offset="0"
            stopColor="#fde68a"
          />
          <stop
            offset=".5"
            stopColor="#fbbf24"
          />
          <stop
            offset="1"
            stopColor="#d97706"
          />
        </linearGradient>
      </defs>
      <path
        fill="none"
        stroke="#f59e0b"
        strokeWidth="4"
        strokeLinecap="round"
        d="M17 13h-7c-1.5 0-2.5 1-2.5 2.5C7.5 23 12 28.5 19 30m28-17h7c1.5 0 2.5 1 2.5 2.5 0 7.5-4.5 13-11.5 14.5"
      />
      <path
        fill={url("gold")}
        d="M16 7h32v15c0 9.4-7.2 17-16 17s-16-7.6-16-17Z"
      />
      <rect
        fill="#fde68a"
        x="13"
        y="5"
        width="38"
        height="5"
        rx="2"
      />
      <path
        fill="#d97706"
        d="M28.5 38h7l1.5 9h-10Z"
      />
      <rect
        fill="#fbbf24"
        x="22"
        y="46"
        width="20"
        height="4.5"
        rx="1.5"
      />
      <rect
        fill="#7c2d12"
        x="16"
        y="50"
        width="32"
        height="10"
        rx="2.5"
      />
      <rect
        fill="#fcd34d"
        x="24"
        y="53"
        width="16"
        height="4"
        rx="1"
      />
      <path
        fill="#fffbeb"
        d={star(32, 21.5, 7)}
      />
      <path
        fill="none"
        stroke="#fff"
        strokeOpacity=".7"
        strokeWidth="2.4"
        strokeLinecap="round"
        d="M20.5 13v8.5c0 3 1 6 2.5 8"
      />
      <path
        fill="#fde047"
        d={`${sparkle(7, 40, 3.2)}${sparkle(57.5, 41, 2.6)}`}
      />
    </>
  ),

  // Life and death
  skull: () => (
    <>
      <path
        fill="#f1f5f9"
        d="M32 5C18.7 5 9 14.5 9 27.5c0 8.3 4 13.8 9.5 17V51c0 3 2.5 5.5 5.5 5.5h16c3 0 5.5-2.5 5.5-5.5v-6.5c5.5-3.2 9.5-8.7 9.5-17C55 14.5 45.3 5 32 5Z"
      />
      <path
        fill="#cbd5e1"
        d="M45.5 44.5V51c0 3-2.5 5.5-5.5 5.5h-4c3 0 5.5-2.5 5.5-5.5v-8c5.5-3.2 9.5-8.7 9.5-16 0-9.5-5.5-17.5-14-20.5C45.3 9 55 17 55 27.5c0 8.3-4 13.8-9.5 17Z"
      />
      <path
        fill="#1e1b2e"
        d="M16 28.5c0-5 4.8-7.5 9-6 3.6 1.3 4.5 6 2 9.5-2.4 3.4-11 3.5-11-3.5Zm32 0c0-5-4.8-7.5-9-6-3.6 1.3-4.5 6-2 9.5 2.4 3.4 11 3.5 11-3.5ZM32 35.5 28.8 42h6.4Z"
      />
      <path
        fill="none"
        stroke="#94a3b8"
        strokeWidth="1.8"
        strokeLinecap="round"
        d="M26 48v6m6-6v7m6-7v6"
      />
      <path
        fill="none"
        stroke="#94a3b8"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M37 7.5 35 12l3 2.5-1.5 4"
      />
    </>
  ),
  heart: ({ id, url }) => (
    <>
      <defs>
        <linearGradient
          id={id("heart")}
          x1="0"
          y1="0"
          x2="0"
          y2="1">
          <stop
            offset="0"
            stopColor="#fb7185"
          />
          <stop
            offset="1"
            stopColor="#e11d48"
          />
        </linearGradient>
      </defs>
      <path
        fill={url("heart")}
        d="M32 57S5 41.5 5 22.5C5 13.4 11.6 7 20 7c5.3 0 9.6 2.9 12 7 2.4-4.1 6.7-7 12-7 8.4 0 15 6.4 15 15.5C59 41.5 32 57 32 57Z"
      />
      <ellipse
        fill="#fff"
        fillOpacity=".55"
        cx="17"
        cy="17"
        rx="5"
        ry="3.2"
        transform="rotate(-35 17 17)"
      />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 31h11l3.5-7 5 15 4.5-11 2.5 3H54"
      />
    </>
  ),
  heal: ({ id, url }) => (
    <>
      <defs>
        <linearGradient
          id={id("potion")}
          x1="0"
          y1="0"
          x2="0"
          y2="1">
          <stop
            offset="0"
            stopColor="#86efac"
          />
          <stop
            offset="1"
            stopColor="#16a34a"
          />
        </linearGradient>
      </defs>
      <path
        fill="#e0f2fe"
        fillOpacity=".2"
        stroke="#e0f2fe"
        strokeOpacity=".75"
        strokeWidth="2"
        d="M26 10h12v12.5C46 25.5 51 32.5 51 41c0 10.5-8.5 19-19 19s-19-8.5-19-19c0-8.5 5-15.5 13-18.5Z"
      />
      <path
        fill={url("potion")}
        d="M14.2 37.5c5.8-2.6 11.6-2.2 17.8.3 6 2.4 11.8 2.6 17.8.2.5 1 .7 2.2.7 3 0 9.9-8 18-18.5 18S13.5 51 13.5 41c0-1.2.3-2.4.7-3.5Z"
      />
      <path
        fill="#fff"
        d="M32 53.5s-7-4.3-7-9c0-2.2 1.6-3.8 3.6-3.8 1.4 0 2.6.8 3.4 2 .8-1.2 2-2 3.4-2 2 0 3.6 1.6 3.6 3.8 0 4.7-7 9-7 9Z"
      />
      <rect
        fill="#b45309"
        x="25"
        y="3"
        width="14"
        height="8.5"
        rx="2.5"
      />
      <rect
        fill="#d97706"
        x="25"
        y="3"
        width="14"
        height="3"
        rx="1.5"
      />
      <path
        fill="#fff"
        fillOpacity=".75"
        d="M22 43.2a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6Zm20 2.4a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8ZM38 32.8a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z"
      />
      <path
        fill="none"
        stroke="#fff"
        strokeOpacity=".7"
        strokeWidth="2.4"
        strokeLinecap="round"
        d="M18.5 35c-1 4 .2 9 3 12"
      />
      <path
        fill="#fde047"
        d={`${sparkle(52, 14, 4)}${sparkle(11, 22, 2.6)}`}
      />
    </>
  ),
  poison: ({ id, url }) => (
    <>
      <defs>
        <linearGradient
          id={id("potion")}
          x1="0"
          y1="0"
          x2="0"
          y2="1">
          <stop
            offset="0"
            stopColor="#c084fc"
          />
          <stop
            offset="1"
            stopColor="#7e22ce"
          />
        </linearGradient>
      </defs>
      <path
        fill="#4ade80"
        d="M42 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"
      />
      <path
        fill="#4ade80"
        fillOpacity=".65"
        d="M48 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM38 1a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z"
      />
      <path
        fill="#e0f2fe"
        fillOpacity=".2"
        stroke="#e0f2fe"
        strokeOpacity=".75"
        strokeWidth="2"
        d="M26.5 12h11v8C44 21.5 49 26.5 49 33v20c0 3.9-3.1 7-7 7H22c-3.9 0-7-3.1-7-7V33c0-6.5 5-11.5 11.5-13Z"
      />
      <path
        fill={url("potion")}
        d="M16 34c5.5-2 11-1.5 16 .5s10.5 2.5 16 .5V53c0 3.3-2.7 6-6 6H22c-3.3 0-6-2.7-6-6Z"
      />
      <rect
        fill="#f5f5f4"
        x="21"
        y="38"
        width="22"
        height="16"
        rx="3"
      />
      <path
        fill="#1f2937"
        d="M32 40.5c-3.3 0-5.5 2.2-5.5 5 0 1.8.9 3.1 2 3.8v1.4c0 .7.6 1.3 1.3 1.3h4.4c.7 0 1.3-.6 1.3-1.3v-1.4c1.1-.7 2-2 2-3.8 0-2.8-2.2-5-5.5-5Z"
      />
      <path
        fill="#f5f5f4"
        d="M29.8 44.5a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6Zm4.4 0a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6Z"
      />
      <rect
        fill="#7c2d12"
        x="25"
        y="6"
        width="14"
        height="7.5"
        rx="2.2"
      />
      <rect
        fill="#a16207"
        x="25"
        y="6"
        width="14"
        height="2.6"
        rx="1.3"
      />
      <path
        fill="none"
        stroke="#fff"
        strokeOpacity=".65"
        strokeWidth="2.2"
        strokeLinecap="round"
        d="M19.5 37v12"
      />
    </>
  ),
  innocent: ({ id, url }) => (
    <>
      <defs>
        <linearGradient
          id={id("ok")}
          x1="0"
          y1="0"
          x2="0"
          y2="1">
          <stop
            offset="0"
            stopColor="#4ade80"
          />
          <stop
            offset="1"
            stopColor="#16a34a"
          />
        </linearGradient>
      </defs>
      <path
        fill="#60a5fa"
        d="M5 61c0-12.5 9-21 21-21s21 8.5 21 21Z"
      />
      <path
        fill="#e3a57a"
        d="M21.5 34h9v7c-1.2 1.6-2.7 2.4-4.5 2.4s-3.3-.8-4.5-2.4Z"
      />
      <circle
        fill="#f2c094"
        cx="26"
        cy="24"
        r="11.5"
      />
      <path
        fill="#78350f"
        d="M14.5 23.5C14.5 15.8 19.6 11 26 11s11.5 4.8 11.5 12.5c-2.6-3.4-6.6-5.5-11.5-5.5s-8.9 2.1-11.5 5.5Z"
      />
      <path
        fill="#3b2416"
        d="M22 24a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm8 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z"
      />
      <path
        fill="none"
        stroke="#8b3a1e"
        strokeWidth="1.7"
        strokeLinecap="round"
        d="M22.5 30.5c2 1.8 5 1.8 7 0"
      />
      <circle
        fill="#fff"
        cx="46"
        cy="46"
        r="15"
      />
      <circle
        fill={url("ok")}
        cx="46"
        cy="46"
        r="12.5"
      />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="3.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M39.8 46.3l4.3 4.3 8-8.6"
      />
    </>
  ),

  // Telling the table, tapping, timing
  mask: () => (
    <>
      <path
        fill="#2dd4bf"
        d="M47 22C46 13 50 6 58 2c1 8-3 15-11 20Z"
      />
      <path
        fill="#f472b6"
        d="M42 21c-2-8 0-14 6-19 2.5 7 .5 13-6 19Z"
      />
      <path
        fill="none"
        stroke="#fbbf24"
        strokeWidth="3"
        strokeLinecap="round"
        d="M51 41l6 20"
      />
      <path
        fill="#7c3aed"
        fillRule="evenodd"
        stroke="#fbbf24"
        strokeWidth="2"
        strokeLinejoin="round"
        d="M4 27c7-6 16-6.5 22-3 3 1.8 4.5 2.5 6 2.5s3-.7 6-2.5c6-3.5 15-3 22 3-1 10-8 18-17 18-6 0-8-4-11-4s-5 4-11 4c-9 0-16-8-17-18Zm9.5 5c2-3.5 8-4 11.5 0-3.5 3.5-9.5 3.5-11.5 0Zm37 0c-2-3.5-8-4-11.5 0 3.5 3.5 9.5 3.5 11.5 0Z"
      />
      <path
        fill="#fde68a"
        d="M32 31.8a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4ZM13 22.3a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Zm38 0a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z"
      />
    </>
  ),
  secret: () => (
    <>
      <path
        fill="#e2e8f0"
        d="M4 32c7.5-12 17.5-18 28-18s20.5 6 28 18c-7.5 12-17.5 18-28 18S11.5 44 4 32Z"
      />
      <circle
        fill="#3b82f6"
        cx="32"
        cy="32"
        r="11"
      />
      <circle
        fill="#0f172a"
        cx="32"
        cy="32"
        r="5"
      />
      <circle
        fill="#fff"
        cx="35.5"
        cy="28.5"
        r="2.2"
      />
      <path
        fill="none"
        stroke="#7f1d1d"
        strokeWidth="9"
        strokeLinecap="round"
        d="M11 53 53 11"
      />
      <path
        fill="none"
        stroke="#ef4444"
        strokeWidth="5.5"
        strokeLinecap="round"
        d="M11 53 53 11"
      />
    </>
  ),
  megaphone: () => (
    <>
      <path
        fill="#94a3b8"
        d="M19 37l2.5 12c.3 1.3 1.4 2 2.6 2h2.4c1.4 0 2.4-1.3 2.1-2.6L26.5 39Z"
      />
      <rect
        fill="#e2e8f0"
        x="4"
        y="26"
        width="8"
        height="12"
        rx="2.5"
      />
      <path
        fill="#ef4444"
        d="M11 25 37 12v40L11 39Z"
      />
      <path
        fill="#f87171"
        d="M11 25 37 12v10L11 30Z"
      />
      <ellipse
        fill="#fecaca"
        cx="37"
        cy="32"
        rx="4"
        ry="20"
      />
      <ellipse
        fill="#b91c1c"
        cx="37.6"
        cy="32"
        rx="2.2"
        ry="16"
      />
      <path
        fill="none"
        stroke="#fbbf24"
        strokeWidth="3.2"
        strokeLinecap="round"
        d="M47 23c3 5.5 3 12.5 0 18m6.5-24c5 9 5 21 0 30"
      />
    </>
  ),
  tap: () => (
    <>
      <path
        fill="none"
        stroke="#fbbf24"
        strokeWidth="2.6"
        strokeLinecap="round"
        d="M26 1.5V6m-9.5-.5 3 3m16-3-3 3"
      />
      <path
        fill="#f5c39b"
        d="M22 41V15c0-2.5 1.8-4 4-4s4 1.5 4 4v16.5c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5V33c0-2 1.8-3.3 4-3.3s4 1.4 4 3.4V35c0-2 1.6-3 3.5-3s3.5 1.3 3.5 3.5V46c0 8.5-6 14-14 14h-5c-5 0-8.5-2.5-11.5-7l-6.5-9.5c-1.3-2-.8-4.3 1-5.5s4.3-.8 5.6 1.1Z"
      />
      <path
        fill="#fde4d0"
        d="M23.6 15.3c0-1.6 1-2.6 2.4-2.6s2.4 1 2.4 2.6v2.4h-4.8Z"
      />
      <path
        fill="none"
        stroke="#d99a72"
        strokeWidth="1.4"
        strokeLinecap="round"
        d="M30 31.5V37m8-4v5m8-3v4.5"
      />
      <path
        fill="#3b82f6"
        d="M24 55h27v7c0 1.1-.9 2-2 2H26c-1.1 0-2-.9-2-2Z"
      />
    </>
  ),
  timer: () => (
    <>
      <path
        fill="#92400e"
        d="M15 9h4v46h-4Zm30 0h4v46h-4Z"
      />
      <path
        fill="#e0f2fe"
        fillOpacity=".22"
        stroke="#bae6fd"
        strokeOpacity=".8"
        strokeWidth="1.6"
        d="M20 10h24c0 10.5-6 16.5-10 22 4 5.5 10 11.5 10 22H20c0-10.5 6-16.5 10-22-4-5.5-10-11.5-10-22Z"
      />
      <path
        fill="#fbbf24"
        d="M23 16.5h18c-1 5-4.5 9.5-9 13.5-4.5-4-8-8.5-9-13.5Z"
      />
      <path
        fill="#f59e0b"
        d="M21.5 53c.8-5.5 5-9.5 10.5-10.5 5.5 1 9.7 5 10.5 10.5Z"
      />
      <path
        fill="none"
        stroke="#fbbf24"
        strokeWidth="1.6"
        d="M32 30v13"
      />
      <path
        fill="#d97706"
        d="M14.5 4h35a3.5 3.5 0 0 1 0 7h-35a3.5 3.5 0 0 1 0-7Zm0 49h35a3.5 3.5 0 0 1 0 7h-35a3.5 3.5 0 0 1 0-7Z"
      />
      <path
        fill="#fbbf24"
        fillOpacity=".55"
        d="M15 5.3h34a.9.9 0 0 1 0 1.8H15a.9.9 0 0 1 0-1.8Zm0 49h34a.9.9 0 0 1 0 1.8H15a.9.9 0 0 1 0-1.8Z"
      />
      <path
        fill="none"
        stroke="#fff"
        strokeOpacity=".65"
        strokeWidth="1.8"
        strokeLinecap="round"
        d="M23.5 14c.4 4.5 2.4 8.3 5.5 11.5"
      />
    </>
  ),

  // Menu and setup
  timeline: () => (
    <>
      <path
        fill="#fef3c7"
        d="M12 9h40v46H12Z"
      />
      <path
        fill="none"
        stroke="#e2cc94"
        strokeWidth="1.6"
        strokeDasharray="2 2.5"
        d="M20 24v13"
      />
      <path
        fill="#d6a964"
        d="M12.5 4h39a4.5 4.5 0 0 1 0 9h-39a4.5 4.5 0 0 1 0-9Zm0 47h39a4.5 4.5 0 0 1 0 9h-39a4.5 4.5 0 0 1 0-9Z"
      />
      <path
        fill="#b7853f"
        d="M12.5 4a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm39 0a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm-39 47a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm39 0a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z"
      />
      <path
        fill="#4f46e5"
        transform="translate(14 14) scale(.17)"
        d={MOON}
      />
      <path
        fill="#f97316"
        d={SMALL_SUN_RAYS}
      />
      <circle
        fill="#fbbf24"
        cx="20"
        cy="30.5"
        r="3.4"
      />
      <path
        fill="#4f46e5"
        transform="translate(14 36) scale(.17)"
        d={MOON}
      />
      <path
        fill="none"
        stroke="#a8a29e"
        strokeWidth="2.2"
        strokeLinecap="round"
        d="M28 17.5h18M28 21.5h11m-11 7h18m-18 4h13m-13 7h18m-18 4h9"
      />
    </>
  ),
  book: () => (
    <>
      <path
        fill="#b91c1c"
        d="M3 20c0-1.1.9-2 2-2h2v35c8.5-1.5 17-.5 25 3.5 8-4 16.5-5 25-3.5V18h2c1.1 0 2 .9 2 2v37.5c0 1.2-1 2.1-2.2 2-9.4-1-18.2.3-26.8 4.3-8.6-4-17.4-5.3-26.8-4.3-1.2.1-2.2-.8-2.2-2Z"
      />
      <path
        fill="#fffbeb"
        d="M7 13.5c8.6-2.2 17-1.2 25 3.2v38.8c-8-4-16.4-5-25-3.3Z"
      />
      <path
        fill="#fef3c7"
        d="M57 13.5c-8.6-2.2-17-1.2-25 3.2v38.8c8-4 16.4-5 25-3.3Z"
      />
      <path
        fill="none"
        stroke="#a8a29e"
        strokeWidth="1.8"
        strokeLinecap="round"
        d="M12 21.5c4.6-.9 9.3-.5 14 1.2M12 28c4.6-.9 9.3-.5 14 1.2M12 34.5c4.6-.9 9.3-.5 14 1.2M12 41c4.6-.9 9.3-.5 10 .3M38 43.5c4.6-1.7 9.4-2.1 14-1.2M38 49.5c4.6-1.7 9.4-2.1 14-1.2"
      />
      <path
        fill="#7c3aed"
        d="M44.5 28.6c2.9 0 5.2 2 5.2 4.4s-2.3 4.4-5.2 4.4-5.2-2-5.2-4.4 2.3-4.4 5.2-4.4ZM38.8 25.4a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm3.7-3.3a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 0 1 0-4.2Zm4.3 0a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 0 1 0-4.2Zm3.6 3.3a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"
      />
      <path
        fill="#7c3aed"
        d="M35.5 55h5v8.5l-2.5-2-2.5 2Z"
      />
    </>
  ),
  pencil: () => (
    <g transform="rotate(-45 32 32)">
      <path
        fill="#f4c99a"
        d="M13 25v14l-9-7Z"
      />
      <path
        fill="#475569"
        d="M7 29.7v4.6L4 32Z"
      />
      <path
        fill="#fbbf24"
        d="M13 25h32v14H13Z"
      />
      <path
        fill="#fde68a"
        d="M13 25h32v4.5H13Z"
      />
      <path
        fill="#f59e0b"
        d="M13 34.5h32V39H13Z"
      />
      <path
        fill="#cbd5e1"
        d="M45 25h6v14h-6Z"
      />
      <path
        fill="none"
        stroke="#94a3b8"
        strokeWidth="1.2"
        d="M47 25v14m2-14v14"
      />
      <path
        fill="#f472b6"
        d="M51 25h5c1.7 0 3 1.3 3 3v8c0 1.7-1.3 3-3 3h-5Z"
      />
    </g>
  ),
  restart: () => (
    <>
      <path
        fill="none"
        stroke="#34d399"
        strokeWidth="6.5"
        strokeLinecap="round"
        d="M49.9 25.5A19 19 0 0 0 14.1 25.5"
      />
      <path
        fill="#34d399"
        d="M11.7 32.1 8.8 22.5l11.3 4.1Z"
      />
      <path
        fill="none"
        stroke="#60a5fa"
        strokeWidth="6.5"
        strokeLinecap="round"
        d="M14.1 38.5A19 19 0 0 0 49.9 38.5"
      />
      <path
        fill="#60a5fa"
        d="M52.3 31.9l2.9 9.6-11.3-4.1Z"
      />
      <path
        fill="#fde047"
        d="M27 24.5v15c0 .8.9 1.3 1.6.9l11.8-7.5c.6-.4.6-1.3 0-1.7l-11.8-7.5c-.7-.5-1.6 0-1.6.8Z"
      />
    </>
  ),
  copy: () => (
    <>
      <rect
        fill="#b45309"
        x="11"
        y="8"
        width="42"
        height="54"
        rx="5"
      />
      <rect
        fill="#fff"
        x="16"
        y="15"
        width="32"
        height="42"
        rx="2"
      />
      <path
        fill="none"
        stroke="#94a3b8"
        strokeWidth="2.2"
        strokeLinecap="round"
        d="M21 25h22M21 32h22M21 39h16M21 46h19"
      />
      <path
        fill="#cbd5e1"
        d="M23 5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v7c0 1.7-1.3 3-3 3H26c-1.7 0-3-1.3-3-3Z"
      />
      <circle
        fill="#64748b"
        cx="32"
        cy="7.5"
        r="2"
      />
    </>
  ),
  trash: () => (
    <>
      <path
        fill="#ef4444"
        d="M14 19h36l-3.2 37.5c-.2 2.5-2.3 4.5-4.8 4.5H22c-2.5 0-4.6-2-4.8-4.5Z"
      />
      <path
        fill="none"
        stroke="#b91c1c"
        strokeWidth="2.6"
        strokeLinecap="round"
        d="M25 27v26m7-26v26m7-26v26"
      />
      <path
        fill="none"
        stroke="#fca5a5"
        strokeWidth="3"
        d="M25 12V8.5C25 7.1 26.1 6 27.5 6h9C37.9 6 39 7.1 39 8.5V12"
      />
      <rect
        fill="#fca5a5"
        x="10"
        y="12"
        width="44"
        height="7.5"
        rx="3.75"
      />
    </>
  ),
  install: ({ id, url }) => (
    <>
      <defs>
        <linearGradient
          id={id("screen")}
          x1="0"
          y1="0"
          x2="1"
          y2="1">
          <stop
            offset="0"
            stopColor="#3b82f6"
          />
          <stop
            offset="1"
            stopColor="#7c3aed"
          />
        </linearGradient>
      </defs>
      <rect
        fill="#334155"
        stroke="#94a3b8"
        strokeWidth="2"
        x="13"
        y="3"
        width="30"
        height="56"
        rx="6"
      />
      <rect
        fill={url("screen")}
        x="16.5"
        y="9"
        width="23"
        height="44"
        rx="2.5"
      />
      <path
        fill="#fef3c7"
        transform="translate(17.5 15) scale(.32)"
        d={MOON}
      />
      <path
        fill="#fff"
        d={sparkle(33, 18, 2.2)}
      />
      <circle
        fill="#fff"
        cx="45"
        cy="45"
        r="14"
      />
      <circle
        fill="#22c55e"
        cx="45"
        cy="45"
        r="11.5"
      />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M45 38v13m-5.5-5.5L45 51l5.5-5.5"
      />
    </>
  ),
  phone: () => (
    <>
      <rect
        fill="#334155"
        stroke="#94a3b8"
        strokeWidth="2"
        x="15"
        y="3"
        width="34"
        height="58"
        rx="6.5"
      />
      <rect
        fill="#1e1b4b"
        x="18.5"
        y="9"
        width="27"
        height="44"
        rx="2.5"
      />
      <rect
        fill="#f87171"
        x="19.9"
        y="13"
        width="6.5"
        height="6.5"
        rx="1.8"
      />
      <rect
        fill="#fbbf24"
        x="28.8"
        y="13"
        width="6.5"
        height="6.5"
        rx="1.8"
      />
      <rect
        fill="#4ade80"
        x="37.6"
        y="13"
        width="6.5"
        height="6.5"
        rx="1.8"
      />
      <rect
        fill="#60a5fa"
        x="19.9"
        y="22"
        width="6.5"
        height="6.5"
        rx="1.8"
      />
      <rect
        fill="#a78bfa"
        x="28.8"
        y="22"
        width="6.5"
        height="6.5"
        rx="1.8"
      />
      <rect
        fill="#f472b6"
        x="37.6"
        y="22"
        width="6.5"
        height="6.5"
        rx="1.8"
      />
      <rect
        fill="#2dd4bf"
        x="19.9"
        y="31"
        width="6.5"
        height="6.5"
        rx="1.8"
      />
      <rect
        fill="#fb923c"
        x="28.8"
        y="31"
        width="6.5"
        height="6.5"
        rx="1.8"
      />
      <rect
        fill="#e879f9"
        x="37.6"
        y="31"
        width="6.5"
        height="6.5"
        rx="1.8"
      />
      <rect
        fill="#94a3b8"
        x="27"
        y="49"
        width="10"
        height="1.6"
        rx=".8"
      />
    </>
  ),
  offline: () => (
    <>
      <path
        fill="none"
        stroke="#60a5fa"
        strokeWidth="5"
        strokeLinecap="round"
        d="M3 25c14-13 36-13 50 0m-42 9c9-8.5 25-8.5 34 0m-26 9c5-4.5 13-4.5 18 0"
      />
      <circle
        fill="#60a5fa"
        cx="28"
        cy="51"
        r="4"
      />
      <circle
        fill="#fff"
        cx="49"
        cy="47"
        r="12.5"
      />
      <circle
        fill="#ef4444"
        cx="49"
        cy="47"
        r="10"
      />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="3.4"
        strokeLinecap="round"
        d="M44.8 42.8l8.4 8.4m0-8.4-8.4 8.4"
      />
    </>
  ),

  // Signs
  warning: ({ id, url }) => (
    <>
      <defs>
        <linearGradient
          id={id("sign")}
          x1="0"
          y1="0"
          x2="0"
          y2="1">
          <stop
            offset="0"
            stopColor="#fde047"
          />
          <stop
            offset="1"
            stopColor="#f59e0b"
          />
        </linearGradient>
      </defs>
      <path
        fill={url("sign")}
        d="M27.7 8.5c1.9-3.3 6.7-3.3 8.6 0l23 40c1.9 3.3-.5 7.5-4.3 7.5H9c-3.8 0-6.2-4.2-4.3-7.5Z"
      />
      <path
        fill="#422006"
        d="M29 22.5c0-1.7 1.3-3 3-3s3 1.3 3 3l-.8 15c-.1 1.2-1 2-2.2 2s-2.1-.8-2.2-2ZM32 43.3a3.2 3.2 0 1 1 0 6.4 3.2 3.2 0 0 1 0-6.4Z"
      />
    </>
  ),
  ban: () => (
    <>
      <circle
        fill="#fff"
        cx="32"
        cy="32"
        r="27"
      />
      <circle
        fill="#94a3b8"
        cx="32"
        cy="24"
        r="8"
      />
      <path
        fill="#94a3b8"
        d="M17.5 50c0-8.5 6.5-14.5 14.5-14.5S46.5 41.5 46.5 50Z"
      />
      <circle
        fill="none"
        stroke="#ef4444"
        strokeWidth="6"
        cx="32"
        cy="32"
        r="26"
      />
      <path
        fill="none"
        stroke="#ef4444"
        strokeWidth="6"
        d="M13.6 13.6 50.4 50.4"
      />
    </>
  ),
  checkCircle: ({ id, url }) => (
    <>
      <defs>
        <linearGradient
          id={id("ok")}
          x1="0"
          y1="0"
          x2="0"
          y2="1">
          <stop
            offset="0"
            stopColor="#4ade80"
          />
          <stop
            offset="1"
            stopColor="#16a34a"
          />
        </linearGradient>
      </defs>
      <circle
        fill={url("ok")}
        cx="32"
        cy="32"
        r="27"
      />
      <ellipse
        fill="#fff"
        fillOpacity=".3"
        cx="24"
        cy="16"
        rx="9"
        ry="4.5"
        transform="rotate(-25 24 16)"
      />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 33l8.5 8.5 17-18"
      />
    </>
  ),
  question: ({ id, url }) => (
    <>
      <defs>
        <linearGradient
          id={id("mystery")}
          x1="0"
          y1="0"
          x2="0"
          y2="1">
          <stop
            offset="0"
            stopColor="#a78bfa"
          />
          <stop
            offset="1"
            stopColor="#6d28d9"
          />
        </linearGradient>
      </defs>
      <circle
        fill={url("mystery")}
        cx="32"
        cy="32"
        r="27"
      />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M23.5 24.5c0-5 3.8-8.5 8.8-8.5s8.7 3.4 8.7 8c0 7-8.8 7.5-8.8 14"
      />
      <circle
        fill="#fff"
        cx="32.2"
        cy="47.5"
        r="3.6"
      />
    </>
  ),
} satisfies Record<string, Art>

export type ArtName = keyof typeof ART
