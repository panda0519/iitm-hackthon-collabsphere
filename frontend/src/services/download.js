// Trigger a client-side file download from a string.
export function downloadText(filename, text, mime) {
  const url = URL.createObjectURL(new Blob([text], { type: (mime || "text/calendar") + ";charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
