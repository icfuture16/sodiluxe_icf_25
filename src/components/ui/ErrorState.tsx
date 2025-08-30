interface ErrorStateProps {
  message?: string;
  retry?: () => void;
}

export default function ErrorState({ message = "Une erreur est survenue", retry }: ErrorStateProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4">
      <p className="text-lg font-semibold text-gray-900">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Réessayer
        </button>
      )}
    </div>
  );
}
