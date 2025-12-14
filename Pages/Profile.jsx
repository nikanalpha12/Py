import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Post } from "@/entities/Post";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, Camera, Save, LogOut, Settings } from "lucide-react";
import { UploadFile } from "@/integrations/Core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import PostCard from "../components/feed/PostCard";
import CommentDialog from "../components/feed/CommentDialog";
import InterestsSelector from "../components/interests/InterestsSelector";

export default function Profile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [myPosts, setMyPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({});
  const [selectedPost, setSelectedPost] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [showInterests, setShowInterests] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState([]);


  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const user = await User.me();
    setCurrentUser(user);
    setEditData({
      full_name: user.full_name || "",
      bio: user.bio || "",
      avatar_url: user.avatar_url || ""
    });
    setSelectedInterests(user.interests || []);

    const posts = await Post.filter({ author_email: user.email }, "-created_date");
    setMyPosts(posts);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { file_url } = await UploadFile({ file });
    setEditData(prev => ({ ...prev, avatar_url: file_url }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await User.updateMyUserData(editData);
    await loadProfile();
    setIsEditing(false);
    setIsSaving(false);
  };

  const handleSaveInterests = async () => {
    setIsSaving(true);
    await User.updateMyUserData({ interests: selectedInterests });
    await loadProfile();
    setShowInterests(false);
    setIsSaving(false);
  };



  const handleToggleInterest = (interestId) => {
    setSelectedInterests(prev => 
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleLike = async (postId, newLikes) => {
    await Post.update(postId, { likes: newLikes });
    await loadProfile();
  };

  const handleDelete = async (postId) => {
    await Post.delete(postId);
    await loadProfile();
  };

  const handleLogout = async () => {
    await User.logout();
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-lg animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Profile Header */}
      <Card className="p-6 bg-white/80 backdrop-blur-sm border-blue-100/50">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-32 h-32 rounded-lg flex items-center justify-center text-white text-4xl font-bold shadow-lg overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600">
                {editData.avatar_url ? (
                  <img src={editData.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  currentUser.full_name?.[0]?.toUpperCase() || "?"
                )}
              </div>
              {isEditing && (
                <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 p-2 bg-white rounded-lg shadow-lg cursor-pointer text-blue-600">
                  <Camera className="w-5 h-5" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            {currentUser.latitude && currentUser.longitude && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>Location enabled</span>
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label className="text-gray-700">Name</Label>
                  <Input
                    value={editData.full_name}
                    onChange={(e) => setEditData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">Bio</Label>
                  <Textarea
                    value={editData.bio}
                    onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                    className="min-h-20 rounded-lg"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{currentUser.full_name}</h2>
                  <p className="text-gray-600">@{currentUser.username}</p>
                  <p className="text-sm mt-1 text-gray-500">{currentUser.email}</p>
                </div>
                {currentUser.bio && (
                  <p className="text-gray-700">{currentUser.bio}</p>
                )}
                {currentUser.interests && currentUser.interests.length > 0 && (
                  <div>
                    <p className="text-sm mb-2 text-gray-600">Interests:</p>
                    <div className="flex flex-wrap gap-2">
                      {currentUser.interests.slice(0, 5).map((interest, idx) => (
                        <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-800 rounded-lg text-sm">
                          {interest.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex gap-3 pt-2 flex-wrap">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
                    <Save className="w-4 h-4" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setEditData({
                        full_name: currentUser.full_name || "",
                        bio: currentUser.bio || "",
                        avatar_url: currentUser.avatar_url || ""
                      });
                    }}
                    className="rounded-lg"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
                    Edit Profile
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowInterests(true)}
                    className="gap-2 rounded-lg border-blue-200 text-blue-600">
                    <Settings className="w-4 h-4" />
                    Interests
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="gap-2 rounded-lg border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* My Posts */}
      <div>
        <h3 className="text-2xl font-bold mb-4 text-gray-900">My Posts</h3>
        {myPosts.length === 0 ? (
          <Card className="p-12 text-center bg-white/80 backdrop-blur-sm border-blue-100/50">
            <p className="text-gray-600">You haven't posted anything yet</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {myPosts.map((post) => (
              <PostCard
                key={post.id}
                post={{
                  ...post,
                  distance: 0
                }}
                currentUserEmail={currentUser.email}
                onLike={handleLike}
                onDelete={handleDelete}
                onCommentClick={(p) => {
                  setSelectedPost(p);
                  setShowComments(true);
                }}
                distance="0.0"
              />
            ))}
          </div>
        )}
      </div>

      {/* Comment Dialog */}
      <CommentDialog
        post={selectedPost}
        currentUser={currentUser}
        open={showComments}
        onOpenChange={setShowComments}
      />

      {/* Interests Dialog */}
      <Dialog open={showInterests} onOpenChange={setShowInterests}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Your Interests</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <InterestsSelector
              selectedInterests={selectedInterests}
              onToggle={handleToggleInterest}
            />
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowInterests(false)}
                className="rounded-lg">
                Cancel
              </Button>
              <Button
                onClick={handleSaveInterests}
                disabled={isSaving}
                className="gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Interests"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


    </div>
  );
}