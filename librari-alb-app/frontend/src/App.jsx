import Navbar from './components/Navbar.jsx';
import FloatingWordWidget from './components/FloatingWordWidget.jsx';
import AppRoutes from './routes/AppRoutes.jsx';

export default function App() {
  return (
    <>
      <div className="app-shell">
        <Navbar />
        <main className="app-main">
          <AppRoutes />
        </main>
      </div>
      <FloatingWordWidget />
    </>
  );
}
