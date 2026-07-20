'use client';

import { memo } from 'react';
import type { CategoryHierarchyItem } from './CategoriesClient';

interface CategoryGroupCardProps {
  group: CategoryHierarchyItem;
  isExpanded: boolean;
  subCount: number;
  subCatInputValue: string;
  onToggle: () => void;
  onRenameMain: () => void;
  onDeleteMain: () => void;
  onRenameSub: (subName: string) => void;
  onDeleteSub: (subName: string) => void;
  onAddSub: (e: React.FormEvent) => void;
  onSubInputChange: (value: string) => void;
}

export const CategoryGroupCard = memo(function CategoryGroupCard({
  group,
  isExpanded,
  subCount,
  subCatInputValue,
  onToggle,
  onRenameMain,
  onDeleteMain,
  onRenameSub,
  onDeleteSub,
  onAddSub,
  onSubInputChange,
}: CategoryGroupCardProps) {
  return (
    <div className="border border-outline-variant/30 rounded-2xl overflow-hidden bg-surface-container-low transition-all shadow-sm hover:border-outline duration-150">
      {/* Row Header */}
      <div
        onClick={onToggle}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-surface-container-high transition-colors select-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">folder</span>
          </div>
          <div className="flex flex-col gap-0.5 text-start">
            <span className="font-bold text-sm text-on-surface leading-tight">{group.name}</span>
            <span className="inline-flex self-start text-[9px] font-bold bg-primary/5 text-primary border border-primary/10 px-2 py-0.5 rounded-md mt-0.5">
              {subCount} فئات فرعية
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={onRenameMain}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant/40 hover:bg-secondary/10 hover:text-secondary transition-all cursor-pointer border-0 bg-transparent p-0"
            title={`تعديل اسم القسم "${group.name}"`}
            aria-label={`تعديل اسم القسم ${group.name}`}
          >
            <span className="material-symbols-outlined text-[17px]">edit</span>
          </button>
          <button
            type="button"
            onClick={onDeleteMain}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant/40 hover:bg-error/10 hover:text-error transition-all cursor-pointer border-0 bg-transparent p-0"
            title={`حذف القسم الرئيسي "${group.name}"`}
            aria-label={`حذف القسم الرئيسي ${group.name}`}
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant/60 hover:bg-surface-container-highest transition-all cursor-pointer border-0 bg-transparent p-0"
            aria-label={isExpanded ? `طي القسم ${group.name}` : `توسيع القسم ${group.name}`}
          >
            <span className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </button>
        </div>
      </div>

      {/* Expanded Body */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-3 bg-white border-t border-outline-variant/20 space-y-4 text-start">
          <div className="flex flex-wrap gap-2 pt-2">
            {subCount > 0 ? (
              group.subcategories.map((sub: string) => (
                <div
                  key={sub}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold bg-surface-container-low text-on-surface border border-outline-variant hover:border-primary/30 transition-colors shadow-sm"
                >
                  <span>{sub}</span>
                  <button
                    type="button"
                    onClick={() => onRenameSub(sub)}
                    className="text-on-surface-variant/40 hover:text-secondary transition-colors cursor-pointer flex items-center border-0 bg-transparent p-0"
                    title={`تعديل اسم الفئة "${sub}"`}
                    aria-label={`تعديل اسم الفئة ${sub}`}
                  >
                    <span className="material-symbols-outlined text-[11px]">edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteSub(sub)}
                    className="text-on-surface-variant/40 hover:text-error transition-colors cursor-pointer flex items-center border-0 bg-transparent p-0"
                    title={`حذف الفئة الفرعية "${sub}"`}
                    aria-label={`حذف الفئة الفرعية ${sub}`}
                  >
                    <span className="material-symbols-outlined text-[12px]">close</span>
                  </button>
                </div>
              ))
            ) : (
              <span className="text-[10px] text-on-surface-variant italic font-bold">لا توجد فئات فرعية مضافة</span>
            )}
          </div>

          <form
            onSubmit={onAddSub}
            className="flex gap-2 pt-4 border-t border-outline-variant/20 max-w-md text-start"
          >
            <input
              type="text"
              placeholder="اسم الفئة الفرعية الجديدة..."
              aria-label={`إضافة فئة فرعية جديدة إلى ${group.name}`}
              value={subCatInputValue}
              onChange={(e) => onSubInputChange(e.target.value)}
              className="flex-grow min-w-0 bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-on-surface text-start font-bold"
            />
            <button
              type="submit"
              className="bg-primary hover:bg-primary/95 text-on-primary px-4 py-2 rounded-xl text-xs font-bold active:scale-[0.98] transition-all flex items-center gap-1 cursor-pointer shadow-sm shrink-0 border-0"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              إضافة
            </button>
          </form>
        </div>
      )}
    </div>
  );
});
