/**
 * @deprecated Use lib/textEmbeddingUtils.ts instead
 * 
 * This file contains image-based embedding functions using HuggingFace CLIP.
 * These have been replaced with text-based embeddings via OpenRouter/free.
 * 
 * Kept for backward compatibility only. All new code should use:
 * - generatePetTextEmbedding() - Generate embedding from pet metadata
 * - generateSearchEmbedding() - Generate embedding from search form inputs
 * - formatMetadataAsText() - Convert metadata to natural language text
 * - extractSearchText() - Convert search form to natural language
 */

export async function generatePetEmbedding({
  imageUrl,
}: {
  imageUrl: string;
}): Promise<number[]> {

  // 1. Fetch image from Cloudinary
  const imageRes = await fetch(imageUrl);
  const imageBlob = await imageRes.blob();

  // 2. Send as binary (NOT JSON)
  const response = await fetch("/api/generate-embedding", {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body: imageBlob,
  });

  if (!response.ok) {
    throw new Error(`Embedding API failed: ${response.status}`);
  }

  const data = await response.json();
  return data.embedding;
}