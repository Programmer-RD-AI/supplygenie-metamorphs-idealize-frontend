"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import ChatPage from "@/components/chat-page"

interface SupplierField {
  label: string
  value: string
  type: "text" | "badge" | "rating" | "price" | "location" | "time"
}

interface Message {
  id: string
  type: string
  content: string
  timestamp: Date
  suppliers?: Supplier[]
}

interface Supplier {
  id: string
  name: string
  fields: SupplierField[]
}

interface Chat {
  id: string
  title: string
  messages: Message[]
}

interface UserType {
  name: string
  email: string
  avatar?: string
  uid: string
}

const mockSuppliers: Supplier[] = [
  {
    id: "1",
    name: "Global Manufacturing Co.",
    fields: [
      { label: "Location", value: "Shenzhen, China", type: "location" },
      { label: "Rating", value: "4.8", type: "rating" },
      { label: "Price Range", value: "$10-50K", type: "price" },
      { label: "Lead Time", value: "15-30 days", type: "time" },
      { label: "MOQ", value: "1,000 units", type: "text" },
      { label: "Certifications", value: "ISO 9001,CE,RoHS", type: "badge" },
      { label: "Specialties", value: "Electronics,Consumer Goods", type: "badge" },
      { label: "Response Time", value: "2-4 hours", type: "time" },
    ],
  },
  {
    id: "2",
    name: "Precision Parts Ltd.",
    fields: [
      { label: "Location", value: "Munich, Germany", type: "location" },
      { label: "Rating", value: "4.9", type: "rating" },
      { label: "Price Range", value: "$25-100K", type: "price" },
      { label: "Lead Time", value: "10-20 days", type: "time" },
      { label: "Production Capacity", value: "50K units/month", type: "text" },
      { label: "Quality Standards", value: "Six Sigma,Lean", type: "badge" },
      { label: "Certifications", value: "ISO 9001,ISO 14001,REACH", type: "badge" },
      { label: "Specialties", value: "Automotive,Precision Engineering", type: "badge" },
    ],
  },
  {
    id: "3",
    name: "EcoSupply Solutions",
    fields: [
      { label: "Location", value: "Portland, USA", type: "location" },
      { label: "Rating", value: "4.7", type: "rating" },
      { label: "Price Range", value: "$5-30K", type: "price" },
      { label: "Lead Time", value: "7-14 days", type: "time" },
      { label: "Sustainability Score", value: "95/100", type: "text" },
      { label: "Certifications", value: "FSC,Organic,Fair Trade", type: "badge" },
      { label: "Materials", value: "Recycled,Biodegradable", type: "badge" },
      { label: "Carbon Neutral", value: "Yes", type: "text" },
    ],
  },
]

