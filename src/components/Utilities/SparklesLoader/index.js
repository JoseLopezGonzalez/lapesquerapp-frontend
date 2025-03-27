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
                path: 'https://lottie.host/b9622bf5-048c-4fd4-b040-c3192e4c1ec8/9cYjmJ8bB1.json',
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
