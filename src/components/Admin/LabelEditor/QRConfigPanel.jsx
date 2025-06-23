'use client'
import React, { useEffect, useRef } from 'react'
import { Badge, badgeVariants } from '@/components/ui/badge'

export default function QRConfigPanel({ value, onChange, fieldOptions }) {
    const editorRef = useRef(null)
    const fieldMapRef = useRef({})

    useEffect(() => {
        fieldMapRef.current = Object.fromEntries(fieldOptions.map(o => [o.value, o.label]))
    }, [fieldOptions])

    const badgeClass = badgeVariants({ variant: 'secondary' }) + ' px-1 py-0.5 text-xs gap-1 cursor-default'

    const renderContent = () => {
        if (!editorRef.current) return
        const parts = (value || '').split(/({{[^}]+}})/g)

        editorRef.current.innerHTML = ''

        parts.forEach((part) => {
            if (/^{{[^}]+}}$/.test(part)) {
                const field = part.slice(2, -2)
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

                editorRef.current.appendChild(span)
            } else {
                editorRef.current.appendChild(document.createTextNode(part))
            }
        })
    }

    const extractValue = () => {
        if (!editorRef.current) return ''
        let result = ''
        editorRef.current.childNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                result += node.textContent
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const field = node.getAttribute('data-field')
                if (field) result += `{{${field}}}`
                else result += node.textContent
            }
        })
        return result
    }

    const handleInput = () => {
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
            // Comprobamos si el cursor está dentro del editor
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
        if (editorRef.current && extractValue() === value) return
        renderContent()
    }, [value])

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
        <div>
            <div
                ref={editorRef}
                className="relative whitespace-pre-wrap break-words min-h-[80px] border border-input bg-background rounded-md p-2 text-sm focus:outline-none"
                contentEditable
                onInput={handleInput}
            />
            <div className="flex flex-wrap gap-1 mt-2">
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
        </div>
    )
}
