import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import ProductSummary from "./ProductSummary"
import { PiMicrosoftExcelLogo } from "react-icons/pi"
import { LucideFileJson } from "lucide-react"

export function SummaryDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">
                    Productos
                </Button>
            </DialogTrigger>
            <DialogContent className=" w-fit max-w-none">
                <DialogHeader>
                    <DialogTitle>Productos</DialogTitle>
                </DialogHeader>
                <div className=" gap-4 pb-2">
                    <ProductSummary />
                </div>
               
            </DialogContent>

        </Dialog>
    )
}
