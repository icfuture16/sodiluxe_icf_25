import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export type ProductCategoryFormProps = {
  onCancel: () => void;
  onSave: (value: string) => void
  initialValue?: string
  title?: string
  confirmLabel?: string
}

export default function ProductCategoryForm({ onSave, onCancel, initialValue = '', title, confirmLabel }: ProductCategoryFormProps) {
  const [value, setValue] = useState(initialValue)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    setIsSaving(true)
    await onSave(value.trim())
    setIsSaving(false)
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center">
      <Input
        ref={inputRef}
        placeholder="Nom de la catégorie"
        value={value}
        onChange={e => setValue(e.target.value)}
        disabled={isSaving}
        className="w-56"
      />
      <Button type="submit" disabled={!value.trim() || isSaving} size="sm">
        {isSaving ? '...' : initialValue ? 'Enregistrer' : 'Ajouter'}
      </Button>
      <Button type="button" variant="outline" onClick={onCancel} size="sm" disabled={isSaving}>
        Annuler
      </Button>
    </form>
  )
}
