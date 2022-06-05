export function sleep() {
  return new Promise(res => setTimeout(res, 500))
}