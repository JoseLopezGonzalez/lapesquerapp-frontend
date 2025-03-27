'use client'
import React, { useEffect, useRef } from 'react';

const SparklesLoader = () => {
    const containerRef = useRef(null);
    const animationInstance = useRef(null);

    useEffect(() => {
        const loadLottie = async () => {
            const lottie = await import('lottie-web'); // ✅ Import dinámico

            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }

            animationInstance.current = lottie.loadAnimation({
                container: containerRef.current,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: 'https://lottie.host/b9622bf5-048c-4fd4-b040-c3192e4c1ec8/9cYjmJ8bB1.json',
            });
        };

        loadLottie();

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
