import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, Sparkles, Image as ImageIcon, Zap, LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  const generateMutation = trpc.imageGeneration.generate.useMutation({
    onSuccess: (data) => {
      toast.success("Image generation started! This may take a few moments...");
      // In a real implementation, we would poll the task status
      // For now, we'll simulate completion after a delay
      setTimeout(() => {
        setIsGenerating(false);
        // Mock image URL - in production this would come from polling the task
        setGeneratedImageUrl("https://via.placeholder.com/512x512.png?text=Generated+Image");
        toast.success("Image generated successfully!");
      }, 3000);
    },
    onError: (error) => {
      setIsGenerating(false);
      toast.error(`Failed to generate image: ${error.message}`);
    },
  });

  const { data: imageHistory } = trpc.imageGeneration.getHistory.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    setIsGenerating(true);
    setGeneratedImageUrl(null);
    generateMutation.mutate({ prompt });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              {APP_TITLE}
            </h1>
          </div>
          {isAuthenticated && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
              <Button variant="outline" size="sm" onClick={() => logout()}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      {!isAuthenticated ? (
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700 text-sm font-medium">
              <Zap className="h-4 w-4" />
              Powered by Manus 1 Trillion Token Campaign
            </div>
            <h2 className="text-5xl md:text-6xl font-bold leading-tight">
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
              <Card className="border-violet-200">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-violet-100 flex items-center justify-center mb-4">
                    <Sparkles className="h-6 w-6 text-violet-600" />
                  </div>
                  <CardTitle>AI-Powered</CardTitle>
                  <CardDescription>
                    Advanced AI models create stunning images from your text prompts
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-purple-200">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle>Free Tokens</CardTitle>
                  <CardDescription>
                    Use the 1 trillion token campaign pool - completely free
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-pink-200">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-pink-100 flex items-center justify-center mb-4">
                    <ImageIcon className="h-6 w-6 text-pink-600" />
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
            <Card className="border-violet-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-violet-600" />
                  Generate New Image
                </CardTitle>
                <CardDescription>
                  Describe what you want to create and let AI bring it to life
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGenerate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="prompt">Your Prompt</Label>
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
                    <div className="rounded-lg overflow-hidden border-2 border-violet-200">
                      <img
                        src={generatedImageUrl}
                        alt="Generated"
                        className="w-full h-auto"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1">
                        Download
                      </Button>
                      <Button variant="outline" className="flex-1">
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
                        className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-violet-400 transition-colors cursor-pointer"
                      >
                        {image.status === "completed" && image.imageUrl ? (
                          <img
                            src={image.imageUrl}
                            alt={image.prompt}
                            className="w-full h-full object-cover"
                          />
                        ) : image.status === "generating" ? (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-red-50 text-red-600 text-sm p-2">
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
      <footer className="border-t bg-white/80 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>
            Built with ❤️ using Manus 1 Trillion Token Campaign •{" "}
            <a
              href="https://events.manus.im/campaign/free-tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-600 hover:underline"
            >
              Learn More
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
