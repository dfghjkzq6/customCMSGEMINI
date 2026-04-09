import React from 'react';
import { BookOpen, Copy, Check, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export const APIDocs = ({ models }: { models: any[] }) => {
  const [copied, setCopied] = React.useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-6 lg:p-10 space-y-12 max-w-5xl mx-auto">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-2xl text-primary">
            <BookOpen size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight">REST API Docs</h1>
            <p className="text-muted-foreground text-lg">Automatically generated endpoints for your custom data models.</p>
          </div>
        </div>
      </div>

      <div className="space-y-20">
        {models.map((model) => {
          const baseUrl = `${window.location.origin}/api/${model.collectionName}`;
          
          const endpoints = [
            { method: 'GET', path: '', desc: `List all ${model.name} records` },
            { method: 'GET', path: '/:id', desc: `Get a single ${model.name} record` },
            { method: 'POST', path: '', desc: `Create a new ${model.name}`, body: model.fields.reduce((acc: any, f: any) => ({ ...acc, [f.key]: f.type === 'number' ? 0 : f.type === 'boolean' ? false : '' }), {}) },
            { method: 'PUT', path: '/:id', desc: `Update an existing ${model.name}` },
            { method: 'DELETE', path: '/:id', desc: `Delete a ${model.name} record` },
          ];

          return (
            <section key={model.id} className="space-y-8">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold">{model.name} API</h2>
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <Terminal size={12} />
                  <span>Base Path: /api/{model.collectionName}</span>
                </div>
                <Separator className="mt-4" />
              </div>

              <div className="space-y-6">
                {endpoints.map((ep, i) => (
                  <Card key={i} className="overflow-hidden border-muted shadow-sm">
                    <div className="p-4 bg-muted/30 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Badge 
                          className={cn(
                            "font-black px-3 py-1 rounded-md",
                            ep.method === 'GET' ? "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20" :
                            ep.method === 'POST' ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" :
                            ep.method === 'PUT' ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20" :
                            "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                          )}
                        >
                          {ep.method}
                        </Badge>
                        <code className="text-sm font-bold opacity-80">{ep.path || '/'}</code>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">{ep.desc}</p>
                    </div>
                    <CardContent className="p-6 space-y-6">
                      <div className="relative group">
                        <div className="absolute top-3 right-3 z-10">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 bg-black/50 text-white hover:bg-black/70 hover:text-white backdrop-blur-sm"
                            onClick={() => handleCopy(`curl -X ${ep.method} ${baseUrl}${ep.path}`, `${model.id}-${i}`)}
                          >
                            {copied === `${model.id}-${i}` ? <Check size={14} /> : <Copy size={14} />}
                          </Button>
                        </div>
                        <pre className="bg-zinc-950 text-zinc-300 p-5 rounded-xl text-xs overflow-x-auto border border-zinc-800 font-mono leading-relaxed">
                          {`curl -X ${ep.method} ${baseUrl}${ep.path}`}
                        </pre>
                      </div>
                      
                      {ep.body && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sample Payload</span>
                            <Separator className="flex-1" />
                          </div>
                          <pre className="bg-muted/30 text-muted-foreground p-5 rounded-xl text-xs border font-mono">
                            {JSON.stringify(ep.body, null, 2)}
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}

        {models.length === 0 && (
          <div className="py-24 text-center bg-muted/30 rounded-[2rem] border-2 border-dashed flex flex-col items-center gap-4">
            <div className="bg-muted p-4 rounded-full">
              <BookOpen size={32} className="text-muted-foreground opacity-20" />
            </div>
            <p className="text-muted-foreground max-w-xs mx-auto italic">
              No custom data models defined yet. API documentation will appear here once you create a model.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
