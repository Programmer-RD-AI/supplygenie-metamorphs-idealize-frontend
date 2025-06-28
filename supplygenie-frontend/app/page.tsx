"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Send,
  Plus, 
  MessageSquare,
  Menu,
  X,
  Zap,
  ExternalLink,
  Clock,
  MapPin,
  Star,
  ArrowRight,
  CheckCircle,
  User,
  Settings,
  LogOut,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Mic,
  Filter,
  ArrowUpDown,
  Phone,
  Globe,
  Mail as MailIcon,
  Building,
} from "lucide-react"
import { auth } from "@/lib/firebase"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, onAuthStateChanged, signOut } from "firebase/auth"
import { useSpeechToText } from "@/hooks/useSpeechToText"

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
  {
    id: "4",
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
  {
    id: "5",
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

const features = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: "AI-Powered Search",
    description: "Find suppliers instantly with intelligent matching algorithms",
  },
  {
    icon: <CheckCircle className="w-6 h-6" />,
    title: "Compliance Tracking",
    description: "Ensure all suppliers meet your regulatory requirements",
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: "Smart Conversations",
    description: "Refine your search through natural language interactions",
  },
]

export default function SupplyGenieApp() {
  const [currentView, setCurrentView] = useState<"landing" | "login" | "signup" | "chat">("landing")
  const [isAnimating, setIsAnimating] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [user, setUser] = useState<UserType | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
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
  const renameInputRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState("")
  const {
    isSupported: isSpeechSupported,
    isRecording,
    transcript,
    error: speechError,
    startListening,
    stopListening,
    setTranscript,
  } = useSpeechToText();
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    }, 1000);
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

  const renderFieldValue = (field: SupplierField) => {
    switch (field.type) {
      case "badge":
        return (
          <div className="flex flex-wrap gap-1">
            {field.value.split(",").map((item, index) => (
              <Badge key={index} variant="secondary" className="text-xs bg-zinc-800 text-zinc-300 border-zinc-700">
                {item.trim()}
              </Badge>
            ))}
          </div>
        )
      case "rating":
        return (
          <div className="flex items-center space-x-1">
            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
            <span className="text-sm font-medium">{field.value}</span>
          </div>
        )
      case "location":
        return (
          <div className="flex items-center space-x-1">
            <MapPin className="w-3 h-3 text-zinc-400" />
            <span className="text-sm">{field.value}</span>
          </div>
        )
      case "time":
        return (
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-zinc-400" />
            <span className="text-sm">{field.value}</span>
          </div>
        )
      case "price":
        return <span className="text-sm font-medium text-green-400">{field.value}</span>
      default:
        return <span className="text-sm">{field.value}</span>
    }
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          name: firebaseUser.displayName || firebaseUser.email || "User",
          email: firebaseUser.email || "",
          uid: firebaseUser.uid,
        })
      } else {
        setUser(null)
      }
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (renamingChatId && renameInputRef.current) {
      renameInputRef.current.focus()
    }
  }, [renamingChatId])

  const handleStartRename = (chat: Chat) => {
    setRenamingChatId(chat.id)
    setRenameValue(chat.title)
  }

  const handleRenameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRenameValue(e.target.value)
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

  // Filter chats for display:
  const filteredChats = chats.filter(chat => chat.title.toLowerCase().includes(search.toLowerCase()))

  // Update currentMessage when transcript changes (only if recording)
  useEffect(() => {
    if (isRecording) {
      setCurrentMessage(transcript);
    }
  }, [transcript, isRecording]);

  // Optionally clear transcript when message is sent
  useEffect(() => {
    if (!currentMessage && !isRecording) {
      setTranscript("");
    }
  }, [currentMessage, isRecording, setTranscript]);

  // When recording ends and transcript is available, set it as the message and focus input
  useEffect(() => {
    if (!isRecording && transcript) {
      setCurrentMessage(transcript);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [isRecording, transcript]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeChat]);

  // Landing Page
  if (currentView === "landing") {
    return (
      <div
        className={`min-h-screen bg-zinc-950 text-white transition-opacity duration-300 ${
          isAnimating ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* Header */}
        <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <img src="/logo.png" alt="SupplyGenie Logo" className="h-10 w-auto" />
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                      <Avatar className="w-10 h-10 bg-zinc-800 border border-zinc-700">
                        <AvatarFallback className="text-xs text-white bg-zinc-800">
                          {user.name.split(" ").map((n) => n[0]).join("") || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <p className="text-xs text-zinc-400">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem onClick={handleLogout} className="text-zinc-300 hover:text-white hover:bg-zinc-800">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => handleViewChange("login")}
                    className="text-zinc-300 hover:text-white"
                  >
                    Sign In
                  </Button>
                  <Button onClick={() => handleViewChange("signup")} className="bg-white text-black hover:bg-zinc-200">
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
            <div className="flex-1 space-y-8 text-center md:text-left">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                  Find Perfect Suppliers
                </h1>
                <p className="text-xl text-zinc-400 max-w-2xl leading-relaxed mx-auto md:mx-0">
                  AI-powered supply chain advisor that helps you discover, evaluate, and connect with suppliers based on your exact requirements.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Button
                  size="lg"
                  onClick={() => handleViewChange(user ? "chat" : "signup")}
                  className="bg-white text-black hover:bg-zinc-200 h-12 px-8"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
            <div className="flex-1 flex justify-center md:justify-end mt-12 md:mt-0">
              <img src="/home_page_image.png" alt="SupplyGenie Home" className="max-w-sm md:max-w-xl w-full rounded-2xl shadow-2xl" />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose SupplyGenie?</h2>
            <p className="text-zinc-400 text-lg">
              Streamline your supplier discovery process with intelligent automation
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center mx-auto text-white">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="text-zinc-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-12 text-center space-y-6">
              <h2 className="text-3xl font-bold text-white">Ready to Transform Your Supply Chain?</h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Join thousands of businesses already using SupplyGenie to find reliable suppliers faster than ever.
              </p>
              <Button
                size="lg"
                onClick={() => handleViewChange(user ? "chat" : "signup")}
                className="bg-white text-black hover:bg-zinc-200 h-12 px-8"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    )
  }

  // Login Page
  if (currentView === "login") {
    return (
      <div
        className={`min-h-screen bg-zinc-950 flex items-center justify-center p-4 transition-opacity duration-300 ${
          isAnimating ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="w-full max-w-6xl flex items-center justify-center">
          {/* Left side - Image */}
          <div className="hidden lg:flex lg:w-1/2 lg:pr-8">
            <img 
              src="/login_page.png" 
              alt="Login illustration" 
              className="w-full h-auto max-h-[600px] object-contain"
            />
          </div>
          
          {/* Right side - Login Form */}
          <div className="w-full lg:w-1/2 flex justify-center">
            <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto flex items-center justify-center" style={{ height: '48px' }}>
                   <img src="/logo.png" alt="SupplyGenie Logo" style={{ height: '48px', maxWidth: '100%', width: 'auto' }} />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-medium text-white">Welcome back</CardTitle>
                  <p className="text-sm text-zinc-400">Sign in to your SupplyGenie account</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <Input
                        placeholder="Email"
                        type="email"
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        className="h-11 pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <Input
                        placeholder="Password"
                        type={showPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        className="h-11 pl-10 pr-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 text-zinc-400 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                {loginError && <div className="text-red-500 text-sm text-center">{loginError}</div>}
                <Button
                  onClick={handleLogin}
                  className="w-full h-11 bg-white text-black hover:bg-zinc-200"
                >
                  Sign In
                </Button>
                <div className="text-center space-y-4">
                  <p className="text-sm text-zinc-400">
                    Don't have an account?{" "}
                    <button onClick={() => handleViewChange("signup")} className="text-white hover:underline font-medium">
                      Sign up
                    </button>
                  </p>
                  <button onClick={() => handleViewChange("landing")} className="text-sm text-zinc-500 hover:text-zinc-400">
                    ← Back to home
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Signup Page
  if (currentView === "signup") {
    return (
      <div
        className={`min-h-screen bg-zinc-950 flex items-center justify-center p-4 transition-opacity duration-300 ${
          isAnimating ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="w-full max-w-6xl flex items-center justify-center">
          {/* Left side - Signup Form */}
          <div className="w-full lg:w-1/2 flex justify-center">
            <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto flex items-center justify-center" style={{ height: '48px' }}>
                   <img src="/logo.png" alt="SupplyGenie Logo" style={{ height: '48px', maxWidth: '100%', width: 'auto' }} />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-medium text-white">Create your account</CardTitle>
                  <p className="text-sm text-zinc-400">Start finding suppliers with SupplyGenie</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <Input
                        placeholder="Full name"
                        value={signupName}
                        onChange={e => setSignupName(e.target.value)}
                        className="h-11 pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <Input
                        placeholder="Email"
                        type="email"
                        value={signupEmail}
                        onChange={e => setSignupEmail(e.target.value)}
                        className="h-11 pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <Input
                        placeholder="Password"
                        type={showPassword ? "text" : "password"}
                        value={signupPassword}
                        onChange={e => setSignupPassword(e.target.value)}
                        className="h-11 pl-10 pr-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 text-zinc-400 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                {signupError && <div className="text-red-500 text-sm text-center">{signupError}</div>}
                <Button
                  onClick={handleSignup}
                  className="w-full h-11 bg-white text-black hover:bg-zinc-200"
                >
                  Create Account
                </Button>
                <div className="text-center space-y-4">
                  <p className="text-sm text-zinc-400">
                    Already have an account?{" "}
                    <button onClick={() => handleViewChange("login")} className="text-white hover:underline font-medium">
                      Sign in
                    </button>
                  </p>
                  <button onClick={() => handleViewChange("landing")} className="text-sm text-zinc-500 hover:text-zinc-400">
                    ← Back to home
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right side - Image */}
          <div className="hidden lg:flex lg:w-1/2 lg:pl-8">
            <img 
              src="/create_acc_page.png" 
              alt="Create account illustration" 
              className="w-full h-auto max-h-[600px] object-contain"
            />
          </div>
        </div>
      </div>
    )
  }

  // Chat Interface
  if (currentView === "chat") {
    return (
      <div className="flex flex-col h-screen bg-zinc-950 text-white">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-4 bg-zinc-900 border-b border-zinc-800">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleViewChange('landing')}
              className="focus:outline-none"
              aria-label="Go to home page"
              type="button"
            >
              <img src="/logo.png" alt="SupplyGenie Logo" className="h-8 w-auto cursor-pointer" />
            </button>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                    <Avatar className="w-10 h-10 bg-zinc-800 border border-zinc-700">
                      <AvatarFallback className="text-xs text-white bg-zinc-800">
                        {user.name.split(" ").map((n) => n[0]).join("") || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <p className="text-xs text-zinc-400">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem onClick={handleLogout} className="text-zinc-300 hover:text-white hover:bg-zinc-800">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>
        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <aside className="w-[340px] bg-zinc-900 border-r border-zinc-800 flex flex-col">
            <div className="flex items-center justify-between px-6 py-5">
              <h2 className="text-lg font-semibold">My Chats</h2>
              <div className="flex items-center space-x-2">
                <Button size="icon" className="bg-zinc-800 rounded-full p-0 w-8 h-8 flex items-center justify-center text-white" onClick={createNewChat}>
                  <Plus className="w-4 h-4 text-white" />
                </Button>
              </div>
            </div>
            {/* Tabs */}
            <div className="flex items-center px-6 space-x-2 mb-3">
              <Button size="sm" className="bg-zinc-800 text-white rounded-full px-4 py-1 text-xs font-semibold">CHATS <span className="ml-2 bg-zinc-800 rounded px-2">{chats.length}</span></Button>
            </div>
            {/* Search and filter */}
            <div className="flex items-center px-6 mb-3 space-x-2">
              <div className="flex-1 relative">
                <input
                  className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 text-sm border-none outline-none placeholder-zinc-400"
                  placeholder="Search..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Button size="icon" className="bg-zinc-800 rounded-lg p-0 w-8 h-8 flex items-center justify-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </Button>
            </div>
            {/* Chat List */}
            <div className="flex-1 overflow-y-auto px-3 pb-4">
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`mb-2 rounded-xl px-3 py-3 cursor-pointer transition-colors ${activeChat === chat.id ? "bg-zinc-800" : "hover:bg-zinc-800/70"}`}
                  onClick={() => setActiveChat(chat.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {renamingChatId === chat.id ? (
                        <input
                          ref={renameInputRef}
                          value={renameValue}
                          onChange={handleRenameChange}
                          onBlur={() => handleRenameSave(chat.id)}
                          onKeyDown={e => handleRenameKeyDown(e, chat.id)}
                          className="font-medium text-sm truncate text-white bg-zinc-800 border border-zinc-700 rounded px-2 py-1 w-32 outline-none"
                          autoFocus
                          onClick={e => e.stopPropagation()}
                        />
                      ) : (
                        <div className="flex items-center group/chat-title">
                          <span
                            className="font-medium text-sm truncate text-white group-hover:text-white cursor-pointer"
                            onClick={e => { e.stopPropagation(); handleStartRename(chat); }}
                            title="Click to rename"
                          >
                            {chat.title}
                          </span>
                          <button
                            className="ml-1 opacity-0 group-hover/chat-title:opacity-100 text-zinc-400 hover:text-white transition"
                            onClick={e => { e.stopPropagation(); handleStartRename(chat); }}
                            tabIndex={-1}
                            title="Rename"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13h3l8-8a2.828 2.828 0 10-4-4l-8 8v3zm0 0v3h3" /></svg>
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-zinc-400">{chat.messages.length} messages</span>
                  </div>
                </div>
              ))}
            </div>
          </aside>
          {/* Main Chat Area */}
          <main className="flex-1 flex flex-col bg-zinc-950">
            {/* Chat Title Bar */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-800">
              <h1 className="text-xl font-semibold">{chats.find(c => c.id === activeChat)?.title || "Select a chat"}</h1>
            </div>
            {/* Messages Area */}
            <div className="flex-1 flex flex-col px-8 py-6 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-zinc-400">
                  No messages yet.
                </div>
              ) : (
                <>
                  {messages.map((message, idx) => (
                    <div
                      key={`${message.id}_${message.type}_${message.timestamp?.toString() || ''}_${idx}`}
                      className={`mb-6 flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.type !== 'user' && (
                        <div className="flex-shrink-0 mr-3 flex items-start">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center border border-zinc-700 shadow-md">
                            {/* AI Robot Icon */}
                            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path 
                                d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" 
                                fill="currentColor"
                              />
                              <circle cx="9" cy="12" r="1" fill="currentColor"/>
                              <circle cx="15" cy="12" r="1" fill="currentColor"/>
                              <path 
                                d="M8 19C8 17.5 9.5 16 12 16C14.5 16 16 17.5 16 19" 
                                stroke="currentColor" 
                                strokeWidth="1.5" 
                                strokeLinecap="round"
                                fill="none"
                              />
                              <rect 
                                x="6" 
                                y="8" 
                                width="12" 
                                height="8" 
                                rx="4" 
                                stroke="currentColor" 
                                strokeWidth="1.5"
                                fill="none"
                              />
                              <path 
                                d="M9 8V6C9 5.5 9.5 5 10 5H14C14.5 5 15 5.5 15 6V8" 
                                stroke="currentColor" 
                                strokeWidth="1.5"
                                fill="none"
                              />
                            </svg>
                          </div>
                        </div>
                      )}
                      <div className={`flex flex-col ${message.type === 'user' ? 'items-end max-w-xl' : 'items-start max-w-full'}`}>
                        <div
                          className={`rounded-2xl px-5 py-4 text-base shadow-lg transition-colors duration-150 ${
                            message.type === 'user'
                              ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white self-end border border-blue-700 hover:shadow-blue-700/30'
                              : 'bg-gradient-to-br from-zinc-800 to-zinc-900 text-white self-start border border-zinc-700 hover:shadow-black/20'
                          } hover:brightness-105`}
                        >
                          {message.content}
                        </div>
                        
                        {/* Supplier Results Section */}
                        {message.suppliers && message.suppliers.length > 0 && (
                          <div className="mt-4 w-full max-w-5xl">
                            {/* Header */}
                            <div className="flex items-center gap-3 mb-6">
                              <div className="p-2 bg-zinc-800 rounded-lg">
                                <Building className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h3 className="text-xl font-semibold text-white">Top Supplier Matches</h3>
                                <p className="text-sm text-zinc-400">Found {message.suppliers.length} suppliers matching your criteria</p>
                              </div>
                            </div>
                            
                            {/* Supplier Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                              {message.suppliers.map((supplier) => (
                                <Card
                                  key={supplier.id}
                                  className="bg-zinc-900 border-zinc-700 hover:border-zinc-600 transition-all duration-200 hover:shadow-lg"
                                >
                                  <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <CardTitle className="text-base font-semibold text-white mb-1 leading-tight">
                                          {supplier.name}
                                        </CardTitle>
                                        {supplier.fields.find(f => f.label === "Location") && (
                                          <div className="flex items-center gap-1 text-sm text-zinc-400">
                                            <MapPin className="w-3 h-3" />
                                            <span>{supplier.fields.find(f => f.label === "Location")?.value}</span>
                                          </div>
                                        )}
                                      </div>
                                      {supplier.fields.find(f => f.label === "Rating") && (
                                        <div className="flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded-lg">
                                          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                          <span className="text-sm font-medium text-white">
                                            {supplier.fields.find(f => f.label === "Rating")?.value}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </CardHeader>
                                  <CardContent className="space-y-3 pt-0">
                                    {/* Price Range */}
                                    {supplier.fields.find(f => f.label === "Price Range") && (
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm text-zinc-400">Price Range</span>
                                        <span className="text-sm font-medium text-green-400">
                                          {supplier.fields.find(f => f.label === "Price Range")?.value}
                                        </span>
                                      </div>
                                    )}
                                    
                                    {/* Lead Time */}
                                    {supplier.fields.find(f => f.label === "Lead Time") && (
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm text-zinc-400">Lead Time</span>
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-3 h-3 text-zinc-400" />
                                          <span className="text-sm text-white">
                                            {supplier.fields.find(f => f.label === "Lead Time")?.value}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Response Time */}
                                    {supplier.fields.find(f => f.label === "Response Time") && (
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm text-zinc-400">Response Time</span>
                                        <span className="text-sm text-white">
                                          {supplier.fields.find(f => f.label === "Response Time")?.value}
                                        </span>
                                      </div>
                                    )}
                                    
                                    {/* MOQ */}
                                    {supplier.fields.find(f => f.label === "MOQ") && (
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm text-zinc-400">MOQ</span>
                                        <span className="text-sm text-white">
                                          {supplier.fields.find(f => f.label === "MOQ")?.value}
                                        </span>
                                      </div>
                                    )}
                                    
                                    {/* Certifications */}
                                    {supplier.fields.find(f => f.label === "Certifications") && (
                                      <div className="space-y-2">
                                        <span className="text-sm text-zinc-400">Supplier Certifications</span>
                                        <div className="flex flex-wrap gap-1">
                                          {supplier.fields.find(f => f.label === "Certifications")?.value.split(",").map((cert, idx) => (
                                            <Badge
                                              key={idx}
                                              variant="secondary"
                                              className="text-xs bg-zinc-800 text-zinc-300 border-zinc-700 px-2 py-1"
                                            >
                                              {cert.trim()}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Specialties */}
                                    {supplier.fields.find(f => f.label === "Specialties") && (
                                      <div className="space-y-2">
                                        <span className="text-sm text-zinc-400">Specialties</span>
                                        <div className="flex flex-wrap gap-1">
                                          {supplier.fields.find(f => f.label === "Specialties")?.value.split(",").map((specialty, idx) => (
                                            <Badge
                                              key={idx}
                                              variant="secondary"
                                              className="text-xs bg-zinc-800 text-white border-zinc-700 px-2 py-1"
                                            >
                                              {specialty.trim()}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Contact Details Section */}
                                    <div className="pt-2 border-t border-zinc-700">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-zinc-400">Contact Details</span>
                                        {supplier.fields.find(f => f.label === "Contact Details")?.value === "Not Provided" ? (
                                          <span className="text-xs text-zinc-400">Not Provided</span>
                                        ) : (
                                          <div className="flex gap-1">
                                            <Button size="sm" variant="ghost" className="p-1 h-6 w-6 text-zinc-400 hover:text-white">
                                              <Phone className="w-3 h-3" />
                                            </Button>
                                            <Button size="sm" variant="ghost" className="p-1 h-6 w-6 text-zinc-400 hover:text-white">
                                              <MailIcon className="w-3 h-3" />
                                            </Button>
                                            <Button size="sm" variant="ghost" className="p-1 h-6 w-6 text-zinc-400 hover:text-white">
                                              <Globe className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <span className="mt-2 text-xs text-zinc-400 font-medium">
                          {message.timestamp instanceof Date ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      {message.type === 'user' && (
                        <div className="flex-shrink-0 ml-3 flex items-end">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base border border-zinc-700 shadow-md">
                            {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
            {/* Input Bar */}
            <div className="px-8 py-6 border-t border-zinc-800 bg-zinc-900">
              <div className="flex items-center space-x-3">
                <input
                  ref={inputRef}
                  className="flex-1 h-12 bg-zinc-800 border-none rounded-lg px-4 text-white placeholder-zinc-400 outline-none"
                  placeholder="Ask questions, or type '/' for commands"
                  value={currentMessage}
                  onChange={e => setCurrentMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSendMessage() }}
                />
                <Button
                  size="icon"
                  className={`bg-zinc-800 rounded-lg p-0 w-12 h-12 flex items-center justify-center text-white ${isRecording ? 'animate-pulse bg-blue-700' : ''}`}
                  onClick={isRecording ? stopListening : startListening}
                  type="button"
                  title={isRecording ? "Stop recording" : "Start voice input"}
                  disabled={!isSpeechSupported}
                >
                  <Mic className={`w-5 h-5 ${isRecording ? 'text-blue-400' : 'text-white'}`} />
                </Button>
                <Button size="icon" className="bg-zinc-800 rounded-lg p-0 w-12 h-12 flex items-center justify-center text-white" onClick={handleSendMessage}>
                  <Send className="w-5 h-5 text-white" />
                </Button>
              </div>
              {!isSpeechSupported && (
                <div className="text-xs text-red-400 mt-2">Voice input is not supported in this browser.</div>
              )}
              {speechError && (
                <div className="text-xs text-red-400 mt-2">{speechError}</div>
              )}
            </div>
          </main>
        </div>
      </div>
    )
  }

  return null
}

function formatChatTimestamp(date: Date) {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 1000 * 60 * 1) return "Now"
  if (diff < 1000 * 60 * 60 * 24) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diff < 1000 * 60 * 60 * 24 * 7) return date.toLocaleDateString([], { weekday: 'short' })
  return date.toLocaleDateString([], { day: '2-digit', month: 'short' })
}
