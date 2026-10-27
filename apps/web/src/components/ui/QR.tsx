"use client";

import { QRCodeSVG } from "qrcode.react";

type Props = { value: string; size?: number; label?: string };

/** Real QR code, rendered as SVG so it is crisp and works offline. */
export function QR({ value, size = 220, label = "QR code" }: Props) {
  return <QRCodeSVG value={value} size={size} level="M" marginSize={0} fgColor="#0c0d10" bgColor="#ffffff" role="img" aria-label={label} />;
}
