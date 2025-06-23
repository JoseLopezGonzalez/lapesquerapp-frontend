'use client'
import React, { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function RichParagraphConfigPanel({ html, onChange }) {
  const editorRef = useRef(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (html || '')) {
      editorRef.current.innerHTML = html || ''
    }
  }, [html])

  const handleInput = () => {
    onChange(editorRef.current?.innerHTML || '')
  }

  const exec = (cmd) => {
    document.execCommand(cmd, false, null)
    handleInput()
  }

  const setColor = (color) => {
    document.execCommand('foreColor', false, color)
    handleInput()
  }

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
    </div>
  )
}
