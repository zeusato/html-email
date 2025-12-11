import React, { useRef } from 'react';
import { Upload, FileText, Image as ImageIcon } from 'lucide-react';
import { convertDocxToHtml, fileToBase64 } from '../utils/converter';
import { UploadState } from '../types';

interface UploadSectionProps {
  onDocxLoaded: (html: string, fileName: string) => void;
  onHeaderLoaded: (base64: string) => void;
  onFooterLoaded: (base64: string) => void;
  setUploadState: React.Dispatch<React.SetStateAction<UploadState>>;
  uploadState: UploadState;
}

const UploadSection: React.FC<UploadSectionProps> = ({ 
  onDocxLoaded, 
  onHeaderLoaded, 
  onFooterLoaded,
  setUploadState,
  uploadState
}) => {
  
  const handleDocxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      setUploadState({ isUploading: false, error: 'Please upload a valid .docx file' });
      return;
    }

    setUploadState({ isUploading: true, error: null });
    try {
      const html = await convertDocxToHtml(file);
      onDocxLoaded(html, file.name);
      setUploadState({ isUploading: false, error: null });
    } catch (err) {
      setUploadState({ isUploading: false, error: 'Failed to parse DOCX file.' });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'header' | 'footer') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadState({ isUploading: false, error: 'Please upload a valid image file' });
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      if (type === 'header') onHeaderLoaded(base64);
      else onFooterLoaded(base64);
      setUploadState(prev => ({ ...prev, error: null }));
    } catch (err) {
      setUploadState(prev => ({ ...prev, error: 'Failed to load image.' }));
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <Upload className="w-5 h-5 mr-2" />
        Upload Assets
      </h2>
      
      {uploadState.error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
          {uploadState.error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Docx Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
          <FileText className="w-10 h-10 mx-auto text-blue-500 mb-3" />
          <h3 className="font-semibold text-gray-700">Email Body (.docx)</h3>
          <p className="text-xs text-gray-500 mb-3">Converts Word to HTML</p>
          <input 
            type="file" 
            accept=".docx" 
            onChange={handleDocxUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Header Image */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
          <ImageIcon className="w-10 h-10 mx-auto text-purple-500 mb-3" />
          <h3 className="font-semibold text-gray-700">Header Image</h3>
          <p className="text-xs text-gray-500 mb-3">Displayed at the top</p>
          <input 
            type="file" 
            accept="image/*" 
            onChange={(e) => handleImageUpload(e, 'header')}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
          />
        </div>

        {/* Footer Image */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors">
          <ImageIcon className="w-10 h-10 mx-auto text-green-500 mb-3" />
          <h3 className="font-semibold text-gray-700">Footer Image</h3>
          <p className="text-xs text-gray-500 mb-3">Displayed at the bottom</p>
          <input 
            type="file" 
            accept="image/*" 
            onChange={(e) => handleImageUpload(e, 'footer')}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
        </div>
      </div>
    </div>
  );
};

export default UploadSection;
