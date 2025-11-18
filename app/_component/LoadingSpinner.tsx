export default function LoadingSpinner() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#F5F1E8" }}
    >
      <div className="text-center">
        <div className="w-[10vw] h-[10vw] border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      </div>
    </div>
  );
}

