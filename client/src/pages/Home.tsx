import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { Download, Lightbulb, LogOut, MessageCircle, Moon, Sparkles, Sun, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AIChatBox, type Message } from "@/components/AIChatBox";

const PROMPT_TEMPLATES = [
  "A serene mountain landscape at sunset with a lake",
  "A futuristic city skyline at night with neon lights",
  "A cozy coffee shop interior with warm lighting",
  "A magical forest with glowing mushrooms and fireflies",
  "An underwater scene with colorful coral reefs",
  "A steampunk airship floating above clouds",
];

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [prompt, setPrompt] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);

  const utils = trpc.useUtils();

  const chatMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: (data) => {
      setChatMessages(prev => [...prev, { role: "assistant" as const, content: data.message }]);
    },
    onError: (error) => {
      toast.error(`Chat error: ${error.message}`);
    }
  });

  const handleSendChatMessage = (content: string) => {
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

  const enhanceMutation = trpc.images.enhancePrompt.useMutation({
    onSuccess: (data) => {
      setPrompt(data.enhancedPrompt);
      toast.success("Prompt enhanced!");
    },
    onError: (error) => {
      toast.error(`Failed to enhance prompt: ${error.message}`);
    },
  });

  const generateMutation = trpc.images.generate.useMutation({
    onSuccess: (data) => {
      setGeneratedImageUrl(data.imageUrl || null);
      toast.success("Image generated successfully!");
      utils.images.getHistory.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to generate image: ${error.message}`);
    },
  });

  const { data: imageHistory } = trpc.images.getHistory.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setGeneratedImageUrl(null);
    generateMutation.mutate({ prompt: prompt.trim() });
  };

  const handleTemplateClick = (template: string) => {
    setPrompt(template);
    setShowTemplates(false);
    toast.success("Template applied!");
  };

  const handleEnhancePrompt = () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt first");
      return;
    }
    enhanceMutation.mutate({ prompt: prompt.trim() });
  };

  const handleDownload = async (imageUrl: string, promptText: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${promptText.slice(0, 30).replace(/[^a-z0-9]/gi, "_")}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Image downloaded!");
    } catch (error) {
      toast.error("Failed to download image");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-gray-950 dark:via-purple-950 dark:to-violet-950">
        <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="container mx-auto flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                {APP_TITLE}
              </h1>
            </div>
            <Button onClick={toggleTheme} variant="ghost" size="icon">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-md border-violet-200 dark:border-violet-800">
            <CardContent className="pt-6 space-y-6">
              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold">Welcome to {APP_TITLE}</h2>
                <p className="text-muted-foreground">
                  Transform your ideas into stunning AI-generated images
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg bg-violet-50 dark:bg-violet-950/30 p-4 space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-violet-600" />
                    Features
                  </h3>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Generate images from text prompts</li>
                    <li>• Browse your creation history</li>
                    <li>• Download high-quality images</li>
                    <li>• Use pre-made prompt templates</li>
                  </ul>
                </div>

                <Button
                  onClick={() => (window.location.href = getLoginUrl())}
                  className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
                  size="lg"
                >
                  Sign In to Get Started
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>

        <footer className="border-t bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm py-6">
          <div className="container text-center text-sm text-muted-foreground">
            Built with ❤️
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-gray-950 dark:via-purple-950 dark:to-violet-950">
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              {APP_TITLE}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Welcome, {user?.name || "User"}
            </span>
            <Button
              onClick={() => window.location.href = "/chat"}
              variant="outline"
              size="sm"
              className="border-violet-300 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat with AI
            </Button>
            <Button onClick={toggleTheme} variant="ghost" size="icon">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button onClick={() => logout()} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-8 space-y-8">
        {/* Generation Section */}
        <Card className="border-violet-200 dark:border-violet-800">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-600" />
              <h2 className="text-xl font-semibold">Generate New Image</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Describe what you want to create and let AI bring it to life
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="prompt">Your Prompt</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="text-violet-600"
                  >
                    <Lightbulb className="h-4 w-4 mr-1" />
                    {showTemplates ? "Hide" : "Show"} Templates
                  </Button>
                </div>

                {showTemplates && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 bg-violet-50 dark:bg-violet-950/30 rounded-lg">
                    {PROMPT_TEMPLATES.map((template, index) => (
                      <button
                        key={index}
                        onClick={() => handleTemplateClick(template)}
                        className="text-left text-sm p-2 rounded hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors"
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                )}

                <Input
                  id="prompt"
                  placeholder="e.g., A serene mountain landscape at sunset with a lake"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !generateMutation.isPending) {
                      handleGenerate();
                    }
                  }}
                  disabled={generateMutation.isPending}
                  className="h-12"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEnhancePrompt}
                  disabled={!prompt.trim() || enhanceMutation.isPending}
                  className="mt-2 text-violet-600 border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/30"
                >
                  {enhanceMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-violet-600 mr-2" />
                      Enhancing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-1" />
                      Enhance Prompt
                    </>
                  )}
                </Button>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending || !prompt.trim()}
                className="w-full h-12 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
                size="lg"
              >
                {generateMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Image
                  </>
                )}
              </Button>

              {generatedImageUrl && (
                <div className="space-y-3">
                  <div className="relative rounded-lg overflow-hidden border-2 border-violet-200 dark:border-violet-800">
                    <img
                      src={generatedImageUrl}
                      alt="Generated"
                      className="w-full h-auto"
                    />
                  </div>
                  <Button
                    onClick={() => handleDownload(generatedImageUrl, prompt)}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Image
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* History Section */}
        <Card className="border-violet-200 dark:border-violet-800">
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-xl font-semibold">Your Creations</h2>
            <p className="text-sm text-muted-foreground">
              Browse your previously generated images
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {imageHistory?.map((image: any) => (
                <div
                  key={image.id}
                  className="group relative rounded-lg overflow-hidden border border-violet-200 dark:border-violet-800 bg-gray-100 dark:bg-gray-800"
                >
                  {image.status === "completed" && image.imageUrl ? (
                    <>
                      <img
                        src={image.imageUrl}
                        alt={image.prompt}
                        className="w-full aspect-square object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDownload(image.imageUrl, image.prompt)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                        <p className="text-white text-xs line-clamp-2">{image.prompt}</p>
                      </div>
                    </>
                  ) : image.status === "generating" ? (
                    <div className="aspect-square flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto" />
                        <p className="text-sm text-muted-foreground">Generating...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-square flex items-center justify-center bg-red-100 dark:bg-red-950/30">
                      <p className="text-sm text-red-600 dark:text-red-400 px-4 text-center">
                        Failed
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {(!imageHistory || imageHistory.length === 0) && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No images generated yet. Start creating!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm py-6">
        <div className="container text-center text-sm text-muted-foreground">
          Built with ❤️
        </div>
      </footer>

      {/* Floating Chat Button */}
      <Button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 z-50"
        size="icon"
      >
        {showChat ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      {/* Chat Box */}
      {showChat && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] shadow-2xl rounded-lg overflow-hidden z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 p-4 text-white">
            <h3 className="font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Assistant
            </h3>
            <p className="text-xs text-violet-100 mt-1">Ask me anything about image generation!</p>
          </div>
          <AIChatBox
            messages={chatMessages}
            onSendMessage={handleSendChatMessage}
            isLoading={chatMutation.isPending}
            placeholder="Ask for prompt ideas or help..."
            height="calc(100% - 80px)"
          />
        </div>
      )}
    </div>
  );
}
