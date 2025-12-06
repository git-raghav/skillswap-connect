import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  userId: string;
  userName: string;
  onUploadComplete: (url: string) => void;
  editable?: boolean;
}

const AvatarUpload = ({ 
  currentAvatarUrl, 
  userId, 
  userName, 
  onUploadComplete,
  editable = true 
}: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      onUploadComplete(publicUrl);
      toast({ title: "Avatar updated!", description: "Your profile picture has been changed." });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const avatarSrc = currentAvatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;

  return (
    <div className="relative inline-block">
      <img
        src={avatarSrc}
        alt={userName}
        className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
      />
      {editable && (
        <>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center border-2 border-background hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" />
            ) : (
              <Camera className="w-5 h-5 text-primary-foreground" />
            )}
          </button>
        </>
      )}
    </div>
  );
};

export default AvatarUpload;
