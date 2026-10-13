import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Sparkles, Send, Bot, User as UserIcon } from 'lucide-react';
import { apiRequest } from '../services/api';
import { showErrorToast } from '../utils/toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your PayDesk AI Compensation Assistant. You can ask me natural language inquiries about organizational payroll metrics, departmental headcounts, average base salaries, and regional compensation distributions across our global workforce.'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!inputQuery.trim() || loading) return;

    const textToSend = inputQuery.trim();
    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await apiRequest<{ success: boolean; data: { reply: string } }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: textToSend,
          conversationHistory: messages
        })
      });

      if (res.data?.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply }]);
      } else {
        throw new Error('No response returned from the server.');
      }
    } catch {
      showErrorToast('Failed to connect to AI assistant service.');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Unable to communicate with the compensation inference service. Please verify your connection or try again shortly.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };


  const renderFormattedMessage = (content: string, isUser: boolean) => {
    const lines = content.split('\n');
    return lines.map((line, lIdx) => {
      const trimmed = line.trim();
      const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('• ');
      const rawText = isBullet ? trimmed.replace(/^[-•]\s*/, '') : line;

      const parts = rawText.split(/(\*\*.*?\*\*)/g);
      const renderedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong
              key={pIdx}
              className={isUser ? 'font-bold text-white' : 'font-semibold text-foreground'}
            >
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={pIdx}>{part}</span>;
      });

      if (isBullet) {
        return (
          <div key={lIdx} className="flex items-start gap-2.5 my-1.5 pl-1">
            <span
              className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${
                isUser ? 'bg-white' : 'bg-primary'
              }`}
            />
            <div className="flex-1 leading-relaxed">{renderedParts}</div>
          </div>
        );
      }

      if (trimmed === '') {
        return <div key={lIdx} className="h-2.5" />;
      }

      return (
        <div key={lIdx} className="my-1 leading-relaxed">
          {renderedParts}
        </div>
      );
    });
  };

  return (
    <div className="flex-1 flex flex-col w-full space-y-4 min-h-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-primary" />
            AI Salary & Compensation Assistant
          </h1>
          <p className="text-sm text-muted mt-1">
            Inquire in natural language with verified data from our MySQL workforce database.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 self-start sm:self-auto">
          Powered by Groq LLM
        </span>
      </div>

      {/* Chat Window: stretches to fill full height with exact 30px bottom spacing */}
      <Card className="flex-1 flex flex-col justify-between p-5 min-h-[480px] shadow-sm">
        <div className="flex-1 overflow-y-auto space-y-4 pr-3 pb-6 min-h-0">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3.5 ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Bot className="w-5 h-5" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-sm shadow-sm ${
                  m.role === 'user'
                    ? 'bg-primary text-white font-medium'
                    : 'bg-background border border-border text-foreground'
                }`}
              >
                {renderFormattedMessage(m.content, m.role === 'user')}
              </div>
              {m.role === 'user' && (
                <div className="w-9 h-9 rounded-xl bg-card border border-border text-muted flex items-center justify-center shrink-0 mt-0.5">
                  <UserIcon className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3.5 text-sm text-muted p-2">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-5 h-5" />
              </div>
              <span>PayDesk AI is evaluating verified database records...</span>
            </div>
          )}

          <div ref={messagesEndRef} className="h-6" />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="pt-4 border-t border-border flex items-center gap-3 bg-card"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={loading}
            placeholder="Ask about salary distribution, department costs, median pay..."
            className="flex-1 h-12 px-4 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          />
          <Button
            type="submit"
            variant="primary"
            disabled={!inputQuery.trim() || loading}
            isLoading={loading}
            leftIcon={<Send className="w-4 h-4" />}
          >
            Ask AI
          </Button>
        </form>
      </Card>
    </div>
  );
};
