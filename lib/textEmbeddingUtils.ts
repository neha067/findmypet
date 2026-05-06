/**
 * Text Embedding Utilities
 * Converts pet metadata to natural language text and generates embeddings via OpenRouter
 */

interface PetMetadata {
  petType?: string;
  name?: string;
  color?: string;
  gender?: string;
  age?: string;
  description?: string;
  status?: string;
  type?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  missingDate?: Date;
  reportedBy?: {
    name?: string;
    email?: string;
  };
  [key: string]: any;
}

interface SearchFormInputs {
  petType?: string;
  color?: string;
  age?: string;
  gender?: string;
  location?: string;
  description?: string;
}

/**
 * Format pet metadata into natural language text for embedding
 * Handles missing/null fields gracefully
 * @param petData - Pet metadata from database
 * @returns Natural language text representation
 */
export function formatMetadataAsText(petData: PetMetadata): string {
  const parts: string[] = [];

  // Build descriptive sentence about the pet
  if (petData.petType || petData.name) {
    const type = petData.petType || 'pet';
    const name = petData.name ? `, named ${petData.name}` : '';
    parts.push(`A ${type}${name}.`);
  }

  // Physical description
  const physicalDescription: string[] = [];
  if (petData.gender && petData.gender !== 'unknown') {
    physicalDescription.push(petData.gender);
  }
  if (petData.color && petData.color !== 'unknown') {
    physicalDescription.push(`${petData.color} colored`);
  }
  if (petData.age && petData.age !== 'unknown') {
    physicalDescription.push(`around ${petData.age} years old`);
  }
  if (physicalDescription.length > 0) {
    parts.push(`${physicalDescription.join(', ')}.`);
  }

  // Status and dates
  if (petData.status || petData.type) {
    const status = petData.status || petData.type;
    if (status === 'missing' && petData.missingDate) {
      const dateStr = formatDate(petData.missingDate);
      if (petData.location) {
        parts.push(`Missing since ${dateStr} from ${petData.location}.`);
      } else {
        parts.push(`Missing since ${dateStr}.`);
      }
    } else if (status === 'found' && petData.location) {
      parts.push(`Found in ${petData.location}.`);
    } else if (status === 'adoption' && petData.location) {
      parts.push(`Available for adoption in ${petData.location}.`);
    } else if (status === 'social' && petData.location) {
      parts.push(`Location: ${petData.location}.`);
    }
  }

  // Additional details/description
  if (petData.description && petData.description.trim()) {
    parts.push(`Additional details: ${petData.description}`);
  }

  // Contact information
  if (petData.reportedBy?.name) {
    parts.push(`Reported by: ${petData.reportedBy.name}.`);
  }

  return parts.join(' ').trim();
}

/**
 * Format search form inputs into natural language query text
 * @param searchInputs - Search form fields
 * @returns Natural language search query
 */
export function extractSearchText(searchInputs: SearchFormInputs): string {
  const parts: string[] = [];

  if (searchInputs.petType && searchInputs.petType !== '') {
    parts.push(`${searchInputs.petType}`);
  }

  if (searchInputs.color && searchInputs.color !== '') {
    parts.push(`${searchInputs.color}`);
  }

  if (searchInputs.age && searchInputs.age !== '') {
    parts.push(`${searchInputs.age}`);
  }

  if (searchInputs.gender && searchInputs.gender !== '' && searchInputs.gender !== 'unknown') {
    parts.push(`${searchInputs.gender}`);
  }

  if (searchInputs.location && searchInputs.location.trim()) {
    parts.push(`around ${searchInputs.location}`);
  }

  if (searchInputs.description && searchInputs.description.trim()) {
    parts.push(`${searchInputs.description}`);
  }

  if (parts.length === 0) {
    return 'pet search';
  }

  return parts.join(', ');
}

/**
 * Generate text embedding from input text
 * Calls the /api/text-embedding endpoint
 * @param text - Text to generate embedding for
 * @returns Embedding vector
 * @throws Error if embedding generation fails
 */
export async function generateTextEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  try {
    const response = await fetch('/api/text-embedding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: text.trim() }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate embedding');
    }

    const data = await response.json();

    if (!Array.isArray(data.embedding)) {
      throw new Error('Invalid embedding format received');
    }

    return data.embedding;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating text embedding:', message);
    throw new Error(`Embedding generation failed: ${message}`);
  }
}

/**
 * Generate text embedding from pet metadata
 * Combines formatting and embedding generation
 * @param petData - Pet metadata
 * @returns Embedding vector
 */
export async function generatePetTextEmbedding(petData: PetMetadata): Promise<number[]> {
  const text = formatMetadataAsText(petData);
  return generateTextEmbedding(text);
}

/**
 * Generate text embedding from search form inputs
 * @param searchInputs - Search form fields
 * @returns Embedding vector
 */
export async function generateSearchEmbedding(searchInputs: SearchFormInputs): Promise<number[]> {
  const text = extractSearchText(searchInputs);
  return generateTextEmbedding(text);
}

/**
 * Helper function to format date consistently
 * @param date - Date to format
 * @returns Formatted date string
 */
function formatDate(date: Date | null | undefined): string {
  if (!date) return 'an unknown date';

  try {
    const d = date instanceof Date ? date : new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return d.toLocaleDateString('en-US', options);
  } catch {
    return 'an unknown date';
  }
}
