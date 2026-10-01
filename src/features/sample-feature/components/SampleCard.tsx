import React from 'react';
import { SampleItem } from '../types';

interface SampleCardProps {
  item: SampleItem;
}

export const SampleCard: React.FC<SampleCardProps> = ({ item }) => {
  return (
    <div className="p-4 rounded-xl border border-white/10 bg-white/5 hover:border-indigo-500/50 transition-all">
      <h3 className="font-semibold text-white">{item.title}</h3>
      <p className="text-sm text-gray-400 mt-1">{item.description}</p>
      <span className="inline-block mt-3 text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
        {item.status}
      </span>
    </div>
  );
};
