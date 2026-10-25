// A buzz under the finger on phones that can vibrate (Android); iPhones and computers ignore it
export function haptic(pattern: VibratePattern = 10) {
  navigator.vibrate?.(pattern)
}
