import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const INTEREST_CATEGORIES = [
  { id: "lost_found_pets", label: "Lost & Found Pets", emoji: "🐾" },
  { id: "safety_crime", label: "Safety & Crime Alerts", emoji: "🚨" },
  { id: "weather_emergencies", label: "Weather & Emergencies", emoji: "⛈️" },
  { id: "local_services", label: "Local Services", emoji: "🛠️" },
  { id: "events_meetups", label: "Events & Meetups", emoji: "🎉" },
  { id: "garage_sales", label: "Garage Sales", emoji: "🏷️" },
  { id: "city_updates", label: "City Updates", emoji: "🏛️" },
  { id: "general_news", label: "General News", emoji: "📰" },
  { id: "casual_chats", label: "Casual Chats", emoji: "💬" }
];

export default function InterestsSelector({ selectedInterests, onToggle }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {INTEREST_CATEGORIES.map((interest) => {
        const isSelected = selectedInterests.includes(interest.id);
        
        return (
          <Card
            key={interest.id}
            onClick={() => onToggle(interest.id)}
            className={`p-4 cursor-pointer transition-all duration-200 ${
              isSelected
                ? "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300 shadow-md"
                : "bg-white hover:bg-gray-50 border-gray-200"
            }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{interest.emoji}</span>
                <span className="font-medium text-gray-900">{interest.label}</span>
              </div>
              
              {isSelected && (
                <div className="w-6 h-6 rounded-lg bg-[#3B82F6] flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export { INTEREST_CATEGORIES };