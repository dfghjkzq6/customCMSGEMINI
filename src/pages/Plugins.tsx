import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Puzzle, Power, PowerOff, Play, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

interface Plugin {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  collections?: string[];
  hasPanel?: boolean;
  pageRef?: string;
  apiRef?: string;
  createdAt: any;
}

export const Plugins = () => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningPlugin, setRunningPlugin] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'plugins'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Plugin[];
      setPlugins(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'plugins');
    });

    return () => unsubscribe();
  }, []);

  const toggleStatus = async (plugin: Plugin) => {
    const newStatus = plugin.status === 'active' ? 'inactive' : 'active';
    const endpoint = `/api/plugins/${plugin.id}/${newStatus === 'active' ? 'activate' : 'deactivate'}`;
    
    try {
      await axios.post(endpoint);
      toast.success(`Plugin ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      toast.error(`Failed to update plugin: ${error.message}`);
    }
  };

  const runPlugin = async (plugin: Plugin) => {
    setRunningPlugin(plugin.id);
    try {
      // Extract folder name from apiRef or assume it's the slugified name
      const folder = plugin.name.toLowerCase().replace(/\s+/g, '-');
      const response = await axios.post(`/api/plugins/${folder}/run`, { timestamp: new Date() });
      toast.success(`Plugin Result: ${JSON.stringify(response.data)}`);
    } catch (error: any) {
      toast.error(`Plugin execution failed: ${error.message}`);
    } finally {
      setRunningPlugin(null);
    }
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Plugins</h2>
          <p className="text-muted-foreground">Manage and execute system extensions.</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()} className="gap-2 font-bold">
          <RefreshCw size={18} />
          <span>Scan for Plugins</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plugins.map((plugin) => (
          <Card key={plugin.id} className="group hover:shadow-md transition-all border-l-4 border-l-transparent data-[status=active]:border-l-green-500" data-status={plugin.status}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="bg-blue-500/10 p-2.5 rounded-lg text-blue-500">
                <Puzzle size={20} />
              </div>
              <Badge variant={plugin.status === 'active' ? 'default' : 'secondary'} className="font-bold uppercase tracking-wider text-[10px]">
                {plugin.status}
              </Badge>
            </CardHeader>
            <CardContent className="pt-4">
              <CardTitle className="text-xl">{plugin.name}</CardTitle>
              <CardDescription className="mt-2 line-clamp-2">
                Extends system with: {plugin.collections?.join(', ') || 'No collections'}
              </CardDescription>
              
              <div className="mt-6 flex flex-wrap gap-2">
                <Button 
                  variant={plugin.status === 'active' ? 'outline' : 'default'} 
                  size="sm" 
                  className="gap-2"
                  onClick={() => toggleStatus(plugin)}
                >
                  {plugin.status === 'active' ? <PowerOff size={14} /> : <Power size={14} />}
                  <span>{plugin.status === 'active' ? 'Deactivate' : 'Activate'}</span>
                </Button>

                {plugin.status === 'active' && (
                  <>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="gap-2"
                      onClick={() => runPlugin(plugin)}
                      disabled={runningPlugin === plugin.id}
                    >
                      <Play size={14} className={runningPlugin === plugin.id ? 'animate-pulse' : ''} />
                      <span>{runningPlugin === plugin.id ? 'Running...' : 'Run'}</span>
                    </Button>
                    
                    {plugin.hasPanel && plugin.pageRef && (
                      <Button variant="ghost" size="sm" className="gap-2" render={<a href={plugin.pageRef} />}>
                        <ExternalLink size={14} />
                        <span>Panel</span>
                      </Button>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {plugins.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center text-muted-foreground italic border-2 border-dashed rounded-2xl">
            No plugins found in /plugins directory.
          </div>
        )}
      </div>
    </div>
  );
};
