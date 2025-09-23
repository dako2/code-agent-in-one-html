import React, { useRef, useEffect } from 'react';

// Let TypeScript know that monaco and require are available on the window
declare const monaco: any;
declare const require: any;

interface MonacoEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  zoomLevel: number;
}

const BASE_FONT_SIZE = 14;

const MonacoEditor: React.FC<MonacoEditorProps> = ({ value, language, onChange, zoomLevel }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);

  onChangeRef.current = onChange;

  useEffect(() => {
    // The main effect should only be responsible for creating and destroying the editor instance.
    if (editorRef.current) {
        // The loader script in index.html defines `require`. We assume it's loaded.
        require(['vs/editor/editor.main'], (monacoInstance) => {
            if (!editorRef.current) {
                return;
            }

            // Make sure to dispose of any existing editor instance
            if (editorInstanceRef.current) {
                editorInstanceRef.current.dispose();
            }

            const editor = monacoInstance.editor.create(editorRef.current, {
                value: value,
                language: language,
                theme: 'vs-dark',
                automaticLayout: true,
                minimap: { enabled: false },
                scrollbar: {
                    verticalScrollbarSize: 10,
                    horizontalScrollbarSize: 10,
                },
                fontFamily: 'monospace',
                padding: {
                    top: 16,
                    bottom: 16
                },
                fontSize: BASE_FONT_SIZE * (zoomLevel / 100),
                mouseWheelZoom: false,
                wordWrap: 'on',
            });
            editorInstanceRef.current = editor;

            editor.onDidChangeModelContent(() => {
                const currentValue = editor.getValue();
                onChangeRef.current(currentValue);
            });
        });
    }

    return () => {
        if (editorInstanceRef.current) {
            editorInstanceRef.current.dispose();
            editorInstanceRef.current = null;
        }
    };
  // We pass zoomLevel here to re-initialize editor if it's the first thing to change
  // but rely on a separate effect for subsequent updates to avoid full re-renders.
  }, []); 

  useEffect(() => {
    if (editorInstanceRef.current) {
        editorInstanceRef.current.updateOptions({
            fontSize: BASE_FONT_SIZE * (zoomLevel / 100),
        });
    }
  }, [zoomLevel]);

  useEffect(() => {
    // This effect handles language changes.
    if (editorInstanceRef.current && typeof monaco !== 'undefined') {
        const model = editorInstanceRef.current.getModel();
        if (model) {
            monaco.editor.setModelLanguage(model, language);
        }
    }
  }, [language]);

  useEffect(() => {
    // This effect handles value changes from the parent component.
    if (editorInstanceRef.current) {
      if (editorInstanceRef.current.getValue() !== value) {
        // Preserve cursor position
        const position = editorInstanceRef.current.getPosition();
        editorInstanceRef.current.setValue(value);
        if (position) {
            editorInstanceRef.current.setPosition(position);
        }
      }
    }
  }, [value]);

  return <div ref={editorRef} style={{ width: '100%', height: '100%' }} />;
};

export default MonacoEditor;