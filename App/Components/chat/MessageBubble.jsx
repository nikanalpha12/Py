
import React from "react";
import { format } from "date-fns";

export default function MessageBubble({ message, isOwnMessage, showAvatar }) {
  return (
    <div className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : "flex-row"} mb-4`}>
      {showAvatar && (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
          {message.sender_avatar ? (
            <img src={message.sender_avatar} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            message.sender_name?.[0]?.toUpperCase() || "?"
          )}
        </div>
      )}
      {!showAvatar && <div className="w-10 flex-shrink-0" />}
      
      <div className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"} max-w-[70%]`}>
        {showAvatar && (
          <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}>
            <span className="text-xs font-semibold text-gray-700">{message.sender_name}</span>
            <span className="text-xs text-gray-500">
              {format(new Date(message.created_date), "h:mm a")}
            </span>
          </div>
        )}
        
        <div
          className={`px-4 py-2.5 rounded-2xl ${
            isOwnMessage
              ? "bg-[#3B82F6] text-white rounded-tr-sm"
              : "bg-white border border-gray-200 text-gray-900 rounded-tl-sm shadow-sm"
          }`}
        >
          <p className="text-sm leading-relaxed break-words">{message.content}</p>
        </div>
        
        {!showAvatar && (
          <span className={`text-xs text-gray-400 mt-1 ${isOwnMessage ? "mr-2" : "ml-2"}`}>
            {format(new Date(message.created_date), "h:mm a")}
          </span>
        )}
      </div>
    </div>
  );
}
