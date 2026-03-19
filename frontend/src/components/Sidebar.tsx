import React from 'react';
import type { Conversation } from '../api/client';
import './Sidebar.css';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations, activeId, onSelect, onNew, onDelete, isOpen, onClose,
}) => {
  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-logo gradient-text">FreelanceClarity</span>
          <button className="btn btn-ghost btn-sm sidebar-close" onClick={onClose}>✕</button>
        </div>

        <button className="btn btn-primary w-full sidebar-new-btn" onClick={onNew}>
          ✦ New Chat
        </button>

        <nav className="sidebar-nav">
          <p className="sidebar-section-label">Recent Conversations</p>
          {conversations.length === 0 && (
            <p className="sidebar-empty">No conversations yet. Start chatting! 💬</p>
          )}
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`sidebar-item ${activeId === conv.id ? 'active' : ''}`}
              onClick={() => { onSelect(conv.id); onClose(); }}
            >
              <span className="sidebar-item-icon">💬</span>
              <span className="sidebar-item-title">{conv.title || 'New Conversation'}</span>
              <button
                className="sidebar-item-delete"
                onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                title="Delete"
              >
                🗑
              </button>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-badge">
            <span>🇪🇹</span>
            <span>Built for Ethiopian Freelancers</span>
          </div>
        </div>
      </aside>
    </>
  );
};
