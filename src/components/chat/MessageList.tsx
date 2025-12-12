interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface MessageListProps {
  messages: ChatMessage[];
}

export function MessageList({ messages }: MessageListProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMessageContent = (message: ChatMessage) => {
    // Split content by lines
    const lines = message.content.split('\n');

    return (
      <>
        {lines.map((line, lineIndex) => (
          <span key={lineIndex}>
            {highlightTokens(line)}
            {lineIndex < lines.length - 1 && <br />}
          </span>
        ))}
      </>
    );
  };

  const highlightTokens = (text: string) => {
    // Find all token patterns (internal ID format: token_ followed by UUID or alphanumeric string)
    const parts = text.split(/(token_[a-zA-Z0-9\-]+)/);

    return parts.map((part, index) => {
      if (part.match(/^token_[a-zA-Z0-9\-]+$/)) {
        return (
          <span key={index} className="font-mono bg-purple-100 text-purple-800 px-1 py-0.5 rounded text-sm">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Data is now included in the message text, no need for separate rendering function

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-lg p-4 ${
              message.type === 'user'
                ? 'bg-blue-600 text-white'
                : message.type === 'system'
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {/* Message Header */}
            <div className={`text-xs mb-1 ${
              message.type === 'user'
                ? 'text-blue-100'
                : message.type === 'system'
                ? 'text-yellow-600'
                : 'text-gray-500'
            }`}>
              {message.type === 'user' ? 'You' : message.type === 'system' ? 'System' : 'Assistant'} • {formatTime(message.timestamp)}
            </div>

            {/* Message Content */}
            <div
              className={`text-sm ${
                message.type === 'user' ? 'text-white' : ''
              }`}
            >
              {renderMessageContent(message)}
            </div>

            {/* Data is now included in the message text, no need for separate section */}
          </div>
        </div>
      ))}
    </div>
  );
}