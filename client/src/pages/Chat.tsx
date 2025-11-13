import { useAuth } from "@/_core/hooks/useAuth";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Button } from "@/components/ui/button";
import { APP_TITLE } from "@/const";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, MessageCircle, Moon, Sparkles, Sun } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Chat() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [chatMessages, setChatMessages] = useState<Message[]>([]);

  const chatMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: (data) => {
      setChatMessages(prev => [...prev, { role: "assistant" as const, content: data.message }]);
    },
    onError: (error) => {
      toast.error(`Chat error: ${error.message}`);
    }
  });

  const handleSendMessage = (content: string) => {
    const userMessage: Message = { role: "user", content };
    setChatMessages(prev => [...prev, userMessage]);
    
    chatMutation.mutate({
      message: content,
      conversationHistory: chatMessages.filter(m => m.role !== "system").map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content
      }))
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-yellow-500">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">
                AI Chat Assistant
              </h1>
              <p className="text-xs text-muted-foreground">Powered by {APP_TITLE}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user?.name || "User"}
            </span>
            <Button onClick={toggleTheme} variant="ghost" size="icon">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col container mx-auto p-4 max-w-4xl">
        <div className="flex-1 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-amber-200 dark:border-amber-800 overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-amber-500 to-yellow-500 p-6 text-white">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">Chat with AI</h2>
                <p className="text-amber-100 mt-1">
                  Ask me anything! I can help with prompts, creative ideas, or just have a conversation.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <AIChatBox
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              isLoading={chatMutation.isPending}
              placeholder="Type your message here..."
              height="100%"
            />
          </div>
        </div>
      </main>

      <footer className="border-t bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm py-6">
        <div className="container text-center text-sm text-muted-foreground">
          Built with ❤️
        </div>
      </footer>
    </div>
  );
}
