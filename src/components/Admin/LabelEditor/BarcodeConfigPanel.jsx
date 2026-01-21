'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import Barcode from 'react-barcode'
import { serializeBarcode, formatMap } from '@/lib/barcodes'
import { Edit3, Barcode as BarcodeIcon } from 'lucide-react'

const typeOptions = [
  { value: 'ean13', label: 'EAN-13' },
  { value: 'ean14', label: 'EAN-14' },
  /* { value: 'ean13-weight', label: 'EAN-13 con peso' }, */
  { value: 'gs1-128', label: 'GS1-128' },
]

export default function BarcodeConfigPanel({
  value,
  onChange,
  fieldOptions,
  type,
  onTypeChange,
  getFieldValue,
  showValue,
  onShowValueChange,
}) {
  const editorRef = useRef(null)
  const isUserEditingRef = useRef(false)
  const fieldMapRef = useRef({})
  const labelToFieldMapRef = useRef({}) // Mapeo inverso: label -> campo
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fieldMapRef.current = Object.fromEntries(fieldOptions.map(o => [o.value, o.label]))
    // Crear mapeo inverso: label -> campo
    labelToFieldMapRef.current = Object.fromEntries(fieldOptions.map(o => [o.label, o.value]))
  }, [fieldOptions])

  // Convertir tokens {{campo}} a {{label}} en el texto
  const tokensToLabels = (text) => {
    if (!text) return ''
    let result = text
    
    // Reemplazar cada token {{campo}} por {{label}}
    Object.entries(fieldMapRef.current).forEach(([field, label]) => {
      const token = `{{${field}}}`
      const labelToken = `{{${label}}}`
      result = result.replace(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), labelToken)
    })
    
    return result
  }

  // Convertir {{label}} de vuelta a {{campo}} en el texto
  const labelsToTokens = (text) => {
    if (!text) return ''
    let result = text
    
    // Reemplazar cada {{label}} por {{campo}} usando el mapeo inverso
    Object.entries(labelToFieldMapRef.current).forEach(([label, field]) => {
      const labelToken = `{{${label}}}`
      const token = `{{${field}}}`
      result = result.replace(new RegExp(labelToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), token)
    })
    
    return result
  }

  // Obtener texto plano para vista previa
  const getPreviewText = () => {
    if (!value) return ''
    const text = tokensToLabels(value || '')
    return text.length > 120 ? text.substring(0, 120) + '...' : text
  }

  const previewText = getPreviewText()

  // Sincronizar editor cuando value cambia o se abre el diálogo
  useEffect(() => {
    if (!isDialogOpen) return
    if (isUserEditingRef.current) return
    
    const syncEditor = () => {
      if (!editorRef.current) {
        setTimeout(syncEditor, 50)
        return
      }
      
      // Convertir tokens a labels para mostrar
      const textWithLabels = tokensToLabels(value || '')
      const currentText = editorRef.current.textContent || editorRef.current.innerText || ''
      
      if (currentText !== textWithLabels) {
        editorRef.current.textContent = textWithLabels
      }
    }
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        syncEditor()
      })
    })
  }, [value, isDialogOpen, fieldOptions])

  // Manejar input del editor
  const handleInput = () => {
    if (!editorRef.current) return
    isUserEditingRef.current = true
    
    // Convertir labels de vuelta a tokens antes de guardar
    const text = editorRef.current.textContent || editorRef.current.innerText || ''
    const tokens = labelsToTokens(text)
    onChange(tokens)
    
    setTimeout(() => {
      isUserEditingRef.current = false
    }, 100)
  }

  // Insertar campo como {{label}}
  const insertField = (field) => {
    if (!editorRef.current) return
    
    const label = fieldMapRef.current[field] || fieldOptions.find(opt => opt.value === field)?.label || field
    const labelToken = `{{${label}}}`
    
    const sel = window.getSelection()
    const editor = editorRef.current
    
    if (!sel || !sel.rangeCount) {
      editor.appendChild(document.createTextNode(labelToken))
    } else {
      const range = sel.getRangeAt(0)
      if (!editor.contains(range.commonAncestorContainer)) {
        editor.appendChild(document.createTextNode(labelToken))
      } else {
        const textNode = document.createTextNode(labelToken)
        range.deleteContents()
        range.insertNode(textNode)
        range.setStartAfter(textNode)
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
      }
    }
    
    handleInput()
    setTimeout(() => editor.focus(), 0)
  }

  // Callback ref para el editor
  const setEditorRef = (element) => {
    editorRef.current = element
    if (element && isDialogOpen) {
      const textWithLabels = tokensToLabels(value || '')
      const currentText = element.textContent || element.innerText || ''
      if (currentText !== textWithLabels) {
        element.textContent = textWithLabels
      }
    }
  }

  const barcodeValue = serializeBarcode(
    (value || '').replace(/{{([^}]+)}}/g, (_, f) => getFieldValue ? getFieldValue(f) || '' : ''),
    type
  )

  const isValidEAN = (val, len) => {
    const trimmed = typeof val === 'string' ? val.trim() : ''
    return /^\d+$/.test(trimmed) && trimmed.length === len
  }

  const isValidBarcode = () => {
    if (!barcodeValue) return false

    if (type === 'ean13') return isValidEAN(barcodeValue, 12)
    if (type === 'ean14') return isValidEAN(barcodeValue, 13)
    return true // otros tipos como gs1-128 pueden variar
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2">
        <Select value={type} onValueChange={onTypeChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button 
          variant='outline' 
          size='sm' 
          onClick={() => setIsDialogOpen(true)}
          className='w-full'
        >
          <Edit3 className='h-4 w-4 mr-2' />
          Editar contenido
        </Button>
        
        <div className='min-h-[60px] border border-input bg-background rounded-md p-3'>
          {previewText ? (
            <p className='text-sm text-foreground whitespace-pre-wrap line-clamp-3'>
              {previewText}
            </p>
          ) : (
            <p className='text-sm text-muted-foreground italic'>Sin contenido</p>
          )}
        </div>
        
        <div className="flex items-center gap-2 pt-2">
          <Checkbox id="show-value" checked={showValue} onCheckedChange={onShowValueChange} />
          <Label htmlFor="show-value" className="text-xs">Mostrar caracteres</Label>
        </div>
      </div>

      <div className="flex justify-center p-2 border rounded">
        {isValidBarcode() ? (
          <Barcode
            value={barcodeValue}
            format={formatMap[type]}
            width={1}
            height={40}
            displayValue={showValue}
          />
        ) : (
          <span className="text-sm text-red-500">
            Valor no válido para {type.toUpperCase()}
          </span>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='max-w-5xl max-h-[90vh] flex flex-col'>
          <DialogHeader className='pb-4 border-b'>
            <DialogTitle className='text-xl font-semibold flex items-center gap-2'>
              <BarcodeIcon className='h-5 w-5' />
              Editor de Contenido de Código de Barras
            </DialogTitle>
            <p className='text-sm text-muted-foreground mt-1'>Edita el contenido que se mostrará en el código de barras</p>
          </DialogHeader>
          <div className='flex-1 overflow-auto p-1'>
            <div className='space-y-4'>
              {/* Editor */}
              <div className='border-2 border-dashed border-muted-foreground/20 rounded-lg overflow-hidden focus-within:border-primary transition-colors'>
                <div
                  ref={setEditorRef}
                  className="min-h-[450px] bg-background rounded-md p-6 text-base focus:outline-none"
                  style={{ lineHeight: '1.8' }}
                  contentEditable
                  onInput={handleInput}
                />
              </div>
              
              {/* Campos dinámicos */}
              <div className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-medium text-foreground'>Campos dinámicos:</span>
                  <span className='text-xs text-muted-foreground'>Haz clic para insertar</span>
                </div>
                <div className='flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border'>
                  {fieldOptions.map((opt) => (
                    <Badge
                      key={opt.value}
                      variant='secondary'
                      className="cursor-pointer select-none px-3 py-1.5 text-sm font-normal hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => insertField(opt.value)}
                    >
                      {opt.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
