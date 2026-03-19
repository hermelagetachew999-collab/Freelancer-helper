import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '../api/client';
import './MessageBubble.css';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  return (
    <div className={`bubble-row ${isUser ? 'bubble-row--user' : 'bubble-row--ai'}`}>
      {!isUser && (
        <div className="bubble-avatar" aria-label="ProposalWin AI">
          <span>✦</span>
        </div>
      )}
      <div className={`bubble ${isUser ? 'bubble--user' : 'bubble--ai'}`}>
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <div className="markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
      {isUser && <div className="bubble-avatar bubble-avatar--user" aria-label="You">👤</div>}
    </div>
  );
};

export const TypingIndicator: React.FC = () => (
  <div className="bubble-row bubble-row--ai">
    <div className="bubble-avatar"><span>✦</span></div>
    <div className="bubble bubble--ai bubble--typing">
      <div className="typing-dot" />
      <div className="typing-dot" />
      <div className="typing-dot" />
    </div>
  </div>
);
