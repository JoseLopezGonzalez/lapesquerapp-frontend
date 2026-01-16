import { ErrorPage } from '@/components/Utilities/ErrorPage'

export default function UnauthorizedPage() {
    return <ErrorPage statusCode={403} homeHref="/admin/home" />
}
