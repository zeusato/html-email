import React, { useState } from 'react';
import { Download, FileCode, Eye, PenTool, Mail, Maximize2, Type } from 'lucide-react';
import UploadSection from './components/UploadSection';
import Editor from './components/Editor';
import CodePreview from './components/CodePreview';
import LivePreview from './components/LivePreview';
import { EmailTemplateState, TabView, UploadState } from './types';
import { generateFullEmailHtml } from './utils/converter';

// Fonts that support Vietnamese Unicode well (email-safe with proper bold weights)
const FONT_OPTIONS = [
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial' },
  { value: 'Times New Roman, Times, serif', label: 'Times New Roman' },
  { value: 'Tahoma, Geneva, sans-serif', label: 'Tahoma' },
  { value: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
  { value: 'Georgia, Times, serif', label: 'Georgia' },
  { value: 'Trebuchet MS, Helvetica, sans-serif', label: 'Trebuchet MS' },
  { value: 'Segoe UI, Tahoma, sans-serif', label: 'Segoe UI' },
  { value: 'Calibri, Arial, sans-serif', label: 'Calibri' },
];

const App: React.FC = () => {
  const [template, setTemplate] = useState<EmailTemplateState>({
    htmlContent: '<p>Upload a Word document to get started, or start typing here...</p>',
    headerImage: null,
    footerImage: null,
    fileName: null,
    outlookCompatible: false,
    maxWidth: 600,
    fontFamily: 'Arial, sans-serif',
  });

  const [activeTab, setActiveTab] = useState<TabView>(TabView.EDITOR);
  const [uploadState, setUploadState] = useState<UploadState>({ isUploading: false, error: null });

  const handleExportHtml = () => {
    const fullHtml = generateFullEmailHtml(
      template.htmlContent,
      template.headerImage,
      template.footerImage,
      template.outlookCompatible,
      template.maxWidth,
      template.fontFamily
    );
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const suffix = template.outlookCompatible ? '-outlook' : '';
    a.download = template.fileName
      ? template.fileName.replace('.docx', `${suffix}.html`)
      : `email-template${suffix}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    const fullHtml = generateFullEmailHtml(
      template.htmlContent,
      template.headerImage,
      template.footerImage,
      template.outlookCompatible,
      template.maxWidth,
      template.fontFamily
    );
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(fullHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const handleMaxWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 300 && value <= 1200) {
      setTemplate(prev => ({ ...prev, maxWidth: value }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Docx2Email
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {/* Font Selection */}
              <div className="flex items-center space-x-2">
                <Type className="w-4 h-4 text-gray-400" />
                <select
                  value={template.fontFamily}
                  onChange={(e) => setTemplate(prev => ({ ...prev, fontFamily: e.target.value }))}
                  className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  title="Select font family"
                >
                  {FONT_OPTIONS.map(font => (
                    <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-px h-8 bg-gray-200" />

              {/* Max Width Input */}
              <div className="flex items-center space-x-2">
                <Maximize2 className="w-4 h-4 text-gray-400" />
                <label className="text-sm text-gray-500">Width:</label>
                <input
                  type="number"
                  min="300"
                  max="1200"
                  step="50"
                  value={template.maxWidth}
                  onChange={handleMaxWidthChange}
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  title="Email max width in pixels (300-1200)"
                />
                <span className="text-xs text-gray-400">px</span>
              </div>

              <div className="w-px h-8 bg-gray-200" />

              {/* Outlook Compatibility Toggle */}
              <label
                className="flex items-center cursor-pointer group"
                title="Enable for Outlook 2007-2019 compatibility (uses table-based layout)"
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={template.outlookCompatible}
                    onChange={(e) => setTemplate(prev => ({ ...prev, outlookCompatible: e.target.checked }))}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full transition-colors ${template.outlookCompatible ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                  <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${template.outlookCompatible ? 'translate-x-4' : ''}`}></div>
                </div>
                <div className="ml-2 flex items-center">
                  <Mail className={`w-4 h-4 mr-1 ${template.outlookCompatible ? 'text-orange-500' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${template.outlookCompatible ? 'text-orange-600' : 'text-gray-500'}`}>
                    Old Outlook
                  </span>
                </div>
              </label>

              <div className="w-px h-8 bg-gray-200" />

              <button
                onClick={handleExportHtml}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FileCode className="w-4 h-4 mr-2" />
                Export HTML
              </button>
              <button
                onClick={handleExportPdf}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow w-full px-4 py-6">
        {/* Outlook Compatibility Info Banner */}
        {template.outlookCompatible && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start">
            <Mail className="w-5 h-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-orange-800">
                Outlook Compatibility Mode Enabled
              </p>
              <p className="text-xs text-orange-600 mt-1">
                HTML will use table-based layout with MSO conditional comments for Outlook 2007-2019 compatibility.
                The exported code may look different but will render correctly in older Outlook versions.
              </p>
            </div>
          </div>
        )}

        <UploadSection
          uploadState={uploadState}
          setUploadState={setUploadState}
          onDocxLoaded={(html, name) => setTemplate(prev => ({ ...prev, htmlContent: html, fileName: name }))}
          onHeaderLoaded={(img) => setTemplate(prev => ({ ...prev, headerImage: img }))}
          onFooterLoaded={(img) => setTemplate(prev => ({ ...prev, footerImage: img }))}
        />

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col md:flex-row min-h-[600px]">

          {/* Editor/Preview Controls */}
          <div className="w-full md:w-1/2 flex flex-col border-r border-gray-200">
            <div className="border-b border-gray-200 flex">
              <button
                onClick={() => setActiveTab(TabView.EDITOR)}
                className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center ${activeTab === TabView.EDITOR ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                <PenTool className="w-4 h-4 mr-2" />
                Visual Editor
              </button>
              <button
                onClick={() => setActiveTab(TabView.CODE)}
                className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center ${activeTab === TabView.CODE ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                <FileCode className="w-4 h-4 mr-2" />
                HTML Source
              </button>
            </div>

            <div className="flex-grow relative">
              {activeTab === TabView.EDITOR && (
                <Editor
                  value={template.htmlContent}
                  onChange={(val) => setTemplate(prev => ({ ...prev, htmlContent: val }))}
                />
              )}
              {activeTab === TabView.CODE && (
                <CodePreview
                  value={template.htmlContent}
                  onChange={(val) => setTemplate(prev => ({ ...prev, htmlContent: val }))}
                />
              )}
            </div>
          </div>

          {/* Live Preview Panel */}
          <div className="w-full md:w-1/2 flex flex-col bg-gray-50">
            <div className="border-b border-gray-200 py-3 px-4 bg-white flex justify-between items-center">
              <span className="text-sm font-bold text-gray-700 flex items-center">
                <Eye className="w-4 h-4 mr-2 text-gray-500" />
                Live Preview
              </span>
              <span className="text-xs text-gray-400">
                {FONT_OPTIONS.find(f => f.value === template.fontFamily)?.label} | {template.maxWidth}px
              </span>
            </div>
            <div className="flex-grow p-4 overflow-hidden">
              <LivePreview
                htmlContent={template.htmlContent}
                headerImage={template.headerImage}
                footerImage={template.footerImage}
              />
            </div>
          </div>

        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="w-full px-4 text-center text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} DocxToEmail Converter. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default App;
