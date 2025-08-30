'use client'

import React, { useState, useMemo } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskItem, TaskStatus } from '@/app/account/page';
import { Column } from './Column';
import { TaskCard } from './TaskCard';

const statuses: TaskStatus[] = ['À faire', 'En cours', 'Terminé'];

interface TaskBoardProps {
  tasks: TaskItem[];
  onTasksChange: (tasks: TaskItem[]) => void;
}

export function TaskBoard({ tasks, onTasksChange }: TaskBoardProps) {
  // Calcul du pourcentage d'avancement
  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'Terminé').length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  const handleToggle = (id: string) => {
    const newTasks = tasks.map(t =>
      t.id === id
        ? { ...t, status: t.status === 'Terminé' ? 'À faire' as TaskStatus : 'Terminé' as TaskStatus }
        : t
    );
    onTasksChange(newTasks);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="font-medium">Avancement :</span>
        <div className="flex-1">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${percent}%` }}
            ></div>
          </div>
        </div>
        <span className="text-sm text-gray-600">{percent}%</span>
      </div>
      <ul className="space-y-2">
        {tasks.map(task => (
          <li key={task.id} className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={task.status === 'Terminé'}
              onChange={() => handleToggle(task.id)}
              className="accent-green-500 h-4 w-4"
            />
            <span className={task.status === 'Terminé' ? 'line-through text-gray-400' : ''}>{task.titre}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
