'use client'

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { TaskStatus, TaskItem } from '@/app/account/page';

interface ColumnProps {
  status: TaskStatus;
  tasks: TaskItem[];
  children: React.ReactNode;
}

export function Column({ status, children }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const style = {
    backgroundColor: isOver ? '#e0f2fe' : '#f1f5f9', // Mettre en surbrillance au survol
    transition: 'background-color 0.2s ease',
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg p-4 min-h-[200px]">
      <h3 className="font-bold text-lg mb-4 text-gray-700">{status}</h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}
