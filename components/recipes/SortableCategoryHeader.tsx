'use client'

import { useState } from 'react'
import type { Category } from '@/lib/supabase'
import { GripVertical, CheckSquare, Square } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// page.tsxから型定義を移動
export type CategoryHeader = Category & {
  type: 'category'
}

export function SortableCategoryHeader({ category, onEdit, categoryRef, isSelectionMode, isSelected, onToggleSelect }: { category: CategoryHeader; onEdit: (id: string, newName: string) => void; categoryRef?: (el: HTMLDivElement | null) => void; isSelectionMode?: boolean; isSelected?: boolean; onToggleSelect?: (id: string) => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(category.name)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: category.id, disabled: isSelectionMode })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const setRefs = (el: HTMLDivElement | null) => {
    setNodeRef(el)
    if (categoryRef) categoryRef(el)
  }

  const handleSave = () => {
    if (editName.trim() && editName.trim() !== category.name) {
      onEdit(category.id, editName.trim())
    }
    setIsEditing(false)
  }

  return (
    <div ref={setRefs} style={style} className={`bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg px-3 py-1.5 flex items-center justify-between transition-all duration-200 ${isSelected ? 'ring-2 ring-amber-500 ring-offset-2' : ''}`}>
      <div className="flex items-center gap-2 flex-1">
        {isSelectionMode ? (
          <div className="px-1 cursor-pointer" onClick={() => onToggleSelect?.(category.id)}>
            {isSelected ? (
              <CheckSquare className="h-4 w-4 text-amber-600" />
            ) : (
              <Square className="h-4 w-4 text-gray-400" />
            )}
          </div>
        ) : (
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-4 w-4 text-amber-600" />
          </div>
        )}
        {isEditing ? (
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') {
                setEditName(category.name)
                setIsEditing(false)
              }
            }}
            className="fluid-text-sm font-bold text-amber-900 bg-white border-amber-300 h-7"
            autoFocus
          />
        ) : (
          <h2
            className="fluid-text-sm font-bold text-amber-900 cursor-pointer hover:text-amber-700"
            onClick={() => setIsEditing(true)}
          >
            {category.name}
          </h2>
        )}
      </div>
    </div>
  )
}
