import React, { useEffect, useRef, useState } from 'react';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Code from '@editorjs/code';
import LinkTool from '@editorjs/link';
import ImageTool from '@editorjs/image';
import Checklist from '@editorjs/checklist';
import Quote from '@editorjs/quote';
import Table from '@editorjs/table';
import InlineCode from '@editorjs/inline-code';
import Marker from '@editorjs/marker';
import Underline from '@editorjs/underline';
import Paragraph from '@editorjs/paragraph';
import Undo from 'editorjs-undo';
import Embed from '@editorjs/embed';

interface BlockEditorProps {
  data: any;
  onChange: (data: any, text: string) => void;
  placeholder?: string;
}

export const BlockEditor = ({ data, onChange, placeholder }: BlockEditorProps) => {
  const editorRef = useRef<EditorJS | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({ words: 0, readingTime: 0 });

  const calculateStats = (savedData: any) => {
    let text = '';
    savedData.blocks.forEach((block: any) => {
      if (block.data && block.data.text) {
        text += block.data.text + ' ';
      }
    });
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const readingTime = Math.ceil(words / 200); // Average 200 wpm
    setStats({ words, readingTime });
  };

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
    } else if (!data || typeof data !== 'object' || !data.blocks) {
      initialData = { blocks: [] };
    }

    const editor = new EditorJS({
      holder: containerRef.current,
      placeholder: placeholder || 'Start writing your story...',
      data: initialData,
      logLevel: 'ERROR' as any,
      onReady: () => {
        if (initialData) {
          calculateStats(initialData);
        }
        new Undo({ editor });
      },
      tools: {
        paragraph: {
          class: Paragraph,
          inlineToolbar: true,
        },
        header: {
          class: Header as any,
          inlineToolbar: true,
          config: {
            placeholder: 'Enter a header',
            levels: [2, 3, 4],
            defaultLevel: 2
          }
        },
        list: {
          class: List as any,
          inlineToolbar: true,
          config: {
            defaultStyle: 'unordered'
          }
        },
        checklist: {
          class: Checklist,
          inlineToolbar: true,
        },
        quote: {
          class: Quote,
          inlineToolbar: true,
          config: {
            quotePlaceholder: 'Enter a quote',
            captionPlaceholder: 'Quote\'s author',
          },
        },
        table: {
          class: Table as any,
          inlineToolbar: true,
          config: {
            rows: 2,
            cols: 3,
          },
        },
        code: Code,
        inlineCode: InlineCode,
        marker: Marker,
        underline: Underline,
        linkTool: LinkTool,
        embed: {
          class: Embed,
          config: {
            services: {
              youtube: true,
              vimeo: true,
              twitter: true,
              instagram: true,
              facebook: true
            }
          }
        },
        image: {
          class: ImageTool,
          config: {
            endpoints: {
              byFile: '/api/upload-dummy',
              byUrl: '/api/fetch-dummy',
            },
            uploader: {
              uploadByUrl(url: string) {
                return Promise.resolve({
                  success: 1,
                  file: { url }
                });
              },
              uploadByFile(file: File) {
                return Promise.resolve({
                  success: 1,
                  file: { url: URL.createObjectURL(file) }
                });
              }
            }
          }
        },
        video: {
          class: ImageTool,
          config: {
            buttonContent: 'Select Video',
            endpoints: {
              byFile: '/api/upload-dummy',
              byUrl: '/api/fetch-dummy',
            },
            uploader: {
              uploadByUrl(url: string) {
                return Promise.resolve({
                  success: 1,
                  file: { url }
                });
              },
              uploadByFile(file: File) {
                return Promise.resolve({
                  success: 1,
                  file: { url: URL.createObjectURL(file) }
                });
              }
            }
          }
        }
      },
      onChange: async () => {
        const savedData = await editor.save();
        calculateStats(savedData);
        
        // Generate plain text for backward compatibility
        const plainText = savedData.blocks
          .map(block => {
            if (block.data && block.data.text) {
              return block.data.text;
            }
            return '';
          })
          .filter(Boolean)
          .join('\n\n');
        
        onChange(savedData, plainText);
      },
    });

    editorRef.current = editor;

    return () => {
      if (editorRef.current && typeof editorRef.current.destroy === 'function') {
        editorRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="relative group">
      <div className="prose prose-blue dark:prose-invert max-w-none border border-gray-200 dark:border-gray-800 rounded-2xl p-8 bg-white dark:bg-[#161B22] min-h-[500px] shadow-sm transition-all duration-300 group-focus-within:border-primary/30 group-focus-within:ring-4 group-focus-within:ring-primary/5">
        <div ref={containerRef} className="dark:text-gray-100 editorjs-container" />
      </div>
      
      <div className="absolute bottom-4 right-6 flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-primary" />
          {stats.words} Words
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-primary" />
          {stats.readingTime} Min Read
        </div>
      </div>

      <style>{`
        .editorjs-container .ce-block__content, 
        .editorjs-container .ce-toolbar__content { 
          max-width: 800px !important; 
        }
        .ce-paragraph {
          line-height: 1.8;
          font-size: 1.125rem;
        }
        .ce-header {
          padding: 1em 0 0.5em;
        }
        .dark .ce-toolbar__plus, 
        .dark .ce-toolbar__settings-btn {
          color: #9ca3af;
          background-color: #1f2937;
          border-radius: 6px;
        }
        .dark .ce-toolbar__plus:hover, 
        .dark .ce-toolbar__settings-btn:hover {
          background-color: #374151;
          color: white;
        }
        .ce-toolbar__settings-btn {
          background-color: #f3f4f6;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          transition: all 0.2s;
        }
        .dark .ce-toolbar__settings-btn {
          background-color: #1f2937;
          border-color: #374151;
        }
        .ce-toolbar__settings-btn:hover {
          transform: scale(1.1);
          background-color: #fff;
        }
        .dark .ce-toolbar__settings-btn:hover {
          background-color: #374151;
        }
        .dark .ce-popover {
          background-color: #1f2937;
          border-color: #374151;
          color: #f3f4f6;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
        }
        .dark .ce-popover__item:hover {
          background-color: #374151;
        }
        .dark .ce-popover__item-icon {
          background-color: #111827;
          color: #f3f4f6;
          border-radius: 4px;
        }
        .dark .ce-popover__item-label {
          color: #f3f4f6;
        }
        .dark .ce-inline-toolbar {
          background-color: #1f2937;
          border-color: #374151;
          color: #f3f4f6;
          border-radius: 8px;
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
          border-radius: 8px;
        }
        .dark .ce-conversion-tool:hover {
          background-color: #374151;
        }
        .dark .ce-block--selected .ce-block__content {
          background-color: rgba(59, 130, 246, 0.05);
          border-radius: 4px;
        }
        .ce-toolbar__plus {
          left: -40px !important;
        }
        .ce-toolbar__settings-btn {
          right: -40px !important;
        }
        @media (max-width: 650px) {
          .ce-toolbar__plus { left: 0 !important; }
          .ce-toolbar__settings-btn { right: 0 !important; }
        }
      `}</style>
    </div>
  );
};

