
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Waveform, Users, Zap } from "lucide-react";

const Landing = () => {
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
            <Link to="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Clone Any Voice with
            <span className="text-primary block">AI Precision</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Transform text into speech using advanced AI voice cloning technology. 
            Create realistic voices from just a few samples.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Start Cloning Voices
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">
            Why Choose VoiceClone?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Waveform className="h-12 w-12 text-primary mb-4" />
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
                  Create voice clones in seconds with our optimized AI models
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Multiple Voices</CardTitle>
                <CardDescription>
                  Build a library of voices for different use cases and projects
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-6">
            Ready to Start Voice Cloning?
          </h3>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of creators using VoiceClone for their projects
          </p>
          <Link to="/signup">
            <Button size="lg">
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground">
          <p>&copy; 2024 VoiceClone. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
