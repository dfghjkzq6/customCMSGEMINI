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
import { Plus, Edit2, Trash2, X, Save, Layers, Settings, MoreHorizontal, Layout as LayoutIcon } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Page {
  id: string;
  title: string;
  path: string;
  type: 'list' | 'form' | 'api-console' | 'static';
  config: any;
}

export const Pages = ({ models, connections }: { models: any[], connections: any[] }) => {
  const [pages, setPages] = useState<Page[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [formData, setFormData] = useState<Omit<Page, 'id'>>({
    title: '',
    path: '',
    type: 'static',
    config: {}
  });

  useEffect(() => {
    const q = query(collection(db, 'pages'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Page[];
      setPages(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'pages');
    });

    return () => unsubscribe();
  }, []);

  const handleOpenForm = (page?: Page) => {
    if (page) {
      setEditingPage(page);
      setFormData({
        title: page.title,
        path: page.path,
        type: page.type,
        config: page.config || {}
      });
    } else {
      setEditingPage(null);
      setFormData({
        title: '',
        path: '',
        type: 'static',
        config: {}
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPage) {
        await updateDoc(doc(db, 'pages', editingPage.id), formData as any);
        await logAction({
          action: AuditAction.UPDATE_PAGE,
          entityType: 'Page',
          entityId: editingPage.id,
          details: `Updated page: ${formData.title}`,
          metadata: { title: formData.title, type: formData.type }
        });
      } else {
        const docRef = await addDoc(collection(db, 'pages'), formData as any);
        await logAction({
          action: AuditAction.CREATE_PAGE,
          entityType: 'Page',
          entityId: docRef.id,
          details: `Created new page: ${formData.title}`,
          metadata: { title: formData.title, type: formData.type }
        });
      }
      setIsFormOpen(false);
    } catch (error) {
      handleFirestoreError(error, editingPage ? OperationType.UPDATE : OperationType.CREATE, 'pages');
    }
  };

  const handleDeleteClick = (id: string) => {
    setPageToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!pageToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'pages', pageToDelete));
      await logAction({
        action: AuditAction.DELETE_PAGE,
        entityType: 'Page',
        entityId: pageToDelete,
        details: `Deleted page with ID: ${pageToDelete}`
      });
      setIsDeleteModalOpen(false);
      setPageToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `pages/${pageToDelete}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pages</h2>
          <p className="text-muted-foreground">Define custom admin pages and navigation.</p>
        </div>
        <Button onClick={() => handleOpenForm()} className="gap-2 font-bold h-11 px-6">
          <Plus size={18} />
          <span>New Page</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pages.map((page) => (
          <Card key={page.id} className="group hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="bg-purple-500/10 p-2.5 rounded-lg text-purple-500">
                <Layers size={20} />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" />}>
                  <MoreHorizontal size={16} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleOpenForm(page)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDeleteClick(page.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="pt-4">
              <CardTitle className="text-xl">{page.title}</CardTitle>
              <CardDescription className="font-mono text-[10px] mt-1">
                path: /p{page.path}
              </CardDescription>
              
              <div className="mt-6 flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider px-2 py-0">
                  Type: {page.type}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {pages.length === 0 && (
          <div className="col-span-full py-20 text-center text-muted-foreground italic border-2 border-dashed rounded-2xl">
            No custom pages defined yet.
          </div>
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh]">
          <DialogHeader className="p-6 pb-0 shrink-0">
            <DialogTitle>{editingPage ? 'Edit Page' : 'New Custom Page'}</DialogTitle>
            <DialogDescription>
              Create a new navigation entry and configure its behavior.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto relative">
            <div className="p-6 space-y-6 pb-32">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pageTitle">Page Title</Label>
                  <Input
                    id="pageTitle"
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. User Management"
                    className="text-base md:text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pagePath">Path</Label>
                  <Input
                    id="pagePath"
                    required
                    value={formData.path}
                    onChange={e => setFormData({ ...formData, path: e.target.value.startsWith('/') ? e.target.value : `/${e.target.value}` })}
                    className="font-mono text-base md:text-sm"
                    placeholder="/users"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pageType">Page Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(val) => setFormData({ ...formData, type: val as any, config: {} })}
                >
                  <SelectTrigger id="pageType" className="w-full text-base md:text-sm h-10">
                    <SelectValue placeholder="Select Page Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="static">Static (Markdown/HTML)</SelectItem>
                    <SelectItem value="list">List (Data Model)</SelectItem>
                    <SelectItem value="form">Form (Data Model)</SelectItem>
                    <SelectItem value="api-console">API Console (External API)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dynamic Config based on Type */}
              <div className="bg-muted/50 p-6 rounded-xl border space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Settings size={14} className="text-muted-foreground" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Configuration</span>
                </div>
                
                {formData.type === 'static' && (
                  <div className="space-y-2">
                    <Label htmlFor="staticContent" className="text-xs">Content (HTML/Markdown)</Label>
                    <Textarea
                      id="staticContent"
                      value={formData.config.content || ''}
                      onChange={e => setFormData({ ...formData, config: { ...formData.config, content: e.target.value } })}
                      className="font-mono text-base md:text-sm min-h-[200px]"
                      placeholder="<h1>Hello World</h1>"
                    />
                  </div>
                )}

                {(formData.type === 'list' || formData.type === 'form') && (
                  <div className="space-y-2">
                    <Label htmlFor="modelId" className="text-xs">Select Data Model</Label>
                    <Select
                      value={formData.config.modelId || ''}
                      onValueChange={(val) => setFormData({ ...formData, config: { ...formData.config, modelId: val } })}
                    >
                      <SelectTrigger id="modelId" className="w-full text-base md:text-sm h-10">
                        <SelectValue placeholder="Select a model..." />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.type === 'api-console' && (
                  <div className="space-y-2">
                    <Label htmlFor="connectionId" className="text-xs">Select API Connection</Label>
                    <Select
                      value={formData.config.connectionId || ''}
                      onValueChange={(val) => setFormData({ ...formData, config: { ...formData.config, connectionId: val } })}
                    >
                      <SelectTrigger id="connectionId" className="w-full text-base md:text-sm h-10">
                        <SelectValue placeholder="Select a connection..." />
                      </SelectTrigger>
                      <SelectContent>
                        {connections.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="p-6 border-t bg-background sticky bottom-0 z-10 shrink-0 sm:flex-row flex-col gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" className="font-bold px-8 w-full sm:w-auto">
                {editingPage ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Page"
        message="Are you sure you want to delete this page? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
};
