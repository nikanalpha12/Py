import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";
import { User } from "@/entities/User";

export default function OnlineUsers({ users }) {

  return (
    <Card className="p-4 bg-white/80 backdrop-blur-sm border-blue-100/50">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">People Nearby</h3>
        <span className="ml-auto text-sm font-medium text-gray-600">{users.length}</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {users.slice(0, 10).map((user, index) => (
          <div
            key={index}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full rounded-lg object-cover" />
              ) : (
                user.name?.[0]?.toUpperCase() || "?"
              )}
            </div>
            <span className="text-sm font-medium text-gray-700">{user.name}</span>
          </div>
        ))}
        {users.length > 10 && (
          <div className="flex items-center px-3 py-1.5 text-sm text-gray-600">
            +{users.length - 10} more
          </div>
        )}
      </div>
    </Card>
  );
}