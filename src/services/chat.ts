import { apiGet, apiPost } from "@/lib/api-client";

export interface ChatMessage {
  id: string;
  classroomId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
}

export interface ChatMessageWire extends Omit<ChatMessage, "timestamp"> {
  timestamp: string;
}

export function fromChatWire(message: ChatMessageWire): ChatMessage {
  return { ...message, timestamp: new Date(message.timestamp) };
}

export async function getChatMessages(classroomId: string): Promise<ChatMessage[]> {
  const response = await apiGet<{ messages?: ChatMessageWire[] }>(
    `/api/communication/chat/${encodeURIComponent(classroomId)}/messages?limit=100`,
  );
  return (response.messages ?? []).map(fromChatWire);
}

export async function sendMessage(classroomId: string, text: string): Promise<ChatMessage> {
  const message = await apiPost<ChatMessageWire>(
    `/api/communication/chat/${encodeURIComponent(classroomId)}/messages`,
    { classroomId, text },
  );
  return fromChatWire(message);
}
