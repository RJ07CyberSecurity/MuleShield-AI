"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Bot, User, Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface SentinelAIChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SentinelAIChat({ isOpen, onClose }: SentinelAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "assistant",
      content: "Hello. I am Sentinel AI. How can I assist you with MuleShield APIs or alert rules today?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    // Mock AI response
    setTimeout(() => {
      const q = inputValue.toLowerCase();
      let responseText = "I can help with MuleShield operations. Could you provide more details about the alert or API endpoint you are investigating?";
      
      if (q.includes("latency") || q.includes("slow") || q.includes("performance") || q.includes("mblenode-x")) {
         responseText = "The API latency on MuleNode-X is currently being investigated. It appears to be related to a high volume of concurrent graph traversals. We recommend implementing pagination on your `/api/v1/network` requests.";
      } else if (q.includes("false positive") || q.includes("crypto") || q.includes("mixer")) {
         responseText = "For Crypto-Mixer false positives (like ticket #MST-8794), we suggest adjusting the risk threshold on rule R4_CRYPTO_MIX from 70 to 85 in your detection settings.";
      } else if (q.includes("rule") || q.includes("r1_") || q.includes("threshold")) {
         responseText = "Alert rule R1_HIGH_TXN_FREQ triggers when a single account executes more than 10 transactions in a 1-hour window. You can modify this threshold in the Rules Engine dashboard.";
      } else if (q.includes("ingest") || q.includes("upload") || q.includes("csv") || q.includes("data")) {
         responseText = "To integrate with the ingestion service, use the `/api/v1/ingestion` endpoint with a standard CSV formatted dataset. Ensure your CSV has 'account_id', 'amount', and 'timestamp' columns.";
      } else if (q.includes("export") || q.includes("batch") || q.includes("error")) {
         responseText = "Batch Analysis Export errors (like #MST-8700) were resolved in the v2.4 patch. Please ensure your instance is fully updated.";
      } else if (q.includes("hello") || q.includes("hi") || q.includes("hey")) {
         responseText = "Hello! I'm here to help you resolve platform issues and optimize your AML detection rules. What are you working on?";
      }
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseText,
      };
      
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-surface-container-low border border-primary/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[100%]"
          >
            {/* Header */}
            <div className="p-4 bg-surface-container-highest border-b border-outline-variant/30 flex justify-between items-center relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/5" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="p-2 rounded-full bg-primary/20 text-primary border border-primary/30">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface text-sm">Sentinel AI Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-risk-low animate-pulse" />
                    <span className="text-[10px] text-on-surface-variant font-label-mono">ONLINE - SECURE SESSION</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest transition-colors relative z-10"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#07090e] min-h-0">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${
                      msg.role === "user"
                        ? "bg-secondary-container text-on-secondary-container border-outline-variant/30"
                        : "bg-surface-container-highest text-primary border-primary/30"
                    }`}
                  >
                    {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-on-primary rounded-tr-none"
                        : "bg-surface-container-low border border-outline-variant/20 text-on-surface rounded-tl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-container-highest text-primary border border-primary/30 flex items-center justify-center">
                    <Bot size={14} />
                  </div>
                  <div className="bg-surface-container-low border border-outline-variant/20 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/30">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask a technical question..."
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-3 pl-4 pr-12 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isTyping}
                  className="absolute right-2 p-1.5 bg-primary text-on-primary rounded-lg hover:bg-primary-fixed disabled:opacity-50 disabled:hover:bg-primary transition-all"
                >
                  {isTyping ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
              <div className="text-center mt-2">
                <span className="text-[9px] text-on-surface-variant font-label-mono uppercase tracking-wider">
                  Responses are generated by AI. Verify critical information.
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
