import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { chatApi } from '../api/client';
import type { Conversation, Message } from '../api/client';
import { useOnboarded, useSessionId } from '../hooks/useSession';
import { Onboarding } from '../components/Onboarding';
import { Sidebar } from '../components/Sidebar';
import { ChatInput } from '../components/ChatInput';
import { MessageBubble, TypingIndicator } from '../components/MessageBubble';

export function CoachPage() {
  const sessionId = useSessionId();
  const [onboarded, markOnboarded] = useOnboarded();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const canSend = useMemo(() => !busy && draft.trim().length > 0, [busy, draft]);

  const loadConversations = useCallback(async () => {
    const { data } = await chatApi.getConversations(sessionId);
    setConversations(data);
    setActiveConversationId((current) => (current ? current : data[0]?.id ?? null));
  }, [sessionId]);

  const loadMessages = async (conversationId: string) => {
    const { data } = await chatApi.getMessages(conversationId);
    setMessages(data);
  };

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (activeConversationId) void loadMessages(activeConversationId);
    else setMessages([]);
  }, [activeConversationId]);

  const newChat = () => {
    setActiveConversationId(null);
    setMessages([]);
  };

  const deleteChat = async (id: string) => {
    await chatApi.deleteConversation(id);
    if (activeConversationId === id) newChat();
    await loadConversations();
  };

  const send = async (text: string) => {
    setBusy(true);
    const optimisticUser: Message = {
      id: `optimistic-user-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimisticUser]);

    try {
      const { data } = await chatApi.sendMessage(sessionId, text, activeConversationId || undefined);
      if (!activeConversationId) setActiveConversationId(data.conversationId);

      const optimisticAi: Message = {
        id: `optimistic-ai-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        created_at: new Date().toISOString(),
      };
      setMessages((m) => [...m, optimisticAi]);
      await loadConversations();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      const errorText = err?.response?.data?.error || 'Failed to get AI response.';
      setMessages((m) => [
        ...m,
        {
          id: `optimistic-ai-error-${Date.now()}`,
          role: 'assistant',
          content: `**Error:** ${errorText}`,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const onSend = async () => {
    if (!canSend) return;
    const text = draft.trim();
    setDraft('');
    await send(text);
  };

  const handleOnboarding = async (answers: { platform: string; skill: string; struggle: string }) => {
    markOnboarded();
    const opener = `Platform: ${answers.platform}\nSkill: ${answers.skill}\nBiggest struggle: ${answers.struggle}\n\nHi ProposalWin AI — please help me.`;
    await send(opener);
  };

  return (
    <div className="container">
      {!onboarded ? <Onboarding onComplete={handleOnboarding} /> : null}

      <div className="flex gap-4" style={{ alignItems: 'stretch' }}>
        <Sidebar
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={(id) => setActiveConversationId(id)}
          onNew={newChat}
          onDelete={deleteChat}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <section className="card card-glow" style={{ padding: 0, flex: 1 }}>
          <div style={{ padding: 14, borderBottom: '1px solid var(--border)' }} className="flex justify-between items-center gap-3">
            <div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>ProposalWin AI Coach</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Paste a job post or proposal draft — I’ll score it and improve it.
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setSidebarOpen(true)}>
              Conversations
            </button>
          </div>

          <div style={{ padding: 16, height: '60vh', overflowY: 'auto' }}>
            {messages.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)' }}>
                Start by pasting a job post, or ask: “Write me a proposal for this job description…”
              </div>
            ) : (
              messages.map((m) => <MessageBubble key={m.id} message={m} />)
            )}
            {busy ? <TypingIndicator /> : null}
          </div>

          <div style={{ padding: 14, borderTop: '1px solid var(--border)' }}>
            <ChatInput value={draft} onChange={setDraft} onSend={onSend} disabled={busy} />
          </div>
        </section>
      </div>
    </div>
  );
}

