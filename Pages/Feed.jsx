import React, { useState, useEffect, useCallback } from "react";
import { Post } from "@/entities/Post";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, AlertCircle, RefreshCw } from "lucide-react";

import CreatePost from "../components/feed/CreatePost";
import PostMap from "../components/map/PostMap";
import CommentDialog from "../components/feed/CommentDialog";

const RADIUS_MILES = 5;

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
  Math.sin(dLat / 2) * Math.sin(dLat / 2) +
  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
  Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function Feed() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState(null);

  const updateUserLocation = async (location) => {
    await User.updateMyUserData({
      latitude: location.latitude,
      longitude: location.longitude,
      location_updated_at: new Date().toISOString()
    });
  };

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setUserLocation(location);
        updateUserLocation(location);
        setLocationError(null);
      },
      (error) => {
        setLocationError("Please enable location access to see nearby posts");
        setIsLoading(false);
      }
    );
  }, []);

  const loadPosts = useCallback(async () => {
    if (!userLocation) return;

    setIsLoading(true);
    const allPosts = await Post.list("-created_date");

    let postsWithDistance = allPosts.
    map((post) => ({
      ...post,
      distance: calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        post.latitude,
        post.longitude
      )
    })).
    filter((post) => post.distance <= RADIUS_MILES).
    sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    if (categoryFilter) {
      postsWithDistance = postsWithDistance.filter((post) => post.category === categoryFilter);
    }

    setPosts(allPosts);
    setFilteredPosts(postsWithDistance);
    setIsLoading(false);
  }, [userLocation, categoryFilter]);

  const initializeUser = useCallback(async () => {
    const user = await User.me();
    setCurrentUser(user);
    // Don't redirect - let users access feed even without completing onboarding
  }, []);

  useEffect(() => {
    initializeUser();
    requestLocation();

    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    if (category) {
      setCategoryFilter(category);
    }
  }, [initializeUser, requestLocation]);

  useEffect(() => {
    if (userLocation) {
      loadPosts();
    }
  }, [userLocation, loadPosts]);

  const handlePostCreated = async (postData) => {
    await Post.create(postData);
    setShowCreatePost(false);
    await loadPosts();
  };

  const handleLike = async (postId, newLikes) => {
    await Post.update(postId, { likes: newLikes });
    await loadPosts();
  };

  const handleDelete = async (postId) => {
    await Post.delete(postId);
    await loadPosts();
  };

  const handleCommentClick = (post) => {
    setSelectedPost(post);
    setShowComments(true);
  };

  if (locationError) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="p-8 text-center bg-white/80 backdrop-blur-sm border-blue-100/50">
          <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900">Location Required</h2>
          <p className="mb-6 text-gray-600">{locationError}</p>
          <Button
            onClick={requestLocation}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
            <MapPin className="w-4 h-4 mr-2" />
            Enable Location
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">Nearby Map</h1>
            <p className="mt-1 text-gray-600">
              {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'} within {RADIUS_MILES} miles
              {categoryFilter && " in selected category"}
            </p>
          </div>
          <div className="flex gap-2">
            {categoryFilter && (
              <Button
                variant="outline"
                onClick={() => {
                  setCategoryFilter(null);
                  window.history.pushState({}, '', window.location.pathname);
                }}
                className="rounded-lg border-blue-200 text-gray-600">
                Clear Filter
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={loadPosts}
              className="rounded-lg border-blue-200 text-gray-600">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setShowCreatePost(!showCreatePost)}
              className="rounded-lg shadow-lg gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              <MapPin className="w-4 h-4" />
              New Post
            </Button>
          </div>
        </div>

        {/* Create Post */}
        {showCreatePost && currentUser && userLocation &&
        <div className="mb-6 max-w-2xl mx-auto">
            <CreatePost
            userLocation={userLocation}
            onPostCreated={handlePostCreated}
            currentUser={currentUser} />

          </div>
        }

        {/* Map */}
        {isLoading ? (
          <div className="flex items-center justify-center h-[calc(100vh-250px)]">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-lg animate-spin" />
              <p className="mt-4 text-gray-600">Loading map...</p>
            </div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <Card className="p-12 text-center max-w-2xl mx-auto bg-white/80 backdrop-blur-sm border-blue-100/50">
            <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">No posts nearby</h3>
            <p className="text-gray-600">Be the first to post in your area!</p>
          </Card>
        ) : (
          <PostMap
            posts={filteredPosts}
            userLocation={userLocation}
            currentUserEmail={currentUser?.email}
            onLike={handleLike}
            onDelete={handleDelete}
            onCommentClick={handleCommentClick}
          />
        )}

        {/* Comment Dialog */}
        {currentUser &&
        <CommentDialog
          post={selectedPost}
          currentUser={currentUser}
          open={showComments}
          onOpenChange={setShowComments} />

        }
      </div>
    </div>
  );
}