'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge, badgeVariants } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Maximize2 } from 'lucide-react'

export default function RichParagraphConfigPanel({ html, onChange, fieldOptions = [] }) {
  const editorRef = useRef(null)
  const largeEditorRef = useRef(null)
  const fieldMapRef = useRef({})
  const isUserEditingRef = useRef(false)
  const lastHtmlRef = useRef('')
  const isInitialMountRef = useRef(true)
  const selectedBadgeRef = useRef(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogHtml, setDialogHtml] = useState('')

  useEffect(() => {
    fieldMapRef.current = Object.fromEntries(fieldOptions.map(o => [o.value, o.label]))
  }, [fieldOptions])

  useEffect(() => {
    if (!editorRef.current) return
    
    const currentHtml = html || ''
    
    // En el montaje inicial, siempre renderizar el contenido
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false
      lastHtmlRef.current = currentHtml
      renderContent()
      return
    }
    
    // Solo actualizar si el HTML cambió externamente y no estamos editando
    if (isUserEditingRef.current) return
    if (lastHtmlRef.current === currentHtml) return
    
    lastHtmlRef.current = currentHtml
    renderContent()
  }, [html])

  const badgeClass = badgeVariants({ variant: 'secondary' }) + ' px-1 py-0.5 text-xs gap-1 cursor-default'

  const createBadge = (field, label) => {
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
    
    // Agregar un espacio invisible después del badge para permitir posicionar el cursor
    const cursorPlaceholder = document.createTextNode('\u200B') // Zero-width space
    return { badge: span, placeholder: cursorPlaceholder }
  }

  const renderContent = () => {
    if (!editorRef.current) return
    const parser = new DOMParser()
    const doc = parser.parseFromString(html || '', 'text/html')

    const replaceTokens = (node, styleWrappers = []) => {
      const children = Array.from(node.childNodes)
      
      children.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const parts = child.textContent.split(/({{[^}]+}})/g)
          const frag = document.createDocumentFragment()
          
          parts.forEach(part => {
            if (/^{{[^}]+}}$/.test(part)) {
              const field = part.slice(2, -2)
              const label = fieldMapRef.current[field] || fieldOptions.find(opt => opt.value === field)?.label || field
              
              const { badge, placeholder } = createBadge(field, label)
              let badgeElement = badge
              
              // Aplicar wrappers de estilo en orden (del más interno al más externo)
              styleWrappers.forEach(wrapper => {
                const wrapperEl = document.createElement(wrapper.tag)
                if (wrapper.style) {
                  wrapperEl.setAttribute('style', wrapper.style)
                }
                wrapperEl.appendChild(badgeElement)
                badgeElement = wrapperEl
              })
              
              frag.appendChild(badgeElement)
              frag.appendChild(placeholder.cloneNode())
            } else if (part) {
              frag.appendChild(document.createTextNode(part))
            }
          })
          
          child.replaceWith(frag)
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          // Detectar elementos de estilo
          const newWrappers = [...styleWrappers]
          
          if (child.tagName === 'B' || child.tagName === 'I' || child.tagName === 'U') {
            newWrappers.push({ tag: child.tagName.toLowerCase() })
          } else if (child.tagName === 'SPAN' && child.hasAttribute('style')) {
            newWrappers.push({ tag: 'span', style: child.getAttribute('style') })
          }
          
          replaceTokens(child, newWrappers)
        }
      })
    }

    replaceTokens(doc.body)
    editorRef.current.innerHTML = doc.body.innerHTML
    
    // Asegurar que todos los badges tienen un placeholder después
    const allBadges = editorRef.current.querySelectorAll('[data-field]')
    allBadges.forEach(badge => {
      let nextSibling = badge.nextSibling
      // Verificar si el siguiente nodo es un placeholder
      if (!nextSibling || nextSibling.nodeType !== Node.TEXT_NODE || nextSibling.textContent !== '\u200B') {
        // Crear placeholder si no existe
        const placeholder = document.createTextNode('\u200B')
        badge.parentNode.insertBefore(placeholder, badge.nextSibling)
      }
    })
    
    // Verificar si el badge seleccionado aún existe después del renderizado
    if (selectedBadgeRef.current && !editorRef.current.contains(selectedBadgeRef.current)) {
      setSelectedBadge(null)
    }
  }

  const extractValue = () => {
    if (!editorRef.current) return ''
    const clone = editorRef.current.cloneNode(true)
    
    // Procesar badges preservando sus estilos
    clone.querySelectorAll('[data-field]').forEach(el => {
      const field = el.getAttribute('data-field')
      let wrapper = el.parentElement
      
      // Si el badge está envuelto en elementos de estilo, preservarlos
      const styleTags = []
      while (wrapper && wrapper !== clone) {
        if (wrapper.tagName === 'B') {
          styleTags.unshift('<b>')
          styleTags.push('</b>')
        } else if (wrapper.tagName === 'I') {
          styleTags.unshift('<i>')
          styleTags.push('</i>')
        } else if (wrapper.tagName === 'U') {
          styleTags.unshift('<u>')
          styleTags.push('</u>')
        } else if (wrapper.tagName === 'SPAN' && wrapper.hasAttribute('style')) {
          const style = wrapper.getAttribute('style')
          styleTags.unshift(`<span style="${style}">`)
          styleTags.push('</span>')
        }
        wrapper = wrapper.parentElement
      }
      
      // Crear el token con los estilos
      const token = `{{${field}}}`
      const styledToken = styleTags.length > 0 
        ? styleTags.slice(0, styleTags.length / 2).join('') + token + styleTags.slice(styleTags.length / 2).join('')
        : token
      
      // Reemplazar el elemento más externo (el wrapper de estilo más externo o el badge mismo)
      let elementToReplace = el
      let current = el.parentElement
      while (current && current !== clone) {
        if (current.tagName === 'B' || current.tagName === 'I' || current.tagName === 'U' ||
            (current.tagName === 'SPAN' && current.hasAttribute('style'))) {
          elementToReplace = current
        }
        current = current.parentElement
      }
      
      // Crear un nodo de texto con el token estilizado
      const parser = new DOMParser()
      const tempDoc = parser.parseFromString(styledToken, 'text/html')
      const fragment = document.createDocumentFragment()
      Array.from(tempDoc.body.childNodes).forEach(node => {
        fragment.appendChild(node.cloneNode(true))
      })
      
      elementToReplace.replaceWith(fragment)
    })
    
    // Eliminar placeholders (zero-width spaces) del HTML final
    const walker = document.createTreeWalker(
      clone,
      NodeFilter.SHOW_TEXT,
      null
    )
    const textNodesToRemove = []
    let node
    while (node = walker.nextNode()) {
      if (node.textContent === '\u200B') {
        textNodesToRemove.push(node)
      }
    }
    textNodesToRemove.forEach(textNode => {
      textNode.remove()
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
              const { badge, placeholder } = createBadge(field, label)
              frag.appendChild(badge)
              frag.appendChild(placeholder.cloneNode())
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

  const getSelectedBadge = () => {
    return selectedBadgeRef.current
  }

  const setSelectedBadge = (badge) => {
    // Remover selección visual de todos los badges
    if (editorRef.current) {
      editorRef.current.querySelectorAll('[data-field]').forEach(b => {
        b.classList.remove('ring-2', 'ring-primary', 'ring-offset-1', 'bg-primary/10')
      })
    }
    
    // Establecer nuevo badge seleccionado
    selectedBadgeRef.current = badge
    
    // Agregar selección visual al nuevo badge
    if (badge) {
      badge.classList.add('ring-2', 'ring-primary', 'ring-offset-1', 'bg-primary/10')
    }
  }

  const findStyleWrapper = (badge, tagName) => {
    let current = badge.parentElement
    while (current && current !== editorRef.current) {
      if (current.tagName === tagName) {
        return current
      }
      current = current.parentElement
    }
    return null
  }

  const applyStyleToBadge = (badge, styleType, value) => {
    if (!badge) return
    
    if (styleType === 'bold') {
      const boldWrapper = findStyleWrapper(badge, 'B')
      if (boldWrapper) {
        // Ya está en negrita, quitar el wrapper preservando otros wrappers
        const parent = boldWrapper.parentElement
        const children = Array.from(boldWrapper.childNodes)
        if (parent && parent !== editorRef.current) {
          children.forEach(child => parent.insertBefore(child, boldWrapper))
        } else {
          children.forEach(child => editorRef.current.insertBefore(child, boldWrapper))
        }
        boldWrapper.remove()
      } else {
        // Envolver en <b>
        const b = document.createElement('b')
        badge.replaceWith(b)
        b.appendChild(badge)
      }
    } else if (styleType === 'italic') {
      const italicWrapper = findStyleWrapper(badge, 'I')
      if (italicWrapper) {
        // Ya está en cursiva, quitar el wrapper preservando otros wrappers
        const parent = italicWrapper.parentElement
        const children = Array.from(italicWrapper.childNodes)
        if (parent && parent !== editorRef.current) {
          children.forEach(child => parent.insertBefore(child, italicWrapper))
        } else {
          children.forEach(child => editorRef.current.insertBefore(child, italicWrapper))
        }
        italicWrapper.remove()
      } else {
        // Envolver en <i>
        const i = document.createElement('i')
        badge.replaceWith(i)
        i.appendChild(badge)
      }
    } else if (styleType === 'underline') {
      const underlineWrapper = findStyleWrapper(badge, 'U')
      if (underlineWrapper) {
        // Ya está subrayado, quitar el wrapper preservando otros wrappers
        const parent = underlineWrapper.parentElement
        const children = Array.from(underlineWrapper.childNodes)
        if (parent && parent !== editorRef.current) {
          children.forEach(child => parent.insertBefore(child, underlineWrapper))
        } else {
          children.forEach(child => editorRef.current.insertBefore(child, underlineWrapper))
        }
        underlineWrapper.remove()
      } else {
        // Envolver en <u>
        const u = document.createElement('u')
        badge.replaceWith(u)
        u.appendChild(badge)
      }
    } else if (styleType === 'color') {
      // Buscar span con style que contenga color
      let colorSpan = null
      let current = badge.parentElement
      while (current && current !== editorRef.current) {
        if (current.tagName === 'SPAN' && current.hasAttribute('style') && 
            current.getAttribute('style').includes('color')) {
          colorSpan = current
          break
        }
        current = current.parentElement
      }
      
      if (colorSpan) {
        // Actualizar el color existente
        colorSpan.style.color = value
      } else {
        // Crear nuevo span con color
        const span = document.createElement('span')
        span.style.color = value
        badge.replaceWith(span)
        span.appendChild(badge)
      }
    }
  }

  const exec = (cmd) => {
    const selectedBadge = getSelectedBadge()
    
    if (selectedBadge) {
      // Aplicar estilo al badge seleccionado
      if (cmd === 'bold') {
        applyStyleToBadge(selectedBadge, 'bold')
      } else if (cmd === 'italic') {
        applyStyleToBadge(selectedBadge, 'italic')
      } else if (cmd === 'underline') {
        applyStyleToBadge(selectedBadge, 'underline')
      }
      handleInput()
      // Mantener la selección visual
      setSelectedBadge(selectedBadge)
    } else {
      // Comportamiento normal para texto
      document.execCommand(cmd, false, null)
      handleInput()
      // Limpiar selección de badge cuando se edita texto normal
      setSelectedBadge(null)
    }
  }

  const setColor = (color) => {
    const selectedBadge = getSelectedBadge()
    
    if (selectedBadge) {
      // Aplicar color al badge seleccionado
      applyStyleToBadge(selectedBadge, 'color', color)
      handleInput()
      // Mantener la selección visual
      setSelectedBadge(selectedBadge)
    } else {
      // Comportamiento normal para texto
      document.execCommand('foreColor', false, color)
      handleInput()
      // Limpiar selección de badge cuando se edita texto normal
      setSelectedBadge(null)
    }
  }

  const insertField = (field) => {
    if (!editorRef.current) return
    const label = fieldMapRef.current[field] || fieldOptions.find(opt => opt.value === field)?.label || field
    
    const { badge, placeholder } = createBadge(field, label)

    const sel = window.getSelection()
    const editor = editorRef.current
    if (!sel || !sel.rangeCount) {
      editor.appendChild(badge)
      editor.appendChild(placeholder.cloneNode())
      // Posicionar cursor después del placeholder
      const range = document.createRange()
      range.setStartAfter(editor.lastChild)
      range.collapse(true)
      sel.removeAllRanges()
      sel.addRange(range)
    } else {
      const range = sel.getRangeAt(0)
      if (!editor.contains(range.commonAncestorContainer)) {
        editor.appendChild(badge)
        editor.appendChild(placeholder.cloneNode())
        // Posicionar cursor después del placeholder
        const newRange = document.createRange()
        newRange.setStartAfter(editor.lastChild)
        newRange.collapse(true)
        sel.removeAllRanges()
        sel.addRange(newRange)
      } else {
        range.deleteContents()
        range.insertNode(badge)
        range.insertNode(placeholder.cloneNode())
        range.setStartAfter(placeholder)
        range.collapse(true)
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
      
      // Manejar eliminación de badge
      if (target.closest && target.closest('[data-remove="true"]')) {
        e.preventDefault()
        e.stopPropagation()
        const badge = target.closest('[data-field]')
        if (badge === selectedBadgeRef.current) {
          setSelectedBadge(null)
        }
        badge?.remove()
        onChange(extractValue())
        return
      }
      
      // Manejar selección de badge (solo cambio visual, sin seleccionar texto)
      const badge = target.closest('[data-field]')
      if (badge && !target.closest('[data-remove="true"]')) {
        e.preventDefault()
        e.stopPropagation()
        
        // Solo establecer el badge seleccionado visualmente, sin seleccionar el texto
        setSelectedBadge(badge)
        
        // Prevenir que el editor pierda el foco
        editor.focus()
        return
      }
      
      // Limpiar selección de badge si se hace clic fuera
      setSelectedBadge(null)
      
      // Asegurar que todos los badges tienen un placeholder después
      setTimeout(() => {
        const allBadges = editor.querySelectorAll('[data-field]')
        allBadges.forEach(badge => {
          let nextSibling = badge.nextSibling
          // Verificar si el siguiente nodo es un placeholder
          if (!nextSibling || nextSibling.nodeType !== Node.TEXT_NODE || nextSibling.textContent !== '\u200B') {
            // Crear placeholder si no existe
            const placeholder = document.createTextNode('\u200B')
            badge.parentNode.insertBefore(placeholder, badge.nextSibling)
          }
        })
      }, 0)
    }
    
    // Prevenir edición del texto dentro de los badges y manejar Enter
    const handleKeyDown = (e) => {
      const selectedBadge = getSelectedBadge()
      
      if (selectedBadge) {
        // Si hay un badge seleccionado, permitir eliminarlo con Backspace/Delete
        if (e.key === 'Backspace' || e.key === 'Delete') {
          e.preventDefault()
          selectedBadge.remove()
          setSelectedBadge(null)
          onChange(extractValue())
        } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          // Prevenir escribir dentro del badge
          e.preventDefault()
        }
      }
      
      // Manejar Enter para insertar salto de línea correctamente
      if (e.key === 'Enter') {
        e.preventDefault()
        const sel = window.getSelection()
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0)
          const container = range.startContainer
          
          // Crear un elemento <br> para el salto de línea
          const br = document.createElement('br')
          
          // Si estamos en un placeholder después de un badge, insertar después del placeholder
          if (container.nodeType === Node.TEXT_NODE && container.textContent === '\u200B') {
            container.parentNode.insertBefore(br, container.nextSibling)
            // Posicionar cursor después del <br>
            const newRange = document.createRange()
            newRange.setStartAfter(br)
            newRange.collapse(true)
            sel.removeAllRanges()
            sel.addRange(newRange)
          } else {
            // Insertar normalmente
            range.deleteContents()
            range.insertNode(br)
            // Posicionar cursor después del <br>
            range.setStartAfter(br)
            range.collapse(true)
            sel.removeAllRanges()
            sel.addRange(range)
          }
          
          handleInput()
        }
      }
    }
    
    // Limpiar selección cuando se hace clic fuera del editor
    const handleClickOutside = (e) => {
      if (!editor.contains(e.target)) {
        setSelectedBadge(null)
      }
    }
    
    editor.addEventListener('click', handleClick)
    editor.addEventListener('keydown', handleKeyDown)
    document.addEventListener('click', handleClickOutside)
    
    return () => {
      editor.removeEventListener('click', handleClick)
      editor.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [onChange])

  const handleOpenDialog = () => {
    // Obtener el contenido actual del editor pequeño como HTML con tokens
    const currentContent = editorRef.current ? extractValue() : (html || '')
    // Establecer el contenido primero
    setDialogHtml(currentContent)
    // Luego abrir el diálogo después de un pequeño delay para asegurar que dialogHtml esté actualizado
    setTimeout(() => {
      setIsDialogOpen(true)
    }, 0)
  }

  // Callback ref para el editor grande
  const setLargeEditorRef = (element) => {
    largeEditorRef.current = element
  }
  
  // Efecto para renderizar cuando el diálogo se abre o cuando dialogHtml cambia
  useEffect(() => {
    if (isDialogOpen && largeEditorRef.current) {
      const contentToRender = dialogHtml || html || ''
      // Usar setTimeout para asegurar que el DOM esté completamente listo
      const timer = setTimeout(() => {
        if (largeEditorRef.current && contentToRender) {
          renderContentInEditor(largeEditorRef.current, contentToRender)
        }
      }, 150)
      
      return () => clearTimeout(timer)
    }
  }, [isDialogOpen, dialogHtml, html])

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
  }

  const handleSaveDialog = () => {
    if (largeEditorRef.current) {
      const largeValue = extractValueFromEditor(largeEditorRef.current)
      onChange(largeValue)
    }
    setIsDialogOpen(false)
  }

  const processTextFieldsInLargeEditor = () => {
    if (!largeEditorRef.current) return
    const walker = document.createTreeWalker(
      largeEditorRef.current,
      NodeFilter.SHOW_TEXT,
      null
    )
    const textNodes = []
    let node
    while (node = walker.nextNode()) {
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
            
            if (label) {
              const { badge, placeholder } = createBadge(field, label)
              frag.appendChild(badge)
              frag.appendChild(placeholder.cloneNode())
            } else {
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

  const execLargeEditor = (cmd) => {
    if (!largeEditorRef.current) return
    
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return
    
    const range = sel.getRangeAt(0)
    const container = range.commonAncestorContainer
    
    // Buscar badge seleccionado
    let node = container.nodeType === Node.ELEMENT_NODE ? container : container.parentElement
    let selectedBadge = null
    while (node && node !== largeEditorRef.current) {
      if (node.hasAttribute && node.hasAttribute('data-field')) {
        selectedBadge = node
        break
      }
      node = node.parentElement
    }
    
    if (selectedBadge) {
      // Aplicar estilo al badge seleccionado
      if (cmd === 'bold') {
        applyStyleToBadge(selectedBadge, 'bold')
      } else if (cmd === 'italic') {
        applyStyleToBadge(selectedBadge, 'italic')
      } else if (cmd === 'underline') {
        applyStyleToBadge(selectedBadge, 'underline')
      }
      setDialogHtml(extractValueFromEditor(largeEditorRef.current))
      setSelectedBadge(selectedBadge)
    } else {
      // Comportamiento normal para texto
      document.execCommand(cmd, false, null)
      processTextFieldsInLargeEditor()
      setDialogHtml(extractValueFromEditor(largeEditorRef.current))
      setSelectedBadge(null)
    }
  }

  const setColorLargeEditor = (color) => {
    if (!largeEditorRef.current) return
    
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return
    
    const range = sel.getRangeAt(0)
    const container = range.commonAncestorContainer
    
    // Buscar badge seleccionado
    let node = container.nodeType === Node.ELEMENT_NODE ? container : container.parentElement
    let selectedBadge = null
    while (node && node !== largeEditorRef.current) {
      if (node.hasAttribute && node.hasAttribute('data-field')) {
        selectedBadge = node
        break
      }
      node = node.parentElement
    }
    
    if (selectedBadge) {
      applyStyleToBadge(selectedBadge, 'color', color)
      setDialogHtml(extractValueFromEditor(largeEditorRef.current))
      setSelectedBadge(selectedBadge)
    } else {
      document.execCommand('foreColor', false, color)
      processTextFieldsInLargeEditor()
      setDialogHtml(extractValueFromEditor(largeEditorRef.current))
      setSelectedBadge(null)
    }
  }

  const extractValueFromEditor = (editor) => {
    if (!editor) return ''
    const clone = editor.cloneNode(true)
    
    // Procesar badges preservando sus estilos
    clone.querySelectorAll('[data-field]').forEach(el => {
      const field = el.getAttribute('data-field')
      let wrapper = el.parentElement
      
      // Si el badge está envuelto en elementos de estilo, preservarlos
      const styleTags = []
      while (wrapper && wrapper !== clone) {
        if (wrapper.tagName === 'B') {
          styleTags.unshift('<b>')
          styleTags.push('</b>')
        } else if (wrapper.tagName === 'I') {
          styleTags.unshift('<i>')
          styleTags.push('</i>')
        } else if (wrapper.tagName === 'U') {
          styleTags.unshift('<u>')
          styleTags.push('</u>')
        } else if (wrapper.tagName === 'SPAN' && wrapper.hasAttribute('style')) {
          const style = wrapper.getAttribute('style')
          styleTags.unshift(`<span style="${style}">`)
          styleTags.push('</span>')
        }
        wrapper = wrapper.parentElement
      }
      
      // Crear el token con los estilos
      const token = `{{${field}}}`
      const styledToken = styleTags.length > 0 
        ? styleTags.slice(0, styleTags.length / 2).join('') + token + styleTags.slice(styleTags.length / 2).join('')
        : token
      
      // Reemplazar el elemento más externo (el wrapper de estilo más externo o el badge mismo)
      let elementToReplace = el
      let current = el.parentElement
      while (current && current !== clone) {
        if (current.tagName === 'B' || current.tagName === 'I' || current.tagName === 'U' ||
            (current.tagName === 'SPAN' && current.hasAttribute('style'))) {
          elementToReplace = current
        }
        current = current.parentElement
      }
      
      // Crear un nodo de texto con el token estilizado
      const parser = new DOMParser()
      const tempDoc = parser.parseFromString(styledToken, 'text/html')
      const fragment = document.createDocumentFragment()
      Array.from(tempDoc.body.childNodes).forEach(node => {
        fragment.appendChild(node.cloneNode(true))
      })
      
      elementToReplace.replaceWith(fragment)
    })
    
    // Eliminar placeholders (zero-width spaces) del HTML final
    const walker = document.createTreeWalker(
      clone,
      NodeFilter.SHOW_TEXT,
      null
    )
    const textNodesToRemove = []
    let node
    while (node = walker.nextNode()) {
      if (node.textContent === '\u200B') {
        textNodesToRemove.push(node)
      }
    }
    textNodesToRemove.forEach(textNode => {
      textNode.remove()
    })
    
    return clone.innerHTML
  }

  const renderContentInEditor = (editor, contentHtml) => {
    if (!editor) return
    
    // Usar exactamente la misma lógica que renderContent()
    const parser = new DOMParser()
    const doc = parser.parseFromString(contentHtml || '', 'text/html')

    const replaceTokens = (node, styleWrappers = []) => {
      const children = Array.from(node.childNodes)
      
      children.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const parts = child.textContent.split(/({{[^}]+}})/g)
          const frag = document.createDocumentFragment()
          
          parts.forEach(part => {
            if (/^{{[^}]+}}$/.test(part)) {
              const field = part.slice(2, -2)
              const label = fieldMapRef.current[field] || fieldOptions.find(opt => opt.value === field)?.label || field
              
              const { badge, placeholder } = createBadge(field, label)
              let badgeElement = badge
              
              // Aplicar wrappers de estilo en orden (del más interno al más externo)
              styleWrappers.forEach(wrapper => {
                const wrapperEl = document.createElement(wrapper.tag)
                if (wrapper.style) {
                  wrapperEl.setAttribute('style', wrapper.style)
                }
                wrapperEl.appendChild(badgeElement)
                badgeElement = wrapperEl
              })
              
              frag.appendChild(badgeElement)
              frag.appendChild(placeholder.cloneNode())
            } else if (part) {
              frag.appendChild(document.createTextNode(part))
            }
          })
          
          child.replaceWith(frag)
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          // Detectar elementos de estilo
          const newWrappers = [...styleWrappers]
          
          if (child.tagName === 'B' || child.tagName === 'I' || child.tagName === 'U') {
            newWrappers.push({ tag: child.tagName.toLowerCase() })
          } else if (child.tagName === 'SPAN' && child.hasAttribute('style')) {
            newWrappers.push({ tag: 'span', style: child.getAttribute('style') })
          }
          
          replaceTokens(child, newWrappers)
        }
      })
    }

    replaceTokens(doc.body)
    editor.innerHTML = doc.body.innerHTML
    
    // Asegurar que todos los badges tienen un placeholder después
    const allBadges = editor.querySelectorAll('[data-field]')
    allBadges.forEach(badge => {
      let nextSibling = badge.nextSibling
      // Verificar si el siguiente nodo es un placeholder
      if (!nextSibling || nextSibling.nodeType !== Node.TEXT_NODE || nextSibling.textContent !== '\u200B') {
        // Crear placeholder si no existe
        const placeholder = document.createTextNode('\u200B')
        badge.parentNode.insertBefore(placeholder, badge.nextSibling)
      }
    })
  }

  // Efecto para sincronizar el contenido del diálogo cuando dialogHtml cambia o cuando se abre
  useEffect(() => {
    if (isDialogOpen) {
      const timer = setTimeout(() => {
        if (largeEditorRef.current) {
          const contentToRender = dialogHtml || html || ''
          renderContentInEditor(largeEditorRef.current, contentToRender)
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [dialogHtml, isDialogOpen, html])

  // Efecto para manejar eventos del editor grande
  useEffect(() => {
    const largeEditor = largeEditorRef.current
    if (!largeEditor || !isDialogOpen) return

    const handleLargeEditorClick = (e) => {
      const target = e.target
      
      // Manejar eliminación de badge
      if (target.closest && target.closest('[data-remove="true"]')) {
        e.preventDefault()
        e.stopPropagation()
        const badge = target.closest('[data-field]')
        badge?.remove()
        setDialogHtml(extractValueFromEditor(largeEditor))
        return
      }
      
      // Limpiar selección de badge si se hace clic fuera
      setSelectedBadge(null)
      
      // Asegurar que todos los badges tienen un placeholder después
      setTimeout(() => {
        const allBadges = largeEditor.querySelectorAll('[data-field]')
        allBadges.forEach(badge => {
          let nextSibling = badge.nextSibling
          if (!nextSibling || nextSibling.nodeType !== Node.TEXT_NODE || nextSibling.textContent !== '\u200B') {
            const placeholder = document.createTextNode('\u200B')
            badge.parentNode.insertBefore(placeholder, badge.nextSibling)
          }
        })
      }, 0)
    }

    const handleLargeEditorKeyDown = (e) => {
      const selectedBadge = getSelectedBadge()
      
      if (selectedBadge && largeEditor.contains(selectedBadge)) {
        if (e.key === 'Backspace' || e.key === 'Delete') {
          e.preventDefault()
          selectedBadge.remove()
          setSelectedBadge(null)
          setDialogHtml(extractValueFromEditor(largeEditor))
        } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          e.preventDefault()
        }
      }
      
      // Manejar Enter
      if (e.key === 'Enter') {
        e.preventDefault()
        const sel = window.getSelection()
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0)
          const container = range.startContainer
          
          const br = document.createElement('br')
          
          if (container.nodeType === Node.TEXT_NODE && container.textContent === '\u200B') {
            container.parentNode.insertBefore(br, container.nextSibling)
            const newRange = document.createRange()
            newRange.setStartAfter(br)
            newRange.collapse(true)
            sel.removeAllRanges()
            sel.addRange(newRange)
          } else {
            range.deleteContents()
            range.insertNode(br)
            range.setStartAfter(br)
            range.collapse(true)
            sel.removeAllRanges()
            sel.addRange(range)
          }
          
          setDialogHtml(extractValueFromEditor(largeEditor))
        }
      }
    }

    largeEditor.addEventListener('click', handleLargeEditorClick)
    largeEditor.addEventListener('keydown', handleLargeEditorKeyDown)

    return () => {
      largeEditor.removeEventListener('click', handleLargeEditorClick)
      largeEditor.removeEventListener('keydown', handleLargeEditorKeyDown)
    }
  }, [isDialogOpen])

  return (
    <div className='space-y-2'>
      <div className='flex items-center gap-2'>
        <Button variant='outline' size='sm' onClick={() => exec('bold')}>B</Button>
        <Button variant='outline' size='sm' onClick={() => exec('italic')}><span className='italic'>I</span></Button>
        <Button variant='outline' size='sm' onClick={() => exec('underline')}><span className='underline'>U</span></Button>
        <Input type='color' className='w-8 h-8 p-0' onChange={(e) => setColor(e.target.value)} />
        <Button 
          variant='outline' 
          size='sm' 
          onClick={handleOpenDialog}
          className='ml-auto'
          title='Abrir editor grande'
        >
          <Maximize2 className='h-4 w-4' />
        </Button>
      </div>
      <div
        ref={editorRef}
        className='min-h-[80px] border border-input bg-background rounded-md p-2 focus:outline-none'
        style={{ fontSize: '14px', lineHeight: '2.2' }}
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

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open)
        // Cuando se abre el diálogo, renderizar el contenido
        if (open) {
          setTimeout(() => {
            if (largeEditorRef.current) {
              // Obtener el contenido actual del editor pequeño
              const currentContent = editorRef.current ? extractValue() : (html || '')
              renderContentInEditor(largeEditorRef.current, currentContent)
            }
          }, 200)
        }
      }}>
        <DialogContent className='max-w-4xl max-h-[90vh] flex flex-col'>
          <DialogHeader>
            <DialogTitle>Editor de Texto</DialogTitle>
          </DialogHeader>
          <div className='flex-1 overflow-auto'>
            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <Button variant='outline' size='sm' onClick={() => execLargeEditor('bold')}>B</Button>
                <Button variant='outline' size='sm' onClick={() => execLargeEditor('italic')}><span className='italic'>I</span></Button>
                <Button variant='outline' size='sm' onClick={() => execLargeEditor('underline')}><span className='underline'>U</span></Button>
                <Input type='color' className='w-8 h-8 p-0' onChange={(e) => setColorLargeEditor(e.target.value)} />
              </div>
              <div
                ref={setLargeEditorRef}
                className='min-h-[400px] border border-input bg-background rounded-md p-4 focus:outline-none'
                style={{ fontSize: '16px', lineHeight: '2.2' }}
                contentEditable
                onInput={() => {
                  if (largeEditorRef.current) {
                    processTextFieldsInLargeEditor()
                    setDialogHtml(extractValueFromEditor(largeEditorRef.current))
                  }
                }}
              />
              <div className='flex flex-wrap gap-1'>
                {fieldOptions.map(opt => (
                  <Badge
                    key={opt.value}
                    className='cursor-pointer select-none px-1.5 py-0.5 text-xs'
                    onClick={() => {
                      if (!largeEditorRef.current) return
                      const label = fieldMapRef.current[opt.value] || opt.label || opt.value
                      const { badge, placeholder } = createBadge(opt.value, label)
                      const sel = window.getSelection()
                      if (!sel || !sel.rangeCount) {
                        largeEditorRef.current.appendChild(badge)
                        largeEditorRef.current.appendChild(placeholder.cloneNode())
                      } else {
                        const range = sel.getRangeAt(0)
                        range.deleteContents()
                        range.insertNode(badge)
                        range.insertNode(placeholder.cloneNode())
                        range.setStartAfter(placeholder)
                        range.collapse(true)
                        sel.removeAllRanges()
                        sel.addRange(range)
                      }
                      setDialogHtml(extractValueFromEditor(largeEditorRef.current))
                    }}
                  >
                    {opt.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={handleCloseDialog}>Cancelar</Button>
            <Button onClick={handleSaveDialog}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
