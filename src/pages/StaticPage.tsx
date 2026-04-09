import React from 'react';

export const StaticPage = ({ page }: { page: any }) => {
  return (
    <div className="flex-1 p-12 max-w-4xl mx-auto">
      <h1 className="text-4xl font-black text-gray-900 dark:text-gray-100 mb-8">{page.title}</h1>
      <div 
        className="prose prose-blue dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: page.config.content || '' }}
      />
    </div>
  );
};
