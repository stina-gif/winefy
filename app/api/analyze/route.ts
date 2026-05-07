import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface FavoriteWine {
  id: string;
  notes: string;
  imageBase64?: string;
  mimeType?: string;
}

interface Profile {
  id: string;
  name: string;
  favorites: FavoriteWine[];
}

type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

export async function POST(request: NextRequest) {
  const { imageBase64, mimeType, profile }: { imageBase64: string; mimeType: string; profile: Profile | null } =
    await request.json();

  const content: Anthropic.MessageParam["content"] = [];

  if (profile && profile.favorites.length > 0) {
    content.push({
      type: "text",
      text: `Anvandardens smakprofil heter "${profile.name}". Nedan foljer deras favoritviner som de har lart upp profilen med:`,
    });

    for (const wine of profile.favorites) {
      if (wine.imageBase64 && wine.mimeType) {
        content.push({
          type: "image",
          source: {
            type: "base64",
            media_type: wine.mimeType as ImageMediaType,
            data: wine.imageBase64,
          },
        });
      }
      if (wine.notes) {
        content.push({ type: "text", text: `Anvandarens beskrivning: ${wine.notes}` });
      }
    }

    content.push({
      type: "text",
      text: "Har ar restaurangens vinmeny:",
    });
  } else if (profile) {
    content.push({
      type: "text",
      text: `Anvandardens smakprofil heter "${profile.name}" men har inga sparade favoritviner an. Analysera menyn generellt. Har ar vinmenyn:`,
    });
  } else {
    content.push({
      type: "text",
      text: "Analysera denna vinmeny generellt. Har ar vinmenyn:",
    });
  }

  content.push({
    type: "image",
    source: {
      type: "base64",
      media_type: mimeType as ImageMediaType,
      data: imageBase64,
    },
  });

  const instruction = profile && profile.favorites.length > 0
    ? `Du ar en vinexpert. Baserat pa anvandardens favoritviner ovan, analysera restaurangmenyn och:
1. Identifiera vilka viner pa menyn som liknar favoriterna mest
2. Forklara varfor de liknar varandra (druvsort, region, smakprofil)
3. Rangordna de basta matchningarna
4. Om inget vin passar bra, forklara vad som ar narmast och varfor

Svara pa svenska i ett tydligt och lattlast format.`
    : `Du ar en vinexpert. Analysera denna vinmeny och beskriv de viktigaste vinerna pa svenska. For varje vin: namn, smakprofil och vilket tillfall det passar. Svara pa svenska.`;

  content.push({ type: "text", text: instruction });

  const message = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 1500,
    messages: [{ role: "user", content }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  return NextResponse.json({ result: text });
}
