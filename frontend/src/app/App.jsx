import { AppRoutes } from '../routes/AppRoutes.jsx';
import { ToastContainer } from '../components/ui/Toast.jsx';
import { useToast } from '../hooks/useToast.jsx';

function ToastLayer() {
  const { toasts, removeToast } = useToast();
  return <ToastContainer onDismiss={removeToast} toasts={toasts} />;
}

export function App() {
  return (
    <>
      <AppRoutes />
      <ToastLayer />
    </>
  );
}
