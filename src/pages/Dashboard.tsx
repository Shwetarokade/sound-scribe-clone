
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, LogOut, User, Brain } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AddVoice from "@/components/dashboard/AddVoice";
import GenerateVoice from "@/components/dashboard/GenerateVoice";
import VoiceLibrary from "@/components/dashboard/VoiceLibrary";
import VoiceCloning from "@/components/dashboard/VoiceCloning";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("library");
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Mic className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">VoiceClone</h1>
          </Link>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">
                {user?.email || 'Welcome back!'}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Voice Dashboard</h2>
          <p className="text-muted-foreground">
            Manage your voices, generate speech, clone voices, and build your voice library
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="library">Voice Library</TabsTrigger>
            <TabsTrigger value="add">Add Voice</TabsTrigger>
            <TabsTrigger value="generate">Generate Voice</TabsTrigger>
            <TabsTrigger value="clone" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Voice Cloning
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="mt-6">
            <VoiceLibrary />
          </TabsContent>

          <TabsContent value="add" className="mt-6">
            <AddVoice />
          </TabsContent>

          <TabsContent value="generate" className="mt-6">
            <GenerateVoice />
          </TabsContent>

          <TabsContent value="clone" className="mt-6">
            <VoiceCloning />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
