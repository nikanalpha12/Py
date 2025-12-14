import React, { useState, useEffect, useRef, useCallback } from "react";
import { Message } from "@/entities/Message";
import { User } from "@/entities/User";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, AlertCircle, Info, Hash, ArrowLeft, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";

import MessageBubble from "../components/chat/MessageBubble";
import MessageInput from "../components/chat/MessageInput";
import OnlineUsers from "../components/chat/OnlineUsers";
import { INTEREST_CATEGORIES } from "../components/interests/InterestsSelector";

const RADIUS_MILES = 5;
const REFRESH_INTERVAL = 3000;

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

export default function Chat() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [locationError, setLocationError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [showChannelList, setShowChannelList] = useState(true);
  const [lastMessageTime, setLastMessageTime] = useState(null);
  const [slowmodeCooldown, setSlowmodeCooldown] = useState(0);
  const scrollAreaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const lastMessageIdRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeUser = useCallback(async () => {
    const user = await User.me();
    setCurrentUser(user);
  }, []);

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
        setLocationError("Please enable location access to use chat");
        setIsLoading(false);
      }
    );
  }, []);

  const loadMessages = useCallback(async () => {
    if (!userLocation || !selectedChannel) return;

    const allMessages = await Message.filter({ channel: selectedChannel }, "-created_date", 100);

    const nearbyMessages = allMessages
      .map((msg) => ({
        ...msg,
        distance: calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          msg.latitude,
          msg.longitude
        )
      }))
      .filter((msg) => msg.distance <= RADIUS_MILES)
      .reverse();

    setMessages(nearbyMessages);

    if (nearbyMessages.length > 0 && nearbyMessages[nearbyMessages.length - 1].id !== lastMessageIdRef.current) {
      lastMessageIdRef.current = nearbyMessages[nearbyMessages.length - 1].id;
      setTimeout(scrollToBottom, 100);
    }

    setIsLoading(false);
  }, [userLocation, selectedChannel]);

  const loadNearbyUsers = useCallback(async () => {
    if (!userLocation) return;

    const allUsers = await User.list();
    const nearby = allUsers
      .filter((user) => user.latitude && user.longitude)
      .map((user) => ({
        ...user,
        distance: calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          user.latitude,
          user.longitude
        )
      }))
      .filter((user) => user.distance <= RADIUS_MILES && user.distance > 0)
      .map((user) => ({
        name: user.full_name,
        avatar: user.avatar_url,
        distance: user.distance
      }));

    setNearbyUsers(nearby);
  }, [userLocation]);

  useEffect(() => {
    initializeUser();
    requestLocation();
  }, [initializeUser, requestLocation]);

  useEffect(() => {
    if (userLocation && selectedChannel) {
      loadMessages();
      loadNearbyUsers();
    }
  }, [userLocation, selectedChannel, loadMessages, loadNearbyUsers]);

  useEffect(() => {
    if (!userLocation || !selectedChannel) return;

    const interval = setInterval(() => {
      loadMessages();
      loadNearbyUsers();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [userLocation, selectedChannel, loadMessages, loadNearbyUsers]);

  // Slowmode cooldown timer
  useEffect(() => {
    if (slowmodeCooldown > 0) {
      const timer = setTimeout(() => {
        setSlowmodeCooldown(slowmodeCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [slowmodeCooldown]);

  const handleSendMessage = async (content) => {
    if (!userLocation || !currentUser) return;

    // Check slowmode
    const SLOWMODE_SECONDS = 4;
    const isSlowmodeActive = nearbyUsers.length > 10; // Slowmode activates if more than 10 nearby users
    
    if (isSlowmodeActive && lastMessageTime) {
      const timeSinceLastMessage = (Date.now() - lastMessageTime) / 1000;
      if (timeSinceLastMessage < SLOWMODE_SECONDS) {
        // If slowmode is active and user tries to send too fast, return early
        return;
      }
    }

    const now = Date.now();
    setLastMessageTime(now); // Update last message time after sending attempt
    
    if (isSlowmodeActive) {
      setSlowmodeCooldown(SLOWMODE_SECONDS); // Start cooldown if slowmode is active
    }

    await Message.create({
      content,
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      sender_name: currentUser.full_name,
      sender_email: currentUser.email,
      sender_avatar: currentUser.avatar_url,
      channel: selectedChannel
    });

    await loadMessages();
  };

  const handleChannelSelect = (channelId) => {
    setSelectedChannel(channelId);
    setShowChannelList(false);
    setIsLoading(true);
  };

  const handleBackToChannels = () => {
    setShowChannelList(true);
    setSelectedChannel(null);
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

  const selectedCategory = INTEREST_CATEGORIES.find(c => c.id === selectedChannel);

  return (
    <div className="fixed inset-0 top-16 bottom-16 md:bottom-0 flex flex-col bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Channel List View */}
      {showChannelList && (
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="flex-shrink-0 px-4 py-4 border-b bg-white/70 backdrop-blur-xl border-blue-100/50">
              <div className="max-w-3xl mx-auto">
                <h1 className="text-2xl md:text-3xl font-bold text-blue-600">What's on your mind today?</h1>
                <p className="text-sm mt-1 text-gray-600">Select a topic to chat with people within {RADIUS_MILES} miles</p>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="max-w-3xl mx-auto space-y-3">
                {INTEREST_CATEGORIES.map((category) => (
                  <Card
                    key={category.id}
                    onClick={() => handleChannelSelect(category.id)}
                    className="p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] bg-white/80 backdrop-blur-sm border-blue-100/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                          <span className="text-2xl">{category.emoji}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{category.label}</h3>
                          <p className="text-sm text-gray-600">Chat about {category.label.toLowerCase()}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Chat View */}
      {!showChannelList && selectedChannel && (
        <>
          {/* Header */}
          <div className="flex-shrink-0 px-4 py-3 border-b bg-white/70 backdrop-blur-xl border-blue-100/50">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBackToChannels}
                    className="rounded-lg text-gray-600">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                      <span className="text-xl">{selectedCategory?.emoji}</span>
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900">{selectedCategory?.label}</h2>
                      <p className="text-xs text-gray-600">
                        {messages.length} messages
                        {nearbyUsers.length > 10 && (
                          <span className="ml-1">• 🐢 Slowmode (4s)</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-lg border-blue-200 text-blue-600">
                      <Info className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Chat Info</SheetTitle>
                    </SheetHeader>
                    
                    <div className="space-y-6 mt-6">
                      <OnlineUsers users={nearbyUsers} />

                      <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                        <h3 className="font-semibold mb-2 text-blue-900">💡 Chat Tips</h3>
                        <ul className="text-sm space-y-2 text-gray-700">
                          <li>• Messages refresh every 3 seconds</li>
                          <li>• Only people within 5 miles can see your messages</li>
                          <li>• Use the back button to switch channels</li>
                          {nearbyUsers.length > 10 && (
                            <li>• Slowmode is active! You can send a message every 4 seconds.</li>
                          )}
                          <li>• Be respectful and friendly!</li>
                        </ul>
                      </Card>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full flex flex-col">
              <Card className="flex-1 flex flex-col shadow-lg overflow-hidden m-0 rounded-none bg-white/80 backdrop-blur-sm border-blue-100/50">
                {/* Messages */}
                <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-lg animate-spin" />
                        <p className="mt-4 text-gray-600">Loading messages...</p>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                          <span className="text-3xl">{selectedCategory?.emoji}</span>
                        </div>
                        <h3 className="text-lg font-semibold mb-2 text-gray-900">No messages yet</h3>
                        <p className="text-gray-600">Be the first to start the conversation!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {messages.map((message, index) => {
                        const isOwnMessage = message.sender_email === currentUser?.email;
                        const prevMessage = messages[index - 1];
                        const showAvatar = !prevMessage ||
                          prevMessage.sender_email !== message.sender_email ||
                          new Date(message.created_date) - new Date(prevMessage.created_date) > 60000;

                        return (
                          <MessageBubble
                            key={message.id}
                            message={message}
                            isOwnMessage={isOwnMessage}
                            showAvatar={showAvatar}
                          />
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 flex-shrink-0 border-t bg-white border-gray-200">
                  <MessageInput
                    onSend={handleSendMessage}
                    disabled={!userLocation || !currentUser || (nearbyUsers.length > 10 && slowmodeCooldown > 0)}
                    placeholder={`Message ${selectedCategory?.label}...`}
                    slowmodeCooldown={slowmodeCooldown}
                    isSlowmodeActive={nearbyUsers.length > 10}
                  />
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}