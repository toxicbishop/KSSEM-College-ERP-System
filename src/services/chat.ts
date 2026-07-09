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
  if (!classroomId || classroomId.trim() === '') {
    throw new Error('Classroom ID is required');
  }
  const response = await apiGet<{ messages?: ChatMessageWire[] }>(
    `/api/communication/chat/${encodeURIComponent(classroomId)}/messages?limit=100`,
  );
  return (response.messages ?? []).map(fromChatWire);
}

export async function sendMessage(classroomId: string, text: string): Promise<ChatMessage> {
  if (!classroomId || classroomId.trim() === '') {
    throw new Error('Classroom ID is required');
  }
  if (!text || text.trim().length === 0) {
    throw new Error('Message text cannot be empty');
  }
  if (text.length > 5000) {
    throw new Error('Message text must not exceed 5000 characters');
  }
  const message = await apiPost<ChatMessageWire>(
    `/api/communication/chat/${encodeURIComponent(classroomId)}/messages`,
    { classroomId, text },
  );
  return fromChatWire(message);
}
