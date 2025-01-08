import { Toaster } from "react-hot-toast";
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en"  className="dark">
      <body
        className={` bg-neutral-900`}
      >
        {children}
        <Toaster />
      </body>
      
    </html>
  );
}
