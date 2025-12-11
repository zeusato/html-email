import React from 'react';

interface LivePreviewProps {
  htmlContent: string;
  headerImage: string | null;
  footerImage: string | null;
}

const LivePreview: React.FC<LivePreviewProps> = ({ htmlContent, headerImage, footerImage }) => {
  return (
    <div className="h-full bg-gray-100 overflow-y-auto p-8 rounded-lg border border-gray-200">
      <div className="max-w-[600px] mx-auto bg-white shadow-xl min-h-[600px] flex flex-col">
        
        {/* Header Area */}
        {headerImage ? (
          <div className="w-full">
            <img src={headerImage} alt="Email Header" className="w-full h-auto block" />
          </div>
        ) : (
          <div className="w-full h-24 bg-gray-100 flex items-center justify-center border-b border-dashed border-gray-300">
            <span className="text-gray-400 text-sm">Header Image Area</span>
          </div>
        )}

        {/* Content Area */}
        <div 
          className="flex-grow p-8 prose max-w-none"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {/* Footer Area */}
        {footerImage ? (
          <div className="w-full mt-auto">
            <img src={footerImage} alt="Email Footer" className="w-full h-auto block" />
          </div>
        ) : (
          <div className="w-full h-20 bg-gray-100 flex items-center justify-center border-t border-dashed border-gray-300 mt-auto">
            <span className="text-gray-400 text-sm">Footer Image Area</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LivePreview;
