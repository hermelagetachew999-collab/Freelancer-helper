import { useRef, useEffect, type KeyboardEvent, type ChangeEvent } from 'react';
import './ChatInput.css';

interface ChatInputProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
}

export const ChatInput = ({ value, onChange, onSend, disabled }: ChatInputProps) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-resize
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = Math.min(ref.current.scrollHeight, 180) + 'px';
    }
  }, [value]);

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  };

  return (
    <div className="chat-input-bar">
      <div className="chat-input-inner">
        <textarea
          ref={ref}
          className="input chat-textarea"
          placeholder="Ask anything — paste a proposal, job post, or question... 💬"
          value={value}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
          onKeyDown={handleKey}
          disabled={disabled}
          rows={1}
        />
        <button
          className="btn btn-primary btn-icon chat-send-btn"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          title="Send (Enter)"
        >
          {disabled ? <span className="spinner" /> : '↑'}
        </button>
      </div>
      <p className="chat-input-hint">Press <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for new line</p>
    </div>
  );
};
