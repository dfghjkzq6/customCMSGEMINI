import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { Plus, Edit2, Trash2, X, Save, Database, ArrowLeft, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ConfirmModal } from '../components/ConfirmModal';
import { logAction, AuditAction } from '../services/auditService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
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
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Field {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'text' | 'select';
}

interface DataModel {
  id: string;
  name: string;
  collectionName: string;
  fields: Field[];
}

export const DynamicCRUD = ({ models }: { models: DataModel[] }) => {
  const { collectionName } = useParams<{ collectionName: string }>();
  const model = models.find(m => m.collectionName === collectionName);
  
  const [items, setItems] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!collectionName) return;

    const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(data);
      setLoading(false);
    }, (error) => {
      // If collection doesn't exist or is empty, it might error on orderBy if no index
      // For simplicity, we just catch it
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName]);

  if (!model) return <div className="p-12 text-center">Model not found</div>;

  const handleOpenForm = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setFormData({ ...item });
    } else {
      setEditingItem(null);
      const initialData: any = {};
      model.fields.forEach(f => {
        if (f.type === 'boolean') initialData[f.key] = false;
        else if (f.type === 'number') initialData[f.key] = 0;
        else initialData[f.key] = '';
      });
      setFormData(initialData);
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        updatedAt: serverTimestamp()
      };
      // Remove id from payload if it exists
      delete payload.id;

      if (editingItem) {
        await updateDoc(doc(db, collectionName!, editingItem.id), payload);
        await logAction({
          action: AuditAction.DYNAMIC_UPDATE,
          entityType: model.name,
          entityId: editingItem.id,
          details: `Updated ${model.name} record`,
          metadata: { collectionName: model.collectionName, data: payload }
        });
      } else {
        const docRef = await addDoc(collection(db, collectionName!), {
          ...payload,
          createdAt: serverTimestamp()
        });
        await logAction({
          action: AuditAction.DYNAMIC_CREATE,
          entityType: model.name,
          entityId: docRef.id,
          details: `Created new ${model.name} record`,
          metadata: { collectionName: model.collectionName, data: payload }
        });
      }
      setIsFormOpen(false);
    } catch (error) {
      handleFirestoreError(error, editingItem ? OperationType.UPDATE : OperationType.CREATE, collectionName!);
    }
  };

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, collectionName!, itemToDelete));
      await logAction({
        action: AuditAction.DYNAMIC_DELETE,
        entityType: model.name,
        entityId: itemToDelete,
        details: `Deleted ${model.name} record with ID: ${itemToDelete}`,
        metadata: { collectionName: model.collectionName }
      });
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${itemToDelete}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest bg-primary/5 text-primary border-primary/10">
              Dynamic Collection
            </Badge>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">{model.name}</h2>
          <p className="text-muted-foreground">Manage records for {model.collectionName}.</p>
        </div>
        <Button onClick={() => handleOpenForm()} className="gap-2 font-bold h-11 px-6">
          <Plus size={18} />
          <span>Add {model.name}</span>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {model.fields.map(f => (
                    <TableHead key={f.key}>{f.label}</TableHead>
                  ))}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className="group">
                    {model.fields.map(f => (
                      <TableCell key={f.key}>
                        {f.type === 'boolean' ? (
                          <Badge variant={item[f.key] ? "default" : "secondary"} className="text-[10px] px-2 py-0">
                            {item[f.key] ? 'Yes' : 'No'}
                          </Badge>
                        ) : (
                          <span className="text-sm">{String(item[f.key] || '')}</span>
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                          <MoreHorizontal size={16} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenForm(item)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(item.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={model.fields.length + 1} className="h-40 text-center text-muted-foreground italic">
                      No records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>{editingItem ? `Edit ${model.name}` : `New ${model.name}`}</DialogTitle>
            <DialogDescription>
              Fill in the details for this {model.name} record.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="flex flex-col max-h-[80vh]">
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {model.fields.map(f => (
                  <div key={f.key} className="space-y-2">
                    <Label htmlFor={f.key}>{f.label}</Label>
                    {f.type === 'text' ? (
                      <Textarea
                        id={f.key}
                        required
                        value={formData[f.key] || ''}
                        onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                        className="min-h-[100px]"
                      />
                    ) : f.type === 'boolean' ? (
                      <div className="flex items-center space-x-2 pt-2">
                        <Switch
                          id={f.key}
                          checked={formData[f.key] || false}
                          onCheckedChange={checked => setFormData({ ...formData, [f.key]: checked })}
                        />
                        <Label htmlFor={f.key} className="font-normal text-muted-foreground">
                          {formData[f.key] ? 'Enabled' : 'Disabled'}
                        </Label>
                      </div>
                    ) : f.type === 'number' ? (
                      <Input
                        id={f.key}
                        required
                        type="number"
                        value={formData[f.key] || 0}
                        onChange={e => setFormData({ ...formData, [f.key]: Number(e.target.value) })}
                      />
                    ) : (
                      <Input
                        id={f.key}
                        required
                        type="text"
                        value={formData[f.key] || ''}
                        onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                      />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <DialogFooter className="p-6 border-t bg-muted/20">
              <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="font-bold px-8">
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={`Delete ${model.name}`}
        message={`Are you sure you want to delete this ${model.name}? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
};
