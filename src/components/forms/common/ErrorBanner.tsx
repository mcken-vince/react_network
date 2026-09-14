import { Text } from "../../atoms";

interface ErrorBannerProps {
  message?: string | null;
}

function ErrorBanner({ message }: ErrorBannerProps) {
  if (!message) return null;
  return (
    <div className="bg-red-50 border border-red-200 px-4 py-3 rounded-lg mb-4" role="alert">
      <Text color="red-700" className="mb-0">
        {message}
      </Text>
    </div>
  );
}

export default ErrorBanner;