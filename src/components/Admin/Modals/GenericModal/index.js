import React from "react";
import ReactDOM from "react-dom";

const Modal = ({ children, onClose, size = "md", showModal }) => {
  if (!showModal) return null; // No renderiza si no está abierto

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-full",
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        className={`bg-white dark:bg-neutral-800 w-full ${sizeClasses[size]} rounded-lg shadow-lg overflow-hidden`}
      >
        {/* Botón de cerrar */}
        <div className="flex justify-end p-2">
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
          >
            &times;
          </button>
        </div>

        {/* Contenido del modal */}
        <div className="p-4">{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
