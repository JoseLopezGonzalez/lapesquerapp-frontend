'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Plus, X, Upload, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Constantes
const MAX_IMAGES = 6;
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

const ProductionRecordImagesManager = ({
  productionRecordId,
  onRefresh,
  hideTitle = false,
  renderInCard = false,
  cardTitle = 'Imágenes del Proceso',
  cardDescription = 'Imágenes asociadas a este proceso de producción',
}) => {
  // Estado local para imágenes (mock data para apariencia)
  const [images, setImages] = useState([
    // Ejemplo de imágenes mock - puedes eliminar esto cuando implementes el backend
    // { id: 1, url: 'https://via.placeholder.com/300', name: 'Imagen 1' },
    // { id: 2, url: 'https://via.placeholder.com/300', name: 'Imagen 2' },
    // { id: 3, url: 'https://via.placeholder.com/300', name: 'Imagen 3' },
    // { id: 4, url: 'https://via.placeholder.com/300', name: 'Imagen 4' },
    // { id: 5, url: 'https://via.placeholder.com/300', name: 'Imagen 5' },
  ]);

  const [selectedImage, setSelectedImage] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [imageToDelete, setImageToDelete] = useState(null);
  const fileInputRef = useRef(null);

  // Máximo 6 imágenes visibles
  const visibleImages = images.slice(0, MAX_IMAGES);
  const remainingCount = images.length - MAX_IMAGES;

  const validateImage = useCallback((file) => {
    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      setError('El archivo debe ser una imagen (JPG, PNG, GIF o WEBP)');
      return false;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`La imagen excede el tamaño máximo de ${MAX_FILE_SIZE_MB}MB`);
      return false;
    }

    setError(null);
    return true;
  }, []);

  const handleFileSelect = useCallback(
    (files) => {
      const file = files?.[0];
      if (!file) return;

      if (!validateImage(file)) {
        return;
      }

      // Solo para apariencia - crear preview local
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage = {
          id: Date.now(),
          url: e.target.result,
          name: file.name,
        };
        setImages((prev) => [...prev, newImage]);
        setError(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    },
    [validateImage]
  );

  const handleFileChange = (e) => {
    handleFileSelect(e.target.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDeleteImage = useCallback((imageId) => {
    setImageToDelete(imageId);
  }, []);

  const handleConfirmDeleteImage = useCallback(() => {
    if (!imageToDelete) return;
    setImages((prev) => prev.filter((img) => img.id !== imageToDelete));
    setImageToDelete(null);
  }, [imageToDelete]);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getImageUrl = useCallback((image) => {
    return image?.url || image?.path || null;
  }, []);

  const content = (
    <div
      className={cn(
        'space-y-4',
        renderInCard && images.length === 0 && 'flex min-h-0 flex-1 flex-col'
      )}
    >
      {/* Galería estilo WhatsApp */}
      {images.length > 0 ? (
        <div className="max-w-2xl">
          {images.length === 1 ? (
            // 1 imagen: ocupa todo el ancho
            <div className="grid grid-cols-2 gap-2">
              <div
                className="border-input bg-muted group relative aspect-square cursor-pointer overflow-hidden rounded-md border"
                onClick={() => setSelectedImage(visibleImages[0])}
              >
                {getImageUrl(visibleImages[0]) ? (
                  <img
                    src={getImageUrl(visibleImages[0])}
                    alt={visibleImages[0].name || `Imagen ${visibleImages[0].id}`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="bg-muted absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="text-muted-foreground h-8 w-8" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteImage(visibleImages[0].id);
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
                className="border-input bg-background hover:bg-accent/5 hover:border-primary flex aspect-square items-center justify-center rounded-md border-1 border-dashed transition-colors"
              >
                <Plus className="text-muted-foreground h-6 w-6" />
              </button>
            </div>
          ) : images.length === 2 ? (
            // 2 imágenes: ambas ocupan la mitad
            <div className="grid grid-cols-2 gap-2">
              {visibleImages.map((image) => {
                const imageUrl = getImageUrl(image);
                return (
                  <div
                    key={image.id}
                    className="border-input bg-muted group relative aspect-square cursor-pointer overflow-hidden rounded-md border"
                    onClick={() => setSelectedImage(image)}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={image.name || `Imagen ${image.id}`}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="bg-muted absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="text-muted-foreground h-8 w-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage(image.id);
                        }}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {/* Botón para agregar más */}
              <button
                onClick={() => setIsAddDialogOpen(true)}
                className="border-input bg-background hover:bg-accent/5 hover:border-primary flex aspect-square items-center justify-center rounded-md border-1 border-dashed transition-colors"
              >
                <Plus className="text-muted-foreground h-6 w-6" />
              </button>
            </div>
          ) : images.length === 3 ? (
            // 3 imágenes: primera ocupa la mitad izquierda completa, otras dos la mitad derecha
            <div className="grid grid-cols-2 gap-2">
              <div
                className="border-input bg-muted group relative row-span-2 aspect-square cursor-pointer overflow-hidden rounded-md border"
                onClick={() => setSelectedImage(visibleImages[0])}
              >
                {getImageUrl(visibleImages[0]) ? (
                  <img
                    src={getImageUrl(visibleImages[0])}
                    alt={visibleImages[0].name || `Imagen ${visibleImages[0].id}`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="bg-muted absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="text-muted-foreground h-8 w-8" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteImage(visibleImages[0].id);
                    }}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {visibleImages.slice(1, 3).map((image) => {
                const imageUrl = getImageUrl(image);
                return (
                  <div
                    key={image.id}
                    className="border-input bg-muted group relative aspect-square cursor-pointer overflow-hidden rounded-md border"
                    onClick={() => setSelectedImage(image)}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={image.name || `Imagen ${image.id}`}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="bg-muted absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="text-muted-foreground h-8 w-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage(image.id);
                        }}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {/* Botón para agregar más */}
              <button
                onClick={() => setIsAddDialogOpen(true)}
                className="border-input bg-background hover:bg-accent/5 hover:border-primary flex aspect-square items-center justify-center rounded-md border-1 border-dashed transition-colors"
              >
                <Plus className="text-muted-foreground h-6 w-6" />
              </button>
            </div>
          ) : (
            // 4 o más imágenes: grid 3x2, último muestra contador
            <div className="grid grid-cols-3 gap-2">
              {visibleImages.map((image, index) => {
                const imageUrl = getImageUrl(image);
                const isLastVisible = index === 5 && remainingCount > 0;

                return (
                  <div
                    key={image.id}
                    className="border-input bg-muted group relative aspect-square cursor-pointer overflow-hidden rounded-md border"
                    onClick={() => setSelectedImage(image)}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={image.name || `Imagen ${image.id}`}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="bg-muted absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="text-muted-foreground h-8 w-8" />
                      </div>
                    )}

                    {/* Overlay con contador si hay más imágenes */}
                    {isLastVisible && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
                        <span className="text-xl font-semibold text-white">+{remainingCount}</span>
                      </div>
                    )}

                    {/* Botón eliminar en hover */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage(image.id);
                        }}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              {/* Botón para agregar más imágenes - solo si hay menos de MAX_IMAGES */}
              {images.length < MAX_IMAGES && (
                <button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="border-input bg-background hover:bg-accent/5 hover:border-primary flex aspect-square items-center justify-center rounded-md border-1 border-dashed transition-colors"
                >
                  <Plus className="text-muted-foreground h-6 w-6" />
                </button>
              )}
            </div>
          )}

          {/* Botón para agregar más imágenes - cuando hay MAX_IMAGES o más */}
          {images.length >= MAX_IMAGES && (
            <div className="mt-2">
              <button
                onClick={() => setIsAddDialogOpen(true)}
                className="border-input bg-background hover:bg-accent/5 hover:border-primary flex aspect-square w-full items-center justify-center rounded-md border-1 border-dashed transition-colors"
              >
                <Plus className="text-muted-foreground h-6 w-6" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          className={cn('max-w-2xl', renderInCard && 'flex min-h-0 flex-1 flex-col justify-center')}
        >
          <div className="grid grid-cols-3 gap-2">
            {/* Placeholders vacíos */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="border-input bg-muted/30 flex aspect-square items-center justify-center rounded-md border border-dashed"
              >
                <ImageIcon className="text-muted-foreground/30 h-8 w-8" />
              </div>
            ))}
            {/* Botón para agregar imágenes */}
            <button
              onClick={() => setIsAddDialogOpen(true)}
              className="border-primary bg-primary/5 hover:bg-primary/10 hover:border-primary/80 flex aspect-square items-center justify-center rounded-md border-1 border-dashed transition-colors"
            >
              <Plus className="text-primary h-6 w-6" />
            </button>
          </div>
        </div>
      )}

      {/* Dialog para agregar imágenes */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Agregar imágenes</DialogTitle>
            <DialogDescription>
              Selecciona una o más imágenes para agregar al proceso
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div
              className={cn(
                'relative flex flex-col items-center justify-center rounded-md border border-dashed p-8 transition-colors',
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-input bg-background hover:bg-accent/5',
                error && 'border-destructive bg-destructive/5'
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
                <div className="bg-primary/10 rounded-full p-3">
                  <Upload className="text-primary h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Arrastra y suelta imágenes aquí o</p>
                  <p className="text-muted-foreground text-xs">JPG, PNG, GIF o WEBP hasta 10MB</p>
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
              <div className="text-destructive flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para vista ampliada */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent size="4xl">
          <DialogHeader>
            <DialogTitle>Vista previa de imagen</DialogTitle>
            <DialogDescription>{selectedImage?.name || 'Imagen del proceso'}</DialogDescription>
          </DialogHeader>
          {selectedImage && (
            <div className="relative w-full">
              <img
                src={getImageUrl(selectedImage)}
                alt={selectedImage.name || 'Imagen'}
                className="h-auto w-full rounded-md"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!imageToDelete} onOpenChange={(open) => !open && setImageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar imagen</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar esta imagen? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDeleteImage}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  if (renderInCard) {
    return (
      <Card className={cn(images.length === 0 && 'min-h-[min(22rem,55vh)]')}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ImageIcon className="text-primary h-5 w-5" />
            {cardTitle}
          </CardTitle>
          {cardDescription && <CardDescription>{cardDescription}</CardDescription>}
        </CardHeader>
        <CardContent className={cn('pt-0', images.length === 0 && 'flex min-h-0 flex-1 flex-col')}>
          {content}
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {!hideTitle && (
        <div className="mb-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <ImageIcon className="text-primary h-5 w-5" />
            {cardTitle}
          </h3>
          {cardDescription && <p className="text-muted-foreground text-sm">{cardDescription}</p>}
        </div>
      )}
      {content}
    </div>
  );
};

export default ProductionRecordImagesManager;
