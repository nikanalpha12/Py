import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, MapPin, MoreVertical, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Post } from "@/entities/Post";
import { User } from "@/entities/User";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PostCard({ post, currentUserEmail, onLike, onDelete, onCommentClick, distance }) {
  const [isLiking, setIsLiking] = useState(false);
  const isLiked = post.likes?.includes(currentUserEmail);
  const likeCount = post.likes?.length || 0;

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    
    const newLikes = isLiked
      ? post.likes.filter(email => email !== currentUserEmail)
      : [...(post.likes || []), currentUserEmail];
    
    await onLike(post.id, newLikes);
    setIsLiking(false);
  };

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-blue-100/50">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-lg shadow-md">
            {post.author_avatar ? (
              <img src={post.author_avatar} alt="" className="w-full h-full rounded-lg object-cover" />
            ) : (
              post.author_name?.[0]?.toUpperCase() || "?"
            )}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{post.author_name}</div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span>{format(new Date(post.created_date), "MMM d, h:mm a")}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{distance} mi away</span>
              </div>
            </div>
          </div>
        </div>
        
        {post.author_email === currentUserEmail && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-lg text-gray-600">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDelete(post.id)} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        <p className="leading-relaxed whitespace-pre-wrap text-gray-900">{post.content}</p>
      </div>

      {/* Image */}
      {post.image_url && (
        <div className="px-4 pb-4">
          <img 
            src={post.image_url} 
            alt="Post" 
            className="w-full rounded-2xl object-cover max-h-96 shadow-md"
          />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 flex items-center gap-4 border-t border-gray-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          disabled={isLiking}
          className={`gap-2 rounded-lg transition-all duration-200 ${isLiked ? 'text-red-500' : 'text-gray-600'}`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
          <span className="font-medium">{likeCount}</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCommentClick(post)}
          className="gap-2 rounded-lg text-gray-600"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="font-medium">Comment</span>
        </Button>
      </div>
    </Card>
  );
}