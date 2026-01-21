'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Edit3, Bold, Italic, Underline, Palette } from 'lucide-react'

export default function RichParagraphConfigPanel({ html, onChange, fieldOptions = [] }) {
  const largeEditorRef = useRef(null)
  const isLargeEditorEditingRef = useRef(false)
  const fieldMapRef = useRef({})
  const labelToFieldMapRef = useRef({}) // Mapeo inverso: label -> campo
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fieldMapRef.current = Object.fromEntries(fieldOptions.map(o => [o.value, o.label]))
    // Crear mapeo inverso: label -> campo
    labelToFieldMapRef.current = Object.fromEntries(fieldOptions.map(o => [o.label, o.value]))
  }, [fieldOptions])

  // Convertir tokens {{campo}} a {{label}} en el texto
  const tokensToLabels = (htmlString) => {
    if (!htmlString) return ''
    let result = htmlString
    
    // Reemplazar cada token {{campo}} por {{label}}
    Object.entries(fieldMapRef.current).forEach(([field, label]) => {
      const token = `{{${field}}}`
      const labelToken = `{{${label}}}`
      result = result.replace(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), labelToken)
    })
    
    return result
  }

  // Convertir {{label}} de vuelta a {{campo}} en el texto
  const labelsToTokens = (htmlString) => {
    if (!htmlString) return ''
    let result = htmlString
    
    // Reemplazar cada {{label}} por {{campo}} usando el mapeo inverso
    Object.entries(labelToFieldMapRef.current).forEach(([label, field]) => {
      const labelToken = `{{${label}}}`
      const token = `{{${field}}}`
      result = result.replace(new RegExp(labelToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), token)
    })
    
    return result
  }

  // Sincronizar editor grande cuando html cambia o se abre el diálogo
  useEffect(() => {
    if (!isDialogOpen) return
    if (isLargeEditorEditingRef.current) return
    
    const syncLargeEditor = () => {
      if (!largeEditorRef.current) {
        setTimeout(syncLargeEditor, 50)
        return
      }
      
      // Convertir tokens a labels para mostrar
      const htmlWithLabels = tokensToLabels(html || '')
      const currentHtml = largeEditorRef.current.innerHTML || ''
      
      if (currentHtml !== htmlWithLabels) {
        largeEditorRef.current.innerHTML = htmlWithLabels
      }
    }
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        syncLargeEditor()
      })
    })
  }, [html, isDialogOpen, fieldOptions])

  // Manejar input del editor grande
  const handleLargeEditorInput = () => {
    if (!largeEditorRef.current) return
    isLargeEditorEditingRef.current = true
    
    // Convertir labels de vuelta a tokens antes de guardar
    const htmlValue = labelsToTokens(largeEditorRef.current.innerHTML)
    onChange(htmlValue)
    
    setTimeout(() => {
      isLargeEditorEditingRef.current = false
    }, 100)
  }

  // Insertar campo en el editor grande
  const insertFieldLarge = (field) => {
    if (!largeEditorRef.current) return
    
    const label = fieldMapRef.current[field] || fieldOptions.find(opt => opt.value === field)?.label || field
    const labelToken = `{{${label}}}`
    
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) {
      // Sin selección, insertar al final
      const textNode = document.createTextNode(labelToken)
      largeEditorRef.current.appendChild(textNode)
    } else {
      // Insertar en la posición del cursor
      const range = sel.getRangeAt(0)
      if (!largeEditorRef.current.contains(range.commonAncestorContainer)) {
        const textNode = document.createTextNode(labelToken)
        largeEditorRef.current.appendChild(textNode)
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
    
    handleLargeEditorInput()
  }

  // Aplicar formato (negrita, cursiva, subrayado)
  const execLargeEditor = (cmd) => {
    if (!largeEditorRef.current) return
    document.execCommand(cmd, false, null)
    handleLargeEditorInput()
  }

  // Aplicar color
  const setColorLargeEditor = (color) => {
    if (!largeEditorRef.current) return
    document.execCommand('foreColor', false, color)
    handleLargeEditorInput()
  }


  // Abrir diálogo
  const handleOpenDialog = () => {
    setIsDialogOpen(true)
  }

  // Callback ref para el editor grande
  const setLargeEditorRef = (element) => {
    largeEditorRef.current = element
    if (element && isDialogOpen) {
      const htmlWithLabels = tokensToLabels(html || '')
      const currentHtml = element.innerHTML || ''
      if (currentHtml !== htmlWithLabels) {
        element.innerHTML = htmlWithLabels
      }
    }
  }

  // Obtener texto plano para vista previa
  const getPreviewText = () => {
    if (!html) return ''
    
    // Convertir tokens a labels y limpiar HTML básico
    let text = html
      .replace(/{{([^}]+)}}/g, (match, field) => {
        const label = fieldMapRef.current[field] || fieldOptions.find(opt => opt.value === field)?.label || field
        return `{{${label}}}`
      })
      .replace(/<br\s*\/?>/gi, '\n') // Convertir <br> a saltos de línea
      .replace(/<[^>]+>/g, '') // Eliminar todas las etiquetas HTML
      .replace(/&nbsp;/g, ' ') // Convertir &nbsp; a espacios
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim()
    
    return text.length > 120 ? text.substring(0, 120) + '...' : text
  }

  const previewText = getPreviewText()

  return (
    <div className='space-y-2'>
      <Button 
        variant='outline' 
        size='sm' 
        onClick={handleOpenDialog}
        className='w-full'
      >
        <Edit3 className='h-4 w-4 mr-2' />
        Editar
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='max-w-5xl max-h-[90vh] flex flex-col'>
          <DialogHeader className='pb-4 border-b'>
            <DialogTitle className='text-xl font-semibold'>Editor de Texto</DialogTitle>
            <p className='text-sm text-muted-foreground mt-1'>Edita el contenido del párrafo con formato y campos dinámicos</p>
          </DialogHeader>
          <div className='flex-1 overflow-auto p-1'>
            <div className='space-y-4'>
              {/* Barra de herramientas de formato */}
              <div className='flex items-center gap-2 p-3 bg-muted/50 rounded-lg border'>
                <div className='flex items-center gap-1'>
                  <Button 
                    variant='ghost' 
                    size='sm' 
                    onClick={() => execLargeEditor('bold')}
                    className='h-9 w-9 p-0'
                    title='Negrita'
                  >
                    <Bold className='h-4 w-4' />
                  </Button>
                  <Button 
                    variant='ghost' 
                    size='sm' 
                    onClick={() => execLargeEditor('italic')}
                    className='h-9 w-9 p-0'
                    title='Cursiva'
                  >
                    <Italic className='h-4 w-4' />
                  </Button>
                  <Button 
                    variant='ghost' 
                    size='sm' 
                    onClick={() => execLargeEditor('underline')}
                    className='h-9 w-9 p-0'
                    title='Subrayado'
                  >
                    <Underline className='h-4 w-4' />
                  </Button>
                </div>
                <div className='h-6 w-px bg-border mx-1' />
                <div className='flex items-center gap-2'>
                  <Palette className='h-4 w-4 text-muted-foreground' />
                  <Input 
                    type='color' 
                    className='w-10 h-9 p-1 cursor-pointer border rounded' 
                    onChange={(e) => setColorLargeEditor(e.target.value)}
                    title='Color del texto'
                  />
                </div>
              </div>
              
              {/* Editor */}
              <div className='border-2 border-dashed border-muted-foreground/20 rounded-lg overflow-hidden focus-within:border-primary transition-colors'>
                <div
                  ref={setLargeEditorRef}
                  className='min-h-[450px] bg-background rounded-md p-6 focus:outline-none prose prose-sm max-w-none'
                  style={{ fontSize: '16px', lineHeight: '1.8' }}
                  contentEditable
                  onInput={handleLargeEditorInput}
                />
              </div>
              
              {/* Campos dinámicos */}
              <div className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-medium text-foreground'>Campos dinámicos:</span>
                  <span className='text-xs text-muted-foreground'>Haz clic para insertar</span>
                </div>
                <div className='flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border'>
                  {fieldOptions.map(opt => (
                    <Badge
                      key={opt.value}
                      variant='secondary'
                      className='cursor-pointer select-none px-3 py-1.5 text-sm font-normal hover:bg-primary hover:text-primary-foreground transition-colors'
                      onClick={() => insertFieldLarge(opt.value)}
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
