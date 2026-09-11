// The designer stores paper dimensions in points (e.g. A4 is 595 x 842).
// Snap standard sizes to exact millimetres to avoid rounding onto an extra page.
export function getPrintPageMetrics(width: number, height: number) {
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 595;
  const safeHeight = Number.isFinite(height) && height > 0 ? height : 842;
  const landscape = safeWidth > safeHeight;
  const short = Math.min(safeWidth, safeHeight);
  const long = Math.max(safeWidth, safeHeight);
  const sizes = [
    { w: 595, h: 842, mmW: 210, mmH: 297 },
    { w: 419, h: 595, mmW: 148, mmH: 210 },
    { w: 612, h: 792, mmW: 215.9, mmH: 279.4 },
    { w: 612, h: 1008, mmW: 215.9, mmH: 355.6 },
  ];
  const standard = sizes.find(size => Math.abs(short - size.w) <= 1 && Math.abs(long - size.h) <= 1);
  const widthMm = standard ? (landscape ? standard.mmH : standard.mmW) : safeWidth * 25.4 / 72;
  const heightMm = standard ? (landscape ? standard.mmW : standard.mmH) : safeHeight * 25.4 / 72;
  return { widthMm, heightMm, zoom: Math.min(widthMm * 96 / 25.4 / safeWidth, heightMm * 96 / 25.4 / safeHeight) };
}
