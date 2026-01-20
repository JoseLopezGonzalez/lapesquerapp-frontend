'use client'
import React, { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge, badgeVariants } from '@/components/ui/badge'

export default function RichParagraphConfigPanel({ html, onChange, fieldOptions = [] }) {
  const editorRef = useRef(null)
  const fieldMapRef = useRef({})
  const isUserEditingRef = useRef(false)
  const lastHtmlRef = useRef(html || '')

  useEffect(() => {
    fieldMapRef.current = Object.fromEntries(fieldOptions.map(o => [o.value, o.label]))
  }, [fieldOptions])

  useEffect(() => {
    if (!editorRef.current) return
    // Solo actualizar si el HTML cambió externamente y no estamos editando
    if (isUserEditingRef.current) return
    if (lastHtmlRef.current === (html || '')) return
    
    lastHtmlRef.current = html || ''
    renderContent()
  }, [html])

  const badgeClass = badgeVariants({ variant: 'secondary' }) + ' px-1 py-0.5 text-xs gap-1 cursor-default'

  const renderContent = () => {
    if (!editorRef.current) return
    const parser = new DOMParser()
    const doc = parser.parseFromString(html || '', 'text/html')

    const replaceTokens = (node) => {
      node.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const parts = child.textContent.split(/({{[^}]+}})/g)
          const frag = document.createDocumentFragment()
          parts.forEach(part => {
            if (/^{{[^}]+}}$/.test(part)) {
              const field = part.slice(2, -2)
              const label = fieldMapRef.current[field] || fieldOptions.find(opt => opt.value === field)?.label || field
              
              const span = document.createElement('span')
              span.setAttribute('data-field', field)
              span.setAttribute('contenteditable', 'false')
              span.className = badgeClass
              const lspan = document.createElement('span')
              lspan.textContent = label
              const removeSpan = document.createElement('span')
              removeSpan.setAttribute('data-remove', 'true')
              removeSpan.className = 'ml-1 cursor-pointer'
              removeSpan.textContent = '×'
              span.appendChild(lspan)
              span.appendChild(removeSpan)
              frag.appendChild(span)
            } else {
              frag.appendChild(document.createTextNode(part))
            }
          })
          child.replaceWith(frag)
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          replaceTokens(child)
        }
      })
    }

    replaceTokens(doc.body)
    editorRef.current.innerHTML = doc.body.innerHTML
  }

  const extractValue = () => {
    if (!editorRef.current) return ''
    const clone = editorRef.current.cloneNode(true)
    clone.querySelectorAll('[data-field]').forEach(el => {
      const field = el.getAttribute('data-field')
      el.replaceWith(`{{${field}}}`)
    })
    return clone.innerHTML
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
            
            // Solo convertir si el campo existe en las opciones
            if (label) {
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
              frag.appendChild(span)
            } else {
              // Si no existe, mantener como texto
              frag.appendChild(document.createTextNode(part))
            }
          } else {
            frag.appendChild(document.createTextNode(part))
          }
        })
        textNode.replaceWith(frag)
      }
    })
  }

  const handleInput = () => {
    isUserEditingRef.current = true
    processTextFields()
    const value = extractValue()
    lastHtmlRef.current = value
    onChange(value)
    // Resetear el flag después de un breve delay para permitir actualizaciones externas
    setTimeout(() => {
      isUserEditingRef.current = false
    }, 100)
  }

  const exec = (cmd) => {
    document.execCommand(cmd, false, null)
    handleInput()
  }

  const setColor = (color) => {
    document.execCommand('foreColor', false, color)
    handleInput()
  }

  const insertField = (field) => {
    if (!editorRef.current) return
    const label = fieldMapRef.current[field] || fieldOptions.find(opt => opt.value === field)?.label || field
    
    const span = document.createElement('span')
    span.setAttribute('data-field', field)
    span.setAttribute('contenteditable', 'false')
    span.className = badgeClass
    const lspan = document.createElement('span')
    lspan.textContent = label
    const removeSpan = document.createElement('span')
    removeSpan.setAttribute('data-remove', 'true')
    removeSpan.className = 'ml-1 cursor-pointer'
    removeSpan.textContent = '×'
    span.appendChild(lspan)
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

  return (
    <div className='space-y-2'>
      <div className='flex items-center gap-2'>
        <Button variant='outline' size='sm' onClick={() => exec('bold')}>B</Button>
        <Button variant='outline' size='sm' onClick={() => exec('italic')}><span className='italic'>I</span></Button>
        <Button variant='outline' size='sm' onClick={() => exec('underline')}><span className='underline'>U</span></Button>
        <Input type='color' className='w-8 h-8 p-0' onChange={(e) => setColor(e.target.value)} />
      </div>
      <div
        ref={editorRef}
        className='min-h-[80px] border border-input bg-background rounded-md p-2 text-sm focus:outline-none'
        contentEditable
        onInput={handleInput}
      />
      <div className='flex flex-wrap gap-1'>
        {fieldOptions.map(opt => (
          <Badge
            key={opt.value}
            className='cursor-pointer select-none px-1.5 py-0.5 text-xs'
            onClick={() => insertField(opt.value)}
          >
            {opt.label}
          </Badge>
        ))}
      </div>
    </div>
  )
}
