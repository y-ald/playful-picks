import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_PROMPT = `Professional e-commerce product photo, high-end children's boutique catalog (Bonpoint / Jacadi style).
- Pure clean cream studio background (~#F5F1EA), subtle vignette
- Soft diffused studio lighting, gentle realistic shadow for depth
- Item perfectly centered, flat-lay, full item visible
- PRESERVE EXACTLY the original garment (fabric, texture, color, pattern, stitching, buttons, proportions)
- Ultra sharp, true-to-life colors
- No props, no text, no watermark, no people, no mannequin`;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Current main image preview (object URL or remote URL) — used as the "before" source */
  sourcePreview: string;
  /** The current source File if available (new upload); null when editing an existing product where source is a URL */
  sourceFile: File | null;
  /**
   * Called when admin clicks "Use this enhanced photo".
   * - enhancedFile: the new studio image to display on the site
   * - originalSource: the original (non-enhanced) source so the hook can save it as `original_image_url`
   */
  onAccept: (enhancedFile: File, originalSource: { file: File | null; url: string | null }) => void;
}

async function urlToBase64(url: string): Promise<{ b64: string; mime: string }> {
  const res = await fetch(url);
  const blob = await res.blob();
  const mime = blob.type || "image/jpeg";
  const buf = await blob.arrayBuffer();
  // base64 from arraybuffer
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as any);
  }
  return { b64: btoa(binary), mime };
}

export function EnhancePhotoDialog({ open, onOpenChange, sourcePreview, sourceFile, onAccept }: Props) {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [loading, setLoading] = useState(false);
  const [enhancedPreview, setEnhancedPreview] = useState<string | null>(null);
  const [enhancedFile, setEnhancedFile] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) {
      setEnhancedPreview(null);
      setEnhancedFile(null);
      setPrompt(DEFAULT_PROMPT);
    }
  }, [open]);

  const generate = async () => {
    setLoading(true);
    setEnhancedPreview(null);
    setEnhancedFile(null);
    try {
      const { b64, mime } = await urlToBase64(sourcePreview);
      const { data, error } = await supabase.functions.invoke("enhance-product-photo", {
        body: { imageBase64: b64, mimeType: mime, prompt },
      });
      if (error) throw error;
      if (!data?.imageBase64) throw new Error("No image returned");

      // Convert base64 -> File
      const byteString = atob(data.imageBase64);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
      const blob = new Blob([ab], { type: data.mimeType || "image/png" });
      const file = new File([blob], `enhanced-${Date.now()}.png`, { type: blob.type });
      setEnhancedFile(file);
      setEnhancedPreview(URL.createObjectURL(blob));
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Enhancement failed",
        description: e?.message ?? "Could not enhance image",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const accept = () => {
    if (!enhancedFile) return;
    const isObjectUrl = sourcePreview.startsWith("blob:");
    onAccept(enhancedFile, {
      file: sourceFile,
      url: !sourceFile && !isObjectUrl ? sourcePreview : null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Studio photo enhancement
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium mb-1 text-muted-foreground">Before (original)</p>
            <div className="aspect-square bg-muted rounded overflow-hidden flex items-center justify-center">
              <img src={sourcePreview} alt="Original" className="max-h-full max-w-full object-contain" />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium mb-1 text-muted-foreground">After (studio)</p>
            <div className="aspect-square bg-muted rounded overflow-hidden flex items-center justify-center">
              {loading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : enhancedPreview ? (
                <img src={enhancedPreview} alt="Enhanced" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-xs text-muted-foreground px-4 text-center">
                  Click "Generate" to create a studio version
                </span>
              )}
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="enhance-prompt" className="text-xs">Prompt (editable)</Label>
          <Textarea
            id="enhance-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={6}
            className="text-xs font-mono"
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            Powered by Google AI Studio (Gemini 2.5 Flash Image — Nano Banana). The original photo is preserved separately.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="secondary" onClick={generate} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {enhancedPreview ? "Regenerate" : "Generate"}
          </Button>
          <Button type="button" onClick={accept} disabled={!enhancedFile}>
            Use this enhanced photo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
