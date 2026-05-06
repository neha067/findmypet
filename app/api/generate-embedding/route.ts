import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const buffer = await req.arrayBuffer();

    const hfRes = await fetch(
      "https://api-inference.huggingface.co/models/sentence-transformers/clip-ViT-B-32",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/octet-stream",
        },
        body: buffer,
      }
    );

    const data = await hfRes.json();

    return NextResponse.json({
      embedding: data,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Embedding failed" },
      { status: 500 }
    );
  }
}