"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getChatMessages, sendMessage, fromChatWire } from "@/services/chat";
import { auth as clientAuth } from "@/lib/firebase/client";
import type { ChatMessage, ChatMessageWire } from "@/services/chat";
import { useGenerateStream } from "@/hooks/use-generate-stream";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNowStrict } from "date-fns";

interface ChatRoomProps {
  classroomId: string;
  currentUserId: string;
  currentUserName: string;
}

export function ChatRoom({
  classroomId,
  currentUserId,
  currentUserName,
}: ChatRoomProps) {
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const streamPath = classroomId
    ? `/api/communication/chat/${encodeURIComponent(classroomId)}/stream`
    : null;
  const { event: streamedMessage, error: streamError } =
    useGenerateStream<ChatMessageWire>(streamPath);

  useEffect(() => {
    if (!classroomId) {
      setIsLoadingMessages(false);
      return;
    }

    setIsLoadingMessages(true);
    void getChatMessages(classroomId)
      .then((fetchedMessages) => {
        setMessages(fetchedMessages);
        setIsLoadingMessages(false);
      })
      .catch((error) => {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error",
          description: "Could not load messages. Please try again.",
          variant: "destructive",
        });
        setIsLoadingMessages(false);
      });
  }, [classroomId, toast]);

  useEffect(() => {
    if (!streamedMessage) return;
    const next = fromChatWire(streamedMessage);
    setMessages((current) =>
      current.some((message) => message.id === next.id) ? current : [...current, next],
    );
  }, [streamedMessage]);

  useEffect(() => {
    if (!streamError) return;
    toast({ title: "Chat disconnected", description: streamError.message, variant: "destructive" });
  }, [streamError, toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !clientAuth?.currentUser) {
      toast({
        title: "Cannot send empty message or not authenticated.",
        variant: "destructive",
      });
      return;
    }
    setIsSending(true);
    try {
      await sendMessage(classroomId, newMessage);
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error Sending Message",
        description: (error as Error).message || "Could not send your message.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    const nameParts = name.split(" ");
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex h-full flex-col rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="border-b p-3">
        <h3 className="font-semibold text-lg flex items-center">
          <MessageCircle className="mr-2 h-5 w-5 text-primary" />
          Classroom Chat
        </h3>
      </div>
      <ScrollArea className="flex-grow p-4">
        {isLoadingMessages && (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Loading messages...</p>
          </div>
        )}
        {!isLoadingMessages && messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">
              No messages yet. Start the conversation!
            </p>
          </div>
        )}
        {!isLoadingMessages && messages.length > 0 && (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${
                  msg.senderId === currentUserId
                    ? "justify-end"
                    : "justify-start"
                }`}>
                {msg.senderId !== currentUserId && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src="https://placehold.co/32x32.png"
                      alt={msg.senderName}
                      data-ai-hint="user avatar generic"
                    />
                    <AvatarFallback>
                      {getInitials(msg.senderName)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[70%] rounded-lg px-3 py-2 ${
                    msg.senderId === currentUserId
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}>
                  <p className="text-sm font-medium">{msg.senderName}</p>
                  <p className="text-sm break-words">{msg.text}</p>
                  <p className="mt-1 text-xs opacity-70">
                    {msg.timestamp instanceof Date
                      ? formatDistanceToNowStrict(msg.timestamp, {
                          addSuffix: true,
                        })
                      : "sending..."}
                  </p>
                </div>
                {msg.senderId === currentUserId && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src="https://placehold.co/32x32.png"
                      alt={currentUserName}
                      data-ai-hint="user avatar current profile"
                    />
                    <AvatarFallback>
                      {getInitials(currentUserName)}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>
      <div className="border-t p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow"
            disabled={isSending || isLoadingMessages}
          />
          <Button
            type="submit"
            disabled={isSending || isLoadingMessages || !newMessage.trim()}>
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
