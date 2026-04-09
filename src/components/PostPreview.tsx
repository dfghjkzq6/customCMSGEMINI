import React from 'react';
import { X, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PostPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    title: string;
    content: string;
    contentBlocks?: any;
    status: string;
  };
}

export const PostPreview = ({ isOpen, onClose, post }: PostPreviewProps) => {
  const renderBlocks = (blocks: any[]) => {
    return blocks.map((block, index) => {
      switch (block.type) {
        case 'header':
          const level = block.data.level || 2;
          if (level === 1) return <h1 key={index} className="text-4xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">{block.data.text}</h1>;
          if (level === 2) return <h2 key={index} className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">{block.data.text}</h2>;
          if (level === 3) return <h3 key={index} className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">{block.data.text}</h3>;
          if (level === 4) return <h4 key={index} className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">{block.data.text}</h4>;
          if (level === 5) return <h5 key={index} className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">{block.data.text}</h5>;
          return <h6 key={index} className="text-base font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">{block.data.text}</h6>;
        case 'paragraph':
          return (
            <p key={index} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: block.data.text }} />
          );
        case 'list':
          const ListTag = block.data.style === 'ordered' ? 'ol' : 'ul';
          return (
            <ListTag key={index} className={`list-${block.data.style === 'ordered' ? 'decimal' : 'disc'} ml-6 mb-4 space-y-2 text-gray-700 dark:text-gray-300`}>
              {block.data.items.map((item: string, i: number) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
              ))}
            </ListTag>
          );
        case 'code':
          return (
            <pre key={index} className="bg-gray-900 dark:bg-black text-gray-100 p-4 rounded-xl font-mono text-sm overflow-x-auto mb-4 border border-gray-800">
              <code>{block.data.code}</code>
            </pre>
          );
        case 'image':
          return (
            <figure key={index} className="my-8">
              <img src={block.data.file.url} alt={block.data.caption || ''} className="rounded-xl w-full h-auto shadow-lg" referrerPolicy="no-referrer" />
              {block.data.caption && (
                <figcaption className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2 italic">{block.data.caption}</figcaption>
              )}
            </figure>
          );
        default:
          return null;
      }
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-[#0F1115] w-full max-w-4xl h-full max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-gray-800"
          >
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                  <Eye size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">Post Preview</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">How your post will appear to readers</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 md:p-12">
              <div className="max-w-3xl mx-auto">
                <div className="mb-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    post.status === 'published' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {post.status}
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-gray-100 mb-8 leading-tight">
                  {post.title || 'Untitled Post'}
                </h1>
                
                <div className="prose prose-blue dark:prose-invert max-w-none">
                  {post.contentBlocks && post.contentBlocks.blocks ? (
                    renderBlocks(post.contentBlocks.blocks)
                  ) : (
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {post.content || 'No content yet...'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
