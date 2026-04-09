import React, { useState } from 'react';
import axios from 'axios';
import { Terminal, Send, Loader2, Plus, Trash2, AlertCircle, Clock, CheckCircle2, Copy, Check, Eraser, FileJson } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { logAction, AuditAction } from '../services/auditService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Header {
  key: string;
  value: string;
}

export const APIConsole = ({ connection }: { connection: any }) => {
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [endpoint, setEndpoint] = useState('');
  const [body, setBody] = useState('{}');
  const [headers, setHeaders] = useState<Header[]>([]);
  const [response, setResponse] = useState<any>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [time, setTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const formatRequestBody = () => {
    try {
      const parsed = JSON.parse(body);
      setBody(JSON.stringify(parsed, null, 2));
    } catch (e) {
      setError('Cannot format: Invalid JSON in request body');
    }
  };

  const copyToClipboard = () => {
    if (!response) return;
    navigator.clipboard.writeText(JSON.stringify(response, null, 2));
    setCopied(true);
    toast.success('Response copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const clearConsole = () => {
    setResponse(null);
    setStatus(null);
    setTime(null);
    setError(null);
    toast.info('Console cleared');
  };

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, field: keyof Header, value: string) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);
  };

  const handleSend = async () => {
    setLoading(true);
    setResponse(null);
    setStatus(null);
    setTime(null);
    setError(null);

    const startTime = Date.now();

    try {
      // Validate JSON body if not GET/DELETE
      let parsedBody = undefined;
      if (method === 'POST' || method === 'PUT') {
        try {
          parsedBody = JSON.parse(body);
        } catch (e) {
          throw new Error('Invalid JSON in request body');
        }
      }

      const requestHeaders: any = { ...connection.headers };
      
      // Add auth headers
      if (connection.authType === 'apiKeyHeader') {
        requestHeaders['X-API-Key'] = connection.authValue;
      } else if (connection.authType === 'bearerToken') {
        requestHeaders['Authorization'] = `Bearer ${connection.authValue}`;
      }

      // Add custom headers
      headers.forEach(h => {
        if (h.key.trim()) {
          requestHeaders[h.key.trim()] = h.value;
        }
      });

      const res = await axios({
        method,
        url: `${connection.baseUrl}${endpoint}`,
        data: parsedBody,
        headers: requestHeaders,
        validateStatus: () => true
      });

      setResponse(res.data);
      setStatus(res.status);
      setTime(Date.now() - startTime);

      if (res.status >= 400) {
        setError(`Request failed with status ${res.status}`);
      }

      await logAction({
        action: AuditAction.API_CALL,
        entityType: 'APIConnection',
        entityId: connection.id,
        details: `API Call: ${method} ${endpoint}`,
        metadata: { 
          connectionName: connection.name, 
          method, 
          endpoint, 
          status: res.status,
          duration: Date.now() - startTime
        }
      });
    } catch (err: any) {
      setError(err.message);
      setResponse(err.response?.data || null);
      setStatus(err.response?.status || null);
      setTime(Date.now() - startTime);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (code: number | null) => {
    if (!code) return 'text-gray-400';
    if (code >= 200 && code < 300) return 'text-green-500';
    if (code >= 400) return 'text-red-500';
    return 'text-yellow-500';
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto flex flex-col min-h-full">
      <Card className="border-muted shadow-sm">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
          <div className="bg-primary/10 p-3 rounded-2xl text-primary">
            <Terminal size={24} />
          </div>
          <div>
            <CardTitle className="text-xl">API Console: {connection.name}</CardTitle>
            <CardDescription className="font-mono text-xs">{connection.baseUrl}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={method} onValueChange={(val) => setMethod(val as any)}>
              <SelectTrigger className="w-full sm:w-[120px] font-bold h-11">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={endpoint}
              onChange={e => setEndpoint(e.target.value)}
              className="flex-1 h-11 font-mono"
              placeholder="/endpoint?query=param"
            />
            <Button
              onClick={handleSend}
              disabled={loading}
              className="h-11 px-8 font-bold gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              <span>Send</span>
            </Button>
          </div>

          {/* Headers Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Custom Headers</span>
                <Separator className="w-12" />
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={addHeader}
                className="h-7 text-[10px] font-bold uppercase gap-1"
              >
                <Plus size={12} /> Add Header
              </Button>
            </div>
            <div className="space-y-2">
              {headers.map((h, i) => (
                <div key={i} className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                  <Input
                    value={h.key}
                    onChange={e => updateHeader(i, 'key', e.target.value)}
                    placeholder="Key"
                    className="flex-1 h-9 text-xs font-mono"
                  />
                  <Input
                    value={h.value}
                    onChange={e => updateHeader(i, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-1 h-9 text-xs font-mono"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeHeader(i)} 
                    className="h-9 w-9 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
              {headers.length === 0 && <p className="text-[10px] text-muted-foreground italic">No custom headers added.</p>}
            </div>
          </div>

          {(method === 'POST' || method === 'PUT') && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Request Body (JSON)</span>
                  <Separator className="w-12" />
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={formatRequestBody}
                  className="h-7 text-[10px] font-bold uppercase gap-1"
                >
                  <FileJson size={12} /> Format JSON
                </Button>
              </div>
              <Textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                className="font-mono text-sm min-h-[120px]"
                placeholder="{}"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex items-start gap-3 text-destructive animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold">Request Error</p>
            <p className="text-xs opacity-90">{error}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setError(null)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
            <Trash2 size={14} />
          </Button>
        </div>
      )}

      <Card className="flex-1 bg-zinc-950 text-zinc-300 border-zinc-800 overflow-hidden flex flex-col min-h-[400px] shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Response</span>
            {status && (
              <div className="flex items-center gap-3">
                <Badge 
                  variant="outline"
                  className={cn(
                    "text-[10px] font-black uppercase flex items-center gap-1 border-0",
                    status >= 200 && status < 300 ? "text-green-500 bg-green-500/10" : "text-red-500 bg-red-500/10"
                  )}
                >
                  {status >= 200 && status < 300 ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                  {status} {status >= 200 && status < 300 ? 'OK' : 'Error'}
                </Badge>
                {time && (
                  <span className="text-[10px] text-zinc-500 font-bold flex items-center gap-1">
                    <Clock size={12} /> {time}ms
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {response && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                  className="h-7 text-[10px] font-bold uppercase text-zinc-400 hover:text-white hover:bg-zinc-800 gap-1.5"
                >
                  {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearConsole}
                  className="h-7 text-[10px] font-bold uppercase text-zinc-400 hover:text-red-400 hover:bg-zinc-800 gap-1.5"
                >
                  <Eraser size={12} />
                  Clear
                </Button>
              </>
            )}
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-0">
            {response ? (
              <SyntaxHighlighter
                language="json"
                style={atomDark}
                customStyle={{
                  margin: 0,
                  padding: '1.5rem',
                  fontSize: '0.875rem',
                  backgroundColor: 'transparent',
                }}
              >
                {JSON.stringify(response, null, 2)}
              </SyntaxHighlighter>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-zinc-600 font-mono text-sm italic">
                {loading ? 'Sending request...' : '// Response will appear here...'}
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};
