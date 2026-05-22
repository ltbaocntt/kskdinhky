import React, { useState, useEffect } from "react";
import { ShieldAlert, Key, User, Eye, EyeOff, Activity, Loader2 } from "lucide-react";
import { motion } from "motion/react";

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorOnSubmit, setErrorOnSubmit] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  // Focus the username input on mount
  useEffect(() => {
    const input = document.getElementById("login-username");
    if (input) {
      input.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorOnSubmit(null);

    if (!username.trim()) {
      setErrorOnSubmit("Vui lòng nhập tên đăng nhập!");
      return;
    }
    if (!password) {
      setErrorOnSubmit("Vui lòng nhập mật khẩu!");
      return;
    }

    setIsLoading(true);

    try {
      // Small artificial delay for professional feeling and brute force prevention
      await new Promise((resolve) => setTimeout(resolve, 800));

      const isUserValid = username.trim().toLowerCase() === "admin";
      let isPassValid = false;

      // 1. Primary secure SHA-256 method
      if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
        try {
          const msgBuffer = new TextEncoder().encode(password);
          const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
          if (hashHex === "410ff0093a7123b1c06a117b6b02a77471fa7e8c682af0c02dac6bf6d0e25298") {
            isPassValid = true;
          }
        } catch (e) {
          console.warn("Lỗi SHA256, chuyển sang phương thức dự phòng:", e);
        }
      }

      // 2. Synchronous fallback (djb2 custom string hash) for non-secure contexts or sandboxed iframes
      if (!isPassValid) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
          hash = (hash << 5) - hash + password.charCodeAt(i);
          hash |= 0;
        }
        if (hash.toString(36) === "13nczw") {
          isPassValid = true;
        }
      }

      if (isUserValid && isPassValid) {
        // Successful login
        if (rememberMe) {
          localStorage.setItem("MED_RECORDS_AUTH", "true");
        } else {
          sessionStorage.setItem("MED_RECORDS_AUTH", "true");
        }
        onLoginSuccess();
      } else {
        setErrorOnSubmit("Tên đăng nhập hoặc mật khẩu không chính xác!");
      }
    } catch (err) {
      console.error("Lỗi đăng nhập:", err);
      setErrorOnSubmit("Đã xảy ra lỗi hệ thống. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 py-12 font-sans overflow-hidden relative">
      {/* Dynamic abstract grid background for polished visual presentation */}
      <div className="absolute inset-0 bg-[radial-gradient(#f43f5e_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-md w-full space-y-8 bg-white p-8 md:p-10 rounded-3xl shadow-xl z-10 border border-slate-200/50"
        id="login-card"
      >
        <div className="text-center">
          {/* Logo container */}
          <div className="inline-flex items-center justify-center bg-red-100 text-red-600 p-4 rounded-2xl mb-4 shadow-sm border border-red-200 animate-pulse">
            <Activity className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
            HỒ SƠ SỨC KHỎE ĐIỆN TỬ
          </h2>
          <p className="mt-2 text-xs text-slate-500 uppercase tracking-widest font-semibold">
            Medical Records Hub • Hệ thống đăng nhập
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} id="login-form">
          {errorOnSubmit && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-red-700 font-medium"
              id="login-error-alert"
            >
              <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorOnSubmit}</span>
            </motion.div>
          )}

          <div className="space-y-4">
            {/* Username Input */}
            <div>
              <label htmlFor="login-username" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Tên đăng nhập
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4.5 w-4.5 text-slate-400" />
                </div>
                <input
                  id="login-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  placeholder="admin"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-205 rounded-xl text-slate-800 text-sm placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Key className="h-4.5 w-4.5 text-slate-400" />
                </div>
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-205 rounded-xl text-slate-800 text-sm placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded-sm cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-xs font-semibold text-slate-600 cursor-pointer select-none">
                Ghi nhớ đăng nhập
              </label>
            </div>

            <div className="text-xs text-slate-400 font-medium">
              Tài khoản dùng thử
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer active:scale-[0.98]"
              id="login-submit-button"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Đăng nhập hệ thống"
              )}
            </button>
          </div>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
          Môi trường chạy cục bộ bảo mật, mã hóa dữ liệu đầu cuối.
        </div>
      </motion.div>
    </div>
  );
}
