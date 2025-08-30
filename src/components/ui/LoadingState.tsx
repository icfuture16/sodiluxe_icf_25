interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message }: LoadingStateProps) {
  return (
    <div className="flex flex-col h-full w-full items-center justify-center gap-4">
      <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-gray-900"></div>
      {message && <p className="text-gray-500 text-center">{message}</p>}
    </div>
  );
}
