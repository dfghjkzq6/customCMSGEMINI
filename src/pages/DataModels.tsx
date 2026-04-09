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
import { Plus, Edit2, Trash2, X, Save, Database, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ConfirmModal } from '../components/ConfirmModal';

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
    try {
      if (editingModel) {
        await updateDoc(doc(db, 'dataModels', editingModel.id), formData as any);
      } else {
        await addDoc(collection(db, 'dataModels'), formData as any);
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
      setIsDeleteModalOpen(false);
      setModelToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `dataModels/${modelToDelete}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <header className="bg-white border-b border-gray-200 p-6 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Models</h2>
          <p className="text-sm text-gray-500">Define custom collections and their schemas</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all font-semibold shadow-lg shadow-blue-100"
        >
          <Plus size={20} />
          <span>New Model</span>
        </button>
      </header>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models.map((model) => (
          <div key={model.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                <Database size={24} />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleOpenForm(model)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDeleteClick(model.id)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{model.name}</h3>
            <p className="text-xs font-mono text-gray-400 mb-4">collection: {model.collectionName}</p>
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fields</p>
              <div className="flex flex-wrap gap-2">
                {model.fields.map((f, i) => (
                  <span key={i} className="px-2 py-1 bg-gray-100 rounded text-[10px] font-medium text-gray-600">
                    {f.label} ({f.type})
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
        {models.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-400 italic">
            No data models defined yet.
          </div>
        )}
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold">{editingModel ? 'Edit Model' : 'New Data Model'}</h3>
                <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Model Name</label>
                    <input
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Products"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Collection Name</label>
                    <input
                      required
                      value={formData.collectionName}
                      onChange={e => setFormData({ ...formData, collectionName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      placeholder="e.g. products"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fields Configuration</label>
                    <button type="button" onClick={addField} className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline">
                      <Plus size={14} /> Add Field
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.fields.map((field, index) => (
                      <div key={index} className="flex gap-3 items-end bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] text-gray-400 font-bold uppercase">Label</label>
                          <input
                            required
                            value={field.label}
                            onChange={e => updateField(index, { label: e.target.value })}
                            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                            placeholder="Display Name"
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] text-gray-400 font-bold uppercase">Key</label>
                          <input
                            required
                            value={field.key}
                            onChange={e => updateField(index, { key: e.target.value })}
                            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-mono"
                            placeholder="field_key"
                          />
                        </div>
                        <div className="w-32 space-y-1">
                          <label className="text-[10px] text-gray-400 font-bold uppercase">Type</label>
                          <select
                            value={field.type}
                            onChange={e => updateField(index, { type: e.target.value as any })}
                            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                          >
                            <option value="string">String</option>
                            <option value="number">Number</option>
                            <option value="boolean">Boolean</option>
                            <option value="text">Long Text</option>
                            <option value="select">Select</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeField(index)}
                          className="p-2 text-gray-400 hover:text-red-600"
                          disabled={formData.fields.length === 1}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-2 text-gray-500 font-bold">Cancel</button>
                  <button type="submit" className="bg-blue-600 text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-blue-100">
                    {editingModel ? 'Update Model' : 'Create Model'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
