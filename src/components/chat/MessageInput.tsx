import { forwardRef, KeyboardEvent } from 'react';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const MessageInput = forwardRef<HTMLTextAreaElement, MessageInputProps>(
  ({ value, onChange, onSend, disabled = false, placeholder = "Type your message..." }, ref) => {
    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (value.trim() && !disabled) {
          onSend(value);
        }
      }
    };

    const handleSend = () => {
      if (value.trim() && !disabled) {
        onSend(value);
      }
    };

    return (
      <div className="flex space-x-2" role="form" aria-label="Message input form">
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          style={{
            minHeight: '40px',
            maxHeight: '120px',
            overflowY: 'auto'
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = Math.min(target.scrollHeight, 120) + 'px';
          }}
          aria-label="Message input"
          aria-describedby="message-input-help"
          aria-disabled={disabled}
          aria-multiline="true"
          maxLength={5000}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          aria-label="Send message"
          aria-disabled={disabled || !value.trim()}
        >
          Send
        </button>
        <div id="message-input-help" className="sr-only">
          Press Enter to send, Shift+Enter for new line. Maximum 5000 characters.
        </div>
      </div>
    );
  }
);

MessageInput.displayName = 'MessageInput';