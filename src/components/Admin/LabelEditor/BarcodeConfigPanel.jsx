'use client'
import React, { useEffect, useRef } from 'react'
import { Badge, badgeVariants } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import Barcode from 'react-barcode'
import { serializeBarcode, formatMap } from '@/lib/barcodes'

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
  const fieldMapRef = useRef({})

  useEffect(() => {
    fieldMapRef.current = Object.fromEntries(fieldOptions.map(o => [o.value, o.label]))
  }, [fieldOptions])

  const badgeClass = `${badgeVariants({ variant: 'secondary' })} px-1 py-0.5 text-xs gap-1 cursor-default`

  const renderContent = () => {
    if (!editorRef.current) return
    const parts = (value || '').split(/({{[^}]+}})/g)
    
    editorRef.current.innerHTML = ''
    
    parts.forEach((part) => {
      if (/^{{[^}]+}}$/.test(part)) {
        const field = part.slice(2, -2)
        // Siempre convertir a badge, incluso si no está en las opciones actuales
        const label = fieldMapRef.current[field] || fieldOptions.find(opt => opt.value === field)?.label || field
        
        const span = document.createElement('span')
        span.setAttribute('data-field', field)
        span.setAttribute('contenteditable', 'false')
        span.className = badgeClass
        
        const labelSpan = document.createElement('span')
        labelSpan.textContent = label
        
        const removeSpan = document.createElement('span')
        removeSpan.setAttribute('data-remove', 'true')
        removeSpan.className = 'ml-1 cursor-pointer'
        removeSpan.textContent = '×'
        
        span.appendChild(labelSpan)
        span.appendChild(removeSpan)
        editorRef.current.appendChild(span)
      } else if (part !== undefined && part !== null) {
        // Agregar texto incluso si está vacío (para preservar espacios)
        // Pero solo si realmente hay contenido o es un espacio
        if (part.length > 0 || part === ' ') {
          editorRef.current.appendChild(document.createTextNode(part))
        }
      }
    })
    
    // Procesar cualquier token que pueda haber quedado como texto después del renderizado
    processTextFields()
  }

  useEffect(() => {
    if (editorRef.current && extractValue() === value) return
    renderContent()
  }, [value])

  const extractValue = () => {
    if (!editorRef.current) return ''
    let result = ''
    
    // Función recursiva para recorrer todo el árbol DOM preservando el orden
    const traverse = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        // Agregar el texto tal cual (incluyendo espacios)
        result += node.textContent
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const field = node.getAttribute('data-field')
        if (field) {
          // Es un badge, agregar el token
          result += `{{${field}}}`
        } else {
          // No es un badge, recorrer sus hijos recursivamente en orden
          // Esto maneja casos donde hay elementos wrapper o contenedores
          Array.from(node.childNodes).forEach(child => traverse(child))
        }
      }
    }
    
    // Recorrer todos los nodos hijos del editor en orden
    Array.from(editorRef.current.childNodes).forEach(node => traverse(node))
    
    return result
  }

  const processTextFields = () => {
    if (!editorRef.current) return
    const walker = document.createTreeWalker(
      editorRef.current,
      NodeFilter.SHOW_TEXT,
      null
    )
    const textNodes = []
    let node
    while (node = walker.nextNode()) {
      // Solo procesar nodos de texto que no estén dentro de un badge
      if (node.parentElement && !node.parentElement.hasAttribute('data-field')) {
        textNodes.push(node)
      }
    }

    textNodes.forEach(textNode => {
      const text = textNode.textContent
      const parts = text.split(/({{[^}]+}})/g)
      
      if (parts.length > 1) {
        const frag = document.createDocumentFragment()
        parts.forEach(part => {
          if (/^{{[^}]+}}$/.test(part)) {
            const field = part.slice(2, -2)
            const label = fieldMapRef.current[field] || fieldOptions.find(opt => opt.value === field)?.label
            
            // Siempre convertir a badge, incluso si no está en las opciones actuales
            const span = document.createElement('span')
            span.setAttribute('data-field', field)
            span.setAttribute('contenteditable', 'false')
            span.className = badgeClass

            const labelSpan = document.createElement('span')
            labelSpan.textContent = label || field

            const removeSpan = document.createElement('span')
            removeSpan.setAttribute('data-remove', 'true')
            removeSpan.className = 'ml-1 cursor-pointer'
            removeSpan.textContent = '×'

            span.appendChild(labelSpan)
            span.appendChild(removeSpan)
            frag.appendChild(span)
          } else {
            frag.appendChild(document.createTextNode(part))
          }
        })
        textNode.replaceWith(frag)
      }
    })
  }

  const handleInput = () => {
    processTextFields()
    onChange(extractValue())
  }

  const insertField = (field) => {
    if (!editorRef.current) return
    const label = fieldMapRef.current[field] || field

    const span = document.createElement('span')
    span.setAttribute('data-field', field)
    span.setAttribute('contenteditable', 'false')
    span.className = badgeClass

    const labelSpan = document.createElement('span')
    labelSpan.textContent = label

    const removeSpan = document.createElement('span')
    removeSpan.setAttribute('data-remove', 'true')
    removeSpan.className = 'ml-1 cursor-pointer'
    removeSpan.textContent = '×'

    span.appendChild(labelSpan)
    span.appendChild(removeSpan)

    const sel = window.getSelection()
    const editor = editorRef.current

    if (!sel || !sel.rangeCount) {
      editor.appendChild(span)
    } else {
      const range = sel.getRangeAt(0)
      if (!editor.contains(range.commonAncestorContainer)) {
        editor.appendChild(span)
      } else {
        range.deleteContents()
        range.insertNode(span)
        range.setStartAfter(span)
        range.setEndAfter(span)
        sel.removeAllRanges()
        sel.addRange(range)
      }
    }

    onChange(extractValue())
    setTimeout(() => editor.focus(), 0)
  }

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    const handleClick = (e) => {
      const target = e.target
      if (target.closest && target.closest('[data-remove="true"]')) {
        const badge = target.closest('[data-field]')
        badge?.remove()
        onChange(extractValue())
      }
    }
    editor.addEventListener('click', handleClick)
    return () => editor.removeEventListener('click', handleClick)
  }, [onChange])

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
        <div
          ref={editorRef}
          className="min-h-[40px] border border-input bg-background rounded-md p-2 text-sm focus:outline-none"
          contentEditable
          onInput={handleInput}
        />
        <div className="flex flex-wrap gap-1">
          {fieldOptions.map((opt) => (
            <Badge
              key={opt.value}
              className="cursor-pointer select-none px-1.5 py-0.5 text-xs"
              onClick={() => insertField(opt.value)}
            >
              {opt.label}
            </Badge>
          ))}
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
    </div>
  )
}
