import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface EmbeddingRequest {
  text: string;
}

interface OpenRouterResponse {
  data: Array<{
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

export async function POST(req: NextRequest) {
  try {
    const { text } = (await req.json()) as EmbeddingRequest;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('OPENROUTER_API_KEY is not set');
      return NextResponse.json(
        { error: 'Embedding service is not configured' },
        { status: 500 }
      );
    }

    // Call OpenRouter API for text embeddings
    // Using openrouter/free which routes to the best available free model
    const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://findmypet.vercel.app',
        'X-Title': 'FindMyPet',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small', 
        input: text,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate embedding' },
        { status: response.status }
      );
    }

    const data = (await response.json()) as OpenRouterResponse;

    if (!data.data || !data.data[0] || !data.data[0].embedding) {
      console.error('Invalid response from OpenRouter:', data);
      return NextResponse.json(
        { error: 'Invalid response from embedding service' },
        { status: 500 }
      );
    }

    const embedding = data.data[0].embedding;

    return NextResponse.json({
      embedding,
      dimension: embedding.length,
      model: data.model,
      tokens_used: data.usage.prompt_tokens,
    });
  } catch (error) {
    console.error('Error generating embedding:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate embedding',
      },
      { status: 500 }
    );
  }
}
