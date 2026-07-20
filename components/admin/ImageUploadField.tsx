'use client';

import { memo } from 'react';

interface ImageUploadFieldProps {
  label: string;
  slot: 'image_url' | 'image_url_2' | 'image_url_3';
  currentUrl: string;
  previewUrl: string | null;
  isUploading: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>, slot: string) => void;
  onSetAsMain?: () => void;
}

export const ImageUploadField = memo(function ImageUploadField({
  label,
  slot,
  currentUrl,
  previewUrl,
  isUploading,
  onFileChange,
  onSetAsMain,
}: ImageUploadFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={`image-upload-${slot}`} className="text-sm text-on-surface block font-bold">{label}</label>
      <div className="flex items-center gap-3">
        <input
          id={`image-upload-${slot}`}
          type="file"
          accept="image/*"
          onChange={(e) => onFileChange(e, slot)}
          disabled={isUploading}
          className="block w-full text-xs text-on-surface-variant file:me-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-surface-container file:text-primary hover:file:bg-surface-container-high cursor-pointer disabled:opacity-60"
        />
        {(previewUrl || currentUrl) && (
          <div className="relative w-12 h-12 rounded-lg border border-outline-variant overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl || currentUrl || ''}
              alt={label}
              className="object-cover w-full h-full"
            />
          </div>
        )}
      </div>
      {isUploading && (
        <p className="text-[10px] text-primary font-semibold animate-pulse">جاري رفع الصورة...</p>
      )}
      {(previewUrl || currentUrl) && onSetAsMain && (
        <button
          type="button"
          onClick={onSetAsMain}
          className="text-[10px] text-primary hover:text-primary-container font-bold flex items-center gap-1 mt-1 cursor-pointer hover:underline"
        >
          <span className="material-symbols-outlined text-[13px] select-none">star</span>
          جعلها الصورة الرئيسية
        </button>
      )}
    </div>
  );
});
ImageUploadField.displayName = 'ImageUploadField';
