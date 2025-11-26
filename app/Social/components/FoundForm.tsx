"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

const FoundForm = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    color: "",
    gender: "",
    age: "",
    description: "",
    location: "",
    latitude: "",
    longitude: "",
    foundMonth: "",
    foundYear: "",
    foundDate: "",
    image: null as File | null,
  });

  const handleInputChange = (field: string, value: string | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert("Please login to report a found cat");
      return;
    }

    if (!formData.color || !formData.location) {
      alert("Please fill in at least color and location");
      return;
    }

    if (!db || !storage) {
      alert("Firebase is not initialized. Please check your configuration.");
      return;
    }

    setLoading(true);
    
    // Safety timeout - reset loading state after 30 seconds if something goes wrong
    const timeoutId = setTimeout(() => {
      setLoading(false);
      alert("Submission is taking longer than expected. Please check your connection and try again.");
    }, 30000);

    try {
      let imageUrl = "";

      // Upload image if provided
      if (formData.image) {
        try {
          // Validate file size (5MB limit)
          if (formData.image.size > 5 * 1024 * 1024) {
            throw new Error("Image size exceeds 5MB limit. Please use a smaller image.");
          }
          
          // Validate file type
          if (!formData.image.type.startsWith('image/')) {
            throw new Error("Invalid file type. Please upload an image file.");
          }
          
          const imageRef = ref(storage, `cats/${Date.now()}_${formData.image.name}`);
          await uploadBytes(imageRef, formData.image);
          imageUrl = await getDownloadURL(imageRef);
        } catch (imageError: any) {
          console.error("Image upload error:", imageError);
          
          // Provide specific error messages for common issues
          let errorMessage = "Failed to upload image. ";
          if (imageError.code === 'storage/unauthorized') {
            errorMessage += "You don't have permission to upload. Please check Firebase Storage rules.";
          } else if (imageError.code === 'storage/quota-exceeded') {
            errorMessage += "Storage quota exceeded. Please contact support.";
          } else if (imageError.message?.includes('CORS') || imageError.message?.includes('cors')) {
            errorMessage += "CORS error detected. Please configure Firebase Storage CORS settings (see FIREBASE_STORAGE_SETUP.md).";
          } else {
            errorMessage += imageError.message || "Please try a smaller image or check your connection.";
          }
          
          throw new Error(errorMessage);
        }
      }

      // Calculate found date
      const foundDateObj = formData.foundDate
        ? new Date(formData.foundDate)
        : formData.foundMonth && formData.foundYear
        ? new Date(parseInt(formData.foundYear), parseInt(formData.foundMonth) - 1, 1)
        : new Date();

      // Get location (or use default Bangalore coordinates)
      const lat = formData.latitude ? parseFloat(formData.latitude) : 12.9716;
      const lng = formData.longitude ? parseFloat(formData.longitude) : 77.5946;

      // Save to Firestore - wrap in try-catch for better error handling
      let catDocRef;
      try {
        const catsRef = collection(db, "cats");
        catDocRef = await addDoc(catsRef, {
        color: formData.color,
        gender: formData.gender || "unknown",
        age: formData.age || "unknown",
        description: formData.description,
        status: "Found",
        location: formData.location,
        position: [lat, lng],
        latitude: lat,
        longitude: lng,
        foundDate: foundDateObj,
        foundMonth: formData.foundMonth,
        foundYear: formData.foundYear,
        imageUrl: imageUrl,
        reportedBy: {
          uid: user.uid,
          name: user.displayName || "Anonymous",
          email: user.email,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likeCount: 0,
        daysAgo: Math.floor((Date.now() - foundDateObj.getTime()) / (1000 * 60 * 60 * 24)),
        });
      } catch (firestoreError: any) {
        console.error("Error saving to cats collection:", firestoreError);
        throw new Error(`Failed to save cat report: ${firestoreError.message || "Please check your connection"}`);
      }

      // Create a post for the social feed
      try {
        const postsRef = collection(db, "posts");
        await addDoc(postsRef, {
        title: `Found: ${formData.color} cat`,
        type: "found",
        catId: catDocRef.id,
        description: formData.description || `Found ${formData.color} cat in ${formData.location}`,
        imageUrl: imageUrl,
        reportedBy: {
          uid: user.uid,
          name: user.displayName || "Anonymous",
          email: user.email,
        },
        createdAt: serverTimestamp(),
        likeCount: 0,
        });
      } catch (postError: any) {
        console.error("Error creating post:", postError);
        // Don't throw - cat was already saved, just log the error
        console.warn("Cat report saved but post creation failed. The cat will still appear on the map.");
      }

      // Reset loading state first
      setLoading(false);
      
      alert("Found cat reported successfully!");
      
      // Reset form
      setFormData({
        color: "",
        gender: "",
        age: "",
        description: "",
        location: "",
        latitude: "",
        longitude: "",
        foundMonth: "",
        foundYear: "",
        foundDate: "",
        image: null,
      });

      // Clear timeout since submission succeeded
      clearTimeout(timeoutId);
      
      // Redirect to home after a brief delay to ensure state is updated
      setTimeout(() => {
        router.push("/home");
      }, 100);
    } catch (error: any) {
      console.error("Error reporting found cat:", error);
      clearTimeout(timeoutId); // Clear timeout on error
      setLoading(false); // Ensure loading is reset on error
      
      // Provide more detailed error message
      const errorMessage = error.message || "Unknown error occurred";
      alert(`Failed to report found cat: ${errorMessage}\n\nPlease check your connection and try again.`);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <FieldSet>
            <FieldLegend className="text-xl font-bold">Report a Found Cat</FieldLegend>
            <FieldDescription>
              Found a stray cat? Report it here so the owner can find them. Check the Missing tab to see if it matches any reported missing cats.
            </FieldDescription>
            
            <FieldGroup className="mt-4 space-y-4">
              {/* Color and Gender Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="cat-color">Color *</FieldLabel>
                  <Select
                    value={formData.color}
                    onValueChange={(value) => handleInputChange("color", value)}
                    required
                  >
                    <SelectTrigger id="cat-color">
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
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
                  <FieldLabel htmlFor="cat-gender">Gender</FieldLabel>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => handleInputChange("gender", value)}
                  >
                    <SelectTrigger id="cat-gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              {/* Age */}
              <Field>
                <FieldLabel htmlFor="cat-age">Age</FieldLabel>
                <Select
                  value={formData.age}
                  onValueChange={(value) => handleInputChange("age", value)}
                >
                  <SelectTrigger id="cat-age">
                    <SelectValue placeholder="Select age range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kitten">Kitten (0-1 year)</SelectItem>
                    <SelectItem value="young">Young (1-3 years)</SelectItem>
                    <SelectItem value="adult">Adult (3-7 years)</SelectItem>
                    <SelectItem value="senior">Senior (7+ years)</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {/* Found Date */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field>
                  <FieldLabel>Found Date (Optional)</FieldLabel>
                  <Input
                    type="date"
                    value={formData.foundDate}
                    onChange={(e) => handleInputChange("foundDate", e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </Field>
                <Field>
                  <FieldLabel>Or select month</FieldLabel>
                  <Select
                    value={formData.foundMonth}
                    onValueChange={(value) => handleInputChange("foundMonth", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Year</FieldLabel>
                  <Select
                    value={formData.foundYear}
                    onValueChange={(value) => handleInputChange("foundYear", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field className="md:col-span-3">
                  <FieldLabel htmlFor="location">Location/Area *</FieldLabel>
                  <Input
                    id="location"
                    placeholder="e.g., Downtown, Park Street, Near Central Station..."
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="latitude">Latitude (Optional)</FieldLabel>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    placeholder="12.9716"
                    value={formData.latitude}
                    onChange={(e) => handleInputChange("latitude", e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="longitude">Longitude (Optional)</FieldLabel>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    placeholder="77.5946"
                    value={formData.longitude}
                    onChange={(e) => handleInputChange("longitude", e.target.value)}
                  />
                </Field>
              </div>

              {/* Description */}
              <Field>
                <FieldLabel htmlFor="description">Additional Details</FieldLabel>
                <Textarea
                  id="description"
                  placeholder="Any distinguishing features, collar details, condition, etc."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </Field>

              {/* Image Upload */}
              <Field>
                <FieldLabel htmlFor="image">Photo (Optional)</FieldLabel>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    handleInputChange("image", file);
                  }}
                />
                {formData.image && (
                  <p className="text-sm text-gray-600 mt-1">
                    Selected: {formData.image.name}
                  </p>
                )}
              </Field>
            </FieldGroup>
          </FieldSet>

          <div className="flex gap-3 mt-6">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Submitting..." : "Report Found Cat"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </FieldGroup>
      </form>
    </div>
  );
};

export default FoundForm;