export default function Chat() {
  const router = useRouter()
  const [user, setUser] = useState<UserType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentMessage, setCurrentMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [search, setSearch] = useState("")
  const [isAssistantTyping, setIsAssistantTyping] = useState(false)

  const handleLogout = async () => {
    await signOut(auth)
    router.push("/")
  }

  const handleViewChange = (newView: "landing" | "login" | "signup" | "chat") => {
    if (newView === "landing") router.push("/")
    if (newView === "login") router.push("/login")
    if (newView === "signup") router.push("/signup")
  }

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !activeChat || !user) return;
    const chat = chats.find(c => c.id === activeChat);
    if (!chat) return;
    const userMessage = {
      id: `${activeChat}_${Date.now()}`,
      type: 'user',
      content: currentMessage,
      timestamp: new Date(),
    };
    // Optimistically update UI
    setChats(prev => prev.map(chat =>
      chat.id === activeChat ? { ...chat, messages: [...chat.messages, userMessage] } : chat
    ));
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage("");
    
    // Show typing indicator
    setIsAssistantTyping(true);
    
    // Save user message to DB
    await fetch('/api/chats', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.uid,
        chat_id: activeChat,
        message: {
          order: (chat.messages.length + 1),
          sender: 'user',
          message: currentMessage,
        },
      }),
    });
    // Simulate assistant response
    setTimeout(async () => {
      setIsAssistantTyping(false);
      const assistantMessage = {
        id: `${activeChat}_${Date.now()}_a`,
        type: 'assistant',
        content: "I found several electronics component suppliers in Asia with ISO certification that match your requirements. Here are the top matches:",
        timestamp: new Date(),
        suppliers: mockSuppliers,
      };
      setChats(prev => prev.map(chat =>
        chat.id === activeChat ? { ...chat, messages: [...chat.messages, assistantMessage] } : chat
      ));
      setMessages(prev => [...prev, assistantMessage]);
      // Save assistant message to DB
      await fetch('/api/chats', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          chat_id: activeChat,
          message: {
            order: (chat.messages.length + 2),
            sender: 'bot',
            message: assistantMessage.content,
          },
        }),
      });
    }, 2000);
  }

  const createNewChat = async () => {
    if (!user) return;
    const chatName = "New Supplier Search";
    // Create chat in DB
    const res = await fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.uid,
        chat_name: chatName,
      }),
    });
    const data = await res.json();
    if (data.chat) {
      const newChat: Chat = {
        id: data.chat.chat_id,
        title: data.chat.chat_name,
        messages: [],
      };
      setChats((prev) => [newChat, ...prev]);
      setActiveChat(newChat.id);
      setMessages([]);
    }
  }

  const handleStartRename = (chat: Chat) => {
    setRenamingChatId(chat.id)
    setRenameValue(chat.title)
  }

  const handleRenameChange = (value: string) => {
    setRenameValue(value)
  }

  const handleRenameSave = async (chatId: string) => {
    const newName = renameValue.trim();
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, title: newName || chat.title } : chat
      )
    );
    setRenamingChatId(null);
    setRenameValue("");
    // Update in DB
    if (user && newName) {
      await fetch('/api/chats', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          chat_id: chatId,
          new_chat_name: newName,
        }),
      });
    }
  }

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, chatId: string) => {
    if (e.key === "Enter") {
      handleRenameSave(chatId)
    } else if (e.key === "Escape") {
      setRenamingChatId(null)
      setRenameValue("")
    }
  }

  const handleChatSelect = (chatId: string) => {
    setActiveChat(chatId)
  }

  // Authentication guard
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          name: firebaseUser.displayName || firebaseUser.email || "User",
          email: firebaseUser.email || "",
          uid: firebaseUser.uid,
        })
      } else {
        router.push("/login")
      }
      setIsLoading(false)
    })
    return () => unsubscribe()
  }, [router])

  // Load chats when user is authenticated
  useEffect(() => {
    if (user) {
      fetch(`/api/chats?user_id=${user.uid}`)
        .then(res => res.json())
        .then(data => {
          if (data.chats) {
            const loadedChats = data.chats.map((chat: any) => ({
              id: chat.chat_id,
              title: chat.chat_name,
              messages: (chat.messages || []).map((m: any) => ({
                id: `${chat.chat_id}_${m.order}`,
                type: m.sender === 'user' ? 'user' : (m.sender === 'bot' ? 'assistant' : m.sender),
                content: m.message,
                timestamp: new Date(),
              }))
            }))
            setChats(loadedChats)
            if (!activeChat && loadedChats.length > 0) {
              setActiveChat(loadedChats[0].id)
            }
          }
        })
    }
  }, [user, activeChat])

  useEffect(() => {
    const chat = chats.find(c => c.id === activeChat)
    setMessages(chat ? chat.messages : [])
  }, [activeChat, chats])

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 animate-pulse">
      </div>
    )
  }

  // Only render chat if user is authenticated
  if (!user) {
    return null
  }

  return (
    <ChatPage
      user={user}
      chats={chats}
      activeChat={activeChat}
      messages={messages}
      currentMessage={currentMessage}
      search={search}
      isAssistantTyping={isAssistantTyping}
      renamingChatId={renamingChatId}
      renameValue={renameValue}
      onViewChange={handleViewChange}
      onLogout={handleLogout}
      onChatSelect={handleChatSelect}
      onCreateNewChat={createNewChat}
      onSendMessage={handleSendMessage}
      onMessageChange={setCurrentMessage}
      onSearchChange={setSearch}
      onStartRename={handleStartRename}
      onRenameChange={handleRenameChange}
      onRenameSave={handleRenameSave}
      onRenameKeyDown={handleRenameKeyDown}
      setRenamingChatId={setRenamingChatId}
    />
  )
}
