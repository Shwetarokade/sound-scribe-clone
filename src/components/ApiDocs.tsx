import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Server, Database, FileText } from 'lucide-react';

const ApiDocs: React.FC = () => {
  const apiBaseUrl = 'http://localhost:3001';
  
  const openSwaggerDocs = () => {
    window.open(`${apiBaseUrl}/api-docs`, '_blank');
  };

  const openApiEndpoint = (endpoint: string) => {
    window.open(`${apiBaseUrl}${endpoint}`, '_blank');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Echo Forge API</h1>
        <p className="text-muted-foreground">
          RESTful API with comprehensive Swagger/OpenAPI documentation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Swagger Documentation */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              API Documentation
            </CardTitle>
            <CardDescription>
              Interactive Swagger UI for testing and exploring the API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={openSwaggerDocs} className="w-full">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Swagger UI
            </Button>
          </CardContent>
        </Card>

        {/* Health Check */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Health Check
            </CardTitle>
            <CardDescription>
              Check the API server status and availability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={() => openApiEndpoint('/health')}
              className="w-full"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Check Health
            </Button>
          </CardContent>
        </Card>

        {/* Voices API */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Voices API
            </CardTitle>
            <CardDescription>
              Direct access to the voices API endpoint
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={() => openApiEndpoint('/api/voices')}
              className="w-full"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View Voices
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* API Endpoints Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Available Endpoints</CardTitle>
          <CardDescription>
            Overview of the RESTful API endpoints for voice management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold text-green-600">GET Endpoints</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li><code>/api/voices</code> - Get all voices (with pagination)</li>
                  <li><code>/api/voices/search</code> - Search voices</li>
                  <li><code>/api/voices/{'{id}'}</code> - Get voice by ID</li>
                  <li><code>/health</code> - Health check</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-600">Write Endpoints</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li><code>POST /api/voices</code> - Create new voice</li>
                  <li><code>PUT /api/voices/{'{id}'}</code> - Update voice</li>
                  <li><code>DELETE /api/voices/{'{id}'}</code> - Delete voice</li>
                </ul>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-2">Features</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <ul className="space-y-1">
                  <li>✓ Full CRUD operations</li>
                  <li>✓ Search functionality</li>
                  <li>✓ Pagination support</li>
                </ul>
                <ul className="space-y-1">
                  <li>✓ OpenAPI 3.0 specification</li>
                  <li>✓ Interactive Swagger UI</li>
                  <li>✓ Request/response validation</li>
                </ul>
                <ul className="space-y-1">
                  <li>✓ Error handling</li>
                  <li>✓ CORS enabled</li>
                  <li>✓ Row Level Security (RLS)</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
          <CardDescription>
            Get started with the Echo Forge API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">1. Start the API Server</h4>
              <code className="block bg-muted p-3 rounded text-sm">
                npm run dev:server
              </code>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">2. Access Swagger UI</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Open the interactive API documentation in your browser:
              </p>
              <code className="block bg-muted p-3 rounded text-sm">
                http://localhost:3001/api-docs
              </code>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">3. Test API Endpoints</h4>
              <p className="text-sm text-muted-foreground">
                Use the Swagger UI to explore and test all available endpoints with real-time validation and examples.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiDocs;