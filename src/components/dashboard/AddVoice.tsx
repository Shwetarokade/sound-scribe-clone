
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Mic, X } from "lucide-react";

const AddVoice = () => {
  const [voiceName, setVoiceName] = useState("");
  const [voiceDescription, setVoiceDescription] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement actual recording functionality
    console.log("Recording:", !isRecording);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // TODO: Implement voice training with uploaded files
    console.log("Training voice:", {
      name: voiceName,
      description: voiceDescription,
      files: uploadedFiles
    });

    // Simulate training process
    setTimeout(() => {
      setLoading(false);
      // Reset form
      setVoiceName("");
      setVoiceDescription("");
      setUploadedFiles([]);
    }, 3000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add New Voice</CardTitle>
          <CardDescription>
            Upload audio samples or record your voice to create a new AI voice clone
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Voice Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="voiceName">Voice Name</Label>
                <Input
                  id="voiceName"
                  placeholder="e.g., Professional Speaker"
                  value={voiceName}
                  onChange={(e) => setVoiceName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="voiceDescription">Description</Label>
                <Textarea
                  id="voiceDescription"
                  placeholder="Describe the voice characteristics and intended use..."
                  value={voiceDescription}
                  onChange={(e) => setVoiceDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* Audio Upload */}
            <div className="space-y-4">
              <Label>Audio Samples</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                <div className="text-center space-y-4">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <p className="text-sm font-medium">Upload audio files</p>
                    <p className="text-xs text-muted-foreground">
                      MP3, WAV, or M4A files up to 10MB each
                    </p>
                  </div>
                  <div className="flex items-center justify-center space-x-4">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept="audio/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button type="button" variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Choose Files
                      </Button>
                    </label>
                    <span className="text-xs text-muted-foreground">or</span>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={toggleRecording}
                      className={isRecording ? "bg-red-100 border-red-300" : ""}
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      {isRecording ? "Stop Recording" : "Record Voice"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Uploaded Files ({uploadedFiles.length})</Label>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Training Tips */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Tips for better voice training:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Upload 5-10 high-quality audio samples</li>
                <li>• Each sample should be 10-30 seconds long</li>
                <li>• Use clear, noise-free recordings</li>
                <li>• Include varied emotions and speaking styles</li>
              </ul>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || uploadedFiles.length === 0 || !voiceName}
            >
              {loading ? "Training Voice..." : "Start Training"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddVoice;
