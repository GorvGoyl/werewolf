// QR codes the app draws itself, so a hand-over code shows even with no connection.
// Byte mode only, which fits any link. The steps follow the standard (ISO/IEC 18004): take the
// smallest size that fits, add Reed-Solomon error correction, place the bits, then pick the
// mask that scores the lowest penalty.

export type Ecc = "L" | "M" | "Q" | "H"

const LEVELS: Ecc[] = ["L", "M", "Q", "H"]
const FORMAT_BITS: Record<Ecc, number> = { L: 1, M: 0, Q: 3, H: 2 }

// For versions 1 to 40
const ECC_PER_BLOCK: Record<Ecc, number[]> = {
  L: [7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  M: [10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  Q: [13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  H: [17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
}
const BLOCKS: Record<Ecc, number[]> = {
  L: [1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  M: [1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  Q: [1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  H: [1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
}

const MASKS: Array<(x: number, y: number) => boolean> = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
]

type Grid = { size: number; dark: boolean[][]; reserved: boolean[][] }

export type QrOptions = {
  ecc?: Ecc // the lowest error correction; a higher one is used when it fits in the same size
  boost?: boolean
  mask?: number // 0 to 7; normally the one with the lowest penalty
}

// Rows of modules, true for dark, without the quiet zone around them
export function qrMatrix(text: string, { ecc = "M", boost = true, mask }: QrOptions = {}): boolean[][] {
  const bytes = new TextEncoder().encode(text)
  const bitsNeeded = (version: number) => 4 + countBits(version) + bytes.length * 8

  let version = 1
  while (bitsNeeded(version) > dataCodewords(version, ecc) * 8) {
    version++
    if (version > 40) throw new Error("Too long for a QR code")
  }
  let level = ecc
  for (const higher of LEVELS.slice(LEVELS.indexOf(ecc) + 1)) {
    if (boost && bitsNeeded(version) <= dataCodewords(version, higher) * 8) level = higher
  }

  const bits: number[] = []
  const push = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1)
  }
  push(0b0100, 4)
  push(bytes.length, countBits(version))
  for (const byte of bytes) push(byte, 8)
  const capacity = dataCodewords(version, level) * 8
  push(0, Math.min(4, capacity - bits.length))
  push(0, (8 - (bits.length % 8)) % 8)
  for (let pad = 0xec; bits.length < capacity; pad ^= 0xec ^ 0x11) push(pad, 8)

  const data: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j]
    data.push(byte)
  }

  const size = version * 4 + 17
  const grid: Grid = {
    size,
    dark: Array.from({ length: size }, () => new Array<boolean>(size).fill(false)),
    reserved: Array.from({ length: size }, () => new Array<boolean>(size).fill(false)),
  }
  drawFunctionPatterns(grid, version, level)
  drawCodewords(grid, withErrorCorrection(data, version, level))

  let chosen = mask ?? 0
  if (mask === undefined) {
    let lowest = Infinity
    for (let m = 0; m < 8; m++) {
      applyMask(grid, m)
      drawFormatBits(grid, level, m)
      const score = penalty(grid)
      if (score < lowest) {
        chosen = m
        lowest = score
      }
      applyMask(grid, m) // masking twice undoes it
    }
  }
  applyMask(grid, chosen)
  drawFormatBits(grid, level, chosen)
  return grid.dark
}

function countBits(version: number): number {
  if (version < 10) return 8
  return 16
}

function rawDataModules(version: number): number {
  let result = (16 * version + 128) * version + 64
  if (version >= 2) {
    const align = Math.floor(version / 7) + 2
    result -= (25 * align - 10) * align - 55
    if (version >= 7) result -= 36
  }
  return result
}

function dataCodewords(version: number, level: Ecc): number {
  const i = version - 1
  return Math.floor(rawDataModules(version) / 8) - ECC_PER_BLOCK[level][i] * BLOCKS[level][i]
}

function alignmentPositions(version: number): number[] {
  if (version === 1) return []
  const count = Math.floor(version / 7) + 2
  const step = Math.floor((version * 8 + count * 3 + 5) / (count * 4 - 4)) * 2
  const result = [6]
  for (let position = version * 4 + 10; result.length < count; position -= step) result.splice(1, 0, position)
  return result
}

function setFunction(grid: Grid, x: number, y: number, dark: boolean) {
  grid.dark[y][x] = dark
  grid.reserved[y][x] = true
}

function drawFunctionPatterns(grid: Grid, version: number, level: Ecc) {
  const { size } = grid
  for (let i = 0; i < size; i++) {
    setFunction(grid, 6, i, i % 2 === 0)
    setFunction(grid, i, 6, i % 2 === 0)
  }
  for (const [x, y] of [
    [3, 3],
    [size - 4, 3],
    [3, size - 4],
  ]) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const distance = Math.max(Math.abs(dx), Math.abs(dy))
        if (x + dx >= 0 && x + dx < size && y + dy >= 0 && y + dy < size) {
          setFunction(grid, x + dx, y + dy, distance !== 2 && distance !== 4)
        }
      }
    }
  }
  const positions = alignmentPositions(version)
  const last = positions.length - 1
  positions.forEach((x, i) => {
    positions.forEach((y, j) => {
      // Not where the finder patterns are
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) setFunction(grid, x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
      }
    })
  })
  drawFormatBits(grid, level, 0)
  if (version >= 7) {
    let remainder = version
    for (let i = 0; i < 12; i++) remainder = (remainder << 1) ^ ((remainder >>> 11) * 0x1f25)
    const bits = (version << 12) | remainder
    for (let i = 0; i < 18; i++) {
      const dark = ((bits >>> i) & 1) === 1
      const a = size - 11 + (i % 3)
      const b = Math.floor(i / 3)
      setFunction(grid, a, b, dark)
      setFunction(grid, b, a, dark)
    }
  }
}

