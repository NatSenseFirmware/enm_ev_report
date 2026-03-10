import { Camera } from "lucide-react";
import { useNavigate } from "react-router";

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">設備檢測</h1>
          <p className="text-gray-600">開始新的檢測流程</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => navigate("/take-photo")}
            className="w-full bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.98] border-2 border-transparent hover:border-blue-400"
          >
            <div className="flex items-center gap-4">
              <div className="bg-blue-500 rounded-full p-4">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 text-left">
                <h2 className="text-xl font-semibold text-gray-900">開始檢測</h2>
                <p className="text-sm text-gray-500">拍攝照片並記錄數據</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}