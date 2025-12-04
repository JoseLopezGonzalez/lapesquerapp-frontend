"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useStoreContext } from "@/context/StoreContext";
import { formatDecimalWeight, formatDecimal } from "@/helpers/formats/numbers/formatNumbers";
import { PiMicrosoftExcelLogo } from "react-icons/pi";
import { Edit, Printer } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { getAvailableBoxesCount, getAvailableNetWeight } from "@/helpers/pallet/boxAvailability";

export function PalletsListDialog() {
    const { speciesSummary, store, pallets, openPalletDialog, openPalletLabelDialog } = useStoreContext();
    const [selectedSpecies, setSelectedSpecies] = useState(null);
    const [filteredPallets, setFilteredPallets] = useState([]);
    const [searchText, setSearchText] = useState("");

    const storeName = store?.name ?? "";

    const currentSpecies = speciesSummary.find((s) => s.name === selectedSpecies);

    useEffect(() => {
        if (speciesSummary.length) {
            setSelectedSpecies(speciesSummary[0].name);
        }
    }, [speciesSummary]);

    useEffect(() => {
        if (!selectedSpecies || !pallets) return;

        const speciesPallets = pallets.filter((pallet) =>
            pallet.boxes.some((box) => box?.product?.species?.name === selectedSpecies)
        );

        const search = searchText.trim().toLowerCase();

        const filtered = speciesPallets
            .filter((pallet) => {
                if (!search) return true;

                const idMatch = pallet.id?.toString()?.toLowerCase().includes(search);

                const productNames = (pallet.boxes ?? [])
                    .map((box) => box?.product?.name)
                    .filter(Boolean);
                const productsMatch = productNames.some((name) => name.toLowerCase().includes(search));

                const lotsArray = Array.isArray(pallet.lots)
                    ? pallet.lots
                    : (pallet.lots ? [pallet.lots] : []);
                const lotsMatch = lotsArray.some((lot) => lot?.toString().toLowerCase().includes(search));

                const observationsMatch = (pallet.observations ?? "")
                    .toString()
                    .toLowerCase()
                    .includes(search);

                return idMatch || productsMatch || lotsMatch || observationsMatch;
            })
            .map((pallet) => {
                // Usar valores del backend si están disponibles, sino calcular desde cajas disponibles
                const totalBoxes = getAvailableBoxesCount(pallet);
                const totalWeight = getAvailableNetWeight(pallet);
                return {
                    id: pallet.id,
                    totalWeight,
                    totalBoxes,
                };
            });

        setFilteredPallets(filtered);
    }, [selectedSpecies, searchText, pallets]);

    // Total palets en el almacén (no filtrado)
    const totalPallets = pallets.length;

    // Peso neto total de todos los palets (solo cajas disponibles)
    const totalWeight = pallets.reduce((total, pallet) => {
        return total + getAvailableNetWeight(pallet);
    }, 0);

    const generateExcel = () => {
        const data = filteredPallets.map((p) => {
            const fullPallet = pallets.find(pa => pa.id === p.id);
            const productNames = Array.from(new Set(fullPallet?.boxes?.map(b => b.product?.name))).join(", ");
            const lots = fullPallet?.lots?.join(", ") ?? "";
            const observations = fullPallet?.observations ?? "";

            return {
                "Palet": p.id,
                "Ubicación": fullPallet?.position || '-', // Nueva columna
                "Artículos": productNames,
                "Lotes": lots,
                "Observaciones": observations,
                "Cajas": p.totalBoxes,
                "Peso neto (kg)": p.totalWeight.toFixed(2),
                "Especie": selectedSpecies,
            };
        });

        const currenDate = new Date();
        const formattedDate = `${currenDate.getDate().toString().padStart(2, '0')}-${(currenDate.getMonth() + 1).toString().padStart(2, '0')}-${currenDate.getFullYear()}`;
        const formattedStoreName = storeName.replace(/\s+/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "PALETS");

        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], { type: "application/vnd.ms-excel" });
        saveAs(blob, `Palets_${formattedStoreName}_${formattedDate}.xlsx`);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="secondary" className="w-full">
                    Palets
                </Button>
                {/* <Button variant="outline">Palets</Button> */}
            </DialogTrigger>
            <DialogContent className="w-full max-w-6xl ">
                <DialogHeader>
                    <DialogTitle>Palets</DialogTitle>
                </DialogHeader>

                <div className="bg-background text-foreground p-6  mx-auto rounded-lg w-full "> {/* max-w-3xl */}
                    <div className="text-sm text-muted-foreground/90 mb-6 flex items-center">
                        <span>{speciesSummary.length} especies</span>
                        <Separator orientation="vertical" className="mx-2 h-3" />
                        <span>{totalPallets} palets</span>
                        <Separator orientation="vertical" className="mx-2 h-3" />
                        <span>{formatDecimalWeight(totalWeight)}</span>
                    </div>

                    {/* Especies */}
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">Especies</h3>
                        <ScrollArea className="w-full whitespace-nowrap pb-4">
                            <div className="flex space-x-2 p-2">
                                {speciesSummary.map((s, idx) => (
                                    <Card
                                        key={idx}
                                        className={cn(
                                            "bg-card border cursor-pointer hover:shadow-md flex-shrink-0",
                                            selectedSpecies === s.name
                                                ? "shadow-md shadow-foreground-400"
                                                : "border-muted"
                                        )}
                                        onClick={() => setSelectedSpecies(s.name)}
                                    >
                                        <CardContent className="p-3 flex items-center space-x-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center",
                                                selectedSpecies === s.name
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted text-muted-foreground"
                                            )}>
                                                <span className="text-sm font-semibold">{s.name[0]}</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-baseline gap-3">
                                                    <div className="text-sm font-medium truncate pr-1" title={s.name}>{s.name}</div>
                                                    <div className={cn(
                                                        "text-xs font-medium rounded-sm px-1.5 py-0.5",
                                                        selectedSpecies === s.name
                                                            ? "bg-primary/10 text-primary"
                                                            : "bg-muted text-muted-foreground"
                                                    )}>
                                                        {s.percentage.toFixed(0)}%
                                                    </div>
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    {formatDecimalWeight(s.quantity)}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </div>

                    {/* Buscador */}
                    <div className="flex items-center justify-between mb-3">
                        <Input
                            type="text"
                            placeholder="Buscar palet por ID, producto, lote u observaciones..."
                            className="max-w-[500px]"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                        <div className="px-3 py-1 rounded-full text-xs bg-muted text-muted-foreground flex items-center justify-center">
                            {filteredPallets.length} palets
                            <Separator orientation="vertical" className="mx-2 h-3 bg-muted-foreground" />
                            {formatDecimalWeight(filteredPallets.reduce((sum, p) => sum + p.totalWeight, 0))}
                        </div>
                    </div>

                    {/* Tabla de palets */}

                    <div className="border rounded-md max-h-[315px] overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left font-medium text-muted-foreground bg-muted">
                                    <th className="px-4 py-2">ID</th>
                                    <th className="px-4 py-2">Artículos</th>
                                    <th className="px-4 py-2">Lotes</th>
                                    <th className="px-4 py-2">Observaciones</th>
                                    <th className="px-4 py-2 text-right">Cajas</th>
                                    <th className="px-4 py-2 text-right text-nowrap">Peso neto</th>
                                    <th className="px-4 py-2 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPallets.map((pallet) => {
                                    const fullPallet = pallets.find(p => p.id === pallet.id);
                                    if (!fullPallet) return null;

                                    const productNames = Array.from(
                                        new Set(fullPallet.boxes.map(b => b.product?.name).filter(Boolean))
                                    ).join("\n");

                                    const lots = fullPallet.lots ?? [];
                                    const observations = fullPallet.observations ?? "";

                                    return (
                                        <tr key={pallet.id} className="border-b border-muted last:border-0 hover:bg-muted/20">
                                            <td className="px-4 py-3">{pallet.id}</td>
                                            <td className="px-4 py-3 whitespace-pre-wrap">{productNames}</td>
                                            <td className="px-4 py-3 max-w-[150px] truncate" title={lots.join(", ")}>
                                                {lots.join(", ")}
                                            </td>
                                            <td className="px-4 py-3 max-w-[200px] truncate" title={observations}>
                                                {observations}
                                            </td>
                                            <td className="px-4 py-3 text-right">{pallet.totalBoxes}</td>
                                            <td className="px-4 py-3 text-right text-nowrap">
                                                {formatDecimalWeight(pallet.totalWeight)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="outline" size="icon" onClick={() => openPalletDialog(pallet.id)}>
                                                        <Edit className="h-4 w-4 " />
                                                    </Button>
                                                    <Button variant="" size="icon" onClick={() => openPalletLabelDialog(pallet.id)}>
                                                        <Printer className="h-4 w-4 " />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>



                    <DialogFooter className="pt-7">
                        <Button variant="secondary" onClick={generateExcel}>
                            <PiMicrosoftExcelLogo className="mr-2" />
                            Exportar .xlsx
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
