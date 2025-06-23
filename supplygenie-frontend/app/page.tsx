"use client"

import { useState } from "react"
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
} from "lucide-react"
import { auth } from "@/lib/firebase"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth"

interface SupplierField {
  label: string
  value: string
  type: "text" | "badge" | "rating" | "price" | "location" | "time"
}

interface Message {
  id: string
  type: "user" | "assistant" | "results"
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
  lastMessage: string
  timestamp: Date
}

interface UserType {
  name: string
  email: string
  avatar?: string
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
  const [chats, setChats] = useState<Chat[]>([
    {
      id: "1",
      title: "Electronics Suppliers in Asia",
      lastMessage: "Found 10 suppliers matching your criteria",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      id: "2",
      title: "Sustainable Packaging Options",
      lastMessage: "What about compliance requirements?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    {
      id: "3",
      title: "Automotive Parts - Germany",
      lastMessage: "Checking lead times for Q2 production",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
  ])
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginError, setLoginError] = useState<string | null>(null)
  const [signupName, setSignupName] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [signupError, setSignupError] = useState<string | null>(null)

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
      setUser({ name: user.displayName || user.email || "User", email: user.email || "" })
      handleViewChange("chat")
    } catch (error: any) {
      setLoginError(error.message || "Login failed")
    }
  }

  const handleLogout = () => {
    setUser(null)
    handleViewChange("landing")
  }

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: currentMessage,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])

    // Simulate AI response with supplier results
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "results",
        content: `I found ${mockSuppliers.length} suppliers that match your criteria. Here are the top results:`,
        timestamp: new Date(),
        suppliers: mockSuppliers,
      }
      setMessages((prev) => [...prev, assistantMessage])
    }, 1000)

    setCurrentMessage("")
  }

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Supplier Search",
      lastMessage: "Start your search...",
      timestamp: new Date(),
    }
    setChats((prev) => [newChat, ...prev])
    setActiveChat(newChat.id)
    setMessages([])
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
      setUser({ name: signupName || user.email || "User", email: user.email || "" })
      handleViewChange("chat")
    } catch (error: any) {
      setSignupError(error.message || "Signup failed")
    }
  }

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
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-black" />
              </div>
              <span className="font-semibold text-xl">SupplyGenie</span>
            </div>
            <div className="flex items-center space-x-4">
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
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                Find Perfect Suppliers
              </h1>
              <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                AI-powered supply chain advisor that helps you discover, evaluate, and connect with suppliers based on
                your exact requirements.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => handleViewChange("signup")}
                className="bg-white text-black hover:bg-zinc-200 h-12 px-8"
              >
                Start Finding Suppliers
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleViewChange("login")}
                className="border-zinc-700 text-white hover:bg-zinc-900 h-12 px-8"
              >
                Sign In
              </Button>
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
                onClick={() => handleViewChange("signup")}
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
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-white rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-black" />
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
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-white rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-black" />
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
    )
  }

  // Chat Interface
  return (
    <div
      className={`flex h-screen bg-zinc-950 text-white transition-opacity duration-300 ${
        isAnimating ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-80" : "w-0"
        } transition-all duration-200 overflow-hidden border-r border-zinc-800 bg-zinc-950 flex flex-col`}
      >
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-black" />
              </div>
              <span className="font-medium text-lg">SupplyGenie</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                  <Avatar className="w-6 h-6 bg-zinc-800 border border-zinc-700">
                    <AvatarFallback className="text-xs text-white bg-zinc-800">
                      {user?.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("") || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-zinc-400">{user?.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem className="text-zinc-300 hover:text-white hover:bg-zinc-800">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-zinc-300 hover:text-white hover:bg-zinc-800">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button onClick={createNewChat} className="w-full bg-white text-black hover:bg-zinc-200">
            <Plus className="w-4 h-4 mr-2" />
            New chat
          </Button>
        </div>

        <ScrollArea className="flex-1 p-3">
          <div className="space-y-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 group ${
                  activeChat === chat.id ? "bg-zinc-800 border border-zinc-700" : "hover:bg-zinc-900/50"
                }`}
                onClick={() => setActiveChat(chat.id)}
              >
                <div className="flex items-start space-x-3">
                  <MessageSquare className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0 group-hover:text-zinc-400" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate text-white group-hover:text-white">{chat.title}</p>
                    <p className="text-xs text-zinc-500 truncate mt-1 group-hover:text-zinc-400">{chat.lastMessage}</p>
                    <p className="text-xs text-zinc-600 mt-1">{chat.timestamp.toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-zinc-800 p-4 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-zinc-400 hover:text-white"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
            <h1 className="font-medium text-white">
              {activeChat ? chats.find((c) => c.id === activeChat)?.title || "Supplier Search" : "SupplyGenie"}
            </h1>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-8">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-medium mb-4 text-white">How can I help you today?</h2>
              <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
                Find suppliers based on your specific requirements. I can help you search by price, location, compliance
                standards, lead times, and much more.
              </p>
            </div>
          ) : (
            <div className="space-y-8 max-w-4xl mx-auto">
              {messages.map((message) => (
                <div key={message.id} className="space-y-6">
                  {message.type === "user" ? (
                    <div className="flex justify-end">
                      <div className="bg-white text-black rounded-2xl px-4 py-3 max-w-2xl">
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-start">
                      <div className="flex space-x-4 max-w-full">
                        <Avatar className="w-8 h-8 bg-zinc-800 border border-zinc-700">
                          <AvatarFallback className="text-xs text-white bg-zinc-800">SG</AvatarFallback>
                        </Avatar>
                        <div className="space-y-6 flex-1">
                          <div className="bg-zinc-900 rounded-2xl px-4 py-3 border border-zinc-800">
                            <p className="text-sm text-white">{message.content}</p>
                          </div>

                          {message.suppliers && (
                            <div className="space-y-4">
                              {message.suppliers.map((supplier) => (
                                <div
                                  key={supplier.id}
                                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors"
                                >
                                  <div className="flex items-start justify-between mb-4">
                                    <h3 className="font-semibold text-lg text-white">{supplier.name}</h3>
                                    <Button size="sm" className="bg-white text-black hover:bg-zinc-200">
                                      <ExternalLink className="w-3 h-3 mr-1" />
                                      Contact
                                    </Button>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {supplier.fields.map((field, index) => (
                                      <div key={index} className="space-y-1">
                                        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                                          {field.label}
                                        </p>
                                        <div className="text-white">{renderFieldValue(field)}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-zinc-800 p-6 bg-zinc-950">
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-3">
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Message SupplyGenie..."
                className="flex-1 h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-600"
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!currentMessage.trim()}
                size="sm"
                className="h-12 w-12 p-0 bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