function drawFormatBits(grid: Grid, level: Ecc, mask: number) {
  const data = (FORMAT_BITS[level] << 3) | mask
  let remainder = data
  for (let i = 0; i < 10; i++) remainder = (remainder << 1) ^ ((remainder >>> 9) * 0x537)
  const bits = ((data << 10) | remainder) ^ 0x5412
  const bit = (i: number) => ((bits >>> i) & 1) === 1
  const { size } = grid
  for (let i = 0; i <= 5; i++) setFunction(grid, 8, i, bit(i))
  setFunction(grid, 8, 7, bit(6))
  setFunction(grid, 8, 8, bit(7))
  setFunction(grid, 7, 8, bit(8))
  for (let i = 9; i < 15; i++) setFunction(grid, 14 - i, 8, bit(i))
  for (let i = 0; i < 8; i++) setFunction(grid, size - 1 - i, 8, bit(i))
  for (let i = 8; i < 15; i++) setFunction(grid, 8, size - 15 + i, bit(i))
  setFunction(grid, 8, size - 8, true)
}

// Two columns at a time, zigzagging up and down from the bottom right
function drawCodewords(grid: Grid, codewords: number[]) {
  const { size } = grid
  let i = 0
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    for (let vertical = 0; vertical < size; vertical++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j
        const upward = ((right + 1) & 2) === 0
        const y = upward ? size - 1 - vertical : vertical
        if (grid.reserved[y][x] || i >= codewords.length * 8) continue
        grid.dark[y][x] = ((codewords[i >>> 3] >>> (7 - (i & 7))) & 1) === 1
        i++
      }
    }
  }
}

function applyMask(grid: Grid, mask: number) {
  const flip = MASKS[mask]
  for (let y = 0; y < grid.size; y++) {
    for (let x = 0; x < grid.size; x++) {
      if (!grid.reserved[y][x] && flip(x, y)) grid.dark[y][x] = !grid.dark[y][x]
    }
  }
}

