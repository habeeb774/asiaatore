import React, { useRef, useState } from 'react';
import Button from '../../ui/Button';

// Minimal image uploader used by AdminProducts drawer
export default function ImageUploader({ onChange }) {
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);

  function handlePick() { inputRef.current?.click(); }
  function handleFiles(e) {
    const list = Array.from(e.target.files || []);
    setFiles(list);
    onChange?.({ files: list });
  }

  return (
    <div className="border rounded-lg p-3">
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-300">{files.length ? `${files.length} file(s) selected` : 'No files selected'}</div>
        <Button variant="outline" size="sm" onClick={handlePick}>Choose files</Button>
      </div>
      {files.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mt-3">
          {files.map((f, i) => (
            <Preview key={i} file={f} />
          ))}
        </div>
      )}
    </div>
  );
}

function Preview({ file }) {
  const [src, setSrc] = useState('');
  React.useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return (
    <div className="w-full aspect-square bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
      {src && <img src={src} alt={file.name} className="w-full h-full object-cover" />}
    </div>
  );
}
