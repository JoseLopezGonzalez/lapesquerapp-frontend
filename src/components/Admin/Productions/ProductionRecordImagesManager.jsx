'use client'

import React, { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Image as ImageIcon, Plus, X, Upload, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

const ProductionRecordImagesManager = ({ 
    productionRecordId, 
    onRefresh, 
    hideTitle = false, 
    renderInCard = false, 
    cardTitle = 'Imágenes del Proceso', 
    cardDescription = 'Imágenes asociadas a este proceso de producción' 
}) => {
    // Estado local para imágenes (mock data para apariencia)
    const [images, setImages] = useState([
        // Ejemplo de imágenes mock - puedes eliminar esto cuando implementes el backend
        // { id: 1, url: 'https://via.placeholder.com/300', name: 'Imagen 1' },
        // { id: 2, url: 'https://via.placeholder.com/300', name: 'Imagen 2' },
        // { id: 3, url: 'https://via.placeholder.com/300', name: 'Imagen 3' },
        // { id: 4, url: 'https://via.placeholder.com/300', name: 'Imagen 4' },
        // { id: 5, url: 'https://via.placeholder.com/300', name: 'Imagen 5' },
    ])
    
    const [selectedImage, setSelectedImage] = useState(null)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [error, setError] = useState(null)
    const fileInputRef = useRef(null)

    // Máximo 6 imágenes visibles
    const visibleImages = images.slice(0, 6)
    const remainingCount = images.length - 6

    const validateImage = (file) => {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        const maxSizeMB = 10
        const maxSizeBytes = maxSizeMB * 1024 * 1024

        if (!validTypes.includes(file.type)) {
            setError('El archivo debe ser una imagen (JPG, PNG, GIF o WEBP)')
            return false
        }

        if (file.size > maxSizeBytes) {
            setError(`La imagen excede el tamaño máximo de ${maxSizeMB}MB`)
            return false
        }

        setError(null)
        return true
    }

    const handleFileSelect = (files) => {
        const file = files?.[0]
        if (!file) return

        if (!validateImage(file)) {
            return
        }

        // Solo para apariencia - crear preview local
        const reader = new FileReader()
        reader.onload = (e) => {
            const newImage = {
                id: Date.now(),
                url: e.target.result,
                name: file.name
            }
            setImages([...images, newImage])
            setError(null)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
        reader.readAsDataURL(file)
    }

    const handleFileChange = (e) => {
        handleFileSelect(e.target.files)
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
        handleFileSelect(e.dataTransfer.files)
    }

    const handleDeleteImage = (imageId) => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta imagen?')) {
            return
        }
        setImages(images.filter(img => img.id !== imageId))
    }

    const triggerFileInput = () => {
        fileInputRef.current?.click()
    }

    const getImageUrl = (image) => {
        return image.url || image.path || null
    }

    const content = (
        <div className="space-y-4">
            {/* Galería estilo WhatsApp */}
            {images.length > 0 ? (
                <div className="max-w-2xl">
                    {images.length === 1 ? (
                        // 1 imagen: ocupa todo el ancho
                        <div className="grid grid-cols-2 gap-2">
                            <div 
                                className="relative aspect-square rounded-md overflow-hidden border border-input bg-muted cursor-pointer group"
                                onClick={() => setSelectedImage(visibleImages[0])}
                            >
                                {getImageUrl(visibleImages[0]) ? (
                                    <img
                                        src={getImageUrl(visibleImages[0])}
                                        alt={visibleImages[0].name || `Imagen ${visibleImages[0].id}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none'
                                        }}
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-muted flex items-center justify-center">
                                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeleteImage(visibleImages[0].id)
                                        }}
                                        className="h-8 w-8"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            {/* Botón para agregar más */}
                            <button
                                onClick={() => setIsAddDialogOpen(true)}
                                className="aspect-square rounded-md border-1 border-dashed border-input bg-background hover:bg-accent/5 hover:border-primary transition-colors flex items-center justify-center"
                            >
                                <Plus className="h-6 w-6 text-muted-foreground" />
                            </button>
                        </div>
                    ) : images.length === 2 ? (
                        // 2 imágenes: ambas ocupan la mitad
                        <div className="grid grid-cols-2 gap-2">
                            {visibleImages.map((image) => {
                                const imageUrl = getImageUrl(image)
                                return (
                                    <div 
                                        key={image.id} 
                                        className="relative aspect-square rounded-md overflow-hidden border border-input bg-muted cursor-pointer group"
                                        onClick={() => setSelectedImage(image)}
                                    >
                                        {imageUrl ? (
                                            <img
                                                src={imageUrl}
                                                alt={image.name || `Imagen ${image.id}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none'
                                                }}
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-muted flex items-center justify-center">
                                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeleteImage(image.id)
                                                }}
                                                className="h-8 w-8"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                            {/* Botón para agregar más */}
                            <button
                                onClick={() => setIsAddDialogOpen(true)}
                                className="aspect-square rounded-md border-1 border-dashed border-input bg-background hover:bg-accent/5 hover:border-primary transition-colors flex items-center justify-center"
                            >
                                <Plus className="h-6 w-6 text-muted-foreground" />
                            </button>
                        </div>
                    ) : images.length === 3 ? (
                        // 3 imágenes: primera ocupa la mitad izquierda completa, otras dos la mitad derecha
                        <div className="grid grid-cols-2 gap-2">
                            <div 
                                className="relative aspect-square rounded-md overflow-hidden border border-input bg-muted cursor-pointer group row-span-2"
                                onClick={() => setSelectedImage(visibleImages[0])}
                            >
                                {getImageUrl(visibleImages[0]) ? (
                                    <img
                                        src={getImageUrl(visibleImages[0])}
                                        alt={visibleImages[0].name || `Imagen ${visibleImages[0].id}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none'
                                        }}
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-muted flex items-center justify-center">
                                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeleteImage(visibleImages[0].id)
                                        }}
                                        className="h-8 w-8"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            {visibleImages.slice(1, 3).map((image) => {
                                const imageUrl = getImageUrl(image)
                                return (
                                    <div 
                                        key={image.id} 
                                        className="relative aspect-square rounded-md overflow-hidden border border-input bg-muted cursor-pointer group"
                                        onClick={() => setSelectedImage(image)}
                                    >
                                        {imageUrl ? (
                                            <img
                                                src={imageUrl}
                                                alt={image.name || `Imagen ${image.id}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none'
                                                }}
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-muted flex items-center justify-center">
                                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeleteImage(image.id)
                                                }}
                                                className="h-8 w-8"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                            {/* Botón para agregar más */}
                            <button
                                onClick={() => setIsAddDialogOpen(true)}
                                className="aspect-square rounded-md border-1 border-dashed border-input bg-background hover:bg-accent/5 hover:border-primary transition-colors flex items-center justify-center"
                            >
                                <Plus className="h-6 w-6 text-muted-foreground" />
                            </button>
                        </div>
                    ) : (
                        // 4 o más imágenes: grid 3x2, último muestra contador
                        <div className="grid grid-cols-3 gap-2">
                            {visibleImages.map((image, index) => {
                                const imageUrl = getImageUrl(image)
                                const isLastVisible = index === 5 && remainingCount > 0
                                
                                return (
                                    <div 
                                        key={image.id} 
                                        className="relative aspect-square rounded-md overflow-hidden border border-input bg-muted cursor-pointer group"
                                        onClick={() => setSelectedImage(image)}
                                    >
                                        {imageUrl ? (
                                            <img
                                                src={imageUrl}
                                                alt={image.name || `Imagen ${image.id}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none'
                                                }}
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-muted flex items-center justify-center">
                                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                        )}
                                        
                                        {/* Overlay con contador si hay más imágenes */}
                                        {isLastVisible && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                                                <span className="text-white font-semibold text-xl">
                                                    +{remainingCount}
                                                </span>
                                            </div>
                                        )}
                                        
                                        {/* Botón eliminar en hover */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeleteImage(image.id)
                                                }}
                                                className="h-8 w-8"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                            
                            {/* Botón para agregar más imágenes - solo si hay menos de 6 */}
                            {images.length < 6 && (
                                <button
                                    onClick={() => setIsAddDialogOpen(true)}
                                    className="aspect-square rounded-md border-1 border-dashed border-input bg-background hover:bg-accent/5 hover:border-primary transition-colors flex items-center justify-center"
                                >
                                    <Plus className="h-6 w-6 text-muted-foreground" />
                                </button>
                            )}
                        </div>
                    )}
                    
                    {/* Botón para agregar más imágenes - cuando hay 6 o más */}
                    {images.length >= 6 && (
                        <div className="mt-2">
                            <button
                                onClick={() => setIsAddDialogOpen(true)}
                                className="w-full aspect-square rounded-md border-1 border-dashed border-input bg-background hover:bg-accent/5 hover:border-primary transition-colors flex items-center justify-center"
                            >
                                <Plus className="h-6 w-6 text-muted-foreground" />
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="max-w-2xl">
                    <div className="grid grid-cols-3 gap-2">
                        {/* Placeholders vacíos */}
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div 
                                key={i}
                                className="aspect-square rounded-md border border-dashed border-input bg-muted/30 flex items-center justify-center"
                            >
                                <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                            </div>
                        ))}
                        {/* Botón para agregar imágenes */}
                        <button
                            onClick={() => setIsAddDialogOpen(true)}
                            className="aspect-square rounded-md border-1 border-dashed border-primary bg-primary/5 hover:bg-primary/10 hover:border-primary/80 transition-colors flex items-center justify-center"
                        >
                            <Plus className="h-6 w-6 text-primary" />
                        </button>
                    </div>
                </div>
            )}

            {/* Dialog para agregar imágenes */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Agregar imágenes</DialogTitle>
                        <DialogDescription>
                            Selecciona una o más imágenes para agregar al proceso
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                        <div
                            className={cn(
                                "relative flex flex-col items-center justify-center rounded-md border border-dashed p-8 transition-colors",
                                isDragging ? "border-primary bg-primary/5" : "border-input bg-background hover:bg-accent/5",
                                error && "border-destructive bg-destructive/5"
                            )}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                onChange={handleFileChange}
                                className="sr-only"
                                multiple
                            />

                            <div className="flex flex-col items-center justify-center space-y-2 text-center">
                                <div className="rounded-full bg-primary/10 p-3">
                                    <Upload className="h-6 w-6 text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Arrastra y suelta imágenes aquí o</p>
                                    <p className="text-xs text-muted-foreground">JPG, PNG, GIF o WEBP hasta 10MB</p>
                                </div>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={triggerFileInput}
                                    className="mt-2"
                                >
                                    Seleccionar imágenes
                                </Button>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-destructive text-sm">
                                <AlertCircle className="h-4 w-4" />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dialog para vista ampliada */}
            <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Vista previa de imagen</DialogTitle>
                        <DialogDescription>
                            {selectedImage?.name || 'Imagen del proceso'}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedImage && (
                        <div className="relative w-full">
                            <img
                                src={getImageUrl(selectedImage)}
                                alt={selectedImage.name || 'Imagen'}
                                className="w-full h-auto rounded-md"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )

    if (renderInCard) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{cardTitle}</CardTitle>
                    {cardDescription && (
                        <CardDescription>{cardDescription}</CardDescription>
                    )}
                </CardHeader>
                <CardContent className="pt-0">
                    {content}
                </CardContent>
            </Card>
        )
    }

    return (
        <div>
            {!hideTitle && (
                <div className="mb-4">
                    <h3 className="text-lg font-semibold">{cardTitle}</h3>
                    {cardDescription && (
                        <p className="text-sm text-muted-foreground">{cardDescription}</p>
                    )}
                </div>
            )}
            {content}
        </div>
    )
}

export default ProductionRecordImagesManager
