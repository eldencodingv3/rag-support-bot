import { useState, useCallback } from 'react'
import ChatInterface from './components/ChatInterface'

interface Source {
  question: string
  category: string
}

interface Message {
  role: 'user' | 'bot'
  content: string
  sources?: Source[]
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const sendMessage = useCallback(async () => {
    const question = input.trim()
    if (!question || loading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: question }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`)
      }

      const data = await res.json()
      setMessages(prev => [
        ...prev,
        {
          role: 'bot',
          content: data.answer,
          sources: data.sources,
        },
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'bot',
          content: 'Sorry, something went wrong. Please try again.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [input, loading])

  return (
    <div className="app">
      <header className="header">
        <div className="header-icon">?</div>
        <div>
          <h1>Support Bot</h1>
          <p>AI-powered customer support</p>
        </div>
      </header>
      <ChatInterface
        messages={messages}
        input={input}
        loading={loading}
        onInputChange={setInput}
        onSend={sendMessage}
      />
    </div>
  )
}
