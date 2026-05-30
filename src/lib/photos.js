import imageCompression from "browser-image-compression";
import { supabase, PHOTO_BUCKET } from "../supabaseClient";

const ALLOWED = ["image/png", "image/jpeg", "image/jpg"];

// Compress a phone photo down to something small (~max 1000px, ~0.3MB)
// before uploading, so 500 entries stay well within the free storage tier.
const COMPRESSION_OPTS = {
  maxSizeMB: 0.3,
  maxWidthOrHeight: 1000,
  useWebWorker: true,
  fileType: "image/jpeg",
};

export function validateImage(file) {
  if (!file) return "Please choose a photo.";
  if (!ALLOWED.includes(file.type)) return "Photo must be a PNG, JPG, or JPEG.";
  if (file.size > 15 * 1024 * 1024) return "Photo is too large (max 15MB).";
  return null;
}

// Compresses + uploads the image, returns its public URL.
export async function uploadPhoto(file, { department, division, roll }) {
  const compressed = await imageCompression(file, COMPRESSION_OPTS);

  // Unique filename so re-uploads (edits) never collide or get cached stale.
  const path = `${department}-${division}/${roll}-${Date.now()}.jpg`;

  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, compressed, { contentType: "image/jpeg", upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
