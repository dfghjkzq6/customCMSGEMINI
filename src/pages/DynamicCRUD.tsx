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
import { Plus, Edit2, Trash2, X, Save, Database, ArrowLeft } from 'lucide-react';
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
      } else {
        await addDoc(collection(db, collectionName!), {
          ...payload,
          createdAt: serverTimestamp()
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
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${itemToDelete}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <header className="bg-white border-b border-gray-200 p-6 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{model.name}</h2>
          <p className="text-sm text-gray-500">Manage records for {model.collectionName}</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all font-semibold shadow-lg shadow-blue-100"
        >
          <Plus size={20} />
          <span>Add {model.name}</span>
        </button>
      </header>

      <div className="p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200">
                  {model.fields.map(f => (
                    <th key={f.key} className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">{f.label}</th>
                  ))}
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="group hover:bg-blue-50/30 transition-colors">
                    {model.fields.map(f => (
                      <td key={f.key} className="px-6 py-4 text-sm text-gray-600">
                        {f.type === 'boolean' ? (item[f.key] ? 'Yes' : 'No') : String(item[f.key] || '')}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenForm(item)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteClick(item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={model.fields.length + 1} className="px-6 py-20 text-center text-gray-400 italic">
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold">{editingItem ? `Edit ${model.name}` : `New ${model.name}`}</h3>
                <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {model.fields.map(f => (
                  <div key={f.key} className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{f.label}</label>
                    {f.type === 'text' ? (
                      <textarea
                        required
                        value={formData[f.key] || ''}
                        onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                      />
                    ) : f.type === 'boolean' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData[f.key] || false}
                          onChange={e => setFormData({ ...formData, [f.key]: e.target.checked })}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600">{f.label}</span>
                      </div>
                    ) : f.type === 'number' ? (
                      <input
                        required
                        type="number"
                        value={formData[f.key] || 0}
                        onChange={e => setFormData({ ...formData, [f.key]: Number(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <input
                        required
                        type="text"
                        value={formData[f.key] || ''}
                        onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                ))}
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-2 text-gray-500 font-bold">Cancel</button>
                  <button type="submit" className="bg-blue-600 text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-blue-100">
                    {editingItem ? 'Update' : 'Create'}
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
        title={`Delete ${model.name}`}
        message={`Are you sure you want to delete this ${model.name}? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
};
