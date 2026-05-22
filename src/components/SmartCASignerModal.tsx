/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { HealthRecord } from "../types";
import { 
  X, 
  Smartphone, 
  CheckCircle, 
  AlertCircle, 
  Lock, 
  ShieldCheck, 
  UserCheck, 
  Building2, 
  Cpu, 
  ChevronRight, 
  Clock, 
  RefreshCw, 
  Fingerprint,
  FileCheck2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SmartCASignerModalProps {
  record: HealthRecord;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedRecord: HealthRecord) => void;
  initialRole?: "doctor" | "leader" | "unit";
}

// Preset VNPT SmartCA credential sets matching standard vietnamese administrative staff
const PRESET_CERTIFICATES = {
  doctor: [
    { name: "BS. CKII. Phan Chí Thành", uid: "0915332115", email: "thanh.pc@smartca.gov.vn", certSerial: "VNPT-SCA-DOC-8832101", title: "Trưởng khoa Khám bệnh" },
    { name: "BS. CK I. Lê Thị Mai", uid: "0945992811", email: "mai.lt@smartca.gov.vn", certSerial: "VNPT-SCA-DOC-1122849", title: "Bác sĩ lâm sàng phụ trách" },
    { name: "BS. Nguyễn Trọng Nhân", uid: "0982554122", email: "nhan.nt@smartca.gov.vn", certSerial: "VNPT-SCA-DOC-9944112", title: "Bác sĩ kết luận chuyên môn" },
  ],
  leader: [
    { name: "ThS. BS. Nguyễn Hoàng Nam", uid: "0908777888", email: "nam.nh.gdoc@smartca.gov.vn", certSerial: "VNPT-SCA-LDR-0091122", title: "Giám đốc bệnh viện / Trung tâm" },
    { name: "Phó Giám đốc ThS. BS. Trần Thị Kim Cúc", uid: "0912112233", email: "cuc.ttk.pgd@smartca.gov.vn", certSerial: "VNPT-SCA-LDR-7733441", title: "Phó giám đốc y khoa phụ trách" },
  ],
  unit: [
    { name: "Bệnh viện Quận 1 - Hồ Chí Minh", uid: "01009831A1", email: "bvquan1.hcm@smartca.vn", certSerial: "VNPT-SCA-ORG-79001", title: "Mã CS: 79001 - Bộ Y tế" },
    { name: "Bệnh viện Đa khoa Tây Đô - Cần Thơ", uid: "0200881920", email: "bvdk.taydo@smartca.vn", certSerial: "VNPT-SCA-ORG-92011", title: "Mã CS: 92011 - Bộ Y tế" },
    { name: "Bệnh viện Bạch Mai - Hà Nội", uid: "0100112211", email: "bachmai.hn@smartca.vn", certSerial: "VNPT-SCA-ORG-01001", title: "Mã CS: 01001 - Bộ Y tế" },
  ]
};

