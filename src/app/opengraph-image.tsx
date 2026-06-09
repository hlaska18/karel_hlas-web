import { ogContentType, ogSize, renderOgImage } from "@/lib/og";

export const runtime = "nodejs";
export const alt = "Karel Hlas — Učitel informatiky a angličtiny";
export const size = ogSize;
export const contentType = ogContentType;

export default function OpengraphImage() {
  return renderOgImage("Učitel informatiky a angličtiny");
}
