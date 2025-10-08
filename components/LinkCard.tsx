import React from 'react';
import { LinkItem } from '../types';

interface LinkCardProps {
  link: LinkItem;
}

const LinkCard: React.FC<LinkCardProps> = ({ link }) => {
  return (
    <div className="bg-slate-800 rounded-xl shadow-lg p-6 flex flex-col h-full hover:shadow-indigo-500/20 transition-all duration-300 hover:-translate-y-1">
      <div className="flex-grow">
        <h3 className="text-xl font-bold text-slate-100 mb-2">{link.title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed mb-4">{link.summary}</p>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {link.tags.map((tag) => (
          <span key={tag} className="bg-slate-700 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-full capitalize">
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-auto pt-4 border-t border-slate-700">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:text-indigo-300 transition-colors text-sm font-medium"
        >
          <span>Read Original</span>
        </a>
      </div>
    </div>
  );
};

export default LinkCard;