import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { Download, Image as ImageIcon, Lightbulb, LogOut, MessageCircle, Moon, Sparkles, Sun, Type, Upload, X } from "lucide-react";
import { useState, useRef } from "react";
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

const TRANSFORMATION_STYLES = [
  { value: "anime", label: "Anime Style" },
  { value: "ghibli", label: "Studio Ghibli" },
  { value: "dbz", label: "Dragon Ball Z" },
  { value: "realistic", label: "Hyper Realistic" },
  { value: "oil-painting", label: "Oil Painting" },
  { value: "watercolor", label: "Watercolor" },
  { value: "cyberpunk", label: "Cyberpunk" },
  { value: "fantasy", label: "Fantasy Art" },
];

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("text-to-image");
  
  // Text-to-Image state
  const [prompt, setPrompt] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  
  // Image-to-Image state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [transformPrompt, setTransformPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("");
  const [transformedImageUrl, setTransformedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Chat state
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

  const transformMutation = trpc.images.transformImage.useMutation({
    onSuccess: (data) => {
      setTransformedImageUrl(data.imageUrl || null);
      toast.success("Image transformed successfully!");
      utils.images.getHistory.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to transform image: ${error.message}`);
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }

    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    toast.success("Image uploaded!");
  };

  const handleTransform = async () => {
    if (!uploadedImage) {
      toast.error("Please upload an image first");
      return;
    }

    if (!transformPrompt.trim() && !selectedStyle) {
      toast.error("Please enter a prompt or select a style");
      return;
    }

    setTransformedImageUrl(null);
    
    // For now, we'll use the base64 data URL directly
    // In production, you'd upload to S3 first
    transformMutation.mutate({
      imageUrl: uploadedImage,
      prompt: transformPrompt.trim(),
      style: selectedStyle,
    });
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
              <img src={APP_LOGO} alt="Logo" className="h-10 w-10" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                AlShami AI Image Generator
              </h1>
            </div>
            <Button onClick={toggleTheme} variant="ghost" size="icon">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-violet-200 dark:border-violet-800">
            <CardContent className="pt-6 space-y-4">
              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold">Welcome!</h2>
                <p className="text-muted-foreground">
                  Sign in to start generating amazing AI images
                </p>
              </div>
              <Button
                onClick={() => (window.location.href = getLoginUrl())}
                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
                size="lg"
              >
                Sign In to Continue
              </Button>
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
            <img src={APP_LOGO} alt="Logo" className="h-10 w-10" />
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
        {/* Tabbed Generation Section */}
        <Card className="border-violet-200 dark:border-violet-800">
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="text-to-image" className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Text to Image
                </TabsTrigger>
                <TabsTrigger value="image-to-image" className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Transform Image
                </TabsTrigger>
              </TabsList>

              {/* Text-to-Image Tab */}
              <TabsContent value="text-to-image" className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-violet-600" />
                  <h2 className="text-xl font-semibold">Generate New Image</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Describe what you want to create and let AI bring it to life
                </p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="prompt">Your Prompt</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTemplates(!showTemplates)}
                      className="text-violet-600"
                    >
                      <Lightbulb className="h-4 w-4 mr-1" />
                      Show Templates
                    </Button>
                  </div>

                  {showTemplates && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4 bg-violet-50 dark:bg-violet-950/20 rounded-lg">
                      {PROMPT_TEMPLATES.map((template, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleTemplateClick(template)}
                          className="text-left justify-start h-auto py-2 px-3 whitespace-normal"
                        >
                          {template}
                        </Button>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
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
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Generate Image
                      </>
                    )}
                  </Button>

                  {generatedImageUrl && (
                    <div className="mt-4 space-y-2">
                      <Label>Generated Image</Label>
                      <div className="relative rounded-lg overflow-hidden border-2 border-violet-200 dark:border-violet-800">
                        <img
                          src={generatedImageUrl}
                          alt="Generated"
                          className="w-full h-auto"
                        />
                        <Button
                          onClick={() => handleDownload(generatedImageUrl, prompt)}
                          className="absolute top-2 right-2 bg-white/90 hover:bg-white dark:bg-gray-900/90 dark:hover:bg-gray-900"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Image-to-Image Tab */}
              <TabsContent value="image-to-image" className="space-y-4">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-violet-600" />
                  <h2 className="text-xl font-semibold">Transform Your Image</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload an image and transform it into different artistic styles
                </p>

                <div className="space-y-4">
                  {/* File Upload */}
                  <div className="space-y-2">
                    <Label>Upload Image</Label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-violet-300 dark:border-violet-700 rounded-lg p-8 text-center cursor-pointer hover:border-violet-500 dark:hover:border-violet-500 transition-colors"
                    >
                      {uploadedImage ? (
                        <div className="space-y-2">
                          <img
                            src={uploadedImage}
                            alt="Uploaded"
                            className="max-h-64 mx-auto rounded-lg"
                          />
                          <p className="text-sm text-muted-foreground">
                            Click to change image
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-12 w-12 mx-auto text-violet-600" />
                          <p className="text-sm font-medium">Click to upload an image</p>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG up to 10MB
                          </p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  {/* Style Selection */}
                  <div className="space-y-2">
                    <Label>Select Style (Optional)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {TRANSFORMATION_STYLES.map((style) => (
                        <Button
                          key={style.value}
                          variant={selectedStyle === style.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedStyle(style.value === selectedStyle ? "" : style.value)}
                          className={selectedStyle === style.value ? "bg-violet-600 hover:bg-violet-700" : ""}
                        >
                          {style.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Transformation Prompt */}
                  <div className="space-y-2">
                    <Label htmlFor="transform-prompt">Transformation Prompt</Label>
                    <Input
                      id="transform-prompt"
                      placeholder="e.g., Make it more vibrant, add magical elements"
                      value={transformPrompt}
                      onChange={(e) => setTransformPrompt(e.target.value)}
                      disabled={transformMutation.isPending}
                      className="h-12"
                    />
                  </div>

                  <Button
                    onClick={handleTransform}
                    disabled={transformMutation.isPending || !uploadedImage}
                    className="w-full h-12 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
                    size="lg"
                  >
                    {transformMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                        Transforming...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Transform Image
                      </>
                    )}
                  </Button>

                  {transformedImageUrl && (
                    <div className="mt-4 space-y-2">
                      <Label>Transformed Image</Label>
                      <div className="relative rounded-lg overflow-hidden border-2 border-violet-200 dark:border-violet-800">
                        <img
                          src={transformedImageUrl}
                          alt="Transformed"
                          className="w-full h-auto"
                        />
                        <Button
                          onClick={() => handleDownload(transformedImageUrl, transformPrompt || selectedStyle)}
                          className="absolute top-2 right-2 bg-white/90 hover:bg-white dark:bg-gray-900/90 dark:hover:bg-gray-900"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Gallery Section */}
        <Card className="border-violet-200 dark:border-violet-800">
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-xl font-semibold">Your Creations</h2>
            <p className="text-sm text-muted-foreground">
              Browse your previously generated images
            </p>

            {imageHistory && imageHistory.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {imageHistory.map((image) => (
                  <div
                    key={image.id}
                    className="relative group rounded-lg overflow-hidden border border-violet-200 dark:border-violet-800 hover:border-violet-400 dark:hover:border-violet-600 transition-colors"
                  >
                    {image.status === "generating" ? (
                      <div className="aspect-square bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-950 dark:to-fuchsia-950 flex items-center justify-center">
                        <div className="text-center space-y-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto" />
                          <p className="text-sm text-muted-foreground">Generating...</p>
                        </div>
                      </div>
                    ) : image.status === "failed" ? (
                      <div className="aspect-square bg-red-50 dark:bg-red-950/20 flex items-center justify-center">
                        <p className="text-sm text-red-600 dark:text-red-400">Failed</p>
                      </div>
                    ) : (
                      <>
                        <img
                          src={image.imageUrl}
                          alt={image.prompt}
                          className="w-full aspect-square object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                          <div className="w-full space-y-2">
                            <p className="text-white text-sm line-clamp-2">
                              {image.prompt}
                            </p>
                            <Button
                              onClick={() => handleDownload(image.imageUrl, image.prompt)}
                              size="sm"
                              className="w-full"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No images generated yet. Start creating!</p>
              </div>
            )}
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
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
        size="icon"
      >
        {showChat ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      {/* Chat Box */}
      {showChat && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-violet-200 dark:border-violet-800 overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 p-4 text-white">
            <h3 className="font-semibold">AI Assistant</h3>
            <p className="text-sm text-violet-100">Ask for prompt ideas or help</p>
          </div>
          <div className="flex-1 overflow-hidden">
            <AIChatBox
              messages={chatMessages}
              onSendMessage={handleSendChatMessage}
              isLoading={chatMutation.isPending}
              placeholder="Ask for prompt ideas..."
              height="100%"
            />
          </div>
        </div>
      )}
    </div>
  );
}
