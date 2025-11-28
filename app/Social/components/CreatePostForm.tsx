"use client";

import { use, useEffect, useState } from "react";
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
import dynamic from "next/dynamic";
import type { LatLngTuple } from "leaflet";
// No need to import default image functions - we use icons instead
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
});

const CreatePostForm = () => {
  const { user } = useAuth();
  const router = useRouter();
  // const map_center: LatLngTuple = [12.9716, 77.5946];
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    petType: "" as "cat" | "dog" | "other" | "",
    name: "",
    color: "",
    gender: "",
    age: "",
    description: "",
    location: "",
    latitude: "",
    longitude: "",
    missingMonth: "",
    missingYear: "",
    missingDate: "",
    image: null as File | null,
    postType: ""
  });

  const handleInputChange = (field: string, value: string | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  const [map_center, setMapCenter] = useState<[number, number]>([12.9716, 77.5946]);

  const updateMapCenter = (data: [number, number]) => {
    setMapCenter(data);
    handleInputChange("latitude", String(data[0]))
    handleInputChange("longitude", String(data[1]))
  };

  useEffect(() => {
    console.log('mapc',map_center);
    
  },[map_center])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Post type is always required
    if (!formData.postType) {
      newErrors.postType = "Please select a post type";
    }

    // For non-social posts, validate all required fields
    if (formData.postType !== "social") {
      if (!formData.petType) {
        newErrors.petType = "Please select a pet type";
      }
      if (!formData.color) {
        newErrors.color = "Please select a color";
      }
      if (!formData.gender) {
        newErrors.gender = "Please select a gender";
      }
      if (!formData.age) {
        newErrors.age = "Please select an age";
      }
      if (!formData.location || formData.location.trim() === "") {
        newErrors.location = "Please enter a location";
      }
      // Name required only for missing posts
      if (formData.postType === "missing" && (!formData.name || formData.name.trim() === "")) {
        newErrors.name = "Please enter the pet's name";
      }
    }

    // For social posts, only description is required
    if (formData.postType === "social") {
      if (!formData.description || formData.description.trim() === "") {
        newErrors.description = "Please enter a description";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert("Please login to report a missing pet");
      return;
    }

    // Validate form and show errors
    if (!validateForm()) {
      const errorFields = Object.keys(errors).join(", ");
      alert(`Please fill in all required fields. Missing: ${errorFields}`);
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
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
      
      // If no image uploaded, imageUrl will remain empty
      // This will trigger icon display in PostCard instead of an image

      // Calculate missing date
      const missingDateObj = formData.missingDate 
        ? new Date(formData.missingDate)
        : formData.missingMonth && formData.missingYear
        ? new Date(parseInt(formData.missingYear), parseInt(formData.missingMonth) - 1, 1)
        : new Date();

      // Get user's location if not provided (or use default Bangalore coordinates)
      const lat = formData.latitude ? parseFloat(formData.latitude) : 12.9716;
      const lng = formData.longitude ? parseFloat(formData.longitude) : 77.5946;

      // Save to Firestore - wrap in try-catch for better error handling
      let catDocRef;
      try {
        const catsRef = collection(db, "cats");
        catDocRef = await addDoc(catsRef, {
        petType: formData.petType,
        name: formData.name,
        color: formData.color,
        gender: formData.gender || "unknown",
        age: formData.age || "unknown",
        description: formData.description,
        status: formData.postType,
        location: formData.location,
        position: [lat, lng],
        latitude: lat,
        longitude: lng,
        missingDate: missingDateObj,
        missingMonth: formData.missingMonth,
        missingYear: formData.missingYear,
        imageUrl: imageUrl,
        reportedBy: {
          uid: user.uid,
          name: user.displayName || "Anonymous",
          email: user.email || "",
          photo: user.photoURL || null,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likeCount: 0,
        daysAgo: Math.floor((Date.now() - missingDateObj.getTime()) / (1000 * 60 * 60 * 24)),
        });
      } catch (firestoreError: any) {
        console.error("Error saving to cats collection:", firestoreError);
        throw new Error(`Failed to save cat report: ${firestoreError.message || "Please check your connection"}`);
      }

      // Create a post for the social feed
      try {
        const postsRef = collection(db, "posts");
        await addDoc(postsRef, {
        title: `Missing: ${formData.name}`,
        type: "missing",
        petType: formData.petType,
        catId: catDocRef.id,
        description: formData.description || `Missing ${formData.color} ${formData.petType || "pet"} named ${formData.name}`,
        imageUrl: imageUrl,
        reportedBy: {
          uid: user.uid,
          name: user.displayName || "Anonymous",
          email: user.email || "",
          photo: user.photoURL || null,
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
      
      alert("Missing cat reported successfully!");
      
      // Reset form
      setFormData({
        petType: "",
        name: "",
        color: "",
        gender: "",
        age: "",
        description: "",
        location: "",
        latitude: "",
        longitude: "",
        missingMonth: "",
        missingYear: "",
        missingDate: "",
        image: null,
        postType:""
      });

      // Clear timeout since submission succeeded
      clearTimeout(timeoutId);
      
      // Redirect to home after a brief delay to ensure state is updated
      setTimeout(() => {
        router.push("/home");
      }, 100);
    } catch (error: any) {
      console.error("Error reporting missing cat:", error);
      clearTimeout(timeoutId); // Clear timeout on error
      setLoading(false); // Ensure loading is reset on error
      
      // Provide more detailed error message
      const errorMessage = error.message || "Unknown error occurred";
      alert(`Failed to report missing cat: ${errorMessage}\n\nPlease check your connection and try again.`);
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

  useEffect(()   => {
    console.log('form',formData);
    
  },[formData,formData?.latitude])

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <FieldSet>
            <FieldLegend className="text-xl font-bold">Create a Post</FieldLegend>
            <FieldDescription>
              Fill in the details below to report a missing/found pet or just for fun. Missing/found cats will appear on the map and social feed.
            </FieldDescription>
            
            <FieldGroup className="mt-4 space-y-4">
              {/*cat status */}
               <Field>
                <FieldLabel htmlFor="post-type">Post type *</FieldLabel>
                 <Select
                    value={formData.postType}
                    onValueChange={(value) => handleInputChange("postType", value)}
                    required
                  >
                    <SelectTrigger 
                      id="post-type"
                      className={errors.postType ? "border-red-500 border-2" : ""}
                    >
                      <SelectValue placeholder="Select type of post" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="missing">Missing</SelectItem>
                      <SelectItem value="found">Found</SelectItem>
                       <SelectItem value="adoption">Adoption</SelectItem>
                      <SelectItem value="social">Just for fun</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.postType && (
                    <p className="text-red-500 text-sm mt-1">{errors.postType}</p>
                  )}
              </Field>

              {formData.postType !== 'social' ? 

              <>

              {/* Pet Type */}
              <Field>
                <FieldLabel htmlFor="pet-type">Pet Type *</FieldLabel>
                <Select
                  value={formData.petType}
                  onValueChange={(value) => handleInputChange("petType", value as "cat" | "dog" | "other")}
                  required
                >
                  <SelectTrigger 
                    id="pet-type"
                    className={errors.petType ? "border-red-500 border-2" : ""}
                  >
                    <SelectValue placeholder="Select pet type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cat">Cat</SelectItem>
                    <SelectItem value="dog">Dog</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.petType && (
                  <p className="text-red-500 text-sm mt-1">{errors.petType}</p>
                )}
              </Field>

              {/* Pet Name */}
              <Field>
                <FieldLabel htmlFor="pet-name">
                  {formData.postType === 'missing' ? 'Pet Name *' : 'Pet Name (Optional)'}
                </FieldLabel>
                <Input
                  id="pet-name"
                  placeholder={formData.petType === "dog" ? "e.g., Max, Bella, Buddy..." : formData.petType === "other" ? "e.g., Birdy, Rabbit..." : "e.g., Whiskers, Luna, Tuna..."}
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required={formData.postType === 'missing'}
                  className={errors.name ? "border-red-500 border-2" : ""}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </Field>

              {/* Color and Gender Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="pet-color">Color/Coat Color *</FieldLabel>
                  <Select
                    value={formData.color}
                    onValueChange={(value) => handleInputChange("color", value)}
                    required
                  >
                    <SelectTrigger 
                      id="pet-color"
                      className={errors.color ? "border-red-500 border-2" : ""}
                    >
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                {errors.color && (
                  <p className="text-red-500 text-sm mt-1">{errors.color}</p>
                )}
                    <SelectContent>
                      <SelectItem value="black">Black</SelectItem>
                      <SelectItem value="white">White</SelectItem>
                      <SelectItem value="orange">Orange</SelectItem>
                      <SelectItem value="brown">Brown</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    <SelectItem value="others">Others</SelectItem>
                  </SelectContent>
                  </Select>
                  {errors.color && (
                    <p className="text-red-500 text-sm mt-1">{errors.color}</p>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="cat-gender">Gender *</FieldLabel>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => handleInputChange("gender", value)}
                    required
                  >
                    <SelectTrigger 
                      id="cat-gender"
                      className={errors.gender ? "border-red-500 border-2" : ""}
                    >
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                {errors.gender && (
                  <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
                )}
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                  </Select>
                  {errors.gender && (
                    <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
                  )}
                </Field>
              </div>

              {/* Age */}
              <Field>
                <FieldLabel htmlFor="pet-age">Age *</FieldLabel>
                <Select
                  value={formData.age}
                  onValueChange={(value) => handleInputChange("age", value)}
                  required
                >
                  <SelectTrigger 
                    id="pet-age"
                    className={errors.age ? "border-red-500 border-2" : ""}
                  >
                    <SelectValue placeholder="Select age range" />
                  </SelectTrigger>
                {errors.age && (
                  <p className="text-red-500 text-sm mt-1">{errors.age}</p>
                )}
                  <SelectContent>
                    {formData.petType === "cat" && (
                      <>
                        <SelectItem value="kitten">Kitten (0-1 year)</SelectItem>
                        <SelectItem value="young">Young (1-3 years)</SelectItem>
                        <SelectItem value="adult">Adult (3-7 years)</SelectItem>
                        <SelectItem value="senior">Senior (7+ years)</SelectItem>
                      </>
                    )}
                    {formData.petType === "dog" && (
                      <>
                        <SelectItem value="puppy">Puppy (0-1 year)</SelectItem>
                        <SelectItem value="young">Young (1-3 years)</SelectItem>
                        <SelectItem value="adult">Adult (3-7 years)</SelectItem>
                        <SelectItem value="senior">Senior (7+ years)</SelectItem>
                      </>
                    )}
                    {formData.petType === "other" && (
                      <>
                        <SelectItem value="young">Young</SelectItem>
                        <SelectItem value="adult">Adult</SelectItem>
                        <SelectItem value="senior">Senior</SelectItem>
                      </>
                    )}
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
                {errors.age && (
                  <p className="text-red-500 text-sm mt-1">{errors.age}</p>
                )}
              </Field>

              {/* Missing Date */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field>
                  <FieldLabel>{formData.postType === 'missing' ? 'Missing Date *' :
                  'Found Date *'} </FieldLabel>
                  <Input
                    type="date"
                    value={formData.missingDate}
                    onChange={(e) => handleInputChange("missingDate", e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </Field>
                {/* <Field>
                  <FieldLabel>Or select month</FieldLabel>
                  <Select
                    value={formData.missingMonth}
                    onValueChange={(value) => handleInputChange("missingMonth", value)}
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
                    value={formData.missingYear}
                    onValueChange={(value) => handleInputChange("missingYear", value)}
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
                </Field> */}
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
                    className={errors.location ? "border-red-500 border-2" : ""}
                  />
                  {errors.location && (
                    <p className="text-red-500 text-sm mt-1">{errors.location}</p>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="latitude">Latitude *</FieldLabel>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    placeholder="12.9716"
                    value={formData.latitude}
                    onChange={(e) => handleInputChange("latitude", e.target.value)}
                    disabled
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="longitude">Longitude *</FieldLabel>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    placeholder="77.5946"
                    value={formData.longitude}
                    onChange={(e) => handleInputChange("longitude", e.target.value)}
                    disabled
                  />
                </Field>
              </div>

              <MapView 
              map_center={map_center} 
              updateMapCenter={updateMapCenter}
              // catData={[]}
              // locationForm={true}
              />

              {/* Description */}
              <Field>
                <FieldLabel htmlFor="description">Additional Details</FieldLabel>
                <Textarea
                  id="description"
                  placeholder="Any distinguishing features, collar details, behavior, etc."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={4}
                  className={`resize-none ${errors.description ? "border-red-500 border-2" : ""}`}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                )}
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
                {!formData.image && (
                  <p className="text-xs text-gray-500 mt-1">
                    No photo selected. A default image will be used based on pet type.
                  </p>
                )}
              </Field>

              </>
              :

              <>

              {/* Description */}
              <Field>
                <FieldLabel htmlFor="description">Whats on your mind? *</FieldLabel>
                <Textarea
                  id="description"
                  placeholder="write caption here..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={4}
                  className={`resize-none ${errors.description ? "border-red-500 border-2" : ""}`}
                  required
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                )}
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
                {!formData.image && (
                  <p className="text-xs text-gray-500 mt-1">
                    No photo selected. A default image will be used.
                  </p>
                )}
              </Field>

              </>
            }
            </FieldGroup>
          </FieldSet>

          <div className="flex gap-3 mt-6">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Submitting..." : "Post"}
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

export default CreatePostForm;
