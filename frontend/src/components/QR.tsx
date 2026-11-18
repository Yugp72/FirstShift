import QRCode from "qrcode";
import { useEffect, useState } from "react";

export function QR({ value, size = 192 }: { value: string; size?: number }) {
  const [src, setSrc] = useState<string>("");
  useEffect(() => {
    QRCode.toDataURL(value, { margin: 1, width: size, color: { dark: "#1E1A16", light: "#FFFAEE" } })
      .then(setSrc)
      .catch(() => setSrc(""));
  }, [value, size]);
  if (!src) return null;
  return <img src={src} alt={`QR code for ${value}`} width={size / 2} height={size / 2} />;
}
