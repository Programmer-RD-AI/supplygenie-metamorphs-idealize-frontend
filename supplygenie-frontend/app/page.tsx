"use client"

import { useState, useEffect, useRef } from "react"
import { auth } from "@/lib/firebase"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, onAuthStateChanged, signOut } from "firebase/auth"
import LandingPage from "@/components/landing-page"
import LoginPage from "@/components/login-page"
import SignupPage from "@/components/signup-page"
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

export default function SupplyGenieApp() {
  const [currentView, setCurrentView] = useState<"landing" | "login" | "signup" | "chat">("landing")
  const [isAnimating, setIsAnimating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<UserType | null>(null)
  const [currentMessage, setCurrentMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginError, setLoginError] = useState<string | null>(null)
  const [signupName, setSignupName] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [signupError, setSignupError] = useState<string | null>(null)
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [search, setSearch] = useState("")
  const [isAssistantTyping, setIsAssistantTyping] = useState(false)

  const handleViewChange = (newView: "landing" | "login" | "signup" | "chat") => {
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentView(newView)
      setIsAnimating(false)
    }, 300)
  }

  const handleLogin = async () => {
    setLoginError(null)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword)
      const user = userCredential.user
      setUser({ name: user.displayName || user.email || "User", email: user.email || "", uid: user.uid })
      handleViewChange("chat")
    } catch (error: any) {
      setLoginError(error.message || "Login failed")
    }
  }

  const handleLogout = () => {
    setUser(null)
    handleViewChange("landing")
  }

  const handleSignup = async () => {
    setSignupError(null)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword)
      const user = userCredential.user
      if (signupName) {
        await updateProfile(user, { displayName: signupName })
      }
      setUser({ name: signupName || user.email || "User", email: user.email || "", uid: user.uid })
      handleViewChange("chat")
    } catch (error: any) {
      setSignupError(error.message || "Signup failed")
    }
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
      setIsAssistantTyping(false); // Hide typing indicator
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
    }, 2000); // Increased delay to show the typing indicator better
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          name: firebaseUser.displayName || firebaseUser.email || "User",
          email: firebaseUser.email || "",
          uid: firebaseUser.uid,
        })
        setCurrentView("chat")
      } else {
        setUser(null)
        setCurrentView("landing")
      }
      setIsLoading(false)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      fetch(`/api/chats?user_id=${user.uid}`)
        .then(res => res.json())
        .then(data => {
          // The backend returns: { chats: [ { chat_id, chat_name, messages: [ { order, sender, message } ] } ] }
          if (data.chats) {
            const loadedChats = data.chats.map((chat: any) => ({
              id: chat.chat_id,
              title: chat.chat_name,
              messages: (chat.messages || []).map((m: any) => ({
                id: `${chat.chat_id}_${m.order}`,
                type: m.sender === 'user' ? 'user' : (m.sender === 'bot' ? 'assistant' : m.sender),
                content: m.message,
                timestamp: new Date(), // Placeholder; replace with real timestamp if available
              }))
            }))
            setChats(loadedChats)
            // If no chat is active, set the first one as active
            if (!activeChat && loadedChats.length > 0) {
              setActiveChat(loadedChats[0].id)
            }
          }
        })
    }
  }, [user])

  useEffect(() => {
    const chat = chats.find(c => c.id === activeChat)
    setMessages(chat ? chat.messages : [])
  }, [activeChat, chats])

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          {/* Spinning loader */}
          <div className="w-12 h-12 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
          
          {/* Loading text */}
          <div className="text-gray-300 text-lg font-medium">
            Loading SupplyGenie...
          </div>
          
          {/* Optional: Pulsing dots */}
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    )
  }

  // Landing Page
  if (currentView === "landing") {
    return (
      <LandingPage
        user={user}
        onViewChange={handleViewChange}
        onLogout={handleLogout}
        isAnimating={isAnimating}
      />
    )
  }

  // Login Page
  if (currentView === "login") {
    return (
      <LoginPage
        loginEmail={loginEmail}
        loginPassword={loginPassword}
        loginError={loginError}
        isAnimating={isAnimating}
        onEmailChange={setLoginEmail}
        onPasswordChange={setLoginPassword}
        onLogin={handleLogin}
        onViewChange={handleViewChange}
      />
    )
  }

  // Signup Page
  if (currentView === "signup") {
    return (
      <SignupPage
        signupName={signupName}
        signupEmail={signupEmail}
        signupPassword={signupPassword}
        signupError={signupError}
        isAnimating={isAnimating}
        onNameChange={setSignupName}
        onEmailChange={setSignupEmail}
        onPasswordChange={setSignupPassword}
        onSignup={handleSignup}
        onViewChange={handleViewChange}
      />
    )
  }

  // Chat Interface
  if (currentView === "chat" && user) {
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

  return null
}
