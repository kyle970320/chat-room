import { useState } from "react";
import ChatPage from "./chat";

function App() {
  const [masterKey, setMasterKey] = useState(() =>
    window.localStorage.getItem("masterKey"),
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = () => {
    const isMasterId = email === import.meta.env.VITE_MASTER_ID;
    const isMasterPassword = password === import.meta.env.VITE_MASTER_PASSWORD;

    if (isMasterId && isMasterPassword) {
      const key = import.meta.env.VITE_MASTER_KEY;
      window.localStorage.setItem("masterKey", key);

      // ✅ 이게 핵심: 상태를 바꿔야 화면이 바뀜
      setMasterKey(key);
      return;
    }

    alert("아이디/비밀번호가 올바르지 않습니다.");
  };

  if (!masterKey) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-purple-600 mb-2">Welcome</h1>
            <p className="text-gray-500">로그인하여 계속하세요</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
            </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700"
            >
              로그인
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="custom-scrollbar flex-1 min-w-0 lg:px-12 max-h-screen overflow-y-auto">
      <ChatPage />
    </div>
  );
}

export default App;
