import React from 'react';
import { TagIcon } from './icons';

interface TagFilterProps {
  tags: string[];
  activeTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

const TagFilter: React.FC<TagFilterProps> = ({ tags, activeTag, onSelectTag }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-100 mb-4 flex items-center gap-2">
        <TagIcon className="w-6 h-6" />
        Filter by Tags
      </h2>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSelectTag(null)}
          className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
            activeTag === null
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          All
        </button>
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => onSelectTag(tag)}
            className={`px-3 py-1 text-sm font-medium rounded-full transition-colors capitalize ${
              activeTag === tag
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TagFilter;