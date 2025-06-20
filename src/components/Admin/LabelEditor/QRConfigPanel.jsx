'use client'
import React, { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'

export default function QRConfigPanel({ value, onChange, fieldOptions }) {
    const editorRef = useRef(null)

    const renderContent = () => {
        if (!editorRef.current) return
        const html = (value || '').split(/({{[^}]+}})/g).map((part) => {
            if (/^{{[^}]+}}$/.test(part)) {
                const field = part.slice(2, -2)
                return `<span data-field="${field}" contenteditable="false" class="inline-flex items-center px-1 bg-muted rounded text-sm mx-0.5">${field}</span>`
            }
            return part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        }).join('')
        editorRef.current.innerHTML = html
    }

    useEffect(() => {
        renderContent()
    }, [value])

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
        const span = document.createElement('span')
        span.textContent = field
        span.setAttribute('data-field', field)
        span.setAttribute('contenteditable', 'false')
        span.className = 'inline-flex items-center px-1 bg-muted rounded text-sm mx-0.5'

        const sel = window.getSelection()
        if (!sel || !sel.rangeCount) {
            editorRef.current.appendChild(span)
        } else {
            const range = sel.getRangeAt(0)
            range.deleteContents()
            range.insertNode(span)
            range.collapse(false)
        }
        onChange(extractValue())
        setTimeout(() => editorRef.current?.focus(), 0)
    }

    return (
        <div>
            <div
                ref={editorRef}
                className="min-h-[40px] border border-input bg-background rounded-md p-2 text-sm focus:outline-none"
                contentEditable
                onInput={handleInput}
            />
            <div className="flex flex-wrap gap-2 mt-2">
                {fieldOptions.map((opt) => (
                    <Button key={opt.value} type="button" variant="outline" size="sm" onClick={() => insertField(opt.value)}>
                        {opt.label}
                    </Button>
                ))}
            </div>
        </div>
    )
}
