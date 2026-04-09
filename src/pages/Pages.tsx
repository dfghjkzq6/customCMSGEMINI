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
import { Plus, Edit2, Trash2, X, Save, Layers, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ConfirmModal } from '../components/ConfirmModal';

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
      } else {
        await addDoc(collection(db, 'pages'), formData as any);
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
      setIsDeleteModalOpen(false);
      setPageToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `pages/${pageToDelete}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <header className="bg-white dark:bg-[#161B22] border-b border-gray-200 dark:border-gray-800 p-6 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pages</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Define custom admin pages and navigation</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all font-semibold shadow-lg shadow-blue-100 dark:shadow-none"
        >
          <Plus size={20} />
          <span>New Page</span>
        </button>
      </header>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pages.map((page) => (
          <div key={page.id} className="bg-white dark:bg-[#161B22] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl text-purple-600 dark:text-purple-400">
                <Layers size={24} />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleOpenForm(page)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDeleteClick(page.id)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{page.title}</h3>
            <p className="text-xs font-mono text-gray-400 dark:text-gray-500 mb-4">path: /p{page.path}</p>
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">
              Type: {page.type}
            </span>
          </div>
        ))}
        {pages.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-400 dark:text-gray-500 italic">
            No custom pages defined yet.
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
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{editingPage ? 'Edit Page' : 'New Custom Page'}</h3>
                <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Page Title</label>
                    <input
                      required
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0F1115] text-gray-900 dark:text-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. User Management"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Path</label>
                    <input
                      required
                      value={formData.path}
                      onChange={e => setFormData({ ...formData, path: e.target.value.startsWith('/') ? e.target.value : `/${e.target.value}` })}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0F1115] text-gray-900 dark:text-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      placeholder="/users"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Page Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as any, config: {} })}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0F1115] text-gray-900 dark:text-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="static">Static (Markdown/HTML)</option>
                    <option value="list">List (Data Model)</option>
                    <option value="form">Form (Data Model)</option>
                    <option value="api-console">API Console (External API)</option>
                  </select>
                </div>

                {/* Dynamic Config based on Type */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 space-y-4">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Configuration</p>
                  
                  {formData.type === 'static' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Content (HTML/Markdown)</label>
                      <textarea
                        value={formData.config.content || ''}
                        onChange={e => setFormData({ ...formData, config: { ...formData.config, content: e.target.value } })}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0F1115] text-gray-900 dark:text-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        rows={6}
                        placeholder="<h1>Hello World</h1>"
                      />
                    </div>
                  )}

                  {(formData.type === 'list' || formData.type === 'form') && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Select Data Model</label>
                      <select
                        value={formData.config.modelId || ''}
                        onChange={e => setFormData({ ...formData, config: { ...formData.config, modelId: e.target.value } })}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0F1115] text-gray-900 dark:text-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a model...</option>
                        {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                  )}

                  {formData.type === 'api-console' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Select API Connection</label>
                      <select
                        value={formData.config.connectionId || ''}
                        onChange={e => setFormData({ ...formData, config: { ...formData.config, connectionId: e.target.value } })}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0F1115] text-gray-900 dark:text-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a connection...</option>
                        {connections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-2 text-gray-500 dark:text-gray-400 font-bold">Cancel</button>
                  <button type="submit" className="bg-blue-600 text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-blue-100 dark:shadow-none">
                    {editingPage ? 'Update' : 'Create'}
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
        title="Delete Page"
        message="Are you sure you want to delete this page? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
};
