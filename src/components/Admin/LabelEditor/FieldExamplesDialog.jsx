'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { labelFields } from '@/hooks/useLabelEditor'

export default function FieldExamplesDialog({ open, onClose, fieldExampleValues, setFieldExampleValues }) {
  const [localValues, setLocalValues] = useState({})

  useEffect(() => {
    if (open) {
      // Inicializar con los valores actuales
      setLocalValues({ ...fieldExampleValues })
    }
  }, [open, fieldExampleValues])

  const handleChange = (fieldKey, value) => {
    setLocalValues(prev => ({
      ...prev,
      [fieldKey]: value
    }))
  }

  const handleSave = () => {
    setFieldExampleValues(localValues)
    onClose()
  }

  const handleReset = () => {
    const defaultValues = {}
    Object.keys(labelFields).forEach(key => {
      defaultValues[key] = labelFields[key].defaultValue
    })
    setLocalValues(defaultValues)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Editar Valores de Ejemplo de Campos Dinámicos</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {Object.entries(labelFields).map(([fieldKey, fieldInfo]) => (
              <div key={fieldKey} className="space-y-2">
                <Label htmlFor={fieldKey} className="text-sm font-medium">
                  {fieldInfo.label}
                </Label>
                <Input
                  id={fieldKey}
                  value={localValues[fieldKey] || ''}
                  onChange={(e) => handleChange(fieldKey, e.target.value)}
                  placeholder={`Ejemplo: ${fieldInfo.defaultValue}`}
                />
                <p className="text-xs text-muted-foreground">
                  Campo: <code className="bg-muted px-1 py-0.5 rounded">{fieldKey}</code>
                </p>
                <Separator />
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            Restaurar Valores por Defecto
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Guardar Cambios
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

