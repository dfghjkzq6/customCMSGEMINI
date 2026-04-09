import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query 
} from 'firebase/firestore';
import { Plus, Edit2, Trash2, X, Save, Globe, Terminal, MoreHorizontal, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ConfirmModal } from '../components/ConfirmModal';
import { logAction, AuditAction } from '../services/auditService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface APIConnection {
  id: string;
  name: string;
  baseUrl: string;
  authType: 'none' | 'apiKeyHeader' | 'bearerToken';
  authValue?: string;
  headers?: any;
}

export const APIConnections = () => {
  const [connections, setConnections] = useState<APIConnection[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [connToDelete, setConnToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingConn, setEditingConn] = useState<APIConnection | null>(null);
  const [formData, setFormData] = useState<Omit<APIConnection, 'id'>>({
    name: '',
    baseUrl: '',
    authType: 'none',
    authValue: '',
    headers: {}
  });

  useEffect(() => {
    const q = query(collection(db, 'apiConnections'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as APIConnection[];
      setConnections(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'apiConnections');
    });

    return () => unsubscribe();
  }, []);

  const handleOpenForm = (conn?: APIConnection) => {
    if (conn) {
      setEditingConn(conn);
      setFormData({
        name: conn.name,
        baseUrl: conn.baseUrl,
        authType: conn.authType,
        authValue: conn.authValue || '',
        headers: conn.headers || {}
      });
    } else {
      setEditingConn(null);
      setFormData({
        name: '',
        baseUrl: '',
        authType: 'none',
        authValue: '',
        headers: {}
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingConn) {
        await updateDoc(doc(db, 'apiConnections', editingConn.id), formData as any);
        await logAction({
          action: AuditAction.UPDATE_CONNECTION,
          entityType: 'APIConnection',
          entityId: editingConn.id,
          details: `Updated API connection: ${formData.name}`,
          metadata: { name: formData.name, baseUrl: formData.baseUrl }
        });
      } else {
        const docRef = await addDoc(collection(db, 'apiConnections'), formData as any);
        await logAction({
          action: AuditAction.CREATE_CONNECTION,
          entityType: 'APIConnection',
          entityId: docRef.id,
          details: `Created new API connection: ${formData.name}`,
          metadata: { name: formData.name, baseUrl: formData.baseUrl }
        });
      }
      setIsFormOpen(false);
    } catch (error) {
      handleFirestoreError(error, editingConn ? OperationType.UPDATE : OperationType.CREATE, 'apiConnections');
    }
  };

  const handleDeleteClick = (id: string) => {
    setConnToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!connToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'apiConnections', connToDelete));
      await logAction({
        action: AuditAction.DELETE_CONNECTION,
        entityType: 'APIConnection',
        entityId: connToDelete,
        details: `Deleted API connection with ID: ${connToDelete}`
      });
      setIsDeleteModalOpen(false);
      setConnToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `apiConnections/${connToDelete}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">API Connections</h2>
          <p className="text-muted-foreground">Configure external REST APIs to integrate with your CMS.</p>
        </div>
        <Button onClick={() => handleOpenForm()} className="gap-2 font-bold h-11 px-6">
          <Plus size={18} />
          <span>New Connection</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {connections.map((conn) => (
          <Card key={conn.id} className="group hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="bg-green-500/10 p-2.5 rounded-lg text-green-500">
                <Globe size={20} />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" />}>
                  <MoreHorizontal size={16} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleOpenForm(conn)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDeleteClick(conn.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="pt-4">
              <CardTitle className="text-xl">{conn.name}</CardTitle>
              <CardDescription className="font-mono text-[10px] mt-1 truncate">
                {conn.baseUrl}
              </CardDescription>
              
              <div className="mt-6 flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-muted/50">
                  <ShieldCheck size={10} className="mr-1" />
                  Auth: {conn.authType}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {connections.length === 0 && (
          <div className="col-span-full py-20 text-center text-muted-foreground italic border-2 border-dashed rounded-2xl">
            No API connections configured yet.
          </div>
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingConn ? 'Edit Connection' : 'New API Connection'}</DialogTitle>
            <DialogDescription>
              Set up the base URL and authentication for your external API.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label htmlFor="connName">Connection Name</Label>
              <Input
                id="connName"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Weather API"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="baseUrl">Base URL</Label>
              <Input
                id="baseUrl"
                required
                type="url"
                value={formData.baseUrl}
                onChange={e => setFormData({ ...formData, baseUrl: e.target.value })}
                className="font-mono"
                placeholder="https://api.example.com/v1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="authType">Auth Type</Label>
                <Select
                  value={formData.authType}
                  onValueChange={(val) => setFormData({ ...formData, authType: val as any })}
                >
                  <SelectTrigger id="authType">
                    <SelectValue placeholder="Select Auth Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="apiKeyHeader">API Key (Header)</SelectItem>
                    <SelectItem value="bearerToken">Bearer Token</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.authType !== 'none' && (
                <div className="space-y-2">
                  <Label htmlFor="authValue">Auth Value</Label>
                  <Input
                    id="authValue"
                    required
                    type="password"
                    value={formData.authValue}
                    onChange={e => setFormData({ ...formData, authValue: e.target.value })}
                    placeholder="Secret key..."
                  />
                </div>
              )}
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="font-bold px-8">
                {editingConn ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete API Connection"
        message="Are you sure you want to delete this connection? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
};
