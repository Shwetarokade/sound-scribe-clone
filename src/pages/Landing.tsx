
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, AudioWaveform, Users, Zap, Play, Pause, Globe } from "lucide-react";

const Landing = () => {
  const [playingDemo, setPlayingDemo] = useState<string | null>(null);

  const demoVoices = [
    {
      id: "demo1",
      name: "Rajesh",
      language: "Hindi",
      category: "Conversational",
      description: "Professional Hindi narrator voice"
    },
    {
      id: "demo2", 
      name: "Priya",
      language: "Tamil",
      category: "Narrative",
      description: "Warm Tamil storytelling voice"
    },
    {
      id: "demo3",
      name: "Arjun",
      language: "English (Indian)",
      category: "AI",
      description: "Clear Indian English assistant voice"
    }
  ];

  const handleDemoPlay = (voiceId: string) => {
    if (playingDemo === voiceId) {
      setPlayingDemo(null);
    } else {
      setPlayingDemo(voiceId);
      // Simulate audio playback
      setTimeout(() => setPlayingDemo(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Mic className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">VoiceClone</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="#demo">
              <Button variant="ghost">Try Demo</Button>
            </Link>
            <Link to="/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-5xl font-bold leading-tight">
            Clone Any Voice with{" "}
            <span className="text-primary">AI Precision</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform any voice into a high-quality AI clone. Perfect for content creation, 
            voiceovers, and personalized audio experiences with full support for Indian languages.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="px-8">
                Start Cloning Voices
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="px-8" onClick={() => document.getElementById('demo')?.scrollIntoView()}>
              Try Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">
            Powerful Voice Cloning Features
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Mic className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Add Voice</CardTitle>
                <CardDescription>
                  Record or upload audio samples to create custom AI voice clones with support for multiple categories
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <AudioWaveform className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Generate Voice</CardTitle>
                <CardDescription>
                  Convert text to speech using your cloned voices with precise control over tone, speed, and pitch
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Globe className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Multilingual Cloning</CardTitle>
                <CardDescription>
                  Full support for Indian languages including Hindi, Tamil, Telugu, Bengali, Marathi, and more
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="px-6 py-20 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold mb-4">
              Experience Voice Cloning
            </h3>
            <p className="text-xl text-muted-foreground">
              Listen to sample voices generated with our AI technology
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {demoVoices.map((voice) => (
              <Card key={voice.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{voice.name}</CardTitle>
                      <CardDescription>{voice.description}</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDemoPlay(voice.id)}
                    >
                      {playingDemo === voice.id ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Language:</span>
                      <span>{voice.language}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <span>{voice.category}</span>
                    </div>
                  </div>
                  {playingDemo === voice.id && (
                    <div className="mt-4">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full animate-pulse w-2/3"></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Playing demo...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h3 className="text-4xl font-bold">
            Ready to Start Voice Cloning?
          </h3>
          <p className="text-xl text-muted-foreground">
            Join thousands of creators who are already using VoiceClone for their projects
          </p>
          <Link to="/signup">
            <Button size="lg" className="px-8">
              Get Started for Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Mic className="h-6 w-6 text-primary" />
                <span className="font-semibold text-lg">VoiceClone</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Advanced AI voice cloning technology for creators worldwide
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Product</h4>
              <div className="space-y-2 text-sm">
                <Link to="#" className="block text-muted-foreground hover:text-primary">Features</Link>
                <Link to="#" className="block text-muted-foreground hover:text-primary">Pricing</Link>
                <Link to="#demo" className="block text-muted-foreground hover:text-primary">Demo</Link>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Support</h4>
              <div className="space-y-2 text-sm">
                <Link to="#" className="block text-muted-foreground hover:text-primary">Help Center</Link>
                <Link to="#" className="block text-muted-foreground hover:text-primary">Documentation</Link>
                <Link to="#" className="block text-muted-foreground hover:text-primary">Contact Us</Link>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Company</h4>
              <div className="space-y-2 text-sm">
                <Link to="#" className="block text-muted-foreground hover:text-primary">About</Link>
                <Link to="#" className="block text-muted-foreground hover:text-primary">Privacy Policy</Link>
                <Link to="#" className="block text-muted-foreground hover:text-primary">Terms of Service</Link>
              </div>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 flex items-center justify-between text-sm text-muted-foreground">
            <p>© 2024 VoiceClone. All rights reserved.</p>
            <p>Built with AI for creators worldwide</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
