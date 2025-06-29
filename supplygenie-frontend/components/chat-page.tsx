"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
  Clock,
  MapPin,
  Star,
  Mic,
  Phone,
  Globe,
  Building,
  Mail,
  LogOut,
} from "lucide-react"
import { useSpeechToText } from "@/hooks/useSpeechToText"

interface UserType {
  name: string
  email: string
  avatar?: string
  uid: string
}

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

interface ChatPageProps {
  user: UserType
  chats: Chat[]
  activeChat: string | null
  messages: Message[]
  currentMessage: string
  search: string
  isAssistantTyping: boolean
  renamingChatId: string | null
  renameValue: string
  onViewChange: (view: "landing" | "login" | "signup" | "chat") => void
  onLogout: () => void
  onChatSelect: (chatId: string) => void
  onCreateNewChat: () => void
  onSendMessage: () => void
  onMessageChange: (message: string) => void
  onSearchChange: (search: string) => void
  onStartRename: (chat: Chat) => void
  onRenameChange: (value: string) => void
  onRenameSave: (chatId: string) => void
  onRenameKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, chatId: string) => void
  setRenamingChatId: (id: string | null) => void
}

// Reusable style constants
const STYLE_CONSTANTS = {
  avatarBase: "w-10 h-10 bg-zinc-800 border border-zinc-700",
  dropdownBase: "bg-zinc-900 border-zinc-800",
}

// Typing indicator component
const TypingIndicator = () => (
  <div className="flex items-center space-x-1 px-2 py-1">
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  </div>
)

const UserAvatarDropdown = ({ user, onLogout }: { user: UserType; onLogout: () => void }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
        <Avatar className={STYLE_CONSTANTS.avatarBase}>
          <AvatarFallback className="text-xs text-white bg-zinc-800">
            {user.name.split(" ").map((n) => n[0]).join("") || "U"}
          </AvatarFallback>
        </Avatar>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className={`w-56 ${STYLE_CONSTANTS.dropdownBase}`}>
      <div className="px-2 py-1.5">
        <p className="text-sm font-medium text-white">{user.name}</p>
        <p className="text-xs text-zinc-400">{user.email}</p>
      </div>
      <DropdownMenuSeparator className="bg-zinc-800" />
      <DropdownMenuItem onClick={onLogout} className="text-zinc-300 hover:text-white hover:bg-zinc-800">
        <LogOut className="w-4 h-4 mr-2" />
        Sign out
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)

const LogoImage = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <img src="/logo.png" alt="SupplyGenie Logo" className={className} style={style} />
)

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

export default function ChatPage({
  user,
  chats,
  activeChat,
  messages,
  currentMessage,
  search,
  isAssistantTyping,
  renamingChatId,
  renameValue,
  onViewChange,
  onLogout,
  onChatSelect,
  onCreateNewChat,
  onSendMessage,
  onMessageChange,
  onSearchChange,
  onStartRename,
  onRenameChange,
  onRenameSave,
  onRenameKeyDown,
  setRenamingChatId,
}: ChatPageProps) {
  const renameInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const {
    isSupported: isSpeechSupported,
    isRecording,
    transcript,
    error: speechError,
    startListening,
    stopListening,
    setTranscript,
  } = useSpeechToText()

  // Update currentMessage when transcript changes (only if recording)
  useEffect(() => {
    if (isRecording) {
      onMessageChange(transcript)
    }
  }, [transcript, isRecording, onMessageChange])

  // Optionally clear transcript when message is sent
  useEffect(() => {
    if (!currentMessage && !isRecording) {
      setTranscript("")
    }
  }, [currentMessage, isRecording, setTranscript])

  // When recording ends and transcript is available, set it as the message and focus input
  useEffect(() => {
    if (!isRecording && transcript) {
      onMessageChange(transcript)
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }
  }, [isRecording, transcript, onMessageChange])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, activeChat, isAssistantTyping])

  useEffect(() => {
    if (renamingChatId && renameInputRef.current) {
      renameInputRef.current.focus()
    }
  }, [renamingChatId])

  // Filter chats for display:
  const filteredChats = chats.filter(chat => chat.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onViewChange('landing')}
            className="focus:outline-none"
            aria-label="Go to home page"
            type="button"
          >
            <LogoImage className="h-8 w-auto cursor-pointer" />
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <UserAvatarDropdown user={user} onLogout={onLogout} />
        </div>
      </header>
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-[340px] bg-zinc-900 border-r border-zinc-800 flex flex-col">
          <div className="flex items-center justify-between px-6 py-5">
            <h2 className="text-lg font-semibold">My Chats</h2>
            <div className="flex items-center space-x-2">
              <Button size="icon" className="bg-zinc-800 rounded-full p-0 w-8 h-8 flex items-center justify-center text-white" onClick={onCreateNewChat}>
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
                onChange={e => onSearchChange(e.target.value)}
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
                onClick={() => onChatSelect(chat.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {renamingChatId === chat.id ? (
                      <input
                        ref={renameInputRef}
                        value={renameValue}
                        onChange={(e) => onRenameChange(e.target.value)}
                        onBlur={() => onRenameSave(chat.id)}
                        onKeyDown={e => onRenameKeyDown(e, chat.id)}
                        className="font-medium text-sm truncate text-white bg-zinc-800 border border-zinc-700 rounded px-2 py-1 w-32 outline-none"
                        autoFocus
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <div className="flex items-center group/chat-title">
                        <span
                          className="font-medium text-sm truncate text-white group-hover:text-white cursor-pointer"
                          onClick={e => { e.stopPropagation(); onStartRename(chat); }}
                          title="Click to rename"
                        >
                          {chat.title}
                        </span>
                        <button
                          className="ml-1 opacity-0 group-hover/chat-title:opacity-100 text-zinc-400 hover:text-white transition"
                          onClick={e => { e.stopPropagation(); onStartRename(chat); }}
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
                                            <Mail className="w-3 h-3" />
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
                
                {/* Typing Indicator */}
                {isAssistantTyping && (
                  <div className="mb-6 flex justify-start">
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
                    <div className="flex flex-col items-start max-w-full">
                      <div className="rounded-2xl px-5 py-4 text-base shadow-lg transition-colors duration-150 bg-gradient-to-br from-zinc-800 to-zinc-900 text-white self-start border border-zinc-700 hover:shadow-black/20 hover:brightness-105">
                        <TypingIndicator />
                      </div>
                    </div>
                  </div>
                )}
                
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
                onChange={e => onMessageChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') onSendMessage() }}
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
              <Button size="icon" className="bg-zinc-800 rounded-lg p-0 w-12 h-12 flex items-center justify-center text-white" onClick={onSendMessage}>
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
