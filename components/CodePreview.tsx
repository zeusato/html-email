import React from 'react';

interface CodePreviewProps {
  value: string;
  onChange: (value: string) => void;
}

const CodePreview: React.FC<CodePreviewProps> = ({ value, onChange }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="bg-gray-900 p-2 border-b border-gray-700 flex justify-between items-center">
        <span className="text-xs font-semibold uppercase text-gray-400">HTML Source</span>
      </div>
      <textarea
        className="flex-grow w-full h-[500px] p-4 bg-[#1e1e1e] text-green-400 font-mono text-sm resize-none focus:outline-none code-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
    </div>
  );
};

export default CodePreview;
