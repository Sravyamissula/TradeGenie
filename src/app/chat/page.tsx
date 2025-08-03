"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MessageSquare,
  Send,
  Mic,
  MicOff,
  Download,
  Copy,
  Check,
  Languages,
  Bot,
  User,
  Sparkles,
  Loader2,
  Paperclip,
  MoreVertical,
  Moon,
  Sun,
  RefreshCw,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  category?: "tariff" | "risk" | "general" | "market" | "compliance";
}

const languageOptions = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
];

export default function ChatPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history and initialize welcome message
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        if (isAuthenticated && user) {
          const token = localStorage.getItem('authToken');
          if (token) {
            const response = await fetch('/api/chat', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.messages && data.messages.length > 0) {
                const formattedMessages = data.messages.reverse().map((msg: any) => ({
                  id: msg.id,
                  type: msg.type,
                  content: msg.content,
                  timestamp: new Date(msg.createdAt),
                  category: 'general'
                }));
                setMessages(formattedMessages);
                setIsLoadingHistory(false);
                return;
              }
            }
          }
        }
        
        // Default welcome message
        setMessages([
          {
            id: "welcome",
            type: "assistant",
            content: isAuthenticated 
              ? `🌟 Welcome back, ${user?.name || 'there'}! I'm TradeGenie AI, your advanced trade assistant with access to 200+ products and 150+ countries. I can help you with:\n\n📊 **Real-Time Trade Data** - Live import/export activity and market insights\n📈 **Market Summary** - Global trade statistics and trending commodities\n🔍 **Tariff Analysis** - Get accurate tariff rates for any product-country combination\n⚠️ **Risk Assessment** - Comprehensive export risk analysis\n🎯 **Market Intelligence** - Profitable product recommendations\n📋 **Document Generation** - Trade document assistance\n🌍 **Compliance** - Regulatory requirements\n\n**Try asking:**\n• \"Show me real-time trade data\"\n• \"Give me a market summary\"\n• \"What's the tariff for exporting tea from India to USA?\"\n\nHow can I assist you today?`
              : `🌟 Welcome to TradeGenie AI! I'm your advanced trade assistant with access to 200+ products and 150+ countries. \n\n**Sign in to unlock full features:**\n• Personalized chat history\n• Custom trade recommendations\n• Document generation\n• Advanced analytics\n\n**Or continue as a guest to try:**\n• \"Show me real-time trade data\"\n• \"What's the tariff for exporting tea from India to USA?\"\n• \"Give me a market summary\"\n\nHow can I help you today?`,
            timestamp: new Date(),
            category: "general",
          },
        ]);
        setIsLoadingHistory(false);
      } catch (error) {
        console.error('Error loading chat history:', error);
        setIsLoadingHistory(false);
      }
    };

    if (!authLoading) {
      loadChatHistory();
    }
  }, [isAuthenticated, user, authLoading]);

  const generateAIResponse = async (userInput: string): Promise<string> => {
    // This would integrate with your existing AI response logic
    try {
      if (isAuthenticated) {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            message: userInput,
            language: selectedLanguage
          })
        });

        if (response.ok) {
          const data = await response.json();
          return data.message;
        }
      }
      
      // Fallback for non-authenticated users
      return `I can help you with trade information! For the best experience with personalized recommendations and chat history, please sign in. \n\nTry asking:\n• "What's the tariff for exporting tea from India to USA?"\n• "Show me real-time trade data"\n• "Give me a market summary"`;
    } catch (error) {
      return "I apologize, but I encountered an error while processing your request. Please try again.";
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const aiResponse = await generateAIResponse(content);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: aiResponse,
        timestamp: new Date(),
        category: "general",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "I apologize, but I encountered an error while processing your request. Please try again.",
        timestamp: new Date(),
        category: "general",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceInput = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setInputMessage("What is the tariff for exporting tea from India to USA?");
      }, 2000);
    }
  };

  const handleCopyMessage = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleDownloadChat = () => {
    const chatContent = messages
      .map(
        (msg) =>
          `${
            msg.type === "user" ? user?.name || "You" : "TradeGenie"
          } (${msg.timestamp.toLocaleString()}):\n${msg.content}\n\n`
      )
      .join("");

    const blob = new Blob([chatContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trade-genie-chat-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (authLoading || isLoadingHistory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                TradeGenie AI
              </h1>
              <p className="text-muted-foreground text-sm">
                Your AI Trade Assistant • Real-time Intelligence
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2">
                    <Languages className="w-4 h-4 text-primary" />
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languageOptions.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            <span className="mr-2">{lang.flag}</span>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Change language</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadChat}
                    className="text-primary border-primary hover:bg-primary/10"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export chat</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </motion.div>

        {/* Chat Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="border-border shadow-xl h-[calc(100vh-12rem)] flex flex-col bg-card/50 backdrop-blur-sm">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-foreground flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-primary" />
                  Conversation
                  {isAuthenticated && (
                    <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">
                      <User className="w-3 h-3 mr-1" />
                      Signed In
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI Powered
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Live Data
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 relative">
              <ScrollArea className="h-full p-6">
                <div className="space-y-6">
                  <AnimatePresence>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex ${
                          message.type === "user" ? "justify-end" : "justify-start"
                        } group`}
                      >
                        <div
                          className={`max-w-[85%] flex ${
                            message.type === "user" ? "flex-row-reverse" : "flex-row"
                          } items-start space-x-3 ${
                            message.type === "user" ? "space-x-reverse" : ""
                          }`}
                        >
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            {message.type === "user" ? (
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={user?.avatar} alt={user?.name || "User"} />
                                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                  {user ? getInitials(user.name) : "U"}
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center">
                                <Bot className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>

                          {/* Message Content */}
                          <div
                            className={`rounded-2xl p-4 shadow-sm ${
                              message.type === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted/50 text-foreground border border-border"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs opacity-70 font-medium">
                                {message.type === "user"
                                  ? user?.name || "You"
                                  : "TradeGenie AI"}
                              </span>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs opacity-50">
                                  {formatTime(message.timestamp)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-70 hover:opacity-100 transition-opacity"
                                  onClick={() => handleCopyMessage(message.id, message.content)}
                                >
                                  {copiedMessageId === message.id ? (
                                    <Check className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <div className="text-sm leading-relaxed">
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                className="prose prose-sm max-w-none dark:prose-invert"
                              >
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex justify-start"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                          <div className="bg-muted/50 rounded-2xl p-4 border border-border">
                            <div className="flex items-center space-x-2">
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                              <span className="text-sm text-muted-foreground">
                                TradeGenie AI is thinking...
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>

            {/* Input Area */}
            <div className="border-t border-border p-4 bg-card/80 backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleVoiceInput}
                        className={`p-3 ${
                          isRecording ? "bg-red-100 text-red-600 border-red-300 dark:bg-red-900/20" : ""
                        }`}
                      >
                        {isRecording ? (
                          <MicOff className="w-4 h-4" />
                        ) : (
                          <Mic className="w-4 h-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isRecording ? "Stop recording" : "Voice input"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="flex-1 relative">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={
                      isAuthenticated 
                        ? "Ask about tariffs, risks, markets, or compliance..."
                        : "Try asking about trade data (sign in for personalized features)..."
                    }
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(inputMessage);
                      }
                    }}
                    className="pr-12 bg-background/50"
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-8 w-8"
                        >
                          <Paperclip className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Attach file (coming soon)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <Button
                  onClick={() => handleSendMessage(inputMessage)}
                  disabled={!inputMessage.trim() || isTyping}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground p-3"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
