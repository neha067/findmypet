import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URl || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function saveEmbedding(
  postId: string,
  embedding: number[]
) {
  const { error } = await supabase.from('pet_embeddings').insert({
    post_id: postId,
    embedding,
  });

  if (error) {
    console.error('Error saving embeddings:', error);
    throw error;
  }

  return true;
}

export const searchSimilarPets = async (
  embedding: number[],
  limit: number = 5
) => {
  try {
    const { data, error } = await supabase.rpc("match_pets", {
      query_embedding: embedding,
      match_count: limit,
    });

    if (error) {
      console.error("Supabase search error:", error);
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error("searchSimilarPets failed:", err);
    return [];
  }
};
