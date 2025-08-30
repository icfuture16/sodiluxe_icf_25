import * as React from 'react';

type ToastVariant = 'default' | 'destructive' | 'success';

interface ToastProps {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, title, description, variant = 'default', onDismiss }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), 5000);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  const baseStyles = 'fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100%-2rem)] p-4 rounded-md shadow-lg';
  const variantStyles = 
    variant === 'destructive' ? 'bg-red-500 text-white' :
    variant === 'success' ? 'bg-green-500 text-white' :
    'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100';

  return (
    <div className={`${baseStyles} ${variantStyles}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-medium">{title}</h3>
          {description && <p className="text-sm mt-1 opacity-90">{description}</p>}
        </div>
        <button
          onClick={() => onDismiss(id)}
          className="ml-4 opacity-70 hover:opacity-100 focus:outline-none"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

interface ToastContextType {
  toast: (props: Omit<ToastProps, 'id' | 'onDismiss'>) => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const onDismiss = React.useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const toastFn = React.useCallback((props: Omit<ToastProps, 'id' | 'onDismiss'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prevToasts) => [...prevToasts, { ...props, id, onDismiss }]);
  }, [onDismiss]);

  // Register the toast handler when the provider is mounted
  React.useEffect(() => {
    setToastHandler(toastFn);
    return () => setToastHandler(() => {});
  }, [toastFn]);

  // Only show the most recent toast
  const toastToShow = toasts[toasts.length - 1];

  return (
    <ToastContext.Provider value={{ toast: toastFn }}>
      {children}
      {toastToShow && (
        <Toast
          key={toastToShow.id}
          id={toastToShow.id}
          title={toastToShow.title}
          description={toastToShow.description}
          variant={toastToShow.variant}
          onDismiss={onDismiss}
        />
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Define the setToastHandler function directly in this file
function setToastHandler(handler: (props: Omit<ToastProps, 'id' | 'onDismiss'>) => void) {
  toastHandler = handler;
}

// Define the global toast handler
let toastHandler: ((props: Omit<ToastProps, 'id' | 'onDismiss'>) => void) | null = null;

// Export the toast function
export function toast(props: Omit<ToastProps, 'id' | 'onDismiss'>) {
  if (toastHandler) {
    return toastHandler(props);
  } else {
    console.error('Toast handler not initialized. Make sure ToastProvider is mounted.');
    return;
  }
}
