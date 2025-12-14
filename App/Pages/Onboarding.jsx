import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Sparkles, User as UserIcon } from "lucide-react";

import InterestsSelector from "../components/interests/InterestsSelector";

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usernameError, setUsernameError] = useState("");

  const checkOnboarding = useCallback(async () => {
    try {
      setIsLoading(true);
      const user = await User.me();
      setCurrentUser(user);
      
      if (user.onboarding_completed) {
        navigate(createPageUrl("Feed"));
        return;
      }
      
      if (user.username) {
        setUsername(user.username);
        setStep(2);
      }
      
      if (user.interests && user.interests.length > 0) {
        setSelectedInterests(user.interests);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error("Error loading user:", err);
      setError("Unable to load user data. Please try refreshing the page.");
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    checkOnboarding();
  }, [checkOnboarding]);

  const handleToggle = (interestId) => {
    setSelectedInterests(prev => 
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const validateUsername = (username) => {
    if (username.length < 3) {
      return "Username must be at least 3 characters";
    }
    if (username.length > 20) {
      return "Username must be less than 20 characters";
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return "Username can only contain letters, numbers, and underscores";
    }
    return "";
  };

  const checkUsernameAvailability = async (username) => {
    const allUsers = await User.list();
    const usernameTaken = allUsers.some(u => 
      u.username?.toLowerCase() === username.toLowerCase() && 
      u.email !== currentUser.email
    );
    return !usernameTaken;
  };

  const handleUsernameSubmit = async () => {
    const validationError = validateUsername(username);
    if (validationError) {
      setUsernameError(validationError);
      return;
    }

    setIsSaving(true);
    const isAvailable = await checkUsernameAvailability(username);
    
    if (!isAvailable) {
      setUsernameError("Username is already taken");
      setIsSaving(false);
      return;
    }

    await User.updateMyUserData({
      username: username.toLowerCase()
    });
    
    setStep(2);
    setIsSaving(false);
  };

  const handleComplete = async () => {
    if (selectedInterests.length === 0) return;
    
    try {
      setIsSaving(true);
      await User.updateMyUserData({
        interests: selectedInterests,
        onboarding_completed: true,
        friends: [],
        friend_requests_sent: [],
        friend_requests_received: []
      });
      
      navigate(createPageUrl("Feed"));
    } catch (err) {
      console.error("Error saving interests:", err);
      alert("Failed to save interests. Please try again.");
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    try {
      setIsSaving(true);
      await User.updateMyUserData({
        onboarding_completed: true,
        interests: [],
        friends: [],
        friend_requests_sent: [],
        friend_requests_received: []
      });
      navigate(createPageUrl("Feed"));
    } catch (err) {
      console.error("Error skipping onboarding:", err);
      alert("Failed to complete onboarding. Please try again.");
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-[#3B82F6] rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold mb-2 text-gray-900">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="rounded-full">
            Refresh Page
          </Button>
        </Card>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-[#3B82F6] rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-4xl w-full p-8 bg-white/90 backdrop-blur-sm shadow-2xl">
        {step === 1 ? (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#3B82F6] flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-2 text-[#3B82F6]">
                Choose Your Username
              </h1>
              <p className="text-gray-600">
                Pick a unique username to help friends find you
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="e.g. john_doe"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setUsernameError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleUsernameSubmit()}
                  className={`text-lg ${usernameError ? "border-red-500" : ""}`}
                />
                {usernameError && (
                  <p className="text-sm text-red-600">{usernameError}</p>
                )}
                <p className="text-xs text-gray-500">
                  3-20 characters, letters, numbers, and underscores only
                </p>
              </div>

              <Button
                onClick={handleUsernameSubmit}
                disabled={!username.trim() || isSaving}
                className="w-full gap-2 rounded-full bg-[#3B82F6] hover:bg-[#2563EB] text-white">
                {isSaving ? "Checking..." : "Continue"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#3B82F6] flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-2 text-[#3B82F6]">
                Choose Your Interests
              </h1>
              <p className="text-gray-600">
                Select topics you care about to personalize your experience
              </p>
            </div>

            <InterestsSelector
              selectedInterests={selectedInterests}
              onToggle={handleToggle}
            />

            <div className="flex gap-3 mt-8 justify-end">
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={isSaving}
                className="rounded-full">
                Skip for now
              </Button>
              <Button
                onClick={handleComplete}
                disabled={selectedInterests.length === 0 || isSaving}
                className="gap-2 rounded-full bg-[#3B82F6] hover:bg-[#2563EB] text-white">
                {isSaving ? "Saving..." : `Continue with ${selectedInterests.length} interests`}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}