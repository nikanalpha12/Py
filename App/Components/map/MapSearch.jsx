import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { User } from "@/entities/User";

export default function MapSearch({ onLocationSelect }) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      setResults(data);
      setShowResults(true);
    } catch (error) {
      console.error("Search error:", error);
    }
    setIsSearching(false);
  };

  const handleSelectResult = (result) => {
    onLocationSelect({
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      name: result.display_name
    });
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className="relative w-full max-w-md">
      <form onSubmit={handleSearch} className="relative">
        <Input
          type="text"
          placeholder="Search location..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="px-3 py-2 text-base rounded-md flex h-10 w-full border ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm shadow-lg pr-20 bg-white/95 backdrop-blur-sm border-blue-200"
        />

        <div className="absolute right-1 top-1 flex gap-1">
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="h-8 w-8 text-gray-600">
              <X className="w-4 h-4" />
            </Button>
          )}
          <Button
            type="submit"
            size="icon"
            disabled={isSearching || !query.trim()}
            className="h-8 w-8 bg-blue-600 hover:bg-blue-700 text-white">
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </form>

      {showResults && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full rounded-lg shadow-xl border max-h-64 overflow-y-auto z-[1001] bg-white/95 backdrop-blur-sm border-blue-200">
          {results.map((result, index) => (
            <button
              key={index}
              onClick={() => handleSelectResult(result)}
              className="w-full text-left px-4 py-3 border-b last:border-b-0 transition-colors border-gray-100 hover:bg-blue-50">
              <div className="font-medium text-sm line-clamp-1 text-gray-900">
                {result.display_name.split(",")[0]}
              </div>
              <div className="text-xs mt-1 line-clamp-1 text-gray-600">
                {result.display_name}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}