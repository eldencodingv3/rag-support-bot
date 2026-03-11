import { useEffect, useRef } from 'react'

interface Source {
  question: string
  category: string
}

interface Message {
  role: 'user' | 'bot'
  content: string
  sources?: Source[]
}

interface ChatInterfaceProps {
  messages: Message[]
  input: string
  loading: boolean
  onInputChange: (value: string) => void
  onSend: () => void
}

export default function ChatInterface({
  messages,
  input,
  loading,
  onInputChange,
  onSend,
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    inputRef.current?.focus()
  }, [loading])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <>
      <div className="messages">
        {messages.length === 0 && (
          <div className="welcome">
            <h2>Welcome!</h2>
            <p>
              Ask me anything about billing, accounts, shipping, returns,
              subscriptions, or technical support.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`message message--${msg.role}`}>
            <div className="message-bubble">{msg.content}</div>
            {msg.sources && msg.sources.length > 0 && (
              <div className="sources">
                <div className="sources-title">Sources</div>
                <ul>
                  {msg.sources.map((src, j) => (
                    <li key={j}>
                      {src.category}: {src.question}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="loading-dots" aria-label="Loading response">
            <span />
            <span />
            <span />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your question..."
          disabled={loading}
          aria-label="Message input"
        />
        <button onClick={onSend} disabled={loading || !input.trim()}>
          Send
        </button>
      </div>
    </>
  )
}
