"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldGroup,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { generateSearchEmbedding, extractSearchText } from "@/lib/textEmbeddingUtils";
import { searchSimilarPets } from "@/lib/supabase";

interface SearchResults {
  petType?: string;
  color?: string;
  age?: string;
  gender?: string;
  location?: string;
  description?: string;
  similarPostIds?: string[];
}

interface SearchPetFormProps {
  onSearch?: (searchParams: SearchResults) => void;
}

export default function SearchPetForm({ onSearch }: SearchPetFormProps) {
  const [formData, setFormData] = useState({
    petType: "" as "cat" | "dog" | "other" | "",
    color: "",
    age: "",
    gender: "",
    location: "",
    description: "",
  });

  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleInputChange = (
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (searchError) {
      setSearchError(null);
    }
  };

  const handleSearch = async () => {
    // Validate that at least one field is filled
    if (
      !formData.petType &&
      !formData.color &&
      !formData.age &&
      !formData.gender &&
      !formData.location &&
      !formData.description
    ) {
      setSearchError("Please fill in at least one search criteria");
      return;
    }

    setSearching(true);
    setSearchError(null);

    try {
      // Convert form inputs to search text
      const searchText = extractSearchText(formData);
      console.log("Search text:", searchText);

      // Generate embedding from search text
      const embedding = await generateSearchEmbedding(formData);
      console.log("Generated embedding:", embedding.length, "dimensions");

      // Search for similar pets
      const similarPets = await searchSimilarPets(embedding, 10);
      console.log("Similar pets found:", similarPets);

      // Trigger callback with results
      if (onSearch) {
        onSearch({
          ...formData,
          similarPostIds: similarPets.map((pet: any) => pet.post_id),
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setSearchError(errorMessage);
      console.error("Search failed:", err);
    } finally {
      setSearching(false);
    }
  };

  const handleReset = () => {
    setFormData({
      petType: "",
      color: "",
      age: "",
      gender: "",
      location: "",
      description: "",
    });
    setSearchError(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <FieldGroup>
        <FieldSet>
          <FieldLegend className="text-xl font-bold">Search for Pets</FieldLegend>
          <FieldDescription>
            Fill in the details below to find similar pets in the community.
            Leave fields blank if you don't know them.
          </FieldDescription>

          <FieldGroup className="mt-4 space-y-4">
            {/* Pet Type */}
            <Field>
              <FieldLabel htmlFor="search-pet-type">Pet Type</FieldLabel>
              <Select
                value={formData.petType}
                onValueChange={(value) => handleInputChange("petType", value)}
              >
                <SelectTrigger id="search-pet-type">
                  <SelectValue placeholder="Select pet type (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="cat">Cat</SelectItem>
                  <SelectItem value="dog">Dog</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {/* Color and Gender Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="search-color">Color</FieldLabel>
                <Select
                  value={formData.color}
                  onValueChange={(value) => handleInputChange("color", value)}
                >
                  <SelectTrigger id="search-color">
                    <SelectValue placeholder="Select color (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="black">Black</SelectItem>
                    <SelectItem value="white">White</SelectItem>
                    <SelectItem value="orange">Orange</SelectItem>
                    <SelectItem value="brown">Brown</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                    <SelectItem value="others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="search-gender">Gender</FieldLabel>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleInputChange("gender", value)}
                >
                  <SelectTrigger id="search-gender">
                    <SelectValue placeholder="Select gender (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {/* Age */}
            <Field>
              <FieldLabel htmlFor="search-age">Age</FieldLabel>
              <Select
                value={formData.age}
                onValueChange={(value) => handleInputChange("age", value)}
              >
                <SelectTrigger id="search-age">
                  <SelectValue placeholder="Select age (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="kitten">Kitten (0-1 year)</SelectItem>
                  <SelectItem value="puppy">Puppy (0-1 year)</SelectItem>
                  <SelectItem value="young">Young (1-3 years)</SelectItem>
                  <SelectItem value="adult">Adult (3-7 years)</SelectItem>
                  <SelectItem value="senior">Senior (7+ years)</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {/* Location */}
            {/* <Field>
              <FieldLabel htmlFor="search-location">Location</FieldLabel>
              <Input
                id="search-location"
                placeholder="e.g., Downtown, Park Street, Central Park... (optional)"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
              />
              <FieldDescription>
                The area where you're searching or saw the pet
              </FieldDescription>
            </Field> */}

            {/* Description */}
            <Field>
              <FieldLabel htmlFor="search-description">
                Search Details (Provide detailed description for more accurate results)
              </FieldLabel>
              <Textarea
                id="search-description"
                placeholder="Any distinguishing features, collar details, behavior, or other details... (optional)"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={4}
                className="resize-none"
              />
              <FieldDescription>
                Include any specific details that might help find the pet
              </FieldDescription>
            </Field>
          </FieldGroup>
        </FieldSet>

        {/* Error Message */}
        {searchError && (
          <div className="flex items-start justify-between p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md text-sm text-red-800 dark:text-red-200 mt-4">
            <div>
              <span className="font-medium">⚠ Error:</span> {searchError}
            </div>
            <button
              type="button"
              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200 ml-2 font-bold"
              onClick={() => setSearchError(null)}
            >
              ×
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <Button
            onClick={handleSearch}
            disabled={searching}
            className="flex-1"
          >
            {searching ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Searching...
              </span>
            ) : (
              "🔍 Search"
            )}
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            disabled={searching}
          >
            Reset
          </Button>
        </div>
      </FieldGroup>
    </div>
  );
}
