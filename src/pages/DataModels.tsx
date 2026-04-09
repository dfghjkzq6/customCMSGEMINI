import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { Plus, Edit2, Trash2, X, Save, Database, Settings, MoreHorizontal, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ConfirmModal } from '../components/ConfirmModal';
import { logAction, AuditAction } from '../services/auditService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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

export const DataModels = () => {
  const [models, setModels] = useState<DataModel[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingModel, setEditingModel] = useState<DataModel | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<DataModel, 'id'>>({
    name: '',
    collectionName: '',
    fields: [{ key: '', label: '', type: 'string' }]
  });

  useEffect(() => {
    const q = query(collection(db, 'dataModels'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const modelsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DataModel[];
      setModels(modelsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'dataModels');
    });

    return () => unsubscribe();
  }, []);

  const handleOpenForm = (model?: DataModel) => {
    if (model) {
      setEditingModel(model);
      setFormData({
        name: model.name,
        collectionName: model.collectionName,
        fields: [...model.fields]
      });
    } else {
      setEditingModel(null);
      setFormData({
        name: '',
        collectionName: '',
        fields: [{ key: '', label: '', type: 'string' }]
      });
    }
    setValidationError(null);
    setIsFormOpen(true);
  };

  const addField = () => {
    setFormData({
      ...formData,
      fields: [...formData.fields, { key: '', label: '', type: 'string' }]
    });
  };

  const removeField = (index: number) => {
    const newFields = formData.fields.filter((_, i) => i !== index);
    setFormData({ ...formData, fields: newFields });
  };

  const updateField = (index: number, field: Partial<Field>) => {
    const newFields = [...formData.fields];
    newFields[index] = { ...newFields[index], ...field };
    setFormData({ ...formData, fields: newFields });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation
    const keys = formData.fields.map(f => f.key.trim());
    const uniqueKeys = new Set(keys);
    
    if (uniqueKeys.size !== keys.length) {
      setValidationError('Field keys must be unique within a model.');
      return;
    }

    const identifierRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    for (const key of keys) {
      if (!identifierRegex.test(key)) {
        setValidationError(`Invalid field key: "${key}". Keys must start with a letter and contain only letters, numbers, and underscores.`);
        return;
      }
    }

    try {
      if (editingModel) {
        await updateDoc(doc(db, 'dataModels', editingModel.id), formData as any);
        await logAction({
          action: AuditAction.UPDATE_MODEL,
          entityType: 'DataModel',
          entityId: editingModel.id,
          details: `Updated data model: ${formData.name}`,
          metadata: { name: formData.name, collectionName: formData.collectionName }
        });
      } else {
        const docRef = await addDoc(collection(db, 'dataModels'), formData as any);
        await logAction({
          action: AuditAction.CREATE_MODEL,
          entityType: 'DataModel',
          entityId: docRef.id,
          details: `Created new data model: ${formData.name}`,
          metadata: { name: formData.name, collectionName: formData.collectionName }
        });
      }
      setIsFormOpen(false);
    } catch (error) {
      handleFirestoreError(error, editingModel ? OperationType.UPDATE : OperationType.CREATE, 'dataModels');
    }
  };

  const handleDeleteClick = (id: string) => {
    setModelToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!modelToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'dataModels', modelToDelete));
      await logAction({
        action: AuditAction.DELETE_MODEL,
        entityType: 'DataModel',
        entityId: modelToDelete,
        details: `Deleted data model with ID: ${modelToDelete}`
      });
      setIsDeleteModalOpen(false);
      setModelToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `dataModels/${modelToDelete}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Data Models</h2>
          <p className="text-muted-foreground">Define custom collections and their schemas.</p>
        </div>
        <Button onClick={() => handleOpenForm()} className="gap-2 font-bold h-11 px-6">
          <Plus size={18} />
          <span>New Model</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models.map((model) => (
          <Card key={model.id} className="group hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="bg-primary/10 p-2.5 rounded-lg text-primary">
                <Database size={20} />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" />}>
                  <MoreHorizontal size={16} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleOpenForm(model)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDeleteClick(model.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="pt-4">
              <CardTitle className="text-xl">{model.name}</CardTitle>
              <CardDescription className="font-mono text-[10px] mt-1">
                collection: {model.collectionName}
              </CardDescription>
              
              <div className="mt-6 space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Fields</p>
                <div className="flex flex-wrap gap-1.5">
                  {model.fields.map((f, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px] font-medium px-2 py-0">
                      {f.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {models.length === 0 && (
          <div className="col-span-full py-20 text-center text-muted-foreground italic border-2 border-dashed rounded-2xl">
            No data models defined yet.
          </div>
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>{editingModel ? 'Edit Model' : 'New Data Model'}</DialogTitle>
            <DialogDescription>
              Configure your data collection schema and field types.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="flex flex-col max-h-[80vh]">
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {validationError && (
                  <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex items-start gap-3 text-destructive text-sm">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <p>{validationError}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="modelName">Model Name</Label>
                    <Input
                      id="modelName"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Products"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="collectionName">Collection Name</Label>
                    <Input
                      id="collectionName"
                      required
                      value={formData.collectionName}
                      onChange={e => setFormData({ ...formData, collectionName: e.target.value })}
                      className="font-mono"
                      placeholder="e.g. products"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fields Configuration</Label>
                    <Button type="button" variant="ghost" size="sm" onClick={addField} className="text-primary hover:text-primary hover:bg-primary/10 gap-1 h-8">
                      <Plus size={14} /> 
                      <span>Add Field</span>
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {formData.fields.map((field, index) => (
                      <div key={index} className="flex gap-3 items-end bg-muted/50 p-4 rounded-xl border relative group/field">
                        <div className="flex-1 space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-muted-foreground">Label</Label>
                          <Input
                            required
                            value={field.label}
                            onChange={e => updateField(index, { label: e.target.value })}
                            placeholder="Display Name"
                            className="h-9"
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-muted-foreground">Key</Label>
                          <Input
                            required
                            value={field.key}
                            onChange={e => updateField(index, { key: e.target.value })}
                            placeholder="field_key"
                            className="h-9 font-mono"
                          />
                        </div>
                        <div className="w-32 space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-muted-foreground">Type</Label>
                          <Select
                            value={field.type}
                            onValueChange={(val) => updateField(index, { type: val as any })}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="string">String</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="boolean">Boolean</SelectItem>
                              <SelectItem value="text">Long Text</SelectItem>
                              <SelectItem value="select">Select</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeField(index)}
                          className="h-9 w-9 text-muted-foreground hover:text-destructive"
                          disabled={formData.fields.length === 1}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="p-6 border-t bg-muted/20">
              <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="font-bold px-8">
                {editingModel ? 'Update Model' : 'Create Model'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Data Model"
        message="Are you sure? This will NOT delete the actual data collection, only the model definition."
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
};
