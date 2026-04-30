import Loader from '@/components/Utilities/Loader'

export default function ProductionsControlPanelLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Loader text="Cargando control de producciones..." />
    </div>
  )
}
