/**
 * Accessibility announcer component
 * Announces dynamic changes to screen readers
 */
'use client';

import React, { useEffect, useState, useCallback } from 'react';

/**
 * Accessibility announcer for screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive' (default: 'polite')
 */
export const AccessibilityAnnouncer = ({ message, priority = 'polite' }) => {
    const [announcement, setAnnouncement] = useState('');

    useEffect(() => {
        if (message) {
            setAnnouncement(message);
            // Clear message after announcement
            const timer = setTimeout(() => setAnnouncement(''), 1000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    return (
        <div
            role="status"
            aria-live={priority}
            aria-atomic="true"
            className="sr-only"
            style={{
                position: 'absolute',
                left: '-10000px',
                width: '1px',
                height: '1px',
                overflow: 'hidden',
            }}
        >
            {announcement}
        </div>
    );
};

/**
 * Hook to manage accessibility announcements
 * @returns {Object} { announce, clear }
 */
export const useAccessibilityAnnouncer = () => {
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState('polite');

    const announce = useCallback((msg, prio = 'polite') => {
        setPriority(prio);
        setMessage(msg);
    }, []);

    const clear = useCallback(() => {
        setMessage('');
    }, []);

    return {
        announce,
        clear,
        Announcer: () => <AccessibilityAnnouncer message={message} priority={priority} />,
    };
};

