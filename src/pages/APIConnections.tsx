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
import { Plus, Edit2, Trash2, X, Save, Globe, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ConfirmModal } from '../components/ConfirmModal';
import { logAction, AuditAction } from '../services/auditService';

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
    <div className="flex-1 flex flex-col min-w-0">
      <header className="bg-white dark:bg-[#161B22] border-b border-gray-200 dark:border-gray-800 p-6 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">API Connections</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Configure external REST APIs to integrate with your CMS</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all font-semibold shadow-lg shadow-blue-100 dark:shadow-none"
        >
          <Plus size={20} />
          <span>New Connection</span>
        </button>
      </header>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {connections.map((conn) => (
          <div key={conn.id} className="bg-white dark:bg-[#161B22] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl text-green-600 dark:text-green-400">
                <Globe size={24} />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleOpenForm(conn)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDeleteClick(conn.id)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{conn.name}</h3>
            <p className="text-xs font-mono text-gray-400 dark:text-gray-500 mb-4 truncate">{conn.baseUrl}</p>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">
                Auth: {conn.authType}
              </span>
            </div>
          </div>
        ))}
        {connections.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-400 dark:text-gray-500 italic">
            No API connections configured yet.
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
              className="bg-white dark:bg-[#161B22] rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{editingConn ? 'Edit Connection' : 'New API Connection'}</h3>
                <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Connection Name</label>
                  <input
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0F1115] text-gray-900 dark:text-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Weather API"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Base URL</label>
                  <input
                    required
                    type="url"
                    value={formData.baseUrl}
                    onChange={e => setFormData({ ...formData, baseUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0F1115] text-gray-900 dark:text-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="https://api.example.com/v1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Auth Type</label>
                    <select
                      value={formData.authType}
                      onChange={e => setFormData({ ...formData, authType: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0F1115] text-gray-900 dark:text-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="none">None</option>
                      <option value="apiKeyHeader">API Key (Header)</option>
                      <option value="bearerToken">Bearer Token</option>
                    </select>
                  </div>
                  {formData.authType !== 'none' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Auth Value</label>
                      <input
                        required
                        type="password"
                        value={formData.authValue}
                        onChange={e => setFormData({ ...formData, authValue: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0F1115] text-gray-900 dark:text-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Secret key..."
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-2 text-gray-500 dark:text-gray-400 font-bold">Cancel</button>
                  <button type="submit" className="bg-blue-600 text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-blue-100 dark:shadow-none">
                    {editingConn ? 'Update' : 'Create'}
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
        title="Delete API Connection"
        message="Are you sure you want to delete this connection? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
};