function withErrorCorrection(data: number[], version: number, level: Ecc): number[] {
  const blockCount = BLOCKS[level][version - 1]
  const eccLength = ECC_PER_BLOCK[level][version - 1]
  const rawCodewords = Math.floor(rawDataModules(version) / 8)
  const shortBlocks = blockCount - (rawCodewords % blockCount)
  const shortLength = Math.floor(rawCodewords / blockCount)
  const divisor = reedSolomonDivisor(eccLength)

  const blocks: number[][] = []
  for (let i = 0, k = 0; i < blockCount; i++) {
    const block = data.slice(k, k + shortLength - eccLength + (i < shortBlocks ? 0 : 1))
    k += block.length
    const ecc = reedSolomonRemainder(block, divisor)
    if (i < shortBlocks) block.push(0)
    blocks.push([...block, ...ecc])
  }

  // Interleaved, one byte of each block in turn
  const result: number[] = []
  for (let i = 0; i < blocks[0].length; i++) {
    blocks.forEach((block, j) => {
      // Short blocks have no byte at this spot
      if (i !== shortLength - eccLength || j >= shortBlocks) result.push(block[i])
    })
  }
  return result
}

// Multiplication in GF(2^8) with the QR polynomial x^8 + x^4 + x^3 + x^2 + 1
function multiply(x: number, y: number): number {
  let z = 0
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d)
    z ^= ((y >>> i) & 1) * x
  }
  return z
}

function reedSolomonDivisor(degree: number): number[] {
  const result = new Array<number>(degree).fill(0)
  result[degree - 1] = 1
  let root = 1
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = multiply(result[j], root)
      if (j + 1 < degree) result[j] ^= result[j + 1]
    }
    root = multiply(root, 0x02)
  }
  return result
}

function reedSolomonRemainder(data: number[], divisor: number[]): number[] {
  const result = divisor.map(() => 0)
  for (const byte of data) {
    const factor = byte ^ (result.shift() ?? 0)
    result.push(0)
    divisor.forEach((coefficient, i) => {
      result[i] ^= multiply(coefficient, factor)
    })
  }
  return result
}

// Penalties from the standard: long runs, 2x2 blocks, finder-like patterns and an uneven mix
function penalty(grid: Grid): number {
  const { size, dark } = grid
  let score = 0
  for (let a = 0; a < size; a++) {
    score += linePenalty(size, (b) => dark[a][b])
    score += linePenalty(size, (b) => dark[b][a])
  }
  let darkCount = 0
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (dark[y][x]) darkCount++
      if (x === size - 1 || y === size - 1) continue
      const color = dark[y][x]
      if (color === dark[y][x + 1] && color === dark[y + 1][x] && color === dark[y + 1][x + 1]) score += 3
    }
  }
  const total = size * size
  score += (Math.ceil(Math.abs(darkCount * 20 - total * 10) / total) - 1) * 10
  return score
}

function linePenalty(size: number, at: (i: number) => boolean): number {
  let score = 0
  let runColor = false
  let runLength = 0
  const history = [0, 0, 0, 0, 0, 0, 0]
  const addHistory = (length: number) => {
    // The first run includes the light border before the line
    if (history[0] === 0) length += size
    history.pop()
    history.unshift(length)
  }
  // Dark, light, dark x3, light, dark (1:1:3:1:1) with light space on a side, like a finder pattern
  const finderLike = () => {
    const n = history[1]
    const core = n > 0 && history[2] === n && history[3] === n * 3 && history[4] === n && history[5] === n
    let count = 0
    if (core && history[0] >= n * 4 && history[6] >= n) count++
    if (core && history[6] >= n * 4 && history[0] >= n) count++
    return count
  }
  for (let i = 0; i < size; i++) {
    if (at(i) === runColor) {
      runLength++
      if (runLength === 5) score += 3
      else if (runLength > 5) score++
      continue
    }
    addHistory(runLength)
    if (!runColor) score += finderLike() * 40
    runColor = at(i)
    runLength = 1
  }
  // The line ends in the light border
  if (runColor) {
    addHistory(runLength)
    runLength = 0
  }
  addHistory(runLength + size)
  return score + finderLike() * 40
}
