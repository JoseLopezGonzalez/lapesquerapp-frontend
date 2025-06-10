"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { getToastTheme } from "@/customs/reactHotToast";
import { Warehouse, Check, Search, X } from "lucide-react";
import Loader from "@/components/Utilities/Loader";
import { movePalletToStore } from "@/services/palletService";
import { useStoreContext } from "@/context/StoreContext";
import { useStoresOptions } from "@/hooks/useStoresOptions";

export default function MovePalletToStoreDialog() {
    const {
        closeMovePalletToStoreDialog,
        movePalletToStoreDialogData: palletId,
        isOpenMovePalletToStoreDialog: isOpen,
        updateStoreWhenOnMovePalletToStore
    } = useStoreContext();

    const { data: session } = useSession();
    const token = session?.user?.accessToken;

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStoreValue, setSelectedStoreValue] = useState(null);

    const { storeOptions, loading } = useStoresOptions();

    const filteredStores = storeOptions.filter((store) =>
        store.label?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const resetAndClose = () => {
        setSelectedStoreValue(null);
        setSearchQuery("");
        closeMovePalletToStoreDialog();
    };

    const handleSubmit = () => {
        if (!selectedStoreValue) {
            toast.error("Seleccione un almacén de destino", getToastTheme());
            return;
        }

        movePalletToStore(palletId, selectedStoreValue, token)
            .then(() => {
                toast.success("Pallet movido correctamente", getToastTheme());
                updateStoreWhenOnMovePalletToStore({palletId , storeId: selectedStoreValue});
                resetAndClose();
            })
            .catch(() => {
                toast.error("Error al mover el pallet", getToastTheme());
            });
    };

    const handleStoreClick = (value) => {
        setSelectedStoreValue((prev) => (prev === value ? null : value));
    };

    if (!isOpen) return null;

    if (!palletId) {
        console.error("No se proporcionó un ID de pallet válido");
        return null;
    }


    return (
        <Dialog open={isOpen} onOpenChange={resetAndClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Traspaso de almacén - Palet #{palletId}</DialogTitle>
                </DialogHeader>

                {/* Buscador */}
                <div className="relative my-2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar almacén..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1 h-7 w-7"
                            onClick={() => setSearchQuery("")}
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Limpiar búsqueda</span>
                        </Button>
                    )}
                </div>

                {/* Lista de almacenes */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center w-full h-[50vh]">
                        <Loader />
                    </div>
                ) : filteredStores.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-6">
                        No se encontraron almacenes
                    </div>
                ) : (
                    <ScrollArea className="h-[45vh] pr-3 w-full">
                        <div className="flex flex-col gap-2 py-1 h-full">
                            {filteredStores.map((store) => {
                                const isSelected = selectedStoreValue === store.value;
                                return (
                                    <div
                                        key={store.value}
                                        className={`flex items-center justify-between p-3 border rounded-md cursor-pointer hover:bg-accent transition-colors ${isSelected ? "border-primary bg-accent" : ""}`}
                                        onClick={() => handleStoreClick(store.value)}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <Warehouse className="h-5 w-5 text-muted-foreground" />
                                            <span className="text-sm font-medium">{store.label}</span>
                                        </div>
                                        {isSelected && <Check className="h-4 w-4 text-primary" />}
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                )}

                <DialogFooter className="mt-4">
                    <Button onClick={handleSubmit} disabled={!selectedStoreValue}>
                        Confirmar traslado
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
