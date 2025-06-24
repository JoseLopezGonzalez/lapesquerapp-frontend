"use client"
import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getLabels } from "@/services/labelService"
import { useSession } from "next-auth/react"
import Loader from "@/components/Utilities/Loader"

const exampleModels = [
  {
    id: "1",
    name: "Rizado Brisatlantic",
    elements: [
      {
        id: "1",
        type: "sanitaryRegister",
        x: 146,
        y: 315,
        width: 72,
        height: 48,
        fontSize: 10,
        fontWeight: "normal",
        textAlign: "left",
        countryCode: "ES",
        approvalNumber: "12.021462/H",
        suffix: "C.E.",
        borderColor: "#000000",
        borderWidth: 1,
        color: "#000000",
      },
      {
        id: "2",
        type: "richParagraph",
        x: 12,
        y: 9,
        width: 111,
        height: 43,
        fontSize: 14,
        fontWeight: "bold",
        textAlign: "left",
        html: "POLPO FRESCO<div>ARRICCIATO</div>",
        color: "#000000",
      },
      {
        id: "3",
        type: "text",
        x: 12,
        y: 45,
        width: 159,
        height: 25,
        fontSize: 12,
        fontWeight: "normal",
        textAlign: "left",
        text: "Octopus Vulgaris - (OCC)",
        color: "#000000",
        textTransform: "uppercase",
        verticalAlign: "center",
      },
      {
        id: "4",
        type: "text",
        x: 11,
        y: 67,
        width: 116,
        height: 30,
        fontSize: 12,
        fontWeight: "normal",
        textAlign: "left",
        text: "Lotto di produzione:",
        color: "#000000",
        verticalAlign: "center",
      },
      {
        id: "5",
        type: "text",
        x: 11,
        y: 89,
        width: 114,
        height: 22,
        fontSize: 12,
        fontWeight: "normal",
        textAlign: "left",
        text: "Data di partenza:",
        color: "#000000",
        verticalAlign: "center",
      },
      {
        id: "6",
        type: "text",
        x: 10,
        y: 107,
        width: 127,
        height: 23,
        fontSize: 12,
        fontWeight: "normal",
        textAlign: "left",
        text: "Da consumare entro il:",
        color: "#000000",
        verticalAlign: "center",
      },
      {
        id: "7",
        type: "richParagraph",
        x: 11,
        y: 134,
        width: 333,
        height: 52,
        fontSize: 10,
        fontWeight: "normal",
        textAlign: "left",
        html:
          "<b>[IT] Modalità di presentazione:</b> eviscerato / <b>Metodo di produzione:</b> pesce pescato / <b>Zona di cattura:</b> FAO 27 IX.a Atlantico nord-orientale / <b>Metodo di pesca:</b> nasse e trapole (FPO) / <b>Origen:</b> Portogallo",
        color: "#000000",
      },
      {
        id: "8",
        type: "richParagraph",
        x: 11,
        y: 185,
        width: 333,
        height: 49,
        fontSize: 10,
        fontWeight: "normal",
        textAlign: "left",
        html:
          "<b>Valore energetico:</b> 380kJ / 91kcal, Grassi: 1,40g, di cui saturi: 0.30g, Carboidrati: 1.40g, di cui zuccheri: 0.00g, Proteine: 17.90g, Sale: 0,91g / <b>Ingredienti:</b> Polpo (<b>Mollusco</b>), Sale",
        color: "#000000",
      },
      {
        id: "9",
        type: "richParagraph",
        x: 12,
        y: 238,
        width: 152,
        height: 35,
        fontSize: 10,
        fontWeight: "normal",
        textAlign: "left",
        html:
          "<div><b>Conservare tra 0 e 4°C.</b></div><div><b>Da consumarse previa cottura.</b></div>",
        color: "#000000",
      },
      {
        id: "10",
        type: "richParagraph",
        x: 14,
        y: 304,
        width: 138,
        height: 77,
        fontSize: 10,
        fontWeight: "normal",
        textAlign: "left",
        html:
          "<div>Prodotto lavorato per:</div><div><b>CONGELADOS BRISAMAR</b></div><div>Pol. Vista Hermosa N11a</div><div>21410 Isla Cristina (HUELVA)</div><div>España</div>",
        color: "#000000",
      },
      {
        id: "11",
        type: "barcode",
        x: 7,
        y: 383,
        width: 340,
        height: 45,
        fontSize: 12,
        fontWeight: "normal",
        textAlign: "left",
        barcodeContent:
          "(01)98436613931182(3100)000500(10)1306250CC01003",
        barcodeType: "gs1-128",
        showValue: true,
        color: "#000000",
      },
      {
        id: "12",
        type: "text",
        x: 12,
        y: 276,
        width: 78,
        height: 29,
        fontSize: 14,
        fontWeight: "bold",
        textAlign: "left",
        text: "Peso netto:",
        color: "#000000",
        horizontalAlign: "left",
      },
      {
        id: "13",
        type: "field",
        x: 89,
        y: 275,
        width: 97,
        height: 31,
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "left",
        field: "product.weight",
        color: "#000000",
      },
      {
        id: "14",
        type: "qr",
        x: 224,
        y: 276,
        width: 100,
        height: 100,
        fontSize: 12,
        fontWeight: "normal",
        textAlign: "left",
        qrContent:
          "SPECIE: POLPO - OCTOPUS VULGARIS (OCC) / METODO DI PRODUZIONE: CATTURATO / ZONA DI CATTURA: FAO 27 IXa Atlantico nord-orientale / NAVI: Raggruppamento / PRESENTAZIONE: EVISCERATO / LOTTO: 130625OCC01003 / PESO: 05000g",
        color: "#000000",
      },
    ],
    canvas: {
      width: 360,
      height: 440,
      rotation: 0,
    },
  },
  { id: "2", name: "Etiqueta Producto Fresco", width: 600, height: 800 },
]

export default function LabelSelectorSheet({ open, onOpenChange, onSelect, children }) {
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const { data: session, status } = useSession();


  useEffect(() => {
    if (status !== "authenticated") return; // Esperar a que esté autenticado
    if (!session?.user?.accessToken) return;

    setLoading(true);

    const token = session.user.accessToken;

    getLabels(token)
      .then((data) => {
        setModels(data);
      })
      .catch((error) => {
        console.error("Error al cargar los modelos de etiqueta:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [status, session, open]);

  const filtered = models.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))

  const handleSelect = (model) => {
    onSelect && onSelect(model)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="w-[320px] sm:w-[400px] flex flex-col gap-4 h-full  ">
        <SheetHeader>
          <SheetTitle>Modelos de Etiqueta</SheetTitle>
        </SheetHeader>
        <Input placeholder="Buscar modelo..." value={search} onChange={e => setSearch(e.target.value)} />
        <ScrollArea className="flex-1 h-full w-full ">
          {loading ? (
            <div className="flex items-center justify-center w-full h-full py-20">
              <Loader className="animate-spin h-6 w-6 text-gray-500" />
            </div>
          ) : (
            <div className="flex-1 space-y-2 py-2">
              {filtered.map((m) => (
                <Button
                  key={m.id}
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => handleSelect(m)}
                >
                  {m.name}
                </Button>
              ))}
            </div>
          )}
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
