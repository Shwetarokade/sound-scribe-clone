
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, AudioWaveform, Users, Zap } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="px-6 py-4 border-b">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Mic className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">VoiceClone</h1>
          </div>
          <div className="flex items-center space-x-4">
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
          <h2 className="text-5xl font-bold">
            Clone Any Voice with{" "}
            <span className="text-primary">AI Precision</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform any voice into a high-quality AI clone. Perfect for content creation, 
            voiceovers, and personalized audio experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="px-8">
                Start Cloning Voices
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="px-8">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">
            Why Choose VoiceClone?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <AudioWaveform className="h-12 w-12 text-primary mb-4" />
                <CardTitle>High Quality Audio</CardTitle>
                <CardDescription>
                  Generate crystal clear audio with professional studio quality
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Zap className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Lightning Fast</CardTitle>
                <CardDescription>
                  Create voice clones in minutes, not hours. Our AI processes audio at incredible speeds
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Users className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Multiple Voices</CardTitle>
                <CardDescription>
                  Support for various accents, languages, and voice types for any project
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-muted/50">
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
      <footer className="border-t px-6 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Mic className="h-6 w-6 text-primary" />
            <span className="font-semibold">VoiceClone</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 VoiceClone. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
