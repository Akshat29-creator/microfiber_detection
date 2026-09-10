'use client';
import { WebSocketProvider } from '@/context/WebSocketContext';
import Sidebar from '@/components/Sidebar';
import TopCommandBar from '@/components/TopCommandBar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const mode = (process.env.NEXT_PUBLIC_MODE as 'demo' | 'real') || 'demo';

  return (
    <WebSocketProvider mode={mode}>
      <div className="app-layout">
        <Sidebar />
        <div className="main-wrapper">
          <TopCommandBar />
          <main className="content-container">
            {children}
          </main>
        </div>
      </div>
    </WebSocketProvider>
  );
}
