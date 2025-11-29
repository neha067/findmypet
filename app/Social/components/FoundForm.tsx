"use client";

import { useEffect, useState } from "react";
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
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
});
// No need to import default image functions - we use icons instead
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface FoundPetData {
  petType: "cat" | "dog" | "other" | "";
  color: string;
  gender: string;
  age: string;
  location?: string;
  latitude?: string;
  longitude?: string;
  foundDate?: string;
  foundMonth?: string;
  foundYear?: string;
  description?: string;
  targetOwnerEmail?: string;
  targetOwnerName?: string;
  targetPostId?: string;
}

const FoundForm = ({ foundPetData, onPostSuccess }: { foundPetData: FoundPetData; onPostSuccess?: () => void }) => {
  const { user, username } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    petType: "" as "cat" | "dog" | "other" | "",
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
  const [map_center, setMapCenter] = useState<[number, number]>([12.9716, 77.5946]);

  const updateMapCenter = (data: [number, number]) => {
    setMapCenter(data);
    handleInputChange("latitude", String(data[0]))
    handleInputChange("longitude", String(data[1]))
  };

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

  useEffect(() => {
    if (foundPetData) {
      setFormData(prev => ({
        ...prev,
        petType: foundPetData.petType,
        color: foundPetData.color,
        gender: foundPetData.gender,
        age: foundPetData.age,
      }));
    }
  }, [foundPetData]);


  useEffect(() => {
    console.log('foundPetData in foundform', foundPetData);
    if (foundPetData) {
      setFormData(prev => ({
        ...prev,
        color: (foundPetData?.color || "").toLowerCase(),
        age: (foundPetData?.age || "").toLowerCase(),
        petType: (foundPetData?.petType || "").toLowerCase() as "cat" | "dog" | "other" | "",
        gender: (foundPetData?.gender || "").toLowerCase(),
        location: foundPetData.location || "",
        latitude: foundPetData.latitude || "",
        longitude: foundPetData.longitude || "",
        foundDate: foundPetData.foundDate || "",
        foundMonth: foundPetData.foundMonth || "",
        foundYear: foundPetData.foundYear || "",
        description: foundPetData.description || ""
      }));
    }
  }, [foundPetData])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.petType) {
      newErrors.petType = "Please select a pet type";
    }
    if (!formData.color) {
      newErrors.color = "Please select a color";
    }
    if (!formData.location || formData.location.trim() === "") {
      newErrors.location = "Please enter a location";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert("Please login to report a found pet");
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

    if (!db) {
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
          // Upload to Cloudinary
          imageUrl = await uploadImageToCloudinary(formData.image, 'pets');
        } catch (imageError: any) {
          console.error("Image upload error:", imageError);
          throw new Error(imageError.message || "Failed to upload image. Please try again.");
        }
      }

      // If no image uploaded, imageUrl will remain empty
      // This will trigger icon display in PostCard instead of an image

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
      let petDocRef;
      try {
        const petsRef = collection(db, "pets");
        petDocRef = await addDoc(petsRef, {
          petType: formData.petType,
          color: formData.color,
          gender: formData.gender || "unknown",
          age: formData.age || "unknown",
          description: formData.description,
          status: "found",
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
            name: username || user.displayName || "Anonymous",
            email: user.email || "",
            photo: user.photoURL || null,
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
      let newPostId = "";
      try {
        const postsRef = collection(db, "posts");
        const postDocRef = await addDoc(postsRef, {
          title: `Found: ${formData.color} ${formData.petType || "pet"}`,
          type: "found",
          petType: formData.petType,
          catId: petDocRef.id,
          description: formData.description || `Found ${formData.color} ${formData.petType || "pet"} in ${formData.location}`,
          imageUrl: imageUrl,
          reportedBy: {
            uid: user.uid,
            name: username || user.displayName || "Anonymous",
            email: user.email || "",
            photo: user.photoURL || null,
          },
          createdAt: serverTimestamp(),
        });
        newPostId = postDocRef.id;
      } catch (postError: any) {
        console.error("Error creating post:", postError);
        // Don't throw - cat was already saved, just log the error
        console.warn("Cat report saved but post creation failed. The cat will still appear on the map.");
      }

      // Reset loading state first
      setLoading(false);

      // Show success dialog
      setShowSuccessDialog(true);

      // Reset form
      setFormData({
        petType: "",
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

      // Send email to the missing pet owner if applicable
      if (foundPetData.targetOwnerEmail) {
        try {
          // Add comment to the missing post if targetPostId exists
          const postLink = `${window.location.origin}/home?id=${newPostId}`;
          if (foundPetData.targetPostId) {
            const commentsRef = collection(db, "posts", foundPetData.targetPostId, "comments");
            await addDoc(commentsRef, {
              userId: user.uid,
              userName: username || user.displayName || "Anonymous",
              userPhoto: user.photoURL || "",
              text: `Is this your pet? I reported a found pet that matches. Please check the timeline! ${postLink}`,
              createdAt: serverTimestamp(),
            });
          }

          const subject = `Potential Match Found: ${formData.color} ${formData.petType}`;
          const body = `
            <p>Hello ${foundPetData.targetOwnerName || "Pet Owner"},</p>
            <p>A user has reported a found pet that might match your missing pet.</p>
            <h3>Details of Found Pet:</h3>
            <ul>
              <li><strong>Type:</strong> ${formData.petType}</li>
              <li><strong>Color:</strong> ${formData.color}</li>
              <li><strong>Location:</strong> ${formData.location}</li>
              <li><strong>Description:</strong> ${formData.description}</li>
            </ul>
            <p><strong>Is this your pet?</strong></p>
            <p>You can view the full report here: <a href="${postLink}">${postLink}</a></p>
            <p>Reported by: ${username || user.displayName || "Anonymous"} (${user.email})</p>
            <p>Please check the app for more details.</p>
          `;

          await fetch('/api/send-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: foundPetData.targetOwnerEmail,
              subject: subject,
              html: body,
            }),
          });
          console.log("Notification email sent to missing pet owner.");
        } catch (emailError) {
          console.error("Error sending notification email:", emailError);
          // Don't block success flow
        }
      }

    } catch (error: any) {
      console.error("Error reporting found cat:", error);
      clearTimeout(timeoutId); // Clear timeout on error
      setLoading(false); // Ensure loading is reset on error

      // Provide more detailed error message
      const errorMessage = error.message || "Unknown error occurred";
      // Send email to the missing pet owner if applicable

      alert(`Failed to report found pet: ${errorMessage}\n\nPlease check your connection and try again.`);
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
            <FieldLegend className="text-xl font-bold">Report a Found Pet</FieldLegend>
            <FieldDescription>
              Found a stray pet? Report it here so the owner can find them.
            </FieldDescription>

            <FieldGroup className="mt-4 space-y-4">
              {/* Pet Type */}
              <Field>
                <FieldLabel htmlFor="pet-type">Pet Type *</FieldLabel>
                <Select
                  value={foundPetData?.petType}
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

              {/* Color and Gender Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="pet-color">Color/Coat Color *</FieldLabel>
                  <Select
                    value={foundPetData?.color}
                    onValueChange={(value) => handleInputChange("color", value)}
                    required
                  >
                    <SelectTrigger
                      id="pet-color"
                      className={errors.color ? "border-red-500 border-2" : ""}
                    >
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
                  {errors.color && (
                    <p className="text-red-500 text-sm mt-1">{errors.color}</p>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="cat-gender">Gender</FieldLabel>
                  <Select
                    value={foundPetData?.gender}
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
                <FieldLabel htmlFor="pet-age">Age</FieldLabel>
                <Select
                  value={foundPetData?.age}
                  onValueChange={(value) => handleInputChange("age", value)}
                >
                  <SelectTrigger id="pet-age">
                    <SelectValue placeholder="Select age range" />
                  </SelectTrigger>
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
                {/* <Field>
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
            </FieldGroup>
          </FieldSet>

          <div className="flex gap-3 mt-6">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Submitting..." : "Report Found Pet"}
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

      <Dialog open={showSuccessDialog} onOpenChange={(open) => {
        if (!open) {
          setShowSuccessDialog(false);
          if (onPostSuccess) {
            onPostSuccess();
          } else {
            router.push("/home");
          }
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Reported Successfully! 🎉</DialogTitle>
            <DialogDescription className="text-center">
              Thank you for helping! The found pet has been reported and is now visible on the map.
              {foundPetData?.targetOwnerEmail && (
                <span className="block mt-2 text-blue-600 dark:text-blue-400">
                  We have also notified the owner of the missing pet about your report.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => {
                setShowSuccessDialog(false);
                if (onPostSuccess) {
                  onPostSuccess();
                } else {
                  router.push("/home");
                }
              }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FoundForm;
