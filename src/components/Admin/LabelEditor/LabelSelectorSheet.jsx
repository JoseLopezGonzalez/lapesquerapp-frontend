"use client"
import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

const exampleModels = [
  { id: "1", name: "Etiqueta Congelado 7x10", width: 700, height: 1000 },
  { id: "2", name: "Etiqueta Producto Fresco", width: 600, height: 800 },
]

export default function LabelSelectorSheet({ open, onOpenChange, onSelect, children }) {
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => {
      setModels(exampleModels)
      setLoading(false)
    }, 500)
    return () => clearTimeout(t)
  }, [])

  const filtered = models.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))

  const handleSelect = (model) => {
    onSelect && onSelect(model)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="w-[320px] sm:w-[400px] flex flex-col gap-4">
        <SheetHeader>
          <SheetTitle>Modelos de Etiqueta</SheetTitle>
        </SheetHeader>
        <Input placeholder="Buscar modelo..." value={search} onChange={e => setSearch(e.target.value)} />
        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-2 py-2">
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando modelos...</p>
            ) : (
              filtered.map(m => (
                <Button key={m.id} variant="secondary" className="w-full justify-start" onClick={() => handleSelect(m)}>
                  {m.name}
                </Button>
              ))
            )}
          </div>
        </ScrollArea>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => handleSelect({ id: Date.now().toString(), name: "", width: 400, height: 300 })}
        >
          + Nueva etiqueta
        </Button>
      </SheetContent>
    </Sheet>
  )
}
