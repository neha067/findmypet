# Supabase Vector Embeddings Setup

## Prerequisites
1. Supabase account with a project
2. OpenAI API key (for text embeddings)
3. Environment variables configured

## Environment Variables

Add to `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URl=your_NEXT_PUBLIC_SUPABASE_URl
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_NEXT_PUBLIC_SUPABASE_ANON_KEY
OPENAI_API_KEY=your_openai_key
```

## Database Setup

### 1. Enable pgvector Extension

In Supabase SQL Editor, run:

```sql
create extension if not exists vector;
```

### 2. Create pet_embeddings Table

```sql
create table public.pet_embeddings (
  id bigserial primary key,
  post_id text not null unique,
  embedding vector(1536),
  animal text,
  color text,
  age text,
  breed text,
  description text,
  created_at timestamp with time zone default now(),
  
  constraint unique_post_id unique(post_id)
);

-- Create index for vector similarity search
create index on public.pet_embeddings using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Grant permissions
grant select, insert, update, delete on public.pet_embeddings to authenticated;
grant select on public.pet_embeddings to anon;
```

### 3. Create RPC Function for Similarity Search

```sql
create or replace function match_pet_embeddings (
  query_embedding vector,
  match_threshold float,
  match_count int
)
returns table (
  post_id text,
  similarity float
)
language sql
as $$
  select
    post_id,
    1 - (embedding <=> query_embedding) as similarity
  from pet_embeddings
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- Grant permission
grant execute on function match_pet_embeddings to authenticated;
```

## How It Works

### When Creating a Post:
1. User uploads image + fills metadata
2. OpenRouter analyzes image → {animal, breed, color, age}
3. Combine with user metadata (description, name)
4. Generate embedding using OpenAI text-embedding-3-small
5. Save to Firebase (main data)
6. Save embedding + post_id to Supabase (for search)

### When Searching:
1. User uploads image
2. OpenRouter analyzes → extracts metadata
3. Generate embedding from analysis (same method)
4. Query Supabase: `match_pet_embeddings(query_embedding)`
5. Get similar post IDs ordered by similarity
6. Display matching posts from Firebase

## Cost Estimation

- **Image Analysis**: OpenRouter free tier
- **Text Embeddings**: ~$0.00002 per embedding (text-embedding-3-small)
- **Vector Storage**: Included in Supabase free tier (up to 2GB)

## Troubleshooting

**"Provider returned error" from OpenRouter**:
- Model might not support images
- Check OpenRouter docs for available free vision models

**Supabase connection errors**:
- Verify URL and keys in .env.local
- Check Row Level Security (RLS) policies
- Ensure authenticated user has permissions

**No similar results**:
- Embeddings might not be well-matched
- Lower the `match_threshold` in search
- Verify embeddings are being saved correctly
