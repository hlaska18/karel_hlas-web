import { OG_SIZE, OG_CONTENT_TYPE, OG_CONTENT, ogImageResponse } from "@/lib/ogCard";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = OG_CONTENT.en.alt;

export default function Image() {
  return ogImageResponse("en");
}
