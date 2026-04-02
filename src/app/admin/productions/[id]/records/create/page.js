import { redirect } from 'next/navigation'

/**
 * La creación de procesos se hace desde el diálogo en la ficha de producción.
 * Mantener la ruta como redirección por enlaces antiguos o favoritos.
 */
export default async function CreateProductionRecordRedirect({ params }) {
    const { id } = await params
    redirect(`/admin/productions/${id}`)
}
