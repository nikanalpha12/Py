import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image, Send, X } from "lucide-react";
import { UploadFile } from "@/integrations/Core";
import { User } from "@/entities/User";
import { INTEREST_CATEGORIES } from "../interests/InterestsSelector";

export default function CreatePost({ userLocation, onPostCreated, currentUser }) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("casual_chats");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const user = await User.me();
        setIsDark(user.theme === 'dark');
      } catch (error) {
        setIsDark(false);
      }
    };
    loadTheme();
  }, []);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() || !userLocation) return;
    
    setIsPosting(true);
    let imageUrl = null;
    
    if (imageFile) {
      const result = await UploadFile({ file: imageFile });
      imageUrl = result.file_url;
    }

    await onPostCreated({
      content: content.trim(),
      image_url: imageUrl,
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      likes: [],
      category: category,
      author_name: currentUser.full_name,
      author_email: currentUser.email,
      author_avatar: currentUser.avatar_url
    });

    setContent("");
    setCategory("casual_chats");
    setImageFile(null);
    setImagePreview(null);
    setIsPosting(false);
  };

  return (
    <Card className="p-4 shadow-lg" style={{
      background: isDark ? '#1E2024' : 'rgba(255, 255, 255, 0.8)',
      borderColor: isDark ? 'rgba(58, 130, 247, 0.2)' : 'rgba(191, 219, 254, 0.5)',
      backdropFilter: 'blur(8px)'
    }}>
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold flex-shrink-0" style={{
          background: isDark ? 'linear-gradient(to br, #3A82F7, #4FC3F7)' : 'linear-gradient(to br, #60a5fa, #3b82f6)'
        }}>
          {currentUser.avatar_url ? (
            <img src={currentUser.avatar_url} alt="" className="w-full h-full rounded-lg object-cover" />
          ) : (
            currentUser.full_name?.[0]?.toUpperCase() || "?"
          )}
        </div>
        
        <div className="flex-1 space-y-3">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="rounded-xl" style={{
              borderColor: isDark ? 'rgba(58, 130, 247, 0.3)' : '#e5e7eb',
              background: isDark ? '#2a2d32' : '#ffffff',
              color: isDark ? '#FFFFFF' : '#1f2937'
            }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={{
              background: isDark ? '#1E2024' : '#ffffff',
              borderColor: isDark ? 'rgba(58, 130, 247, 0.2)' : '#e5e7eb',
              color: isDark ? '#FFFFFF' : '#1f2937'
            }}>
              {INTEREST_CATEGORIES.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Textarea
            placeholder="What's happening nearby?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-20 resize-none rounded-2xl"
            style={{
              borderColor: isDark ? 'rgba(58, 130, 247, 0.3)' : '#e5e7eb',
              background: isDark ? '#2a2d32' : '#ffffff',
              color: isDark ? '#FFFFFF' : '#1f2937'
            }}
          />
          
          {imagePreview && (
            <div className="relative">
              <img src={imagePreview} alt="Preview" className="w-full rounded-2xl max-h-64 object-cover" />
              <Button
                variant="secondary"
                size="icon"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                }}
                className="absolute top-2 right-2 rounded-lg shadow-lg"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload">
              <Button variant="ghost" size="sm" className="gap-2 rounded-lg" type="button" asChild>
                <span style={{ color: isDark ? '#A0A4AB' : '#6b7280' }}>
                  <Image className="w-4 h-4" />
                  Photo
                </span>
              </Button>
            </label>
            
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || isPosting || !userLocation}
              className="gap-2 rounded-lg shadow-md"
              style={{
                background: isDark ? 'linear-gradient(135deg, #3A82F7, #4FC3F7)' : '#3B82F6',
                color: '#ffffff'
              }}>
              <Send className="w-4 h-4" />
              {isPosting ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}