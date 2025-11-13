import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, Sparkles, Image as ImageIcon, Zap, LogOut, Moon, Sun, Download, Lightbulb } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

const PROMPT_TEMPLATES = [
  "A serene mountain landscape at sunset with a lake",
  "A futuristic city skyline at night with neon lights",
  "A magical forest with glowing mushrooms and fireflies",
  "An underwater scene with colorful coral reefs and tropical fish",
  "A cozy coffee shop interior with warm lighting",
  "A space station orbiting a distant planet",
];

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [currentImageId, setCurrentImageId] = useState<number | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const utils = trpc.useUtils();

  const generateMutation = trpc.imageGeneration.generate.useMutation({
    onSuccess: (data) => {
      toast.success("Image generation started! This may take a few moments...");
      setCurrentTaskId(data.taskId);
      setCurrentImageId(data.imageId);
      startPolling(data.taskId, data.imageId);
    },
    onError: (error) => {
      setIsGenerating(false);
      toast.error(`Failed to generate image: ${error.message}`);
    },
  });

  const pollTaskMutation = trpc.imageGeneration.pollTask.useMutation({
    onSuccess: (data) => {
      if (data.status === "completed" && data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
        setIsGenerating(false);
        stopPolling();
        toast.success("Image generated successfully!");
        utils.imageGeneration.getHistory.invalidate();
      } else if (data.status === "failed") {
        setIsGenerating(false);
        stopPolling();
        toast.error(`Image generation failed: ${data.error || "Unknown error"}`);
      }
      // Continue polling if still generating
    },
    onError: (error) => {
      console.error("Polling error:", error);
      // Don't stop polling on error, just log it
    },
  });

  const { data: imageHistory } = trpc.imageGeneration.getHistory.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const startPolling = (taskId: string, imageId: number) => {
    stopPolling(); // Clear any existing interval
    
    // Poll immediately
    pollTaskMutation.mutate({ taskId, imageId });
    
    // Then poll every 3 seconds
    pollingIntervalRef.current = setInterval(() => {
      pollTaskMutation.mutate({ taskId, imageId });
    }, 3000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    setIsGenerating(true);
    setGeneratedImageUrl(null);
    setCurrentTaskId(null);
    setCurrentImageId(null);
    generateMutation.mutate({ prompt });
  };

  const handleTemplateClick = (template: string) => {
    setPrompt(template);
    setShowTemplates(false);
  };

  const handleDownload = async () => {
    if (!generatedImageUrl) return;
    
    try {
      const response = await fetch(generatedImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `alshami-ai-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Image downloaded!");
    } catch (error) {
      toast.error("Failed to download image");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-background to-purple-50 dark:from-gray-950 dark:via-background dark:to-violet-950">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              AlShami AI Image Generator
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            {isAuthenticated && (
              <>
                <span className="text-sm text-muted-foreground hidden sm:inline">Welcome, {user?.name}</span>
                <Button variant="outline" size="sm" onClick={() => logout()}>
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {!isAuthenticated ? (
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-medium">
              <Zap className="h-4 w-4" />
              Powered by Manus 1 Trillion Token Campaign
            </div>
            <h2 className="text-5xl md:text-6xl font-bold leading-tight text-foreground">
              Create Stunning Images with{" "}
              <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                AI Magic
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transform your ideas into beautiful images using advanced AI. Powered by free campaign tokens from Manus.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" asChild className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
                <a href={getLoginUrl()}>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Get Started Free
                </a>
              </Button>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-6 mt-16">
              <Card className="border-violet-200 dark:border-violet-800">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4">
                    <Sparkles className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                  </div>
                  <CardTitle>AI-Powered</CardTitle>
                  <CardDescription>
                    Advanced AI models create stunning images from your text prompts
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle>Free Tokens</CardTitle>
                  <CardDescription>
                    Use the 1 trillion token campaign pool - completely free
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-pink-200 dark:border-pink-800">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-4">
                    <ImageIcon className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <CardTitle>Instant Results</CardTitle>
                  <CardDescription>
                    Generate high-quality images in seconds with our fast AI
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Generation Form */}
            <Card className="border-violet-200 dark:border-violet-800 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  Generate New Image
                </CardTitle>
                <CardDescription>
                  Describe what you want to create and let AI bring it to life
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGenerate} className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="prompt">Your Prompt</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowTemplates(!showTemplates)}
                        className="text-xs"
                      >
                        <Lightbulb className="h-3 w-3 mr-1" />
                        {showTemplates ? "Hide" : "Show"} Templates
                      </Button>
                    </div>
                    {showTemplates && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-muted/50 rounded-lg">
                        {PROMPT_TEMPLATES.map((template, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleTemplateClick(template)}
                            className="text-left text-sm p-2 rounded hover:bg-accent transition-colors"
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
                      disabled={isGenerating}
                      className="text-base"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Image
                      </>
                    )}
                  </Button>
                </form>

                {/* Generated Image Display */}
                {generatedImageUrl && (
                  <div className="mt-6 space-y-4">
                    <div className="rounded-lg overflow-hidden border-2 border-violet-200 dark:border-violet-800">
                      <img
                        src={generatedImageUrl}
                        alt="Generated"
                        className="w-full h-auto"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={handleDownload}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedImageUrl);
                          toast.success("Image URL copied to clipboard!");
                        }}
                      >
                        Share
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Image History */}
            {imageHistory && imageHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Creations</CardTitle>
                  <CardDescription>
                    Browse your previously generated images
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {imageHistory.map((image) => (
                      <div
                        key={image.id}
                        className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-violet-400 dark:hover:border-violet-600 transition-colors cursor-pointer"
                      >
                        {image.status === "completed" && image.imageUrl ? (
                          <img
                            src={image.imageUrl}
                            alt={image.prompt}
                            className="w-full h-full object-cover"
                          />
                        ) : image.status === "generating" ? (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-sm p-2">
                            Failed
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                          <p className="text-white text-sm line-clamp-2">{image.prompt}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t bg-card/80 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>
            Built with ❤️ using Manus 1 Trillion Token Campaign •{" "}
            <a
              href="https://events.manus.im/campaign/free-tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-600 dark:text-violet-400 hover:underline"
            >
              Learn More
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
