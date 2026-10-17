// QR code rendering via the qrcode-generator global (loaded from a CDN in index.html).
// Returns a data URL, or null when the library is missing.
export function qrDataUrl(text) {
  try {
    if (typeof qrcode === "undefined") return null;
    const qr = qrcode(0, "M");
    qr.addData(text);
    qr.make();
    return qr.createDataURL(6, 2);
  } catch (e) {
    return null;
  }
}
