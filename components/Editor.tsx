import React, { useEffect, useCallback, useState, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import {
  $getRoot,
  $insertNodes,
  EditorState,
  LexicalEditor,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  $createTextNode,
  $createParagraphNode,
  DecoratorNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  LexicalNode,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  $getNodeByKey,
} from 'lexical';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListNode, ListItemNode, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { LinkNode, AutoLinkNode, $createLinkNode } from '@lexical/link';
import { HeadingNode, QuoteNode, $createHeadingNode } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
  Indent,
  Outdent,
  Link,
  MousePointer2,
  X,
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Minus,
  Plus,
} from 'lucide-react';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
}

// Custom Image Node for Lexical with width support
type SerializedImageNode = Spread<
  { src: string; altText: string; alignment: 'left' | 'center' | 'right'; width: number },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<React.ReactNode> {
  __src: string;
  __altText: string;
  __alignment: 'left' | 'center' | 'right';
  __width: number; // width in pixels, 0 means auto (100%)

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__altText, node.__alignment, node.__width, node.__key);
  }

  constructor(src: string, altText: string, alignment: 'left' | 'center' | 'right' = 'center', width: number = 0, key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__alignment = alignment;
    this.__width = width;
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.style.textAlign = this.__alignment;
    div.style.margin = '10px 0';
    div.setAttribute('data-alignment', this.__alignment);
    div.setAttribute('data-width', String(this.__width));
    return div;
  }

  updateDOM(prevNode: ImageNode, dom: HTMLElement): boolean {
    // Return true if DOM needs to be recreated
    if (prevNode.__alignment !== this.__alignment || prevNode.__width !== this.__width) {
      return true;
    }
    return false;
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    return $createImageNode(serializedNode.src, serializedNode.altText, serializedNode.alignment, serializedNode.width || 0);
  }

  exportJSON(): SerializedImageNode {
    return {
      type: 'image',
      version: 1,
      src: this.__src,
      altText: this.__altText,
      alignment: this.__alignment,
      width: this.__width,
    };
  }

  exportDOM(): DOMExportOutput {
    const div = document.createElement('div');
    div.style.margin = '10px 0';
    div.style.textAlign = this.__alignment;

    const img = document.createElement('img');
    img.src = this.__src;
    img.alt = this.__altText;
    img.style.height = 'auto';
    img.style.display = 'inline-block';

    if (this.__width > 0) {
      img.style.width = `${this.__width}px`;
      img.style.maxWidth = '100%';
    } else {
      img.style.maxWidth = '100%';
    }

    div.appendChild(img);
    return { element: div };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: convertImageElement,
        priority: 0,
      }),
    };
  }

  setAlignment(alignment: 'left' | 'center' | 'right'): void {
    const writable = this.getWritable();
    writable.__alignment = alignment;
  }

  setWidth(width: number): void {
    const writable = this.getWritable();
    writable.__width = width;
  }

  getWidth(): number {
    return this.__width;
  }

  decorate(): React.ReactNode {
    return (
      <ImageComponent
        src={this.__src}
        altText={this.__altText}
        alignment={this.__alignment}
        width={this.__width}
        nodeKey={this.__key}
      />
    );
  }
}

function convertImageElement(domNode: HTMLElement): DOMConversionOutput | null {
  if (domNode instanceof HTMLImageElement) {
    const src = domNode.src;
    const altText = domNode.alt || 'Image';
    const width = domNode.width || 0;
    const node = $createImageNode(src, altText, 'center', width);
    return { node };
  }
  return null;
}

export function $createImageNode(src: string, altText: string, alignment: 'left' | 'center' | 'right' = 'center', width: number = 0): ImageNode {
  return new ImageNode(src, altText, alignment, width);
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}

// Image Component with controls including resize
interface ImageComponentProps {
  src: string;
  altText: string;
  alignment: 'left' | 'center' | 'right';
  width: number;
  nodeKey: NodeKey;
}

