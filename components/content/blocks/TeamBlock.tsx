'use client';

import { BlockProps } from '@/lib/server/content/content-model';

interface Props { props: BlockProps['team'] }

const COLS: Record<number, string> = { 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4' };

export function TeamBlock({ props }: Props) {
  return (
    <div className={`grid grid-cols-1 ${COLS[props.columns] ?? 'md:grid-cols-3'} gap-6`}>
      {props.members.map((member, i) => (
        <div key={i} className="rounded-xl border border-gray-800 p-6 text-center bg-surface">
          {member.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={member.avatar} alt={member.name} className="w-20 h-20 rounded-full mx-auto mb-4 object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-cyan/20 flex items-center justify-center text-xl text-cyan">
              {member.name.charAt(0)}
            </div>
          )}
          <h3 className="font-medium text-white">{member.name}</h3>
          <p className="text-sm text-cyan mt-1">{member.role}</p>
          {member.bio && <p className="text-sm text-gray-400 mt-3">{member.bio}</p>}
        </div>
      ))}
    </div>
  );
}
