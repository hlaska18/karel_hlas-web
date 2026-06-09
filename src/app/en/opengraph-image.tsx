import { ogContentType, ogSize, renderOgImage } from "@/lib/og";

export const runtime = "nodejs";
export const alt = "Karel Hlas — Computer Science & English Language Teacher";
export const size = ogSize;
export const contentType = ogContentType;

export default function OpengraphImage() {
  return renderOgImage("Computer Science & English Language Teacher");
}
