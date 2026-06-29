import { NextResponse } from "next/server";
import { extractListingFromText } from "@/lib/extraction";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const rawText = typeof body?.rawText === "string" ? body.rawText.trim() : "";

  if (!rawText) {
    return NextResponse.json({ error: "Paste some listing text first." }, { status: 400 });
  }

  try {
    const extracted = await extractListingFromText(rawText);
    return NextResponse.json({ extracted });
  } catch (err) {
    console.error("Listing extraction failed:", err);
    return NextResponse.json(
      { error: "Extraction failed — please fill in the fields manually below." },
      { status: 502 },
    );
  }
}
