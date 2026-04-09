import React, { useState } from 'react';
import axios from 'axios';
import { Terminal, Send, Loader2, Plus, Trash2, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
        validateStatus: () => true // Don't throw on 4xx/5xx so we can show the response
      });

      setResponse(res.data);
      setStatus(res.status);
      setTime(Date.now() - startTime);
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
    <div className="flex-1 flex flex-col min-w-0 p-6 space-y-6 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
            <Terminal size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">API Console: {connection.name}</h2>
            <p className="text-sm text-gray-500">{connection.baseUrl}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-3">
            <select
              value={method}
              onChange={e => setMethod(e.target.value as any)}
              className="px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold bg-gray-50"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
            <input
              value={endpoint}
              onChange={e => setEndpoint(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              placeholder="/endpoint?query=param"
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl transition-all font-bold shadow-lg shadow-blue-100 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              <span>Send</span>
            </button>
          </div>

          {/* Headers Section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Custom Headers</label>
              <button 
                onClick={addHeader}
                className="text-blue-600 text-[10px] font-bold uppercase flex items-center gap-1 hover:underline"
              >
                <Plus size={12} /> Add Header
              </button>
            </div>
            <div className="space-y-2">
              {headers.map((h, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={h.key}
                    onChange={e => updateHeader(i, 'key', e.target.value)}
                    placeholder="Key"
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-mono"
                  />
                  <input
                    value={h.value}
                    onChange={e => updateHeader(i, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-mono"
                  />
                  <button onClick={() => removeHeader(i)} className="p-1.5 text-gray-400 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {headers.length === 0 && <p className="text-[10px] text-gray-400 italic">No custom headers added.</p>}
            </div>
          </div>

          {(method === 'POST' || method === 'PUT') && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Request Body (JSON)</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows={5}
              />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="flex-1 bg-[#1E1E1E] rounded-2xl p-6 overflow-hidden flex flex-col shadow-xl min-h-[400px]">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Response</p>
            {status && (
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-black uppercase flex items-center gap-1 ${getStatusColor(status)}`}>
                  {status >= 200 && status < 300 ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                  {status} {status >= 200 && status < 300 ? 'OK' : 'Error'}
                </span>
                {time && (
                  <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                    <Clock size={12} /> {time}ms
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-auto rounded-xl">
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
            <div className="h-full flex items-center justify-center text-gray-600 font-mono text-sm italic">
              {loading ? 'Sending request...' : '// Response will appear here...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
