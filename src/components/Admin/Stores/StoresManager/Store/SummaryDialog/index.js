import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Ellipsis } from "lucide-react"
import Summary from "./Summary"

export function SummaryDialog() {


    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Ellipsis size={24} />
                </Button>
            </DialogTrigger>
            <DialogContent className=" w-fit max-w-none">
                <DialogHeader>
                    <DialogTitle>Resumen de almacén</DialogTitle>
                    <DialogDescription>
                    Resumen de los productos y cantidades en el almacén
                    </DialogDescription>
                </DialogHeader>
                <div className=" gap-4 py-4">
                    <Summary />
                </div>
                <DialogFooter>
                    {/* <Button type="submit">Save changes</Button> */}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
