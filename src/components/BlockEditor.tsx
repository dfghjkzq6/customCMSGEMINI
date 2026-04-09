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
    <div className="prose prose-blue max-w-none border border-gray-200 rounded-xl p-6 bg-white min-h-[400px]">
      <div ref={containerRef} />
    </div>
  );
};
