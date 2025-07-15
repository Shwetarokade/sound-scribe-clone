
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";

interface VoiceFormData {
  name: string;
  language: string;
  voice_type: string;
  description: string;
}

interface VoiceFormProps {
  onSubmit: (formData: VoiceFormData) => void;
  loading?: boolean;
}

const VoiceForm = ({ onSubmit, loading = false }: VoiceFormProps) => {
  const [formData, setFormData] = useState<VoiceFormData>({
    name: "",
    language: "",
    voice_type: "",
    description: ""
  });

  const indianLanguages = [
    { value: "hi", label: "Hindi" },
    { value: "ta", label: "Tamil" },
    { value: "te", label: "Telugu" },
    { value: "bn", label: "Bengali" },
    { value: "mr", label: "Marathi" },
    { value: "gu", label: "Gujarati" },
    { value: "kn", label: "Kannada" },
    { value: "ml", label: "Malayalam" },
    { value: "pa", label: "Punjabi" },
    { value: "or", label: "Odia" },
    { value: "as", label: "Assamese" },
    { value: "ur", label: "Urdu" },
    { value: "en-in", label: "English (Indian)" }
  ];

  const voiceTypes = [
    { value: "conversational", label: "Conversational" },
    { value: "narrative", label: "Narrative" },
    { value: "ai", label: "AI" },
    { value: "robotic", label: "Robotic" },
    { value: "natural", label: "Natural" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.language && formData.voice_type) {
      onSubmit(formData);
    }
  };

  const updateFormData = (field: keyof VoiceFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = formData.name && formData.language && formData.voice_type;

  return (
    <div className="animate-in slide-in-from-bottom-8 duration-500 delay-200">
      <Card className="transition-all duration-300 hover:shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Voice Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2 animate-in fade-in-50 duration-300 delay-300">
                <Label htmlFor="voiceName">Voice Name *</Label>
                <Input
                  id="voiceName"
                  placeholder="e.g., Professional Speaker"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  required
                  className="transition-all duration-200 focus:scale-[1.02]"
                />
              </div>

              <div className="space-y-2 animate-in fade-in-50 duration-300 delay-400">
                <Label htmlFor="language">Language *</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => updateFormData('language', value)}
                >
                  <SelectTrigger className="transition-all duration-200 focus:scale-[1.02]">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {indianLanguages.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 animate-in fade-in-50 duration-300 delay-500">
                <Label htmlFor="voice_type">Voice Type *</Label>
                <Select
                  value={formData.voice_type}
                  onValueChange={(value) => updateFormData('voice_type', value)}
                >
                  <SelectTrigger className="transition-all duration-200 focus:scale-[1.02]">
                    <SelectValue placeholder="Select voice type" />
                  </SelectTrigger>
                  <SelectContent>
                    {voiceTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2 animate-in fade-in-50 duration-300 delay-600">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the voice characteristics and intended use..."
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  rows={3}
                  className="transition-all duration-200 focus:scale-[1.01]"
                />
              </div>
            </div>

            {/* Training Tips */}
            <div className="bg-muted/50 p-4 rounded-lg animate-in fade-in-50 duration-300 delay-700">
              <h4 className="font-medium mb-2">Tips for better voice training:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use high-quality, clear audio recordings (44.1kHz, 16-bit minimum)</li>
                <li>• 15-second clips work best for voice cloning</li>
                <li>• Avoid background noise and echo</li>
                <li>• Speak naturally with consistent volume and pace</li>
                <li>• Record in a quiet environment for best results</li>
              </ul>
            </div>

            <Button 
              type="submit" 
              className="w-full transition-all duration-200 hover:scale-[1.02]" 
              disabled={loading || !isFormValid}
            >
              {loading ? (
                <>
                  <Save className="h-4 w-4 mr-2 animate-spin" />
                  Processing Voice...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Add Voice to Library
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceForm;
