"use client";

import AdminSidebar from "@/components/AdminSidebar";
import { useSession } from "@/store/useSession";
import { Bot, ChevronLeft, ChevronRight, Send, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ChatPage() {
  const router = useRouter();
  const { user, fetchUser, logout } = useSession();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const init = async () => {
      await fetchUser();
      setAuthChecked(true);
    };
    init();
  }, [fetchUser]);

  useEffect(() => {
    if (!authChecked) return;
    if (!user) {
      router.push("/auth/login");
      return;
    }
  }, [authChecked, user, router]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          history: messages,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "Sorry, I encountered an error. Please try again.",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: data.reply },
        ]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!authChecked || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onLogout={async () => {
          await logout();
          router.push("/auth/login");
        }}
      />

      <div
        className={`transition-all duration-200 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}`}
      >
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-10">
          <header className="glass rounded-3xl px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed((v) => !v)}
                  className="rounded-2xl border border-slate-200 bg-white/70 p-2 text-slate-700 hover:border-emerald-400 hover:text-emerald-600 lg:inline-flex dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
                  aria-label="Toggle sidebar"
                  title="Toggle sidebar"
                >
                  {sidebarCollapsed ? (
                    <ChevronRight size={20} />
                  ) : (
                    <ChevronLeft size={20} />
                  )}
                </button>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-600">
                    AI Assistant
                  </p>
                  <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    Patient Data Assistant
                  </h1>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Ask questions about patient assessments, malnutrition data,
                    or mental health statistics.
                  </p>
                </div>
              </div>
            </div>
          </header>

          <div className="glass rounded-3xl p-6">
            <div className="h-[70vh] flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.length === 0 && (
                  <div className="text-center text-slate-500 dark:text-slate-400 mt-16">
                    <Bot className="w-20 h-20 mx-auto mb-6 opacity-60 text-emerald-600" />
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      Start a conversation
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-6">
                      Ask me anything about patient data and assessments
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                      <div className="glass rounded-xl p-4 text-left hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors cursor-pointer">
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          How many patients are in the database?
                        </p>
                      </div>
                      <div className="glass rounded-xl p-4 text-left hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors cursor-pointer">
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          Show me patients aged 5-10 years
                        </p>
                      </div>
                      <div className="glass rounded-xl p-4 text-left hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors cursor-pointer">
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          What are the mental health statistics?
                        </p>
                      </div>
                      <div className="glass rounded-xl p-4 text-left hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors cursor-pointer">
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          Get assessments from a specific camp
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] p-4 rounded-2xl ${
                        message.role === "user"
                          ? "bg-emerald-600 text-white"
                          : "glass text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {message.text}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="glass p-4 rounded-2xl">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-emerald-600 rounded-full animate-bounce"></div>
                        <div
                          className="w-3 h-3 bg-emerald-600 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-3 h-3 bg-emerald-600 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <div className="flex gap-3">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about patient data..."
                    className="flex-1 p-4 glass rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400"
                    rows={1}
                    disabled={isLoading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isLoading || !input.trim()}
                    className="px-6 py-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 font-medium"
                  >
                    <Send className="w-5 h-5" />
                    {!sidebarCollapsed && <span>Send</span>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
