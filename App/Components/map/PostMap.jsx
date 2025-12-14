import React, { useState, useMemo, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, X } from "lucide-react";
import { format } from "date-fns";
import MapSearch from "./MapSearch";
import LocationSidebar from "./LocationSidebar";
import { User } from "@/entities/User"; // Added import for User entity

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"
});

function MapController({ center }) {
  const map = useMap();

  React.useEffect(() => {
    // Multiple attempts to invalidate size to ensure proper rendering
    const timers = [
      setTimeout(() => map.invalidateSize(), 100),
      setTimeout(() => map.invalidateSize(), 300),
      setTimeout(() => map.invalidateSize(), 500),
      setTimeout(() => map.invalidateSize(), 1000)
    ];


    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [map]);

  React.useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);

  return null;
}

function clusterPosts(posts, radiusInMiles = 0.1) {
  const clusters = [];
  const processed = new Set();

  posts.forEach((post, index) => {
    if (processed.has(index)) return;

    const cluster = {
      latitude: post.latitude,
      longitude: post.longitude,
      posts: [post],
      distance: post.distance
    };

    posts.forEach((otherPost, otherIndex) => {
      if (index === otherIndex || processed.has(otherIndex)) return;

      const distance = calculateDistance(
        post.latitude,
        post.longitude,
        otherPost.latitude,
        otherPost.longitude
      );

      if (distance <= radiusInMiles) {
        cluster.posts.push(otherPost);
        processed.add(otherIndex);
      }
    });

    processed.add(index);

    const avgLat = cluster.posts.reduce((sum, p) => sum + p.latitude, 0) / cluster.posts.length;
    const avgLng = cluster.posts.reduce((sum, p) => sum + p.longitude, 0) / cluster.posts.length;
    cluster.latitude = avgLat;
    cluster.longitude = avgLng;

    clusters.push(cluster);
  });

  return clusters;
}

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

function createClusterIcon(count) {
  return L.divIcon({
    html: `
      <div style="
        background: #3B82F6;
        color: white;
        border-radius: 50%;
        width: ${count > 1 ? 50 : 40}px;
        height: ${count > 1 ? 50 : 40}px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: ${count > 1 ? 16 : 14}px;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        border: 3px solid white;
        cursor: pointer;
        pointer-events: auto;
      ">
        ${count > 1 ? count : '1'}
      </div>
    `,
    className: '',
    iconSize: [count > 1 ? 50 : 40, count > 1 ? 50 : 40],
    iconAnchor: [count > 1 ? 25 : 20, count > 1 ? 25 : 20]
  });
}

