import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/entities/User";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, UserCheck, UserX, Users, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Friends() {
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadCurrentUser = useCallback(async () => {
    const user = await User.me();
    setCurrentUser(user);
    setIsLoading(false);
  }, []);

  const loadFriends = useCallback(async () => {
    if (!currentUser) return;

    const allUsers = await User.list();
    const friendsList = allUsers.filter((u) =>
    currentUser.friends?.includes(u.email) && u.email !== currentUser.email
    );
    setFriends(friendsList);
  }, [currentUser]);

  const loadFriendRequests = useCallback(async () => {
    if (!currentUser) return;

    const allUsers = await User.list();
    const requests = allUsers.filter((u) =>
    currentUser.friend_requests_received?.includes(u.email)
    );
    setFriendRequests(requests);
  }, [currentUser]);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  useEffect(() => {
    if (currentUser) {
      loadFriends();
      loadFriendRequests();
    }
  }, [currentUser, loadFriends, loadFriendRequests]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const allUsers = await User.list();
    const results = allUsers.filter((u) =>
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) &&
    u.email !== currentUser.email
    );
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSendFriendRequest = async (targetUser) => {
    const updatedSentRequests = [...(currentUser.friend_requests_sent || []), targetUser.email];
    const updatedReceivedRequests = [...(targetUser.friend_requests_received || []), currentUser.email];

    await User.updateMyUserData({
      friend_requests_sent: updatedSentRequests
    });

    await User.update(targetUser.id, {
      friend_requests_received: updatedReceivedRequests
    });

    await loadCurrentUser();
    handleSearch();
  };

  const handleAcceptFriendRequest = async (requester) => {
    const updatedFriends = [...(currentUser.friends || []), requester.email];
    const updatedReceivedRequests = currentUser.friend_requests_received.filter(
      (email) => email !== requester.email
    );

    const requesterFriends = [...(requester.friends || []), currentUser.email];
    const requesterSentRequests = (requester.friend_requests_sent || []).filter(
      (email) => email !== currentUser.email
    );

    await User.updateMyUserData({
      friends: updatedFriends,
      friend_requests_received: updatedReceivedRequests
    });

    await User.update(requester.id, {
      friends: requesterFriends,
      friend_requests_sent: requesterSentRequests
    });

    await loadCurrentUser();
    await loadFriends();
    await loadFriendRequests();
  };

  const handleRejectFriendRequest = async (requester) => {
    const updatedReceivedRequests = currentUser.friend_requests_received.filter(
      (email) => email !== requester.email
    );

    const requesterSentRequests = (requester.friend_requests_sent || []).filter(
      (email) => email !== currentUser.email
    );

    await User.updateMyUserData({
      friend_requests_received: updatedReceivedRequests
    });

    await User.update(requester.id, {
      friend_requests_sent: requesterSentRequests
    });

    await loadCurrentUser();
    await loadFriendRequests();
  };

  const handleRemoveFriend = async (friend) => {
    const updatedFriends = currentUser.friends.filter((email) => email !== friend.email);
    const friendUpdatedFriends = (friend.friends || []).filter((email) => email !== currentUser.email);

    await User.updateMyUserData({
      friends: updatedFriends
    });

    await User.update(friend.id, {
      friends: friendUpdatedFriends
    });

    await loadCurrentUser();
    await loadFriends();
  };

  if (isLoading || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-[#3B82F6] rounded-lg animate-spin" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>);

  }

  const getButtonForUser = (user) => {
    const isFriend = currentUser.friends?.includes(user.email);
    const requestSent = currentUser.friend_requests_sent?.includes(user.email);
    const requestReceived = currentUser.friend_requests_received?.includes(user.email);

    if (isFriend) {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          <UserCheck className="w-3 h-3 mr-1" />
          Friends
        </Badge>);

    }

    if (requestSent) {
      return (
        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>);

    }

    if (requestReceived) {
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
          Respond in Requests
        </Badge>);

    }

    return (
      <Button
        size="sm"
        onClick={() => handleSendFriendRequest(user)}
        className="gap-2 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white">
        <UserPlus className="w-4 h-4" />
        Add Friend
      </Button>);

  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-blue-600 text-3xl font-bold">Friends</h1>
        <p className="text-[#A0A4AB] mt-1">Connect with people using their username</p>
      </div>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search">
            <Search className="w-4 h-4 mr-2" />
            Search
          </TabsTrigger>
          <TabsTrigger value="friends">
            <Users className="w-4 h-4 mr-2" />
            Friends ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="requests">
            <Clock className="w-4 h-4 mr-2" />
            Requests ({friendRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <Card className="p-4 bg-white/80 backdrop-blur-sm border-blue-100/50">
            <div className="flex gap-2">
              <Input
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="rounded-lg" />

              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="gap-2 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white">
                <Search className="w-4 h-4" />
                Search
              </Button>
            </div>
          </Card>

          <ScrollArea className="h-[calc(100vh-320px)]">
            <div className="space-y-3">
              {searchResults.length === 0 && searchQuery && !isSearching ?
              <Card className="p-8 text-center bg-white/80 backdrop-blur-sm border-blue-100/50">
                  <p className="text-gray-600">No users found with that username</p>
                </Card> :

              searchResults.map((user) =>
              <Card key={user.id} className="p-4 bg-white/80 backdrop-blur-sm border-blue-100/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold overflow-hidden">
                          {user.avatar_url ?
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> :

                      user.full_name?.[0]?.toUpperCase() || "?"
                      }
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{user.full_name}</div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                      {getButtonForUser(user)}
                    </div>
                  </Card>
              )
              }
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="friends">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-3">
              {friends.length === 0 ?
              <Card className="p-8 text-center bg-white/80 backdrop-blur-sm border-blue-100/50">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600">You don't have any friends yet</p>
                  <p className="text-sm text-gray-500 mt-1">Search for people to add them!</p>
                </Card> :

              friends.map((friend) =>
              <Card key={friend.id} className="p-4 bg-white/80 backdrop-blur-sm border-blue-100/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold overflow-hidden">
                          {friend.avatar_url ?
                      <img src={friend.avatar_url} alt="" className="w-full h-full object-cover" /> :

                      friend.full_name?.[0]?.toUpperCase() || "?"
                      }
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{friend.full_name}</div>
                          <div className="text-sm text-gray-500">@{friend.username}</div>
                          {friend.bio &&
                      <div className="text-xs text-gray-400 mt-1 line-clamp-1">{friend.bio}</div>
                      }
                        </div>
                      </div>
                      <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveFriend(friend)}
                    className="gap-2 rounded-lg border-red-200 text-red-600 hover:bg-red-50">
                        <UserX className="w-4 h-4" />
                        Remove
                      </Button>
                    </div>
                  </Card>
              )
              }
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="requests">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-3">
              {friendRequests.length === 0 ?
              <Card className="p-8 text-center bg-white/80 backdrop-blur-sm border-blue-100/50">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600">No pending friend requests</p>
                </Card> :

              friendRequests.map((requester) =>
              <Card key={requester.id} className="p-4 bg-white/80 backdrop-blur-sm border-blue-100/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold overflow-hidden">
                          {requester.avatar_url ?
                      <img src={requester.avatar_url} alt="" className="w-full h-full object-cover" /> :

                      requester.full_name?.[0]?.toUpperCase() || "?"
                      }
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{requester.full_name}</div>
                          <div className="text-sm text-gray-500">@{requester.username}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                      size="sm"
                      onClick={() => handleAcceptFriendRequest(requester)}
                      className="gap-2 rounded-lg bg-green-600 hover:bg-green-700 text-white">
                          <UserCheck className="w-4 h-4" />
                          Accept
                        </Button>
                        <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectFriendRequest(requester)}
                      className="gap-2 rounded-lg border-red-200 text-red-600 hover:bg-red-50">
                          <UserX className="w-4 h-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </Card>
              )
              }
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>);

}