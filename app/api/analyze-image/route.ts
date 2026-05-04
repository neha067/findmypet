import { NextRequest, NextResponse } from 'next/server';

type ImageAnalysis = {
  animal: "cat" | "dog" | "unknown";
  breed: string;
  color: string;
  age_estimate: "young" | "adult" | "old";
  confidence: number;
};

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("OpenRouter API key not configured");
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [{
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${file.type};base64,${base64}` },
            },
            {
              type: "text",
              text: `Analyze this pet image and return ONLY valid JSON with no markdown or explanation:\n{"animal":"cat"|"dog"|"unknown","breed":"<breed name or unknown>","color":"black"|"white"|"orange"|"brown"|"mixed"|"others","age_estimate":"young"|"adult"|"old","confidence":<0.0 to 1.0>}`,
            },
          ],
        }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`OpenRouter API error ${response.status}:`, errorData);
      return NextResponse.json(
        { error: `API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    if (!text) {
      console.error("Empty response from OpenRouter API");
      return NextResponse.json(
        { error: "Empty response from API" },
        { status: 500 }
      );
    }

    // Robustly extract JSON by finding outermost braces
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      console.error("No JSON found in response:", text);
      return NextResponse.json(
        { error: "Invalid API response format" },
        { status: 500 }
      );
    }

    const analysis: ImageAnalysis = JSON.parse(text.slice(jsonStart, jsonEnd + 1));

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Image analysis error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to analyze image: ${errorMessage}` },
      { status: 500 }
    );
  }
}