export default function PostMap({ posts, userLocation, currentUserEmail, onLike, onDelete, onCommentClick }) {
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [searchedLocation, setSearchedLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [showLocationSidebar, setShowLocationSidebar] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapContainerRef = useRef(null);

  const clusters = useMemo(() => clusterPosts(posts), [posts]);

  useEffect(() => {
    if (userLocation && !mapCenter) {
      setMapCenter([userLocation.latitude, userLocation.longitude]);
    }
  }, [userLocation, mapCenter]);

  // Force map resize on mount and visibility change
  useEffect(() => {
    const handleResize = () => {
      window.dispatchEvent(new Event('resize'));
    };

    // Trigger multiple times to ensure map renders
    const timers = [
      setTimeout(handleResize, 100),
      setTimeout(handleResize, 300),
      setTimeout(handleResize, 500),
      setTimeout(handleResize, 1000),
      setTimeout(() => setMapReady(true), 1000)
    ];


    // Listen for visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeout(handleResize, 100);
        setTimeout(handleResize, 300);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Additional resize trigger when posts change
  useEffect(() => {
    if (mapReady) {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    }
  }, [posts, mapReady]);

  const handleLike = async (post) => {
    const isLiked = post.likes?.includes(currentUserEmail);
    const newLikes = isLiked ?
      post.likes.filter((email) => email !== currentUserEmail) :
      [...(post.likes || []), currentUserEmail];

    await onLike(post.id, newLikes);
  };

  const handleLocationSearch = (location) => {
    setSearchedLocation(location);
    setMapCenter([location.latitude, location.longitude]);
    setShowLocationSidebar(true);
    setSelectedCluster(null);
  };

  const handleBackToMyLocation = () => {
    if (userLocation) {
      setMapCenter([userLocation.latitude, userLocation.longitude]);
      setSearchedLocation(null);
      setShowLocationSidebar(false);
    }
  };

  const handleClusterClick = (cluster) => {
    console.log("Cluster clicked:", cluster);
    setSelectedCluster(cluster);
    setShowLocationSidebar(false);
  };

  if (!userLocation) return null;


  return (
    <>
      <div className="relative w-full h-[calc(100vh-180px)]" ref={mapContainerRef}>
        {/* Map Container */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl border-4 border-white" style={{ zIndex: 1 }}>
          <MapContainer
            center={mapCenter || [userLocation.latitude, userLocation.longitude]}
            zoom={13}
            style={{ height: "100%", width: "100%", zIndex: 1 }}
            zoomControl={true}
            scrollWheelZoom={true}
            dragging={true}
            touchZoom={true}
            doubleClickZoom={true}
            keyboard={true}
            attributionControl={true}>

            <MapController center={mapCenter} />

            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />


            {/* User location marker */}
            <Marker
              position={[userLocation.latitude, userLocation.longitude]}
              icon={L.divIcon({
                html: `
                  <div style="
                    background: #FF5252; /* Updated color */
                    color: white;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.5);
                    border: 3px solid white;
                  ">
                    <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
                  </div>
                `,
                className: '',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              })}>

              <Popup>
                <div className="text-sm font-semibold">You are here</div>
              </Popup>
            </Marker>

            {/* Searched location marker */}
            {searchedLocation &&
              <Marker
                position={[searchedLocation.latitude, searchedLocation.longitude]}
                icon={L.divIcon({
                  html: `
                    <div style="
                      background: #2ECC71; /* Updated color */
                      color: white;
                      border-radius: 50%;
                      width: 32px;
                      height: 32px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      box-shadow: 0 4px 12px rgba(46, 204, 113, 0.6);
                      border: 3px solid white;
                    ">
                      📍
                    </div>
                  `,
                  className: '',
                  iconSize: [32, 32],
                  iconAnchor: [16, 32]
                })}>

                <Popup>
                  <div className="text-sm font-semibold">{searchedLocation.name.split(',')[0]}</div>
                </Popup>
              </Marker>
            }

            {/* Post clusters */}
            {clusters.map((cluster, index) =>
              <Marker
                key={`cluster-${index}`}
                position={[cluster.latitude, cluster.longitude]}
                icon={createClusterIcon(cluster.posts.length)}
                eventHandlers={{
                  click: (e) => {
                    e.originalEvent?.stopPropagation();
                    handleClusterClick(cluster);
                  }
                }} />

            )}
          </MapContainer>
        </div>

        {/* Search Bar - Higher z-index */}
        <div className="absolute top-4 left-4 right-4 flex gap-2" style={{ zIndex: 1000, pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto' }} className="mx-10 flex gap-2 w-full">
            <MapSearch onLocationSelect={handleLocationSearch} />
            {searchedLocation && (
              <Button
                onClick={handleBackToMyLocation}
                className="shadow-lg bg-white/95 backdrop-blur-sm text-gray-700 border-blue-200">
                Back to my location
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Location Sidebar */}
      {showLocationSidebar && searchedLocation &&
        <LocationSidebar
          location={searchedLocation}
          onClose={() => setShowLocationSidebar(false)} />

      }

      {/* Cluster Details Panel */}
      {selectedCluster && (
        <div className="fixed top-24 right-4 w-96 max-h-[calc(100vh-120px)] md:flex flex-col bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-blue-100 z-[10000] hidden">
          <div className="flex-shrink-0 bg-[#3B82F6] text-white p-4 flex items-center justify-between rounded-t-2xl">
            <h3 className="font-bold text-lg">
              {selectedCluster.posts.length} {selectedCluster.posts.length === 1 ? 'Post' : 'Posts'} Nearby
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedCluster(null)}
              className="text-white hover:bg-white/20 rounded-lg">

              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {selectedCluster.posts.map((post) => {
              const isLiked = post.likes?.includes(currentUserEmail);
              const likeCount = post.likes?.length || 0;

              return (
                <Card key={post.id} className="p-4 border-blue-100/50 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {post.author_avatar ?
                        <img src={post.author_avatar} alt="" className="w-full h-full rounded-lg object-cover" /> :

                        post.author_name?.[0]?.toUpperCase() || "?"
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{post.author_name}</div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(post.created_date), "MMM d, h:mm a")} • {post.distance.toFixed(1)} mi
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-800 mb-3 line-clamp-3">{post.content}</p>

                  {post.image_url &&
                    <img
                      src={post.image_url}
                      alt=""
                      className="w-full rounded-lg mb-3 max-h-48 object-cover" />

                  }

                  <div className="flex items-center gap-3 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post)}
                      className={`gap-1 text-xs ${isLiked ? "text-red-500" : "text-gray-600"}`}>

                      <Heart className={`w-4 h-4 ${isLiked ? "fill-red-500" : ""}`} />
                      {likeCount}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCommentClick(post)}
                      className="gap-1 text-xs text-gray-600">

                      <MessageCircle className="w-4 h-4" />
                      Comment
                    </Button>
                    {post.author_email === currentUserEmail &&
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(post.id)}
                        className="gap-1 text-xs text-red-600 ml-auto">

                        Delete
                      </Button>
                    }
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile Cluster Panel */}
      {selectedCluster && (
        <div className="md:hidden fixed inset-0 bg-white z-[10000] flex flex-col">
          <div className="flex-shrink-0 bg-[#3B82F6] text-white p-4 flex items-center justify-between">
            <h3 className="font-bold text-lg">
              {selectedCluster.posts.length} {selectedCluster.posts.length === 1 ? 'Post' : 'Posts'} Nearby
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedCluster(null)}
              className="text-white hover:bg-white/20 rounded-lg">

              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {selectedCluster.posts.map((post) => {
              const isLiked = post.likes?.includes(currentUserEmail);
              const likeCount = post.likes?.length || 0;

              return (
                <Card key={post.id} className="p-4 border-purple-100/50 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {post.author_avatar ?
                        <img src={post.author_avatar} alt="" className="w-full h-full rounded-lg object-cover" /> :

                        post.author_name?.[0]?.toUpperCase() || "?"
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{post.author_name}</div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(post.created_date), "MMM d, h:mm a")} • {post.distance.toFixed(1)} mi
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-800 mb-3">{post.content}</p>

                  {post.image_url &&
                    <img
                      src={post.image_url}
                      alt=""
                      className="w-full rounded-lg mb-3 max-h-48 object-cover" />

                  }

                  <div className="flex items-center gap-3 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post)}
                      className={`gap-1 text-xs ${isLiked ? "text-red-500" : "text-gray-600"}`}>

                      <Heart className={`w-4 h-4 ${isLiked ? "fill-red-500" : ""}`} />
                      {likeCount}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCommentClick(post)}
                      className="gap-1 text-xs text-gray-600">

                      <MessageCircle className="w-4 h-4" />
                      Comment
                    </Button>
                    {post.author_email === currentUserEmail &&
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(post.id)}
                        className="gap-1 text-xs text-red-600 ml-auto">

                        Delete
                      </Button>
                    }
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </>
  );

}