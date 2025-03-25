'use client'
import React, { useEffect, useRef } from 'react';
import lottie from 'lottie-web';

const SparklesLoader = () => {
    const containerRef = useRef(null);
    const animationInstance = useRef(null);

    useEffect(() => {
        // Limpia el contenedor por completo antes de volver a cargar
        if (containerRef.current) {
            containerRef.current.innerHTML = ''; // 🔥 Limpieza total
        }

        // Carga la animación
        animationInstance.current = lottie.loadAnimation({
            container: containerRef.current,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: 'https://lottie.host/b9622bf5-048c-4fd4-b040-c3192e4c1ec8/9cYjmJ8bB1.json',
        });

        // Cleanup al desmontar
        return () => {
            animationInstance.current?.destroy();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="lottie w-[150px] h-[150px]"
        />
    );
};

export default SparklesLoader;
