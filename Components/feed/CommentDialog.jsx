
import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Trash2 } from "lucide-react";
import { Comment } from "@/entities/Comment";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function CommentDialog({ post, currentUser, open, onOpenChange }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadComments = useCallback(async () => {
    if (!post) return; // Add null check for post
    setIsLoading(true);
    const data = await Comment.filter({ post_id: post.id }, "-created_date");
    setComments(data);
    setIsLoading(false);
  }, [post]); // Dependency on post

  useEffect(() => {
    if (open && post) {
      loadComments();
    }
  }, [open, post, loadComments]); // Dependency on loadComments

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    await Comment.create({
      post_id: post.id,
      content: newComment.trim(),
      author_name: currentUser.full_name,
      author_email: currentUser.email,
      author_avatar: currentUser.avatar_url
    });
    
    setNewComment("");
    await loadComments();
    setIsSubmitting(false);
  };

  const handleDelete = async (commentId) => {
    await Comment.delete(commentId);
    await loadComments();
  };

  if (!post) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No comments yet. Be the first!</div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {comment.author_avatar ? (
                      <img src={comment.author_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      comment.author_name?.[0]?.toUpperCase() || "?"
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-sm truncate">{comment.author_name}</span>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {format(new Date(comment.created_date), "MMM d, h:mm a")}
                        </span>
                      </div>
                      
                      {comment.author_email === currentUser.email && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(comment.id)}
                          className="h-8 w-8 rounded-full flex-shrink-0"
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mt-1 break-words">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-20 resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <Button
            onClick={handleSubmit}
            disabled={!newComment.trim() || isSubmitting}
            className="self-end bg-[#3B82F6] hover:bg-[#2563EB] text-white">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
