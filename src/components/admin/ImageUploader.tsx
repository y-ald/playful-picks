
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X } from "lucide-react";

interface ImageUploaderProps {
  mainImagePreview: string | null;
  additionalImagePreviews: string[];
  onMainImageChange: (file: File | null) => void;
  onAdditionalImagesChange: (files: File[]) => void;
  onRemoveAdditionalImage: (index: number) => void;
}

export function ImageUploader({ 
  mainImagePreview, 
  additionalImagePreviews, 
  onMainImageChange, 
  onAdditionalImagesChange,
  onRemoveAdditionalImage
}: ImageUploaderProps) {
  const handleMainFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onMainImageChange(e.target.files[0]);
    }
  };

  const handleAdditionalFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onAdditionalImagesChange(filesArray);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
        <h3 className="text-sm font-medium mb-2">Main Product Image</h3>
        {mainImagePreview ? (
          <div className="relative">
            <img 
              src={mainImagePreview} 
              alt="Main product preview" 
              className="mx-auto max-h-48 object-contain" 
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => onMainImageChange(null)}
            >
              Remove Image
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <Upload className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 mb-2">
              Click to upload or drag and drop
            </p>
            <Input
              id="main-product-image"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleMainFileChange}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('main-product-image')?.click()}
            >
              Select Main Image
            </Button>
          </div>
        )}
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
        <h3 className="text-sm font-medium mb-2">Additional Product Images</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {additionalImagePreviews.map((imgSrc, index) => (
            <div key={index} className="relative">
              <img 
                src={imgSrc} 
                alt={`Product preview ${index + 1}`} 
                className="w-full h-24 object-cover rounded" 
              />
              <button
                type="button"
                className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md"
                onClick={() => onRemoveAdditionalImage(index)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        
        <div className="mt-4">
          <Input
            id="additional-product-images"
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleAdditionalFilesChange}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('additional-product-images')?.click()}
          >
            Add More Images
          </Button>
        </div>
      </div>
    </div>
  );
}
