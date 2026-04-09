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
  Timestamp,
  limit,
  startAfter,
  getCountFromServer
} from 'firebase/firestore';
import { Plus, Edit2, Trash2, X, Save, FileText, Eye, MoreHorizontal, Image as ImageIcon, Tag, Hash, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { BlockEditor } from '../components/BlockEditor';
import { PostPreview } from '../components/PostPreview';
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
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  contentBlocks?: any;
  status: 'draft' | 'published';
  featuredImage?: string;
  tags?: string[];
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    contentBlocks: null as any,
    status: 'draft' as 'draft' | 'published',
    featuredImage: '',
    tags: [] as string[]
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [firstDoc, setFirstDoc] = useState<any>(null);
  const pageSize = 10;
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchTotal = async () => {
      const coll = collection(db, 'posts');
      const snapshot = await getCountFromServer(coll);
      setTotalPosts(snapshot.data().count);
    };
    fetchTotal();
  }, []);

  useEffect(() => {
    let q = query(
      collection(db, 'posts'), 
      orderBy('createdAt', 'desc'), 
      limit(pageSize)
    );

    if (currentPage > 1 && lastDoc) {
      q = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(pageSize)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(postsData);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setFirstDoc(snapshot.docs[0]);
      setLoading(false);
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'posts');
      } catch (wrappedError: any) {
        toast.error('Failed to load posts. Please check your permissions.');
      }
    });

    return () => unsubscribe();
  }, [currentPage]);

  const totalPages = Math.ceil(totalPosts / pageSize);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFormData({ ...formData, featuredImage: url });
    }
  };

  const handleOpenForm = (post?: Post) => {
    if (post) {
      setEditingPost(post);
      setFormData({
        title: post.title,
        slug: post.slug,
        content: post.content,
        contentBlocks: post.contentBlocks || null,
        status: post.status,
        featuredImage: post.featuredImage || '',
        tags: post.tags || []
      });
    } else {
      setEditingPost(null);
      setFormData({
        title: '',
        slug: '',
        content: '',
        contentBlocks: null,
        status: 'draft',
        featuredImage: '',
        tags: []
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic Validation
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formData.slug.trim()) {
      toast.error('Slug is required');
      return;
    }
    if (!formData.content.trim() && (!formData.contentBlocks || !formData.contentBlocks.blocks || formData.contentBlocks.blocks.length === 0)) {
      toast.error('Content is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        updatedAt: serverTimestamp()
      };

      if (editingPost) {
        await updateDoc(doc(db, 'posts', editingPost.id), payload);
        await logAction({
          action: AuditAction.UPDATE_POST,
          entityType: 'Post',
          entityId: editingPost.id,
          details: `Updated post: ${payload.title}`,
          metadata: { title: payload.title, status: payload.status }
        });
        toast.success('Post updated successfully');
      } else {
        const docRef = await addDoc(collection(db, 'posts'), {
          ...payload,
          createdAt: serverTimestamp()
        });
        await logAction({
          action: AuditAction.CREATE_POST,
          entityType: 'Post',
          entityId: docRef.id,
          details: `Created new post: ${payload.title}`,
          metadata: { title: payload.title, status: payload.status }
        });
        toast.success('Post created successfully');
      }
      setIsFormOpen(false);
    } catch (error: any) {
      try {
        // Log the error using our standard handler
        handleFirestoreError(error, editingPost ? OperationType.UPDATE : OperationType.CREATE, 'posts');
      } catch (wrappedError: any) {
        // Parse the wrapped error to show a nice message
        try {
          const errInfo = JSON.parse(wrappedError.message);
          const errorMessage = errInfo.error || 'Unknown error';
          
          if (errorMessage.includes('permission-denied')) {
            toast.error('Permission denied: You do not have rights to save posts.');
          } else if (errorMessage.includes('quota-exceeded')) {
            toast.error('Quota exceeded: Please try again later.');
          } else {
            toast.error(`Failed to save post: ${errorMessage}`);
          }
        } catch (parseError) {
          toast.error('An unexpected error occurred while saving the post.');
        }
      }
    } finally {
      setIsSubmitting(false);
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
      await logAction({
        action: AuditAction.DELETE_POST,
        entityType: 'Post',
        entityId: postToDelete,
        details: `Deleted post with ID: ${postToDelete}`
      });
      toast.success('Post deleted successfully');
      setIsDeleteModalOpen(false);
      setPostToDelete(null);
    } catch (error: any) {
      try {
        handleFirestoreError(error, OperationType.DELETE, `posts/${postToDelete}`);
      } catch (wrappedError: any) {
        try {
          const errInfo = JSON.parse(wrappedError.message);
          const errorMessage = errInfo.error || 'Unknown error';
          if (errorMessage.includes('permission-denied')) {
            toast.error('Permission denied: You do not have rights to delete posts.');
          } else {
            toast.error(`Failed to delete post: ${errorMessage}`);
          }
        } catch (e) {
          toast.error('An unexpected error occurred while deleting the post.');
        }
      }
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
    <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Posts</h2>
          <p className="text-muted-foreground">Manage your blog content and drafts.</p>
        </div>
        <Button onClick={() => handleOpenForm()} className="gap-2 font-bold h-11 px-6">
          <Plus size={18} />
          <span>New Post</span>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Title</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence initial={false}>
                    {posts.map((post) => (
                      <TableRow key={post.id} className="group">
                        <TableCell>
                          <div className="font-semibold">{post.title}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                            {post.content.substring(0, 60)}...
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-[10px] text-muted-foreground">
                          {post.slug}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={post.status === 'published' ? 'default' : 'secondary'}
                            className={cn(
                              "uppercase text-[10px] font-bold tracking-wider px-2 py-0.5",
                              post.status === 'published' ? "bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20" : ""
                            )}
                          >
                            {post.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(post.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                              <MoreHorizontal size={16} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenForm(post)}>
                                <Edit2 className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClick(post.id)}
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
                  </AnimatePresence>
                  {posts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-40 text-center text-muted-foreground italic">
                        No posts yet. Start by creating one!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t bg-muted/30">
                  <div className="text-xs text-muted-foreground font-medium">
                    Showing {posts.length} of {totalPosts} posts
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="h-8 px-3 gap-1"
                    >
                      <ChevronLeft size={14} />
                      <span>Prev</span>
                    </Button>
                    <div className="text-xs font-bold px-2">
                      {currentPage} / {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8 px-3 gap-1"
                    >
                      <span>Next</span>
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Full Screen Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-[100] bg-background overflow-y-auto"
          >
            <div className="max-w-5xl mx-auto p-6 md:p-12">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsFormOpen(false)}
                    className="rounded-full"
                  >
                    <X size={24} />
                  </Button>
                  <h3 className="text-3xl font-bold tracking-tight">
                    {editingPost ? 'Edit Post' : 'New Post'}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg border">
                    <Label htmlFor="status" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</Label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
                      className="bg-transparent border-none outline-none text-sm font-bold cursor-pointer"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => setIsPreviewOpen(true)}
                    className="gap-2 font-bold"
                  >
                    <Eye size={18} />
                    <span>Preview</span>
                  </Button>
                  
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="gap-2 font-bold px-8 min-w-[120px]"
                  >
                    {isSubmitting ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Save size={18} />
                    )}
                    <span>{isSubmitting ? 'Saving...' : (editingPost ? 'Update' : 'Publish')}</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-8">
                <div className="group relative w-full h-[300px] bg-muted rounded-3xl overflow-hidden border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors">
                  {formData.featuredImage ? (
                    <>
                      <img 
                        src={formData.featuredImage} 
                        alt="Featured" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-[2px]">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => fileInputRef.current?.click()}
                          className="gap-2 font-bold"
                        >
                          <Upload size={14} />
                          Change
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => setFormData({ ...formData, featuredImage: '' })}
                          className="gap-2 font-bold"
                        >
                          <Trash2 size={14} />
                          Remove
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div 
                      className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileChange}
                      />
                      <div className="p-4 bg-background rounded-full shadow-sm">
                        <Upload size={32} />
                      </div>
                      <div className="text-center">
                        <p className="font-bold">Click to Upload Image</p>
                        <p className="text-xs">Or paste a URL below</p>
                      </div>
                      <div onClick={e => e.stopPropagation()} className="w-full max-w-xs">
                        <Input 
                          placeholder="Image URL..." 
                          value={formData.featuredImage}
                          onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full text-4xl md:text-6xl font-black border-none outline-none placeholder:text-muted/50 bg-transparent"
                  placeholder="Post Title"
                />
                
                <div className="flex flex-wrap items-center gap-6 text-muted-foreground border-b pb-4">
                  <div className="flex items-center gap-2 font-mono text-sm">
                    <span className="opacity-50">/</span>
                    <input
                      required
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="border-none outline-none focus:text-primary bg-transparent"
                      placeholder="post-url-slug"
                    />
                  </div>
                  
                  <Separator orientation="vertical" className="h-4 hidden md:block" />
                  
                  <div className="flex items-center gap-2">
                    <Tag size={14} />
                    <Input 
                      className="h-7 text-xs border-none bg-transparent focus-visible:ring-0 p-0 w-40"
                      placeholder="Add tags (comma separated)..."
                      value={formData.tags.join(', ')}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                    />
                  </div>
                </div>

                <div className="mt-8">
                  <BlockEditor 
                    data={formData.contentBlocks || formData.content}
                    onChange={(blocks, text) => setFormData({ ...formData, contentBlocks: blocks, content: text })}
                  />
                </div>
              </div>
            </div>
          </motion.div>
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