function ImageComponent({ src, altText, alignment, width, nodeKey }: ImageComponentProps) {
  const [editor] = useLexicalComposerContext();
  const [showControls, setShowControls] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(width);
  const [inputWidth, setInputWidth] = useState(width > 0 ? width.toString() : '');

  const handleAlignmentChange = (newAlignment: 'left' | 'center' | 'right') => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) {
        node.setAlignment(newAlignment);
      }
    });
  };

  const handleDelete = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) {
        node.remove();
      }
    });
  };

  const handleWidthChange = (newWidth: number) => {
    const clampedWidth = Math.max(0, Math.min(1200, newWidth));
    setCurrentWidth(clampedWidth);
    setInputWidth(clampedWidth > 0 ? clampedWidth.toString() : '');
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) {
        node.setWidth(clampedWidth);
      }
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputWidth(e.target.value);
  };

  const handleInputBlur = () => {
    const newWidth = parseInt(inputWidth, 10);
    if (!isNaN(newWidth) && newWidth > 0) {
      handleWidthChange(newWidth);
    } else {
      handleWidthChange(0);
      setInputWidth('');
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
  };

  const increaseWidth = () => {
    const newWidth = (currentWidth || 200) + 50;
    handleWidthChange(newWidth);
  };

  const decreaseWidth = () => {
    const newWidth = Math.max(50, (currentWidth || 200) - 50);
    handleWidthChange(newWidth);
  };

  const alignStyle: React.CSSProperties = {
    textAlign: alignment,
    margin: '10px 0',
    position: 'relative',
  };

  const imgStyle: React.CSSProperties = {
    maxWidth: '100%',
    height: 'auto',
    display: 'inline-block',
    ...(currentWidth > 0 ? { width: `${currentWidth}px` } : {}),
  };

  return (
    <div
      style={alignStyle}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      className="group"
    >
      <img
        src={src}
        alt={altText}
        style={imgStyle}
        draggable={false}
      />
      {showControls && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-lg p-1 flex items-center gap-1 z-10 border">
          {/* Alignment controls */}
          <button
            onClick={() => handleAlignmentChange('left')}
            className={`p-1.5 rounded ${alignment === 'left' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Căn trái"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleAlignmentChange('center')}
            className={`p-1.5 rounded ${alignment === 'center' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Căn giữa"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleAlignmentChange('right')}
            className={`p-1.5 rounded ${alignment === 'right' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Căn phải"
          >
            <AlignRight className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Width controls */}
          <button
            onClick={decreaseWidth}
            className="p-1.5 rounded hover:bg-gray-100"
            title="Giảm kích thước"
          >
            <Minus className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={inputWidth}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            placeholder="auto"
            className="w-14 px-1 py-0.5 text-xs text-center border rounded"
            title="Nhập chiều rộng (px)"
          />
          <button
            onClick={increaseWidth}
            className="p-1.5 rounded hover:bg-gray-100"
            title="Tăng kích thước"
          >
            <Plus className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Delete */}
          <button
            onClick={handleDelete}
            className="p-1.5 rounded hover:bg-red-100 text-red-600"
            title="Xóa ảnh"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// Theme for Lexical editor
const theme = {
  paragraph: 'mb-2',
  heading: {
    h1: 'text-3xl font-bold mb-4',
    h2: 'text-2xl font-bold mb-3',
    h3: 'text-xl font-bold mb-2',
  },
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
  },
  list: {
    nested: {
      listitem: 'list-none',
    },
    ol: 'list-decimal ml-4 mb-2',
    ul: 'list-disc ml-4 mb-2',
    listitem: 'mb-1',
  },
  link: 'text-blue-600 underline cursor-pointer',
  indent: 'ml-8',
};

// Image Upload Modal with width option
interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (base64: string, width: number) => void;
  imageData: string | null;
}

function ImageUploadModal({ isOpen, onClose, onInsert, imageData }: ImageUploadModalProps) {
  const [width, setWidth] = useState(0);
  const [previewWidth, setPreviewWidth] = useState<number | null>(null);

  useEffect(() => {
    if (imageData) {
      // Get natural image size
      const img = new window.Image();
      img.onload = () => {
        setPreviewWidth(img.naturalWidth);
      };
      img.src = imageData;
    }
  }, [imageData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (imageData) {
      onInsert(imageData, width);
      setWidth(0);
      onClose();
    }
  };

  if (!isOpen || !imageData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-[500px] max-w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Chèn Ảnh</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview */}
        <div className="mb-4 p-2 bg-gray-100 rounded-lg overflow-hidden" style={{ maxHeight: '200px' }}>
          <img
            src={imageData}
            alt="Preview"
            style={{
              maxWidth: '100%',
              maxHeight: '180px',
              display: 'block',
              margin: '0 auto',
              width: width > 0 ? `${Math.min(width, 460)}px` : 'auto'
            }}
          />
        </div>

        {previewWidth && (
          <p className="text-xs text-gray-500 mb-3">
            Kích thước gốc: {previewWidth}px
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chiều rộng hiển thị (px)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="1200"
                step="50"
                value={width || ''}
                onChange={(e) => setWidth(parseInt(e.target.value, 10) || 0)}
                placeholder="Tự động (100%)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-500">px</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Để trống hoặc 0 để sử dụng chiều rộng tự động (100% container)
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              Chèn Ảnh
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Link/Button Modal Component
interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (displayText: string, url: string, isButton: boolean) => void;
  mode: 'link' | 'button';
}

function LinkModal({ isOpen, onClose, onInsert, mode }: LinkModalProps) {
  const [displayText, setDisplayText] = useState('');
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (displayText && url) {
      onInsert(displayText, url, mode === 'button');
      setDisplayText('');
      setUrl('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {mode === 'link' ? 'Chèn Link' : 'Chèn Button'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Văn bản hiển thị
            </label>
            <input
              type="text"
              value={displayText}
              onChange={(e) => setDisplayText(e.target.value)}
              placeholder="Nhập văn bản..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL / Link
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {mode === 'button' && (
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-500">
                Button sẽ được tạo với style: nền xanh, chữ trắng, padding, border-radius
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!displayText || !url}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Chèn {mode === 'link' ? 'Link' : 'Button'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Plugin to load initial HTML content and sync external changes
function LoadInitialContentPlugin({ initialHtml }: { initialHtml: string }) {
  const [editor] = useLexicalComposerContext();
  const [isFirstRender, setIsFirstRender] = useState(true);
  const lastValueRef = useRef(initialHtml);
  const isInternalChangeRef = useRef(false);

  // Listen to editor changes to track internal updates
  useEffect(() => {
    return editor.registerUpdateListener(({ tags }) => {
      // Mark as internal change when not triggered by external source
      if (!tags.has('external')) {
        isInternalChangeRef.current = true;
      }
    });
  }, [editor]);

  useEffect(() => {
    // Skip if this is an internal change (user typing)
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      lastValueRef.current = initialHtml;
      return;
    }

    // Handle first render or external value change (like DOCX import)
    const shouldUpdate = isFirstRender || (initialHtml !== lastValueRef.current);

    if (shouldUpdate && initialHtml) {
      if (isFirstRender) setIsFirstRender(false);
      lastValueRef.current = initialHtml;

      editor.update(() => {
        const parser = new DOMParser();
        const dom = parser.parseFromString(initialHtml, 'text/html');
        const nodes = $generateNodesFromDOM(editor, dom);
        const root = $getRoot();
        root.clear();
        root.append(...nodes);
      }, { tag: 'external' });
    }
  }, [editor, initialHtml, isFirstRender]);

  return null;
}

// Toolbar Component
function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [modalMode, setModalMode] = useState<'link' | 'button'>('link');
  const [showImageModal, setShowImageModal] = useState(false);
  const [pendingImageData, setPendingImageData] = useState<string | null>(null);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
    }
  }, []);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  const formatHeading = (headingSize: 'h1' | 'h2' | 'h3') => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(headingSize));
      }
    });
  };

  const handleIndent = () => {
    editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
  };

  const handleOutdent = () => {
    editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
  };

  const openLinkModal = () => {
    setModalMode('link');
    setShowLinkModal(true);
  };

  const openButtonModal = () => {
    setModalMode('button');
    setShowLinkModal(true);
  };

  const handleInsertImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          const base64 = loadEvent.target?.result as string;
          setPendingImageData(base64);
          setShowImageModal(true);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleImageInsert = (base64: string, width: number) => {
    editor.update(() => {
      const imageNode = $createImageNode(base64, 'Image', 'center', width);
      $insertNodes([imageNode]);
    });
  };

  const handleInsertLinkOrButton = (displayText: string, url: string, isButton: boolean) => {
    editor.update(() => {
      const selection = $getSelection();

      if (isButton) {
        const buttonHtml = `<a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">${displayText}</a>`;
        const parser = new DOMParser();
        const dom = parser.parseFromString(buttonHtml, 'text/html');
        const nodes = $generateNodesFromDOM(editor, dom);
        if (nodes.length > 0) {
          $insertNodes(nodes);
        }
      } else {
        const linkNode = $createLinkNode(url);
        const textNode = $createTextNode(displayText);
        linkNode.append(textNode);

        if ($isRangeSelection(selection)) {
          selection.insertNodes([linkNode]);
        } else {
          $insertNodes([linkNode]);
        }
      }
    });
  };

  const btnClass = (active: boolean) =>
    `p-2 rounded hover:bg-gray-200 transition-colors ${active ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`;

  return (
    <>
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        {/* Undo/Redo */}
        <button
          type="button"
          onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
          className={btnClass(false)}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
          className={btnClass(false)}
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Headings */}
        <button
          type="button"
          onClick={() => formatHeading('h1')}
          className={btnClass(false)}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => formatHeading('h2')}
          className={btnClass(false)}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => formatHeading('h3')}
          className={btnClass(false)}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Text formatting */}
        <button
          type="button"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
          className={btnClass(isBold)}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
          className={btnClass(isItalic)}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
          className={btnClass(isUnderline)}
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
          className={btnClass(isStrikethrough)}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Indent/Outdent */}
        <button
          type="button"
          onClick={handleOutdent}
          className={btnClass(false)}
          title="Decrease Indent (Shift+Tab)"
        >
          <Outdent className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleIndent}
          className={btnClass(false)}
          title="Increase Indent (Tab)"
        >
          <Indent className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
          className={btnClass(false)}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
          className={btnClass(false)}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Link, Button, and Image */}
        <button
          type="button"
          onClick={openLinkModal}
          className={btnClass(false)}
          title="Chèn Link"
        >
          <Link className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={openButtonModal}
          className={btnClass(false)}
          title="Chèn Button"
        >
          <MousePointer2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleInsertImage}
          className={btnClass(false)}
          title="Chèn Ảnh"
        >
          <Image className="w-4 h-4" />
        </button>
      </div>

      <LinkModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        onInsert={handleInsertLinkOrButton}
        mode={modalMode}
      />

      <ImageUploadModal
        isOpen={showImageModal}
        onClose={() => {
          setShowImageModal(false);
          setPendingImageData(null);
        }}
        onInsert={handleImageInsert}
        imageData={pendingImageData}
      />
    </>
  );
}

const Editor: React.FC<EditorProps> = ({ value, onChange }) => {
  const initialConfig = {
    namespace: 'EmailEditor',
    theme,
    onError: (error: Error) => {
      console.error('Lexical error:', error);
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
      AutoLinkNode,
      ImageNode,
    ],
  };

  const handleChange = (editorState: EditorState, editor: LexicalEditor) => {
    editorState.read(() => {
      const htmlString = $generateHtmlFromNodes(editor, null);
      onChange(htmlString);
    });
  };

  return (
    <div className="h-full flex flex-col">
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin />
        <div className="flex-grow relative overflow-auto bg-white">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="min-h-[200px] p-4 outline-none focus:outline-none prose max-w-none" />
            }
            placeholder={
              <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
                Upload a Word document to get started, or start typing here...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <LoadInitialContentPlugin initialHtml={value} />
          <OnChangePlugin onChange={handleChange} />
        </div>
      </LexicalComposer>
    </div>
  );
};

export default Editor;