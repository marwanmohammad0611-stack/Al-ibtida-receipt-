
import React, { useRef } from 'react';
import { Upload, X } from 'lucide-react';

interface LogoUploaderProps {
  currentLogo: string | null;
  onLogoChange: (logo: string | null) => void;
}

const LogoUploader: React.FC<LogoUploaderProps> = ({ currentLogo, onLogoChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onLogoChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
        {currentLogo ? (
          <>
            <img src={currentLogo} alt="School Logo" className="w-full h-full object-contain" />
            <button
              onClick={() => onLogoChange(null)}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X size={12} />
            </button>
          </>
        ) : (
          <div className="text-gray-400 flex flex-col items-center">
            <Upload size={24} />
            <span className="text-[10px] mt-1">Logo</span>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="text-sm text-blue-600 font-medium hover:underline"
      >
        Change Logo
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};

export default LogoUploader;
