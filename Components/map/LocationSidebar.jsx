
import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, MapPin, Navigation, Sparkles } from "lucide-react";
import { InvokeLLM } from "@/integrations/Core";

export default function LocationSidebar({ location, onClose }) {
  const [locationInfo, setLocationInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLocationInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      const info = await InvokeLLM({
        prompt: `Provide key information about this location: "${location.name}". 
        
Include:
- Brief description (2-3 sentences)
- Type of place (restaurant, park, landmark, etc.)
- Notable features or what it's known for
- Best times to visit if applicable

Keep it concise and informative.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            description: { type: "string" },
            place_type: { type: "string" },
            notable_features: { 
              type: "array",
              items: { type: "string" }
            },
            best_time: { type: "string" }
          }
        }
      });
      setLocationInfo(info);
    } catch (error) {
      console.error("Error fetching location info:", error);
      setLocationInfo(null);
    }
    setIsLoading(false);
  }, [location]);

  useEffect(() => {
    if (location) {
      fetchLocationInfo();
    }
  }, [location, fetchLocationInfo]);

  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`;
    window.open(url, '_blank');
  };

  const handleViewOnMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
    window.open(url, '_blank');
  };

  if (!location) return null;

  return (
    <>
      {/* Mobile Full Screen */}
      <div className="md:hidden fixed inset-0 bg-white z-[10000] flex flex-col">
        <div className="flex-shrink-0 bg-[#3B82F6] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            <h3 className="font-bold text-lg">Location Details</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Location Name */}
          <div>
            <h4 className="font-bold text-xl text-gray-900 mb-2">
              {location.name.split(',')[0]}
            </h4>
            <p className="text-sm text-gray-600 line-clamp-2">
              {location.name}
            </p>
          </div>

          {/* AI-Generated Info */}
          {isLoading ? (
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Sparkles className="w-4 h-4 text-[#3B82F6] animate-pulse" />
                <span>Loading location details...</span>
              </div>
            </Card>
          ) : locationInfo ? (
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[#3B82F6]" />
                <span className="text-sm font-semibold text-blue-900">AI-Generated Info</span>
              </div>
              
              {locationInfo.place_type && (
                <div className="mb-3">
                  <span className="inline-block px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-xs font-medium">
                    {locationInfo.place_type}
                  </span>
                </div>
              )}

              {locationInfo.description && (
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                  {locationInfo.description}
                </p>
              )}

              {locationInfo.notable_features && locationInfo.notable_features.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Notable Features:</p>
                  <ul className="space-y-1">
                    {locationInfo.notable_features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-[#3B82F6] mt-1">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {locationInfo.best_time && (
                <div className="pt-3 border-t border-blue-200">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Best Time to Visit:</p>
                  <p className="text-sm text-gray-600">{locationInfo.best_time}</p>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-4 bg-gray-50">
              <p className="text-sm text-gray-600">
                Unable to load additional details for this location.
              </p>
            </Card>
          )}

          {/* Coordinates */}
          <Card className="p-3 bg-gray-50">
            <p className="text-xs text-gray-500 mb-1">Coordinates:</p>
            <p className="text-sm font-mono text-gray-700">
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </p>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={handleGetDirections}
              className="w-full gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white">
              <Navigation className="w-4 h-4" />
              Get Directions
            </Button>
            
            <Button
              onClick={handleViewOnMaps}
              variant="outline"
              className="w-full gap-2 border-blue-200 hover:bg-blue-50"
            >
              <MapPin className="w-4 h-4" />
              View on Google Maps
            </Button>
          </div>

          {/* Info Note */}
          <Card className="p-3 bg-blue-50 border-blue-200">
            <p className="text-xs text-blue-800">
              💡 Click "View on Google Maps" to see photos, reviews, hours, and contact information.
            </p>
          </Card>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed top-24 right-4 w-96 max-h-[calc(100vh-120px)] overflow-y-auto bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-blue-100 z-[10000]">
        <div className="sticky top-0 bg-[#3B82F6] text-white p-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            <h3 className="font-bold text-lg">Location Details</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Same content as mobile */}
          <div>
            <h4 className="font-bold text-xl text-gray-900 mb-2">
              {location.name.split(',')[0]}
            </h4>
            <p className="text-sm text-gray-600 line-clamp-2">
              {location.name}
            </p>
          </div>

          {isLoading ? (
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Sparkles className="w-4 h-4 text-[#3B82F6] animate-pulse" />
                <span>Loading location details...</span>
              </div>
            </Card>
          ) : locationInfo ? (
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[#3B82F6]" />
                <span className="text-sm font-semibold text-blue-900">AI-Generated Info</span>
              </div>
              
              {locationInfo.place_type && (
                <div className="mb-3">
                  <span className="inline-block px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-xs font-medium">
                    {locationInfo.place_type}
                  </span>
                </div>
              )}

              {locationInfo.description && (
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                  {locationInfo.description}
                </p>
              )}

              {locationInfo.notable_features && locationInfo.notable_features.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Notable Features:</p>
                  <ul className="space-y-1">
                    {locationInfo.notable_features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-[#3B82F6] mt-1">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {locationInfo.best_time && (
                <div className="pt-3 border-t border-blue-200">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Best Time to Visit:</p>
                  <p className="text-sm text-gray-600">{locationInfo.best_time}</p>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-4 bg-gray-50">
              <p className="text-sm text-gray-600">
                Unable to load additional details for this location.
              </p>
            </Card>
          )}

          <Card className="p-3 bg-gray-50">
            <p className="text-xs text-gray-500 mb-1">Coordinates:</p>
            <p className="text-sm font-mono text-gray-700">
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </p>
          </Card>

          <div className="space-y-2">
            <Button
              onClick={handleGetDirections}
              className="w-full gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white">
              <Navigation className="w-4 h-4" />
              Get Directions
            </Button>
            
            <Button
              onClick={handleViewOnMaps}
              variant="outline"
              className="w-full gap-2 border-blue-200 hover:bg-blue-50"
            >
              <MapPin className="w-4 h-4" />
              View on Google Maps
            </Button>
          </div>

          <Card className="p-3 bg-blue-50 border-blue-200">
            <p className="text-xs text-blue-800">
              💡 Click "View on Google Maps" to see photos, reviews, hours, and contact information.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
