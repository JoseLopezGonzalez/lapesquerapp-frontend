'use client'
import React, { useEffect, useRef } from 'react'

const SparklesLoader = () => {
    const containerRef = useRef(null)
    const animationInstance = useRef(null)

    useEffect(() => {
        let isMounted = true

        const loadLottie = async () => {
            const lottie = await import('lottie-web')

            if (!isMounted || !containerRef.current) return

            // Limpia cualquier animación previa
            if (animationInstance.current) {
                animationInstance.current.destroy()
            }

            containerRef.current.innerHTML = ''

            animationInstance.current = lottie.loadAnimation({
                container: containerRef.current,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: '/animations/sparkles.json',
            })
        }

        loadLottie()

        return () => {
            isMounted = false
            if (animationInstance.current) {
                animationInstance.current.destroy()
                animationInstance.current = null
            }
        }
    }, [])

    return <div ref={containerRef} className="lottie w-[150px] h-[150px]" />
}

export default SparklesLoader
