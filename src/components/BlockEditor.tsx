import React, { useEffect, useRef } from 'react';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Code from '@editorjs/code';
import LinkTool from '@editorjs/link';
import ImageTool from '@editorjs/image';

interface BlockEditorProps {
  data: any;
  onChange: (data: any, text: string) => void;
  placeholder?: string;
}

export const BlockEditor = ({ data, onChange, placeholder }: BlockEditorProps) => {
  const editorRef = useRef<EditorJS | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Backward compatibility: If data is a string, convert to EditorJS format
    let initialData = data;
    if (typeof data === 'string' && data.trim() !== '') {
      initialData = {
        blocks: [
          {
            type: 'paragraph',
            data: { text: data }
          }
        ]
      };
    } else if (!data || typeof data !== 'object') {
      initialData = { blocks: [] };
    }

    const editor = new EditorJS({
      holder: containerRef.current,
      placeholder: placeholder || 'Start writing your story...',
      data: initialData,
      tools: {
        header: {
          class: Header as any,
          inlineToolbar: ['link'],
          config: { placeholder: 'Enter a header' }
        },
        list: {
          class: List as any,
          inlineToolbar: true
        },
        code: Code,
        linkTool: LinkTool,
        image: {
          class: ImageTool,
          config: {
            // In this simple version, we only support URL-based images as requested
            uploader: {
              uploadByUrl(url: string) {
                return Promise.resolve({
                  success: 1,
                  file: { url }
                });
              }
            }
          }
        }
      },
      onChange: async () => {
        const savedData = await editor.save();
        // Generate plain text for backward compatibility
        const plainText = savedData.blocks
          .map(block => {
            if (block.type === 'paragraph' || block.type === 'header') {
              return block.data.text;
            }
            return '';
          })
          .filter(Boolean)
          .join('\n\n');
        
        onChange(savedData, plainText);
      }
    });

    editorRef.current = editor;

    return () => {
      if (editorRef.current && typeof editorRef.current.destroy === 'function') {
        editorRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="prose prose-blue dark:prose-invert max-w-none border border-gray-200 dark:border-gray-800 rounded-xl p-6 bg-white dark:bg-[#161B22] min-h-[400px]">
      <div ref={containerRef} className="dark:text-gray-100" />
      <style>{`
        .ce-block__content, .ce-toolbar__content { max-width: 100% !important; }
        .cdx-block { max-width: 100% !important; }
        .dark .ce-toolbar__plus, .dark .ce-toolbar__settings-btn {
          color: #9ca3af;
          background-color: #1f2937;
        }
        .dark .ce-toolbar__plus:hover, .dark .ce-toolbar__settings-btn:hover {
          background-color: #374151;
        }
        .dark .ce-popover {
          background-color: #1f2937;
          border-color: #374151;
          color: #f3f4f6;
        }
        .dark .ce-popover__item:hover {
          background-color: #374151;
        }
        .dark .ce-popover__item-icon {
          background-color: #111827;
          color: #f3f4f6;
        }
        .dark .ce-popover__item-label {
          color: #f3f4f6;
        }
        .dark .ce-inline-toolbar {
          background-color: #1f2937;
          border-color: #374151;
          color: #f3f4f6;
        }
        .dark .ce-inline-tool:hover {
          background-color: #374151;
        }
        .dark .ce-inline-tool--active {
          color: #3b82f6;
        }
        .dark .ce-conversion-toolbar {
          background-color: #1f2937;
          border-color: #374151;
        }
        .dark .ce-conversion-tool:hover {
          background-color: #374151;
        }
        .dark .ce-block--selected .ce-block__content {
          background-color: #1e293b;
        }
      `}</style>
    </div>
  );
};