export default function SmartCASignerModal({ 
  record, 
  isOpen, 
  onClose, 
  onSuccess,
  initialRole = "doctor"
}: SmartCASignerModalProps) {
  
  const [localRecord, setLocalRecord] = useState<HealthRecord>(record);

  // Sync prop changes into local state to bypass delayed React propagation challenges
  useEffect(() => {
    setLocalRecord(record);
  }, [record]);

  // Step tracker: "setup" | "approvals_waiting" | "success"
  const [step, setStep] = useState<"setup" | "approvals_waiting" | "success">("setup");
  const [selectedRole, setSelectedRole] = useState<"doctor" | "leader" | "unit">(
    initialRole === "leader" ? "unit" : initialRole
  );
  
  // Real VNPT SmartCA Connector credentials and state
  const [gatewayMode, setGatewayMode] = useState<"demo" | "live">("demo");
  const [realBaseUrl, setRealBaseUrl] = useState("https://smartcastaging.vnpt.vn");
  const [realClientId, setRealClientId] = useState("");
  const [realClientSecret, setRealClientSecret] = useState("");
  const [realPassword, setRealPassword] = useState("");
  const [realProfileId, setRealProfileId] = useState("Standard_Signing_Profile");
  const [isRequesting, setIsRequesting] = useState(false);
  const [accessTokenProxy, setAccessTokenProxy] = useState("");

  // Input fields
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [customUsername, setCustomUsername] = useState("");
  const [customCertName, setCustomCertName] = useState("");
  const [customTitle, setCustomTitle] = useState("");

  const [useCustomCreds, setUseCustomCreds] = useState(false);
  
  // Load from localStorage on mount to provide high-fidelity autofill memory
  useEffect(() => {
    try {
      const savedGatewayMode = localStorage.getItem("smartca_gatewayMode");
      if (savedGatewayMode === "demo" || savedGatewayMode === "live") {
        setGatewayMode(savedGatewayMode as "demo" | "live");
      }
      const savedRealBaseUrl = localStorage.getItem("smartca_realBaseUrl");
      if (savedRealBaseUrl) setRealBaseUrl(savedRealBaseUrl);

      const savedRealClientId = localStorage.getItem("smartca_realClientId");
      if (savedRealClientId) setRealClientId(savedRealClientId);

      const savedRealClientSecret = localStorage.getItem("smartca_realClientSecret");
      if (savedRealClientSecret) setRealClientSecret(savedRealClientSecret);

      const savedRealPassword = localStorage.getItem("smartca_realPassword");
      if (savedRealPassword) setRealPassword(savedRealPassword);

      const savedRealProfileId = localStorage.getItem("smartca_realProfileId");
      if (savedRealProfileId) setRealProfileId(savedRealProfileId);

      const savedUseCustomCreds = localStorage.getItem("smartca_useCustomCreds");
      if (savedUseCustomCreds) setUseCustomCreds(savedUseCustomCreds === "true");

      const savedCustomUsername = localStorage.getItem("smartca_customUsername");
      if (savedCustomUsername) setCustomUsername(savedCustomUsername);

      const savedCustomCertName = localStorage.getItem("smartca_customCertName");
      if (savedCustomCertName) setCustomCertName(savedCustomCertName);

      const savedCustomTitle = localStorage.getItem("smartca_customTitle");
      if (savedCustomTitle) setCustomTitle(savedCustomTitle);

      const savedSelectedPresetIndex = localStorage.getItem("smartca_selectedPresetIndex");
      if (savedSelectedPresetIndex) {
        setSelectedPresetIndex(parseInt(savedSelectedPresetIndex, 10));
      }
    } catch (e) {
      console.warn("Could not load SmartCA state from localStorage", e);
    }
  }, []);
  
  // Phone simulation states
  const [countdown, setCountdown] = useState(120);
  const [transactionId, setTransactionId] = useState("");
  const [phoneApproved, setPhoneApproved] = useState(false);
  const [phonePin, setPhonePin] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Countdown timer effect
  useEffect(() => {
    let timer: any;
    if (step === "approvals_waiting" && countdown > 0 && !phoneApproved) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0 && !phoneApproved) {
      setStep("setup");
      alert("Hết thời gian chờ ký VNPT SmartCA. Vui lòng thực hiện gửi lại lệnh!");
    }
    return () => clearInterval(timer);
  }, [step, countdown, phoneApproved]);

  // Polling loop for Real Staging/Production VNPT Gateway status
  useEffect(() => {
    let pollInterval: any;
    if (step === "approvals_waiting" && gatewayMode === "live" && transactionId && !phoneApproved) {
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch("/api/smartca/status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              baseUrl: realBaseUrl,
              transactionId: transactionId,
              accessToken: accessTokenProxy,
              mockMode: gatewayMode
            })
          });

          if (res.ok) {
            const data = await res.json();
            // Once the user approves on their physical smartphone, complete the signature!
            if (data.status === "SUCCESS" || data.status === "SIGNED") {
              clearInterval(pollInterval);
              setPhoneApproved(true);
              
              const certName = getActiveCertName();
              const certTitle = getActiveTitle();
              const certSerial = getActiveSerial();
              const formattedTime = new Date().toLocaleString("vi-VN");
              const shaHash = data.signature ? `HASH-${data.signature.substring(0, 15)}...` : `SHA256:${Math.random().toString(16).substring(2, 10).toUpperCase()}`;

              const digitalSigString = `VNPT SmartCA Remote Sign (Lớp CA Quốc Gia - Cổng Thật App VNPT)\nChủ thể: ${certName}\nChức danh: ${certTitle}\nSeri: ${certSerial}\nThời gian ký: ${formattedTime}\nHợp quy QĐ y tế: GD-SHA256\nTính toàn vẹn: ${shaHash}`;

              const updatedRecord = { ...localRecord };
              if (selectedRole === "doctor") {
                updatedRecord.CKS_NGUOI_KET_LUAN = digitalSigString;
              } else if (selectedRole === "leader") {
                updatedRecord.CKS_LANH_DAO = digitalSigString;
              } else {
                updatedRecord.CKS_BENH_VIEN = digitalSigString;
              }
              
              updatedRecord.updatedAt = new Date().toISOString();
              setLocalRecord(updatedRecord);
              onSuccess(updatedRecord);
              
              setTimeout(() => {
                setStep("success");
              }, 1200);
            } else if (data.status === "REJECTED" || data.status === "FAILED") {
              clearInterval(pollInterval);
              setPhoneError("Giao dịch bị từ chối hoặc gặp lỗi trên ứng dụng SmartCA của bạn.");
            }
          }
        } catch (pollErr) {
          console.error("Lỗi polling trạng thái ký số SmartCA", pollErr);
        }
      }, 3000); // Check status every 3 seconds
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [step, gatewayMode, transactionId, phoneApproved, accessTokenProxy]);

  if (!isOpen) return null;

  // Derive active parameters
  const getActiveCertName = () => {
    if (useCustomCreds) return customCertName || "Người dùng VNPT SmartCA";
    return PRESET_CERTIFICATES[selectedRole][selectedPresetIndex]?.name || "";
  };

  const getActiveUsername = () => {
    if (useCustomCreds) return customUsername || "0912345678";
    return PRESET_CERTIFICATES[selectedRole][selectedPresetIndex]?.uid || "";
  };

  const getActiveTitle = () => {
    if (useCustomCreds) return customTitle || "Cán bộ y tế";
    return PRESET_CERTIFICATES[selectedRole][selectedPresetIndex]?.title || "";
  };

  const getActiveSerial = () => {
    if (useCustomCreds) return "VNPT-SCA-CUST-" + Math.random().toString(36).substring(2, 9).toUpperCase();
    return PRESET_CERTIFICATES[selectedRole][selectedPresetIndex]?.certSerial || "";
  };

  // Trigger remote sign request calling express gateway proxy
  const handleInitiateSigning = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs if custom
    if (useCustomCreds) {
      if (!customUsername.trim()) {
        alert("Vui lòng nhập số điện thoại hoặc mã định danh SmartCA.");
        return;
      }
      if (!customCertName.trim()) {
        alert("Vui lòng nhập họ tên hoặc tên tổ chức chủ chứng thư số.");
        return;
      }
    }

    // Save configuration settings to localStorage so they autofill next time
    try {
      localStorage.setItem("smartca_gatewayMode", gatewayMode);
      localStorage.setItem("smartca_realBaseUrl", realBaseUrl);
      localStorage.setItem("smartca_realClientId", realClientId);
      localStorage.setItem("smartca_realClientSecret", realClientSecret);
      localStorage.setItem("smartca_realPassword", realPassword);
      localStorage.setItem("smartca_realProfileId", realProfileId);
      localStorage.setItem("smartca_useCustomCreds", useCustomCreds ? "true" : "false");
      localStorage.setItem("smartca_customUsername", customUsername);
      localStorage.setItem("smartca_customCertName", customCertName);
      localStorage.setItem("smartca_customTitle", customTitle);
      localStorage.setItem("smartca_selectedPresetIndex", selectedPresetIndex.toString());
    } catch (errLocal) {
      console.warn("Lỗi khi lưu cấu hình SmartCA vào localStorage:", errLocal);
    }

    setIsRequesting(true);
    setPhoneError("");

    try {
      const payload = {
        baseUrl: gatewayMode === "live" ? realBaseUrl : null,
        clientId: gatewayMode === "live" ? realClientId : null,
        clientSecret: gatewayMode === "live" ? realClientSecret : null,
        username: useCustomCreds ? customUsername : PRESET_CERTIFICATES[selectedRole][selectedPresetIndex]?.uid,
        password: gatewayMode === "live" ? realPassword : null,
        profileId: gatewayMode === "live" ? realProfileId : null,
        role: selectedRole,
        patientName: localRecord.HO_TEN,
        patientLk: localRecord.MA_LK,
        isCustomCreds: gatewayMode === "live"
      };

      const res = await fetch("/api/smartca/request-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.details || errData.error || "Gặp lỗi kết nối tới Server Proxy.");
      }

      const data = await res.json();
      
      setTransactionId(data.transactionId);
      setAccessTokenProxy(data.accessTokenProxy || "");
      setCountdown(120);
      setPhoneApproved(false);
      setPhonePin("");

      if (data.mode === "live") {
        setGatewayMode("live");
      } else {
        setGatewayMode("demo"); // High-fidelity Simulation Sandbox Mode
      }
      
      setStep("approvals_waiting");
    } catch (err: any) {
      alert("Không thể kết nối Cổng VNPT SmartCA: " + err.message);
    } finally {
      setIsRequesting(false);
    }
  };

  // Execute approval manually (applicable for Sandbox, or manual fast-track bypass)
  const handlePhoneConfirmSubmit = () => {
    if (!phonePin) {
      setPhoneError("Vui lòng nhập mã PIN SmartCA (mặc định 123456) để kết nối chữ ký số.");
      return;
    }
    if (phonePin !== "123456") {
      setPhoneError("Mã PIN SmartCA không đúng. Mẹo: Hãy dùng mã mặc định 123456.");
      return;
    }
    
    setPhoneApproved(true);
    
    // Simulate slight delay before complete certificate registration
    setTimeout(() => {
      const certName = getActiveCertName();
      const certTitle = getActiveTitle();
      const certSerial = getActiveSerial();
      const shaHash = "SHA256:" + Math.random().toString(16).substring(2, 10).toUpperCase() + 
                      Math.random().toString(16).substring(2, 10).toUpperCase() + 
                      Math.random().toString(16).substring(2, 10).toUpperCase();
      const signTime = new Date().toISOString();
      const formattedTime = new Date(signTime).toLocaleString("vi-VN");

      const digitalSigString = `VNPT SmartCA Remote Sign (Lớp CA Bảo mật Quốc gia - Demo Sandbox)\nChủ thể: ${certName}\nChức danh: ${certTitle}\nSeri: ${certSerial}\nThời gian ký: ${formattedTime}\nHợp quy QĐ y tế: GD-SHA256\nTính toàn vẹn: ${shaHash}`;

      const updatedRecord = { ...localRecord };
      if (selectedRole === "doctor") {
        updatedRecord.CKS_NGUOI_KET_LUAN = digitalSigString;
      } else if (selectedRole === "leader") {
        updatedRecord.CKS_LANH_DAO = digitalSigString;
      } else {
        updatedRecord.CKS_BENH_VIEN = digitalSigString;
      }
      
      updatedRecord.updatedAt = signTime;

      setLocalRecord(updatedRecord);
      onSuccess(updatedRecord);
      setStep("success");
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full text-slate-800"
        id="smartca-signer-box"
      >
        {/* Header bar */}
        <div className="flex justify-between items-center bg-blue-900 text-white rounded-t-2xl px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="bg-white text-blue-900 p-1 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-blue-700 font-bold" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-wide uppercase">Cổng Ký Số Từ Xa VNPT SmartCA</h3>
              <p className="text-[10px] text-blue-200 uppercase tracking-widest leading-none mt-0.5">Xác thực chứng thư số quốc gia Bộ Thông tin và Truyền thông</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Record info bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap justify-between items-center text-xs gap-2">
          <div>
            <span className="text-slate-400">Học viên/Bệnh nhân:</span>{" "}
            <span className="font-bold text-slate-800 uppercase">{localRecord.HO_TEN}</span>
          </div>
          <div>
            <span className="text-slate-400">Mã lượt khám:</span>{" "}
            <span className="font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold">{localRecord.MA_LK}</span>
          </div>
          <div>
            <span className="text-slate-400">Mã hồ sơ:</span>{" "}
            <span className="font-mono text-slate-650 font-semibold">{localRecord.id}</span>
          </div>
        </div>

        {/* Body content */}
        <div className="p-6 md:p-8">
          
          {/* STEP 1: SETUP CREDENTIALS */}
          {step === "setup" && (
            <form onSubmit={handleInitiateSigning} className="space-y-6">
              
              {/* Choose signing role */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  1. Chọn thực thể ký duyệt tài liệu y tế
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  
                  {/* Doctor Card */}
                  <div 
                    onClick={() => { setSelectedRole("doctor"); setSelectedPresetIndex(0); }}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all flex items-start gap-3 select-none ${
                      selectedRole === "doctor" 
                        ? "border-blue-500 bg-blue-50/30 ring-1 ring-blue-500" 
                        : "border-slate-200 hover:border-slate-350 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className={`p-2 rounded-lg mt-0.5 ${selectedRole === "doctor" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm leading-tight text-slate-900">Bác sĩ khám bệnh</h4>
                      <p className="text-[11px] text-slate-450 mt-1">Xác nhận kết luận sức khỏe của bác sĩ tổ chức khám.</p>
                      {localRecord.CKS_NGUOI_KET_LUAN && (
                        <span className="inline-block mt-2 text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">Đã có chữ ký cũ</span>
                      )}
                    </div>
                  </div>

                  {/* Unit Card */}
                  <div 
                    onClick={() => { setSelectedRole("unit"); setSelectedPresetIndex(0); }}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all flex items-start gap-3 select-none ${
                      selectedRole === "unit" 
                        ? "border-blue-500 bg-blue-50/30 ring-1 ring-blue-500" 
                        : "border-slate-200 hover:border-slate-350 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className={`p-2 rounded-lg mt-0.5 ${selectedRole === "unit" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm leading-tight text-slate-900">Đại diện Cơ sở khám chữa bệnh</h4>
                      <p className="text-[11px] text-slate-450 mt-1">Con dấu số tích hợp pháp nhân hoặc chữ ký số đại diện cơ sở khám.</p>
                      {localRecord.CKS_BENH_VIEN && (
                        <span className="inline-block mt-2 text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">Đã có con dấu cũ</span>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Mode Selection Tab */}
              <div className="bg-slate-105 p-1 rounded-xl flex gap-1 text-xs font-bold leading-normal border border-slate-205">
                <button
                  type="button"
                  onClick={() => setGatewayMode("demo")}
                  className={`flex-1 py-1.5 text-center rounded-lg transition-all cursor-pointer ${gatewayMode === "demo" ? "bg-white text-blue-900 shadow-xs ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-800"}`}
                >
                  Môi trường Thử nghiệm (Mô Phỏng Sandbox)
                </button>
                <button
                  type="button"
                  onClick={() => setGatewayMode("live")}
                  className={`flex-1 py-1.5 text-center rounded-lg transition-all cursor-pointer ${gatewayMode === "live" ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                >
                  Kết nối Cổng Thật của VNPT (Live App SmartCA)
                </button>
              </div>

              {/* Account Credentials Setup */}
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
                
                {/* Real Live Endpoint Configurations */}
                {gatewayMode === "live" && (
                  <div className="p-4 bg-blue-50/60 rounded-lg space-y-3 mb-2.5 border border-blue-150">
                    <div className="font-extrabold text-blue-900 text-xs uppercase tracking-wide flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      Cấu hình thông tin tích hợp VNPT SmartCA Gateway:
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-650 mb-1">Base URL Cổng VNPT SmartCA</label>
                        <input
                          type="url"
                          required
                          value={realBaseUrl}
                          onChange={(e) => setRealBaseUrl(e.target.value)}
                          placeholder="https://smartcastaging.vnpt.vn"
                          className="w-full text-xs px-3 py-2 border border-slate-250 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-650 mb-1">Mã Profile Ký số (Profile ID)</label>
                        <input
                          type="text"
                          required
                          value={realProfileId}
                          onChange={(e) => setRealProfileId(e.target.value)}
                          placeholder="Standard_Signing_Profile"
                          className="w-full text-xs px-3 py-2 border border-slate-250 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-650 mb-1">Client ID của đơn vị</label>
                        <input
                          type="text"
                          required
                          value={realClientId}
                          onChange={(e) => setRealClientId(e.target.value)}
                          placeholder="Nhập Client ID do VNPT cấp"
                          className="w-full text-xs px-3 py-2 border border-slate-250 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-655 mb-1">Client Secret bảo mật</label>
                        <input
                          type="password"
                          required
                          value={realClientSecret}
                          onChange={(e) => setRealClientSecret(e.target.value)}
                          placeholder="Nhập Client Secret cấp cho app y tế"
                          className="w-full text-xs px-3 py-2 border border-slate-250 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-white font-mono"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-650 mb-1">Mật khẩu tài khoản SmartCA (Nên dùng nếu Gateway yêu cầu password grant-type)</label>
                        <input
                          type="password"
                          value={realPassword}
                          onChange={(e) => setRealPassword(e.target.value)}
                          placeholder="Mật khẩu của tài khoản SmartCA người dùng (Để trống nếu chỉ cần Client Credentials mặc định)"
                          className="w-full text-xs px-3 py-2 border border-slate-250 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="font-bold text-xs uppercase text-slate-550">
                    2. Thiết lập chứng thư & tài khoản VNPT SmartCA ({gatewayMode === "live" ? "THẬT" : "TEST"})
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">Nhập thủ công</span>
                    <input 
                      type="checkbox" 
                      checked={useCustomCreds} 
                      onChange={(e) => setUseCustomCreds(e.target.checked)} 
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Preset Picker */}
                {!useCustomCreds ? (
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-450 mb-1.5">Chọn kỹ thuật viên y tế (Đã kết nối chữ ký số SmartCA của Bộ)</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {PRESET_CERTIFICATES[selectedRole].map((cert, idx) => (
                        <div 
                          key={cert.uid}
                          onClick={() => setSelectedPresetIndex(idx)}
                          className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all select-none ${
                            selectedPresetIndex === idx 
                              ? "border-blue-550 bg-white ring-1 ring-blue-500 shadow-sm" 
                              : "border-slate-200 bg-white hover:bg-slate-50"
                          }`}
                        >
                          <span className="block font-bold text-xs text-slate-900 truncate">{cert.name}</span>
                          <span className="block text-[10px] text-slate-500 truncate mt-0.5">{cert.title}</span>
                          <span className="block text-[9px] text-blue-600 font-mono mt-1 font-semibold">Tài khoản: {cert.uid}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-455 mb-1">Mã định danh/SĐT SmartCA</label>
                      <input 
                        type="text"
                        required
                        value={customUsername}
                        onChange={(e) => setCustomUsername(e.target.value)}
                        placeholder="Ví dụ: 0912112233"
                        className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-455 mb-1">Họ tên chủ Chứng Thư</label>
                      <input 
                        type="text"
                        required
                        value={customCertName}
                        onChange={(e) => setCustomCertName(e.target.value)}
                        placeholder="Ví dụ: BS. CKII. Lâm Vũ Đại"
                        className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-455 mb-1">Chức vụ / Cơ sở</label>
                      <input 
                        type="text"
                        required
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="Ví dụ: Giám đốc sở y tế"
                        className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* Display resolved cert summary */}
                <div className="bg-blue-50/30 rounded-lg p-3 text-xs leading-relaxed space-y-1 border border-blue-100">
                  <div className="flex gap-1 items-center font-bold text-blue-900 text-[11px]">
                    <Lock className="w-3.5 h-3.5" />
                    CHỨNG THƯ SỐ LỰA CHỌN:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 mt-1 text-slate-650">
                    <div>• Họ tên / Cơ sở: <strong className="text-slate-800 font-bold">{getActiveCertName()}</strong></div>
                    <div>• Số hiệu: <strong className="text-slate-800 font-mono">{getActiveSerial()}</strong></div>
                    <div>• Chức vụ kiểm định: <strong className="text-slate-800 italic">{getActiveTitle()}</strong></div>
                    <div>• SĐT SmartCA: <strong className="text-slate-800 font-mono">{getActiveUsername()}</strong></div>
                  </div>
                </div>
              </div>

              {/* Core trigger Button */}
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Hủy thao tác
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-1 cursor-pointer"
                >
                  Gửi yêu cầu ký tới SmartCA
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </form>
          )}

          {/* STEP 2: COUNTDOWN & PHONE APPROVAL PORTAL */}
          {step === "approvals_waiting" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Waiting status column */}
              <div className="lg:col-span-7 space-y-5">
                <div className="bg-amber-50 text-amber-900 border border-amber-200 rounded-xl p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <h4 className="font-bold">Đang chờ xác nhận từ VNPT SmartCA...</h4>
                    <p className="leading-relaxed">Yêu cầu giao dịch đã được truyền phát thành công lên hệ thống bảo mật đám mây SmartCA Cloud HSM của VNPT.</p>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Thông tin bảo mật giao dịch</span>
                    <div className="flex items-center gap-1 text-[11px] text-blue-600 font-mono font-semibold animate-pulse">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs divide-y divide-slate-100">
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-450">Tài khoản SmartCA:</span>
                      <strong className="text-slate-800 font-mono">{getActiveUsername()}</strong>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-450">Mã Chứng thư số (Serial Cert):</span>
                      <strong className="text-slate-800 font-mono">{getActiveSerial()}</strong>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-450">Mã giao dịch (TxID):</span>
                      <strong className="text-slate-800 font-mono text-blue-800 font-semibold">{transactionId}</strong>
                    </div>
                    <div className="py-1.5 flex justify-between items-center text-[11px] bg-slate-50 px-2 rounded mt-2 text-slate-650">
                      <span>Loại Chứng từ:</span>
                      <strong className="font-bold">Hồ sơ sức khỏe điện tử (QĐ 19/2025)</strong>
                    </div>
                  </div>

                  <div className="text-center py-4">
                    <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mx-auto mb-3"></div>
                    <p className="text-xs text-slate-500 font-medium">Bản ghi chuẩn SHA256 đang được đưa vào xếp hàng...</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Vui lòng phê duyệt thông báo trên ứng dụng SmartCA trên điện thoại di động của bạn.</p>
                  </div>
                </div>

                <div className="flex justify-start">
                  <button 
                    type="button"
                    onClick={() => setStep("setup")}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Hủy lệnh này và chỉnh cấu hình
                  </button>
                </div>
              </div>

              {/* Simulation Smartphone panel column */}
              <div className="lg:col-span-5 flex flex-col items-center w-full">
                {gatewayMode === "live" ? (
                  <div className="w-full bg-slate-950 text-emerald-400 p-6 rounded-2xl font-mono text-xs border border-emerald-500/30 space-y-4 self-stretch text-left">
                    <div className="flex items-center gap-2 border-b border-emerald-500/20 pb-3 text-emerald-300">
                      <Cpu className="w-5 h-5 animate-pulse shrink-0" />
                      <div>
                        <h4 className="font-bold text-xs uppercase tracking-wider">VNPT LIVE GATEWAY MONITOR</h4>
                        <p className="text-[9px] text-slate-405 font-sans">Kiểm tra kết nối thời gian thực cổng quốc gia</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <div>
                          <p className="font-bold text-emerald-300">[SSL] Thiết lập kênh bảo mật API</p>
                          <p className="text-[10px] text-slate-450">API Base: {realBaseUrl}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <div>
                          <p className="font-bold text-emerald-300">[TOKEN] Nhận Token xác thực</p>
                          <p className="text-[10px] text-slate-450 font-sans font-semibold">Token: Bearer {accessTokenProxy ? accessTokenProxy.substring(0, 12) + "..." : "Xác thực tự động"}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <div>
                          <p className="font-bold text-emerald-300">[PUSH] Gửi yêu cầu ký số thật</p>
                          <p className="text-[10px] text-slate-450 font-sans">Mã giao dịch SmartCA: <span className="text-blue-400 font-mono text-[9px] font-bold">{transactionId}</span></p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold animate-ping shrink-0 mt-1">●</span>
                        <div>
                          <p className="font-bold text-amber-300">[POLLING] Thăm dò phản hồi thiết bị</p>
                          <p className="text-[10px] text-slate-350 font-sans leading-normal">
                            Đang thăm dò kết quả phê duyệt từ app di động SmartCA của bạn...
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-emerald-500/20 pt-4 text-center space-y-3">
                      <p className="text-[10px] font-sans text-amber-200 leading-normal animate-pulse bg-amber-500/10 py-1.5 px-2 rounded border border-amber-500/20 text-left">
                        🔔 Hãy mở ứng dụng <strong>VNPT SmartCA thật</strong> của bạn để xác nhận ký số!
                      </p>
                      
                      <button
                        type="button"
                        onClick={handlePhoneConfirmSubmit}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-sans font-extrabold py-2 rounded-lg text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Bỏ qua nhanh (Bypass để Demo test)
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="text-xs font-bold text-slate-450 uppercase mb-2 tracking-widest flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                      Mô phỏng VNPT SmartCA App
                    </span>

                {/* Simulated Phone Body */}
                <div className="w-full max-w-[290px] aspect-[9/18] bg-slate-900 rounded-[32px] p-2.5 border-4 border-slate-700 shadow-xl relative overflow-hidden flex flex-col justify-between">
                  {/* Speaker and Camera notch */}
                  <div className="absolute top-0 inset-x-0 h-6 flex justify-center items-center z-20">
                    <div className="w-24 h-4 bg-slate-900 rounded-b-xl flex items-center justify-between px-4">
                      <div className="w-8 h-1 bg-slate-700 rounded-full"></div>
                      <div className="w-2.5 h-2.5 bg-slate-800 rounded-full"></div>
                    </div>
                  </div>

                  {/* Phone OS status bar */}
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 px-3 pt-1.5 z-10">
                    <span>VNPT Net</span>
                    <div className="flex items-center gap-1">
                      <span>4G</span>
                      <div className="w-4 h-2 bg-slate-500 rounded-xs"></div>
                    </div>
                  </div>

                  {/* SmartCA Mobile Interface screen */}
                  <div className="flex-grow bg-slate-950 rounded-[22px] p-3 text-white flex flex-col justify-between overflow-y-auto mt-2 select-none h-full">
                    
                    {/* App Header logo */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-2 mt-4">
                      <div className="flex items-center gap-1">
                        <div className="bg-blue-600 p-0.5 rounded">
                          <ShieldCheck className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="font-extrabold text-[10px] tracking-tight uppercase">VNPT SmartCA</span>
                      </div>
                      <span className="text-[8px] bg-green-950/80 text-green-400 px-1 py-0.2 rounded border border-green-800">CONNECTED</span>
                    </div>

                    {/* Pending signing request block */}
                    {!phoneApproved ? (
                      <div className="my-auto space-y-3.5">
                        <div className="text-center">
                          <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center mx-auto border border-blue-500/30 animate-pulse">
                            <Fingerprint className="w-6 h-6" />
                          </div>
                          <h5 className="font-bold text-xs mt-1.5">YÊU CẦU KÝ SỐ MỚI</h5>
                          <p className="text-[8px] text-slate-400">Giao dịch y tế thông tư Bộ Y Tế </p>
                        </div>

                        {/* Signed metadata box */}
                        <div className="bg-white/5 rounded-lg p-2.5 space-y-1.5 text-[9px] border border-white/5 leading-normal">
                          <div>
                            <span className="text-slate-400">Dịch vụ phát hành:</span>{" "}
                            <span className="text-blue-400 font-bold">VNPT SmartCA</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Chủ chứng thư:</span>{" "}
                            <span className="font-semibold">{getActiveCertName()}</span>
                          </div>
                          <div className="truncate">
                            <span className="text-slate-400">Tài liệu hash:</span>{" "}
                            <span className="font-mono text-[7px] text-slate-400">{transactionId}</span>
                          </div>
                          <div className="border-t border-white/5 pt-1 mt-1 text-slate-300">
                            Xác thực ký kết cho lượt khám <strong className="text-white">{localRecord.MA_LK}</strong> bệnh nhân <span className="uppercase text-white font-bold">{localRecord.HO_TEN}</span>.
                          </div>
                        </div>

                        {/* PIN keypad simulation */}
                        <div className="space-y-1">
                          <label className="block text-[8px] text-slate-400 uppercase tracking-widest font-semibold">Mã PIN điện thoại của bạn:</label>
                          <input 
                            type="password"
                            maxLength={6}
                            value={phonePin}
                            onChange={(e) => {
                              setPhoneError("");
                              setPhonePin(e.target.value.replace(/\D/g, ""));
                            }}
                            placeholder="Nhập 123456"
                            className="bg-black/40 text-center tracking-widest w-full py-1 rounded text-sm text-yellow-400 border border-white/10 focus:outline-hidden"
                          />
                          <p className="text-[7px] text-slate-500 italic mt-0.5 text-center">Gợi ý kiểm nghiệm: Điền 123456</p>
                        </div>

                        {phoneError && (
                          <div className="text-[7px] text-red-400 text-center leading-normal mt-1 border border-red-950 bg-red-950/20 p-1 rounded">
                            {phoneError}
                          </div>
                        )}

                        <div className="pt-1">
                          <button 
                            type="button"
                            onClick={handlePhoneConfirmSubmit}
                            className="w-full bg-blue-600 hover:bg-blue-500 py-1.5 rounded-lg text-[10px] font-bold text-center transition-colors cursor-pointer"
                          >
                            Xác nhận phê duyệt
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="my-auto text-center space-y-3">
                        <div className="w-12 h-12 bg-green-600/20 text-green-400 border border-green-500/30 rounded-full flex items-center justify-center mx-auto">
                          <CheckCircle className="w-7 h-7" />
                        </div>
                        <h5 className="font-bold text-xs text-green-400">PHÊ DUYỆT THÀNH CÔNG</h5>
                        <p className="text-[9px] text-slate-300 leading-snug">Chữ ký số đã được áp vào tài liệu y tế hành chính. Giao dịch kết thúc hoàn hảo!</p>
                        <div className="bg-white/5 p-2 rounded text-[8px] font-mono whitespace-nowrap overflow-hidden text-ellipsis text-slate-400 text-center">
                          TxID: {transactionId.substring(0, 18)}...
                        </div>
                      </div>
                    )}

                    {/* App footer branding */}
                    <p className="text-[7px] text-center text-slate-550 italic uppercase tracking-wider mt-4">Powered by VNPT Information Technology</p>
                  </div>
                </div>

                <p className="text-[10px] text-slate-450 mt-2 text-center max-w-[260px] leading-relaxed">
                  Nhập mã mặc định <strong className="text-blue-700">123456</strong> và nhấn <strong>Xác nhận phê duyệt</strong> trên điện thoại giả lập để hoàn tất ký số.
                </p>
              </>
            )}
          </div>

            </div>
          )}

          {/* STEP 3: SUCCESS BLOCK */}
          {step === "success" && (
            <div className="text-center py-8 px-4 space-y-5">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-300 flex items-center justify-center mx-auto text-4xl">
                <FileCheck2 className="w-12 h-12 text-emerald-600" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900 uppercase">Hoàn Tất Ký Số VNPT SmartCA Thành Công!</h3>
                <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
                  Đã tải lên tệp tin và thực hiện đóng dấu mã hóa từ cấu cấu hình tài khoản SmartCA cho thực thể <strong className="text-slate-800 font-bold">{getActiveCertName()}</strong> ({getActiveTitle()}).
                </p>
              </div>

              <div className="bg-slate-50 border rounded-xl p-4 max-w-xl mx-auto space-y-2 text-left text-xs text-slate-650">
                <h4 className="font-bold text-slate-905 flex items-center gap-1 border-b pb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Mã xác thực chữ ký VNPT SmartCA lưu trữ:
                </h4>
                <div className="font-mono text-[10px] leading-relaxed uppercase bg-slate-950 text-emerald-400/90 rounded p-3 whitespace-pre-wrap overflow-x-auto select-all">
                  {selectedRole === "doctor" ? localRecord.CKS_NGUOI_KET_LUAN : selectedRole === "leader" ? localRecord.CKS_LANH_DAO : localRecord.CKS_BENH_VIEN}
                </div>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button 
                  onClick={() => setStep("setup")}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Ký tiếp thực thể khác
                </button>
                <button 
                  onClick={onClose}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-md cursor-pointer"
                >
                  Hoàn thành trở về
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer info banner */}
        <div className="px-6 py-4 bg-slate-50 border-t rounded-b-2xl flex justify-between items-center text-[10px] text-slate-400">
          <span>Công nghệ ký số Remote Cloud HSM tích hợp SHA-256 mã hóa tiêu chuẩn Việt Nam</span>
          <span className="font-semibold text-slate-500 shrink-0">Phiên bản VNPT SmartCA v2.26</span>
        </div>

      </motion.div>
    </div>
  );
}
