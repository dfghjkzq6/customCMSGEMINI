import React from 'react';
import { BookOpen, Copy, Check } from 'lucide-react';

export const APIDocs = ({ models }: { models: any[] }) => {
  const [copied, setCopied] = React.useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex-1 p-6 lg:p-12 max-w-5xl mx-auto space-y-12">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <BookOpen className="text-blue-600 dark:text-blue-400" size={32} />
          <h1 className="text-4xl font-black text-gray-900 dark:text-gray-100">REST API Documentation</h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-lg">Automatically generated endpoints for your custom data models.</p>
      </div>

      <div className="space-y-16">
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
            <section key={model.id} className="space-y-6">
              <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{model.name} API</h2>
                <p className="text-sm font-mono text-gray-400 dark:text-gray-500">Base Path: /api/{model.collectionName}</p>
              </div>

              <div className="space-y-8">
                {endpoints.map((ep, i) => (
                  <div key={i} className="bg-white dark:bg-[#161B22] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-lg text-xs font-black ${
                          ep.method === 'GET' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          ep.method === 'POST' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          ep.method === 'PUT' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {ep.method}
                        </span>
                        <code className="text-sm font-bold text-gray-700 dark:text-gray-300">{ep.path || '/'}</code>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{ep.desc}</p>
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="relative group">
                        <pre className="bg-gray-900 dark:bg-black text-gray-300 p-4 rounded-xl text-xs overflow-x-auto border dark:border-gray-800">
                          {`curl -X ${ep.method} ${baseUrl}${ep.path}`}
                        </pre>
                        <button 
                          onClick={() => handleCopy(`curl -X ${ep.method} ${baseUrl}${ep.path}`, `${model.id}-${i}`)}
                          className="absolute top-2 right-2 p-2 bg-gray-800 text-gray-400 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {copied === `${model.id}-${i}` ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                      {ep.body && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Sample Payload</p>
                          <pre className="bg-gray-50 dark:bg-gray-800/30 text-gray-600 dark:text-gray-400 p-4 rounded-xl text-xs border border-gray-100 dark:border-gray-800">
                            {JSON.stringify(ep.body, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {models.length === 0 && (
          <div className="py-20 text-center bg-gray-50 dark:bg-gray-800/30 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
            <p className="text-gray-400 dark:text-gray-500 italic">No custom data models defined yet. API documentation will appear here once you create a model.</p>
          </div>
        )}
      </div>
    </div>
  );
};
