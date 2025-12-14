import React, { useState, useEffect, useCallback } from "react";
import { Post } from "@/entities/Post";
import { User } from "@/entities/User";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, AlertCircle, RefreshCw, ChevronRight, Sparkles } from "lucide-react";
import { InvokeLLM } from "@/integrations/Core";
import { INTEREST_CATEGORIES } from "../components/interests/InterestsSelector";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

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

export default function Summary() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [categorizedPosts, setCategorizedPosts] = useState({});
  const [summaries, setSummaries] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [isGeneratingSummaries, setIsGeneratingSummaries] = useState(false);

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
        setLocationError(null);
      },
      (error) => {
        setLocationError("Please enable location access");
        setIsLoading(false);
      }
    );
  }, []);

  const loadPosts = useCallback(async () => {
    if (!userLocation || !currentUser) return;

    setIsLoading(true);
    const allPosts = await Post.list("-created_date", 50);

    const nearbyPosts = allPosts.
    map((post) => ({
      ...post,
      distance: calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        post.latitude,
        post.longitude
      )
    })).
    filter((post) => post.distance <= RADIUS_MILES);

    const userInterests = currentUser.interests || [];
    const categorized = {};

    userInterests.forEach((interest) => {
      categorized[interest] = nearbyPosts.filter((post) => post.category === interest);
    });

    setCategorizedPosts(categorized);
    setIsLoading(false);

    generateSummaries(categorized);
  }, [userLocation, currentUser]);

  const generateSummaries = async (categorized) => {
    setIsGeneratingSummaries(true);
    const newSummaries = {};

    for (const [category, posts] of Object.entries(categorized)) {
      if (posts.length === 0) continue;

      try {
        const postTexts = posts.slice(0, 5).map((p) => p.content).join("\n\n");
        const categoryLabel = INTEREST_CATEGORIES.find((c) => c.id === category)?.label || category;

        const summary = await InvokeLLM({
          prompt: `You are summarizing local community posts in the "${categoryLabel}" category. 
          
Posts:
${postTexts}

Create a brief, engaging 2-3 sentence summary that captures the key themes and highlights from these posts. Write it like a news headline with personality. Be concise and conversational.`
        });

        newSummaries[category] = summary;
      } catch (error) {
        console.error(`Error generating summary for ${category}:`, error);
      }
    }

    setSummaries(newSummaries);
    setIsGeneratingSummaries(false);
  };

  useEffect(() => {
    initializeUser();
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    if (userLocation && currentUser) {
      loadPosts();
    }
  }, [userLocation, currentUser, loadPosts]);

  const initializeUser = async () => {
    const user = await User.me();
    setCurrentUser(user);

    if (!user.onboarding_completed) {
      window.location.href = createPageUrl("Onboarding");
    }
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

  if (!currentUser || !currentUser.interests || currentUser.interests.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="p-8 text-center bg-white/80 backdrop-blur-sm border-blue-100/50">
          <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900">Select Your Interests</h2>
          <p className="mb-6 text-gray-600">Choose topics you care about to see personalized summaries</p>
          <Link to={createPageUrl("Profile")}>
            <Button className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
              Choose Interests
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-600">Your Summary</h1>
          <p className="mt-1 text-gray-600">Personalized updates based on your interests</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={loadPosts}
          className="rounded-lg border-blue-200 text-blue-600">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-lg animate-spin" />
          <p className="mt-4 text-gray-600">Loading your personalized summary...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentUser.interests.map((interest) => {
            const posts = categorizedPosts[interest] || [];
            const category = INTEREST_CATEGORIES.find((c) => c.id === interest);
            if (!category) return null;

            return (
              <Card key={interest} className="p-6 hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm border-blue-100/50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{category.emoji}</span>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{category.label}</h3>
                      <Badge variant="secondary" className="mt-1 bg-gray-100 text-gray-700">
                        {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {posts.length === 0 ? (
                  <p className="text-sm text-gray-600">No recent posts in this category</p>
                ) : (
                  <>
                    {summaries[interest] ? (
                      <div className="mb-4">
                        <div className="flex items-start gap-2 mb-2">
                          <Sparkles className="w-4 h-4 mt-1 flex-shrink-0 text-blue-600" />
                          <p className="leading-relaxed text-gray-700">{summaries[interest]}</p>
                        </div>
                      </div>
                    ) : isGeneratingSummaries ? (
                      <div className="mb-4 text-sm italic text-gray-500">Generating summary...</div>
                    ) : null}

                    <div className="space-y-3 mb-4">
                      {posts.slice(0, 2).map((post) => (
                        <div key={post.id} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                              {post.author_name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <span className="text-sm font-medium text-gray-700">{post.author_name}</span>
                            <span className="text-xs text-gray-500">• {post.distance.toFixed(1)} mi</span>
                          </div>
                          <p className="text-sm line-clamp-2 text-gray-700">{post.content}</p>
                        </div>
                      ))}
                    </div>

                    <Button
                      variant="ghost"
                      className="gap-2 rounded-lg text-blue-600"
                      asChild>
                      <Link to={`${createPageUrl("Feed")}?category=${interest}`}>
                        View all posts
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}