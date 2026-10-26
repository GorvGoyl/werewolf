import { describe, expect, it } from "vitest"
import { qrMatrix } from "../src/lib/qr"

const LINK = "https://werewolf.gourav.io/#players=Ana,Ben,Cleo,Dev,Eli,Fay,Gus,Hal,Ivy,Jay,Kim,Lou&gm=Gourav&roles=2qcws&t=3"

// The same link made by segno, a separate encoder: version 7, level M, mask 3, one hex row per line
const SEGNO = [
  "1fdbda4af97f", "10517707ea41", "17441ed8325d", "175a3fe88b5d", "1745a7f42f5d", "1049bf136841", "1fd55555557f",
  "0016af1fe900", "16e84df38b4b", "180664396313", "02c2dbebd483", "1801c2e1a94a", "12c27ed92881", "1facbdfd1af2",
  "19504726d6a8", "1b9e1e4f913e", "08489a04b5e5", "0bacf4139e19", "1cfabd352672", "0bb7438861ba", "07f5cbff03f4",
  "05149b1ef31f", "11515b57ff5b", "031b1b18fd18", "0df8a5f463f8", "03af234f0840", "1c53871f3828", "0a891f1ad86d",
  "1ee0b7309636", "0ab1bf2a3df3", "03ef6a56bf2a", "0203de992508", "08622c574c86", "1a8b21686a8c", "0143c439f4df",
  "0f187fc896da", "135217fae1fb", "00151d172910", "1fdd03526350", "10572b130b1c", "174455fe75f6", "175e5a60af53",
  "1757333d3f02", "104d70eb4841", "1fdfcea98eec",
]

function hexRows(matrix: boolean[][]): string[] {
  return matrix.map((row) => {
    const bits = row.map((dark) => (dark ? "1" : "0")).join("")
    return BigInt(`0b${bits}`).toString(16).padStart(Math.ceil(bits.length / 4), "0")
  })
}

describe("QR codes", () => {
  it("matches another encoder module for module", () => {
    expect(hexRows(qrMatrix(LINK, { ecc: "M", boost: false, mask: 3 }))).toEqual(SEGNO)
  })

  it("uses the smallest size that fits", () => {
    expect(qrMatrix("a".repeat(14), { boost: false })).toHaveLength(21)
    expect(qrMatrix("a".repeat(15), { boost: false })).toHaveLength(25)
    expect(qrMatrix(LINK)).toHaveLength(45)
  })

  it("counts bytes, not letters", () => {
    expect(qrMatrix("สมชาย", { boost: false })).toHaveLength(25)
  })

  it("takes more error correction when it still fits the same size", () => {
    expect(qrMatrix("a")).toEqual(qrMatrix("a", { ecc: "H", boost: false }))
  })

  it("refuses text too long for any QR code", () => {
    expect(() => qrMatrix("a".repeat(3000))).toThrow()
  })
})
