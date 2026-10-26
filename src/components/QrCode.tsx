import { useMemo } from "react"
import { qrMatrix } from "../lib/qr"

// Camera apps look for a light margin of 4 modules around the code
const QUIET_ZONE = 4

type Props = { text: string; label: string }

// Dark on white whatever the theme, since that's what cameras read best
export function QrCode({ text, label }: Props) {
  const { size, path } = useMemo(() => {
    const matrix = qrMatrix(text)
    let d = ""
    matrix.forEach((row, y) => {
      // One rectangle per run of dark modules keeps the drawing small
      for (let x = 0; x < row.length; x++) {
        if (!row[x]) continue
        let end = x
        while (end + 1 < row.length && row[end + 1]) end++
        d += `M${x + QUIET_ZONE} ${y + QUIET_ZONE}h${end - x + 1}v1h-${end - x + 1}z`
        x = end
      }
    })
    return { size: matrix.length + QUIET_ZONE * 2, path: d }
  }, [text])

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
      className="block aspect-square w-full rounded-2xl bg-white">
      <path
        fill="#070816"
        d={path}
      />
    </svg>
  )
}
