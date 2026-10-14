import React, { useState, useRef, useEffect } from 'react';
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
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior
      });
    }
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages.length, loading]);

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
    } catch (err: any) {
      const errorMsg = err?.message || 'AI service temporarily unavailable. Please try again later.';
      showErrorToast(errorMsg);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: errorMsg
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderFormattedMessage = (content: string, isUser: boolean) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    const renderInline = (text: string) => {
      const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
      return parts.map((part, pIdx) => {
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
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={pIdx} className="italic text-muted">{part.slice(1, -1)}</em>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={pIdx} className="px-1.5 py-0.5 rounded bg-muted/20 font-mono text-xs text-primary">
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={pIdx}>{part}</span>;
      });
    };

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Check for Markdown Table
      if (trimmed.startsWith('|') && trimmed.endsWith('|') && i + 1 < lines.length && lines[i + 1].trim().startsWith('|') && lines[i + 1].includes('---')) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          tableLines.push(lines[i].trim());
          i++;
        }

        if (tableLines.length >= 2) {
          const headerCols = tableLines[0].slice(1, -1).split('|').map(c => c.trim());
          const bodyRows = tableLines.slice(2).map(r => r.slice(1, -1).split('|').map(c => c.trim()));

          elements.push(
            <div key={`table-${i}`} className="my-3 overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/15 border-b border-border text-foreground font-semibold">
                  <tr>
                    {headerCols.map((col, cIdx) => (
                      <th key={cIdx} className="px-3 py-2 border-r border-border last:border-r-0">
                        {renderInline(col)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bodyRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-muted/5 transition">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3 py-2 border-r border-border last:border-r-0 text-foreground">
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // Blockquote
      if (trimmed.startsWith('>')) {
        const quoteText = trimmed.replace(/^>\s*/, '');
        elements.push(
          <div key={`quote-${i}`} className="my-2 pl-3 border-l-2 border-primary/40 text-xs italic text-muted">
            {renderInline(quoteText)}
          </div>
        );
        i++;
        continue;
      }

      // Bullet points
      const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ');
      if (isBullet) {
        const bulletText = trimmed.replace(/^[-•*]\s*/, '');
        elements.push(
          <div key={`bullet-${i}`} className="flex items-start gap-2.5 my-1 pl-1 text-sm">
            <span
              className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${isUser ? 'bg-white' : 'bg-primary'}`}
            />
            <div className="flex-1 leading-relaxed">{renderInline(bulletText)}</div>
          </div>
        );
        i++;
        continue;
      }

      // Empty line
      if (trimmed === '') {
        elements.push(<div key={`empty-${i}`} className="h-2" />);
        i++;
        continue;
      }

      // Headings
      if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${i}`} className="text-sm font-bold text-foreground mt-3 mb-1">
            {renderInline(trimmed.replace(/^###\s*/, ''))}
          </h3>
        );
        i++;
        continue;
      }
      if (trimmed.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${i}`} className="text-base font-bold text-foreground mt-3 mb-1">
            {renderInline(trimmed.replace(/^##\s*/, ''))}
          </h2>
        );
        i++;
        continue;
      }

      // Regular line
      elements.push(
        <div key={`line-${i}`} className="my-0.5 leading-relaxed text-sm">
          {renderInline(line)}
        </div>
      );
      i++;
    }

    return elements;
  };

  return (
    <div className="h-[calc(100vh-110px)] lg:h-[calc(100vh-125px)] flex flex-col w-full space-y-3 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            AI Salary & Compensation Assistant
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Ask questions in natural language about organizational payroll metrics, departmental headcounts, and workforce compensation.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 self-start sm:self-auto shrink-0">
          AI Payroll Intelligence
        </span>
      </div>

      {/* Main Chat Box Container: Exactly fills remaining height, never scrolls outer page */}
      <div className="flex-1 min-h-0 bg-card border border-border rounded-2xl shadow-xs flex flex-col overflow-hidden">
        {/* Scrollable Messages Area */}
        <div
          ref={chatScrollRef}
          className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 overscroll-contain"
        >
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm shadow-2xs ${m.role === 'user'
                  ? 'bg-primary text-white font-medium'
                  : 'bg-background border border-border text-foreground'
                  }`}
              >
                {renderFormattedMessage(m.content, m.role === 'user')}
              </div>
              {m.role === 'user' && (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-card border border-border text-muted flex items-center justify-center shrink-0 mt-0.5">
                  <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-xs sm:text-sm text-muted p-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <span>PayDesk AI is evaluating verified database records...</span>
            </div>
          )}
        </div>

        {/* Fixed Message Input Bar at the Bottom */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="shrink-0 p-3 sm:p-4 border-t border-border bg-card flex items-center gap-2.5 sm:gap-3"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={loading}
            placeholder="Ask about salary distribution, department costs, median pay..."
            className="flex-1 h-11 sm:h-12 px-4 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
          <Button
            type="submit"
            variant="primary"
            disabled={!inputQuery.trim() || loading}
            isLoading={loading}
            leftIcon={<Send className="w-4 h-4" />}
            className="h-11 sm:h-12 px-4 sm:px-5 shrink-0"
          >
            Ask AI
          </Button>
        </form>
      </div>
    </div>
  );
};
