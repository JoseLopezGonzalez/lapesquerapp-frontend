"use client"

import React, { useState, useRef } from "react"
import { Upload, X, FileText, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FaRegFilePdf } from "react-icons/fa"

export function PdfUpload({
    onChange,
    maxSizeMB = 10,
    className,
    label = "Seleccionar documento PDF",
}) {
    const [file, setFile] = useState(null)
    const [isDragging, setIsDragging] = useState(false)
    const [error, setError] = useState(null)
    const fileInputRef = useRef(null)

    const maxSizeBytes = maxSizeMB * 1024 * 1024

    const validateFile = (file) => {
        if (!file.type.includes("pdf")) {
            setError("El archivo debe ser un PDF")
            return false
        }

        if (file.size > maxSizeBytes) {
            setError(`El archivo excede el tamaño máximo de ${maxSizeMB}MB`)
            return false
        }

        setError(null)
        return true
    }

    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0] || null

        if (selectedFile && validateFile(selectedFile)) {
            setFile(selectedFile)
            onChange?.(selectedFile)
        } else if (!selectedFile) {
            setFile(null)
            onChange?.(null)
        }
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setIsDragging(false)

        const droppedFile = e.dataTransfer.files?.[0]
        if (droppedFile && validateFile(droppedFile)) {
            setFile(droppedFile)
            onChange?.(droppedFile)

            if (fileInputRef.current) {
                const dataTransfer = new DataTransfer()
                dataTransfer.items.add(droppedFile)
                fileInputRef.current.files = dataTransfer.files
            }
        }
    }

    const clearFile = () => {
        setFile(null)
        setError(null)
        onChange?.(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const triggerFileInput = () => {
        fileInputRef.current?.click()
    }

    return (
        <div className={cn("space-y-2", className)}>
            <label htmlFor="pdf-upload" className="text-sm font-medium">
                {label}
            </label>

            <div
                className={cn(
                    "relative flex flex-col items-center justify-center rounded-md border border-dashed p-4 transition-colors",
                    isDragging ? "border-primary bg-primary/5" : "border-input bg-background hover:bg-accent/5",
                    error && "border-destructive bg-destructive/5"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    id="pdf-upload"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="sr-only"
                />

                {file ? (
                    <div className="flex w-full items-center justify-between gap-2 p-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <FaRegFilePdf className="h-8 w-8 shrink-0 text-primary" />
                            <div className="overflow-hidden">
                                <p className="truncate text-sm font-medium">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={clearFile} aria-label="Eliminar archivo">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center space-y-2 p-4 text-center">
                        <div className="rounded-full bg-primary/10 p-3">
                            <Upload className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium">Arrastra y suelta tu PDF aquí o</p>
                            <p className="text-xs text-muted-foreground">PDF hasta {maxSizeMB}MB</p>
                        </div>
                        <Button type="button" variant="secondary" size="sm" onClick={triggerFileInput} className="mt-2">
                            Seleccionar archivo
                        </Button>
                    </div>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    )
}
