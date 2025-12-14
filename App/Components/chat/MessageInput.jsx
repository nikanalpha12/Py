import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Clock } from "lucide-react";

export default function MessageInput({ onSend, disabled, placeholder = "Type a message...", slowmodeCooldown = 0, isSlowmodeActive = false }) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || isSending || slowmodeCooldown > 0) return;

    setIsSending(true);
    await onSend(message.trim());
    setMessage("");
    setIsSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isDisabled = disabled || isSending || slowmodeCooldown > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {isSlowmodeActive && slowmodeCooldown > 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
          <Clock className="w-3 h-3" />
          <span>Slowmode active - wait {slowmodeCooldown}s before sending another message</span>
        </div>
      )}
      
      <div className="flex gap-2 items-end">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isDisabled}
          className="bg-background px-3 py-2 text-sm rounded-2xl flex w-full border ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-12 max-h-32 resize-none border-gray-200 focus:border-blue-300"
          rows={1}
        />

        <Button
          type="submit"
          disabled={!message.trim() || isDisabled}
          className="h-12 w-12 rounded-full bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-lg flex-shrink-0 relative"
        >
          {slowmodeCooldown > 0 ? (
            <span className="text-xs font-bold">{slowmodeCooldown}</span>
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>

      {isSlowmodeActive && (
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>Slowmode is on - 4 second message cooldown</span>
        </div>
      )}
    </form>
  );
}