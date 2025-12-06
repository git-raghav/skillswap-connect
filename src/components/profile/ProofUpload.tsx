import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Upload, FileText, Image, Loader2, X, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Proof {
  id: string;
  title: string;
  file_url: string;
  file_type: string;
  created_at: string;
}

interface ProofUploadProps {
  userId: string;
  proofs: Proof[];
  onProofsChange: (proofs: Proof[]) => void;
  editable?: boolean;
}

const ProofUpload = ({ userId, proofs, onProofsChange, editable = true }: ProofUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !title.trim()) {
      toast({ title: "Missing info", description: "Please provide a title", variant: "destructive" });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 10MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Determine file type
      const fileType = file.type.startsWith("image/") ? "image" : "document";

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("certificates")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("certificates")
        .getPublicUrl(filePath);

      // Save to database
      const { data: proof, error: dbError } = await supabase
        .from("user_proofs")
        .insert({
          user_id: userId,
          title: title.trim(),
          file_url: publicUrl,
          file_type: fileType,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      onProofsChange([...proofs, proof]);
      setTitle("");
      setDialogOpen(false);
      toast({ title: "Proof uploaded!", description: "Your certificate/proof has been added." });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (proofId: string) => {
    try {
      const { error } = await supabase
        .from("user_proofs")
        .delete()
        .eq("id", proofId);

      if (error) throw error;

      onProofsChange(proofs.filter(p => p.id !== proofId));
      toast({ title: "Proof deleted" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Certificates & Proofs</h3>
        {editable && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Upload className="w-4 h-4" />
                Add Proof
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Certificate/Proof</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Guitar Certificate, Language Diploma"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Label>File</Label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleUpload}
                    accept="image/*,.pdf,.doc,.docx"
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className="w-full mt-2 h-24 border-dashed gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || !title.trim()}
                  >
                    {uploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Click to upload (Max 10MB)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {proofs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {proofs.map((proof) => (
            <div
              key={proof.id}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border"
            >
              {proof.file_type === "image" ? (
                <Image className="w-5 h-5 text-primary shrink-0" />
              ) : (
                <FileText className="w-5 h-5 text-primary shrink-0" />
              )}
              <span className="flex-1 text-sm font-medium text-foreground truncate">
                {proof.title}
              </span>
              <a
                href={proof.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              {editable && (
                <button
                  onClick={() => handleDelete(proof.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {editable ? "No proofs uploaded yet. Add certificates to build trust!" : "No proofs uploaded yet."}
        </p>
      )}
    </div>
  );
};

export default ProofUpload;
