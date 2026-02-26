import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import TickerTape from './TickerTape.jsx';

export default function DashboardLayout() {
    return (
        <div className="flex flex-col min-h-screen bg-[#0b101e] text-white font-sans overflow-hidden">
            <TickerTape />
            <div className="flex flex-1 min-h-0">
                <Sidebar />
                <main className="flex-1 min-w-0 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
