
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";

interface ImageUploaderProps {
  imagePreview: string | null;
  onImageChange: (file: File | null) => void;
}

export function ImageUploader({ imagePreview, onImageChange }: ImageUploaderProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageChange(e.target.files[0]);
    }
  };

  // Using a dashed border container for consistent drop zone appearance
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
      {imagePreview ? (
        <div className="relative">
          <img 
            src={imagePreview} 
            alt="Product preview" 
            className="mx-auto max-h-48 object-contain" 
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => onImageChange(null)}
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
            id="product-image"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('product-image')?.click()}
          >
            Select Image
          </Button>
        </div>
      )}
    </div>
  );
}
