/** Stable accent colors from a string id (subject UUID, etc.) */
export function classAccentFromId(id) {
  const s = String(id || "x");
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = s.charCodeAt(i) + ((h << 5) - h);
  }
  const hue = Math.abs(h) % 360;
  const hue2 = (hue + 42) % 360;
  return {
    hue,
    bar: `hsl(${hue} 72% 52%)`,
    gradient: `linear-gradient(135deg, hsl(${hue} 75% 48%) 0%, hsl(${hue2} 68% 54%) 100%)`,
    softBg: `hsl(${hue} 62% 97%)`,
    iconBg: `hsl(${hue} 45% 94%)`,
  };
}

export function dicebearBgHex(id) {
  const s = String(id || "x");
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = s.charCodeAt(i) + ((h << 5) - h);
  }
  const n = Math.abs(h) % 0xffffff;
  return n.toString(16).padStart(6, "0").slice(0, 6);
}
