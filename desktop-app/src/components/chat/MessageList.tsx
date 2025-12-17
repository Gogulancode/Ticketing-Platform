import { useRef, useEffect } from 'react';
import { format, parseISO, isToday, isYesterday, isSameDay } from 'date-fns';
import { Check, CheckCheck, CornerUpRight } from 'lucide-react';
import { Message } from '../../store/chatStore';

interface MessageListProps {
  messages: Message[];
  currentUserId: number;
}

export default function MessageList({ messages, currentUserId }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatMessageTime = (dateStr: string) => {
    return format(parseISO(dateStr), 'HH:mm');
  };

  const formatDateDivider = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  const shouldShowDateDivider = (currentMsg: Message, prevMsg?: Message) => {
    if (!prevMsg) return true;
    return !isSameDay(parseISO(currentMsg.createdAt), parseISO(prevMsg.createdAt));
  };

  const shouldGroupWithPrevious = (currentMsg: Message, prevMsg?: Message) => {
    if (!prevMsg) return false;
    if (currentMsg.senderId !== prevMsg.senderId) return false;
    const timeDiff = new Date(currentMsg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime();
    return timeDiff < 60000; // 1 minute
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">No messages yet</p>
          <p className="text-sm text-gray-400 mt-1">Start the conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
      {messages.map((message, index) => {
        const prevMessage = messages[index - 1];
        const isOwnMessage = message.senderId === currentUserId;
        const showDateDivider = shouldShowDateDivider(message, prevMessage);
        const isGrouped = shouldGroupWithPrevious(message, prevMessage);

        return (
          <div key={message.id}>
            {/* Date Divider */}
            {showDateDivider && (
              <div className="flex items-center justify-center my-4">
                <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                  {formatDateDivider(message.createdAt)}
                </div>
              </div>
            )}

            {/* Message */}
            <div
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${
                isGrouped ? 'mt-0.5' : 'mt-3'
              }`}
            >
              <div
                className={`message-bubble max-w-[70%] ${
                  isOwnMessage
                    ? 'bg-primary-600 text-white rounded-2xl rounded-br-md'
                    : 'bg-white text-gray-900 rounded-2xl rounded-bl-md shadow-sm'
                } px-4 py-2`}
              >
                {/* Sender name (for group chats, not own messages) */}
                {!isOwnMessage && !isGrouped && (
                  <p className="text-xs font-medium text-primary-600 mb-1">
                    {message.senderName}
                  </p>
                )}

                {/* Reply indicator */}
                {message.parentMessageId && (
                  <div className={`flex items-center gap-1 text-xs mb-1 ${
                    isOwnMessage ? 'text-primary-200' : 'text-gray-400'
                  }`}>
                    <CornerUpRight className="w-3 h-3" />
                    <span>Reply</span>
                  </div>
                )}

                {/* Message content */}
                <p className="whitespace-pre-wrap break-words">{message.content}</p>

                {/* Attachments */}
                {message.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={att.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block text-sm underline ${
                          isOwnMessage ? 'text-primary-100' : 'text-primary-600'
                        }`}
                      >
                        📎 {att.fileName}
                      </a>
                    ))}
                  </div>
                )}

                {/* Reactions */}
                {message.reactions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.entries(
                      message.reactions.reduce((acc, r) => {
                        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([emoji, count]) => (
                      <span
                        key={emoji}
                        className="inline-flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5 text-xs"
                      >
                        {emoji} {count}
                      </span>
                    ))}
                  </div>
                )}

                {/* Time and status */}
                <div
                  className={`flex items-center gap-1 mt-1 text-xs ${
                    isOwnMessage ? 'text-primary-200 justify-end' : 'text-gray-400'
                  }`}
                >
                  <span>{formatMessageTime(message.createdAt)}</span>
                  {message.isEdited && <span>(edited)</span>}
                  {isOwnMessage && (
                    <span className="ml-1">
                      {message.isRead ? (
                        <CheckCheck className="w-3 h-3" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
