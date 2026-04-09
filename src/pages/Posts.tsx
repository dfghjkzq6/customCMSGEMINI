import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { Plus, Edit2, Trash2, X, Save, FileText, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { BlockEditor } from '../components/BlockEditor';
import { PostPreview } from '../components/PostPreview';
import { ConfirmModal } from '../components/ConfirmModal';

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  contentBlocks?: any;
  status: 'draft' | 'published';
  createdAt: any;
  updatedAt: any;
}

export const Posts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    contentBlocks: null as any,
    status: 'draft' as 'draft' | 'published'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'posts');
    });

    return () => unsubscribe();
  }, []);

  const handleOpenForm = (post?: Post) => {
    if (post) {
      setEditingPost(post);
      setFormData({
        title: post.title,
        slug: post.slug,
        content: post.content,
        contentBlocks: post.contentBlocks || null,
        status: post.status
      });
    } else {
      setEditingPost(null);
      setFormData({
        title: '',
        slug: '',
        content: '',
        contentBlocks: null,
        status: 'draft'
      });
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

      if (editingPost) {
        await updateDoc(doc(db, 'posts', editingPost.id), payload);
      } else {
        await addDoc(collection(db, 'posts'), {
          ...payload,
          createdAt: serverTimestamp()
        });
      }
      setIsFormOpen(false);
    } catch (error) {
      handleFirestoreError(error, editingPost ? OperationType.UPDATE : OperationType.CREATE, 'posts');
    }
  };

  const handleDeleteClick = (id: string) => {
    setPostToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'posts', postToDelete));
      setIsDeleteModalOpen(false);
      setPostToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `posts/${postToDelete}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '...';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <header className="bg-white border-b border-gray-200 p-6 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Posts</h2>
          <p className="text-sm text-gray-500">Manage your blog content and drafts</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all font-semibold shadow-lg shadow-blue-100"
        >
          <Plus size={20} />
          <span>New Post</span>
        </button>
      </header>

      <div className="p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200">
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Slug</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <AnimatePresence initial={false}>
                  {posts.map((post) => (
                    <motion.tr
                      key={post.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group hover:bg-blue-50/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{post.title}</div>
                        <div className="text-xs text-gray-400 truncate max-w-xs">{post.content.substring(0, 60)}...</div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-mono text-xs">{post.slug}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          post.status === 'published' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">{formatDate(post.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenForm(post)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(post.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {posts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-gray-400 italic">
                      No posts yet. Start by creating one!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Full Screen Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-[100] bg-white overflow-y-auto">
            <div className="max-w-5xl mx-auto p-6 md:p-12">
              <div className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsFormOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                  <h3 className="text-3xl font-bold text-gray-900">
                    {editingPost ? 'Edit Post' : 'New Post'}
                  </h3>
                </div>
                <div className="flex gap-4">
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
                    className="px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                  <button
                    onClick={() => setIsPreviewOpen(true)}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-xl transition-all font-bold"
                  >
                    <Eye size={20} />
                    <span>Preview</span>
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl transition-all font-bold shadow-lg shadow-blue-100"
                  >
                    <Save size={20} />
                    <span>{editingPost ? 'Update' : 'Publish'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-8">
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full text-5xl font-black border-none outline-none placeholder:text-gray-200"
                  placeholder="Post Title"
                />
                
                <div className="flex items-center gap-2 text-gray-400 font-mono text-sm border-b border-gray-100 pb-4">
                  <span>/</span>
                  <input
                    required
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="flex-1 border-none outline-none focus:text-blue-600"
                    placeholder="post-url-slug"
                  />
                </div>

                <div className="mt-8">
                  <BlockEditor 
                    data={formData.contentBlocks || formData.content}
                    onChange={(blocks, text) => setFormData({ ...formData, contentBlocks: blocks, content: text })}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <PostPreview 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        post={{
          title: formData.title,
          content: formData.content,
          contentBlocks: formData.contentBlocks,
          status: formData.status
        }}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
};
