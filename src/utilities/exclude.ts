export default function exclude<T extends object, K extends [...(keyof T)[]]>(
  o: T,
  ...keys: K
): {
  [K2 in Exclude<keyof T, K[number]>]: T[K2];
} {
  return Object.fromEntries(
    Object.entries(o).filter(([key]) => !keys.includes(key as keyof T))
  ) as any;
}
