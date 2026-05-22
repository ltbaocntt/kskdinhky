/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { HealthRecord, createEmptyRecord } from "../types";
import { 
  ArrowLeft, ArrowRight, Save, User, ShieldCheck, Heart, 
  Stethoscope, FileCode, Check, AlertCircle, RefreshCw, PenTool,
  Smartphone, Building2, Lock, Search, MapPin, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import SmartCASignerModal from "./SmartCASignerModal";
import { 
  VIETNAM_ADMINISTRATIVE_DIVISIONS, 
  getFlatDivisionsList, 
  FlatDivisionSearch 
} from "../utils/administrative";

interface RecordFormProps {
  initialRecord?: HealthRecord;
  onSave: (record: HealthRecord) => void;
  onCancel: () => void;
}

// Translate yyyyMMddHHmm back to simple html form values
function parseDatetimeField(val: string) {
  if (!val || val.length < 8) return { dayMonthYear: "", hoursMinutes: "00:00" };
  const yyyy = val.substring(0, 4);
  const MM = val.substring(4, 6);
  const dd = val.substring(6, 8);
  const HH = val.length >= 10 ? val.substring(8, 10) : "00";
  const mm = val.length >= 12 ? val.substring(10, 12) : "00";
  return {
    date: `${yyyy}-${MM}-${dd}`,
    time: `${HH}:${mm}`
  };
}

// Compile custom inputs back into yyyyMMddHHmm format
function compileDatetimeField(date: string, time: string): string {
  if (!date) return "";
  // date format: yyyy-MM-dd
  const cleanDate = date.replace(/-/g, ""); // yyyyMMdd
  const cleanTime = (time || "00:00").replace(/:/g, ""); // HHmm
  return `${cleanDate}${cleanTime}`;
}

// Raw yyyyMMdd format for CCCD issue date
function parseDateField(val: string) {
  if (!val || val.length < 8) return "";
  const yyyy = val.substring(0, 4);
  const MM = val.substring(4, 6);
  const dd = val.substring(6, 8);
  return `${yyyy}-${MM}-${dd}`;
}

function compileDateField(date: string): string {
  if (!date) return "";
  return date.replace(/-/g, ""); // yyyyMMdd
}

// Clean up and isolate the street/house part of the current address
function cleanStreetPrefix(currentAddress: string, oldProvCode: string, oldCommCode: string): string {
  if (!currentAddress || currentAddress.trim() === "" || currentAddress === "Chưa xác định") {
    return "";
  }
  
  let street = currentAddress.trim();
  
  // Find old commune/province names
  const oldProv = VIETNAM_ADMINISTRATIVE_DIVISIONS.find(p => p.code === oldProvCode);
  const oldComm = oldProv?.communes.find(c => c.code === oldCommCode);
  
  const namesToRemove: string[] = [];
  if (oldComm) {
    namesToRemove.push(oldComm.name.trim());
  }
  if (oldProv) {
    namesToRemove.push(oldProv.name.trim());
  }
  
  namesToRemove.forEach(name => {
    if (!name) return;
    const rEscaped = name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`,?\\s*${rEscaped}\\s*,?`, "gi");
    street = street.replace(regex, ",");
  });
  
  // Clean up trailing commas, leading commas, and extra spaces
  street = street.replace(/^[\s,]+|[\s,]+$/g, "").trim();
  street = street.replace(/,\s*,/g, ",").trim();
  
  return street;
}

export default function RecordForm({ initialRecord, onSave, onCancel }: RecordFormProps) {
  // Mode check
  const isEditing = !!initialRecord;

  // Form State
  const [record, setRecord] = useState<HealthRecord>(() => {
    return initialRecord ? { ...initialRecord } : createEmptyRecord();
  });

  // Custom date bound elements to bypass raw 12-char challenges
  const [birthDateVals, setBirthDateVals] = useState(() => parseDatetimeField(initialRecord?.NGAY_SINH || ""));
  const [examDateVals, setExamDateVals] = useState(() => parseDatetimeField(initialRecord?.NGAY_VAO || ""));

  // VNPT SmartCA interactive states inside the editor
  const [isSmartCAModalOpen, setIsSmartCAModalOpen] = useState(false);
  const [smartCARole, setSmartCARole] = useState<"doctor" | "leader" | "unit">("doctor");
  const [cccdIssueDate, setCccdIssueDate] = useState(() => parseDateField(initialRecord?.NGAY_CAP_CCCD || ""));

  // Current sub-form wizard step (1 to 6)
  const [step, setStep] = useState<number>(1);
  const totalSteps = 6;

  // Search states for administrative divisions
  const [addressSearch, setAddressSearch] = useState("");
  const [isAddressDropdownOpen, setIsAddressDropdownOpen] = useState(false);
  const [filterProvinceCode, setFilterProvinceCode] = useState<string>("");

  // Track field touch validity
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Trigger auto BMI calculation when weight/height changes
  useEffect(() => {
    const height = parseFloat(record.CHIEU_CAO);
    const weight = parseFloat(record.CAN_NANG);

    if (!isNaN(height) && !isNaN(weight) && height > 0) {
      // BMI = Weight (kg) / (Height (m) ^ 2)
      const heightInMeters = height / 100;
      const bmi = weight / (heightInMeters * heightInMeters);
      const bmiFixed = bmi.toFixed(2);
      
      setRecord(prev => ({ ...prev, CHI_SO_BMI: bmiFixed }));
    } else {
      setRecord(prev => ({ ...prev, CHI_SO_BMI: "" }));
    }
  }, [record.CHIEU_CAO, record.CAN_NANG]);

  // Handle standard changes
  const handleChange = (field: keyof HealthRecord, value: any) => {
    setRecord(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error
    if (errors[field]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  // Compile dates before submission state check
  const validateForm = (): boolean => {
    const tempErrors: { [key: string]: string } = {};

    if (!record.HO_TEN || record.HO_TEN.trim() === "") {
      tempErrors.HO_TEN = "Họ và tên bệnh nhân là bắt buộc";
    }

    if (!birthDateVals.date) {
      tempErrors.NGAY_SINH = "Ngày sinh là bắt buộc";
    }

    if (!record.SO_CCCD || record.SO_CCCD.trim().length === 0) {
      tempErrors.SO_CCCD = "Số định danh / CCCD là bắt buộc (tối đa 15 ký tự)";
    } else if (record.SO_CCCD.trim().length > 15) {
      tempErrors.SO_CCCD = "Số định danh / CCCD tối đa 15 ký tự";
    }

    if (record.DIEN_THOAI && record.DIEN_THOAI.trim().length > 15) {
      tempErrors.DIEN_THOAI = "Điện thoại tối đa 15 số";
    }

    // Checking max strings
    const checkMaxStr = (field: keyof HealthRecord, maxL: number, label: string) => {
      const val = record[field];
      if (typeof val === "string" && val.length > maxL) {
        tempErrors[field] = `${label} tối đa ${maxL} ký tự (đang có ${val.length})`;
      }
    };

    checkMaxStr("HO_TEN", 255, "Họ tên");
    checkMaxStr("NGUOI_GIAM_HO", 255, "Người giám hộ");
    checkMaxStr("NOI_CAP_CCCD", 1024, "Nơi cấp");
    checkMaxStr("DIA_CHI", 1024, "Chỗ ở hiện tại");
    checkMaxStr("MATINH_CU_TRU", 3, "Mã tỉnh");
    checkMaxStr("MAXA_CU_TRU", 5, "Mã xã");
    checkMaxStr("MA_CSKCB", 5, "Mã CSKCB");
    checkMaxStr("MA_GTIN_CSKCB", 255, "Tên cơ sở khám chữa bệnh");
    checkMaxStr("KET_LUAN_LOAI_SUC_KHOE", 255, "Kết luận xếp loại sức khỏe");
    checkMaxStr("KET_LUAN_CAC_VAN_DE_SUC_KHOE", 255, "Kết luận bệnh lý cần chú ý");

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      // Find step with errors and set it
      if (errors.HO_TEN || errors.NGAY_SINH || errors.SO_CCCD || errors.DIA_CHI) {
        setStep(1);
      } else if (errors.MA_CSKCB || errors.MA_GTIN_CSKCB) {
        setStep(2);
      } else if (errors.TSGD_TEN_BENH || errors.BENH_GAY_RA_SAN_KHOA_KHONG_BINH_THUONG) {
        setStep(3);
      }
      return;
    }

    // Finalize compiled dates back to model record
    const finalRecord: HealthRecord = {
      ...record,
      NGAY_SINH: compileDatetimeField(birthDateVals.date, birthDateVals.time),
      NGAY_VAO: compileDatetimeField(examDateVals.date, examDateVals.time),
      NGAY_CAP_CCCD: compileDateField(cccdIssueDate),
      updatedAt: new Date().toISOString()
    };

    onSave(finalRecord);
  };

  // Helper values for completion bar
  const getFieldsCompletedCount = () => {
    let count = 0;
    const coreFields: (keyof HealthRecord)[] = [
      "HO_TEN", "SO_CCCD", "DIA_CHI", "DIEN_THOAI", "CHIEU_CAO", 
      "CAN_NANG", "MACH", "HUYET_AP", "KET_LUAN_LOAI_SUC_KHOE"
    ];
    coreFields.forEach(f => {
      if (record[f] && String(record[f]).trim() !== "") count++;
    });
    if (birthDateVals.date) count++;
    return count;
  };

  const completionPercentage = Math.round((getFieldsCompletedCount() / 10) * 100);

  // Digital generation tools
  const triggerAutoSign = (field: "CKS_NGUOI_KHAM" | "CKS_NGUOI_KET_LUAN" | "CKS_LANH_DAO" | "CKS_BENH_VIEN") => {
    let name = "";
    if (field === "CKS_NGUOI_KHAM") name = record.HO_TEN ? record.HO_TEN.replace(/\s+/g, "").toUpperCase() : "PATIENT";
    else if (field === "CKS_NGUOI_KET_LUAN") name = "DOCTOR_APPROVED";
    else if (field === "CKS_LANH_DAO") name = "LEADER_APPROVED";
    else name = "HOSPITALSEAL";

    const signature = `CKS_${name}_MD5_${Math.random().toString(16).substring(2, 10).toUpperCase()}_APPROVED`;
    handleChange(field, signature);
  };

  const handleSmartCASuccess = (updated: HealthRecord) => {
    setRecord(updated);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6">
      {/* Header and top meta info */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <PenTool className="w-5 h-5 text-blue-600" />
            {isEditing ? `Hiệu chỉnh hồ sơ: ${record.HO_TEN}` : "Tạo Hợp đồng / Hồ sơ sức khỏe mới"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Mã lượt khám: <span className="font-mono font-bold text-slate-800 bg-slate-100 py-0.5 px-1.5 rounded">{record.MA_LK}</span>
          </p>
        </div>

        <div className="flex flex-col items-end w-full md:w-auto">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-450 font-medium">Độ hoàn thiện thông tin cốt lõi:</span>
            <span className="text-xs font-bold text-slate-800">{completionPercentage}%</span>
          </div>
          <div className="w-full md:w-36 bg-slate-100 rounded-full h-2">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step Progress indicators */}
      <div className="mb-6 overflow-x-auto pb-2">
        <div className="flex justify-between min-w-[650px] gap-2 px-1">
          {[
            { step: 1, label: "Hành chính", icon: User },
            { step: 2, label: "Cơ sở Y tế", icon: FileCode },
            { step: 3, label: "Tiền sử & Thể lực", icon: Heart },
            { step: 4, label: "Khám lâm sàng", icon: Stethoscope },
            { step: 5, label: "Cận lâm sàng", icon: Stethoscope },
            { step: 6, label: "Kết luận & Ký", icon: ShieldCheck }
          ].map((item) => (
            <button
              key={item.step}
              onClick={() => setStep(item.step)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all border outline-none cursor-pointer ${
                step === item.step
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : step > item.step
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50/50"
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              <span>{item.step}. {item.label}</span>
              {step > item.step && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>
          ))}
        </div>
      </div>

      {/* Main wizard cardboard containing sections */}
      <div className="bg-white border text-left border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 min-h-[420px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
          >
            {/* STEP 1: Hành chính */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="border-b pb-2 mb-4">
                  <h3 className="text-base font-bold text-slate-800">1. Thông tin hành chính bệnh nhân</h3>
                  <p className="text-xs text-slate-500">Thông tin cá nhân được ghi nhận theo căn cước công dân hoặc BHYT.</p>
                </div>

                {/* Bộ Chọn Mẫu Tờ Khai Sức Khỏe theo Tuổi */}
                <div className="bg-blue-50/50 p-4 border border-blue-100 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div>
                    <span className="font-bold text-slate-800 text-sm block">Chọn mẫu tờ khai khám sức khỏe</span>
                    <span className="text-slate-500 text-[11px]">Hệ thống hỗ trợ tự động định hình nội dung khám phù hợp với độ tuổi.</span>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        handleChange("KIEU_MAU", "UNDER_18");
                        handleChange("KHAM_NHI_KHOA", 1);
                        handleChange("KHAM_NOI_KHOA", 0);
                        handleChange("KHAM_NGOI_KHOA", 0);
                        handleChange("KHAM_DA_LIEU", 0);
                        handleChange("KHAM_SAN_PHU_KHOA", 0);
                      }}
                      className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        record.KIEU_MAU !== "OVER_19"
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      Mẫu dưới 18 tuổi (Học sinh/Trẻ em)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleChange("KIEU_MAU", "OVER_19");
                        handleChange("KHAM_NHI_KHOA", 0);
                        handleChange("KHAM_NOI_KHOA", 1);
                        handleChange("KHAM_NGOI_KHOA", 1);
                        handleChange("KHAM_DA_LIEU", 1);
                        handleChange("KHAM_SAN_PHU_KHOA", record.GIOI_TINH === 2 ? 1 : 0);
                      }}
                      className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        record.KIEU_MAU === "OVER_19"
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      Mẫu từ 18 tuổi trở lên (Công đoàn/Người lớn)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* HO_TEN */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                      Họ và tên người bệnh <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={record.HO_TEN}
                      onChange={(e) => handleChange("HO_TEN", e.target.value)}
                      placeholder="NGUYỄN VĂN A"
                      className={`w-full text-sm py-2 px-3 border rounded-lg focus:outline-none focus:ring-2 uppercase ${
                        errors.HO_TEN ? "border-red-350 focus:ring-red-200" : "border-slate-300 focus:ring-blue-100"
                      }`}
                      id="input-ho-ten"
                    />
                    {errors.HO_TEN && <p className="text-red-500 text-[11px] mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.HO_TEN}</p>}
                  </div>

                  {/* GIOI_TINH */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Giới tính <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={record.GIOI_TINH}
                      onChange={(e) => {
                        const gender = parseInt(e.target.value);
                        handleChange("GIOI_TINH", gender);
                        if (record.KIEU_MAU === "OVER_19") {
                          handleChange("KHAM_SAN_PHU_KHOA", gender === 2 ? 1 : 0);
                        }
                      }}
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                      id="input-gioi-tinh"
                    >
                      <option value={1}>Nam (mã 1)</option>
                      <option value={2}>Nữ (mã 2)</option>
                      <option value={3}>Chưa xác định (mã 3)</option>
                    </select>
                  </div>

                  {/* NGAY_SINH (Custom components translating to yyyyMMddHHmm) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Ngày sinh trên BHYT <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={birthDateVals.date}
                        onChange={(e) => {
                          const newD = { ...birthDateVals, date: e.target.value };
                          setBirthDateVals(newD);
                          handleChange("NGAY_SINH", compileDatetimeField(newD.date, newD.time));
                          
                          // Smart Template Auto-selector based on Birth Year!
                          if (newD.date) {
                            const birthYear = new Date(newD.date).getFullYear();
                            const currentYear = new Date().getFullYear();
                            const age = currentYear - birthYear;
                            if (age >= 18 && record.KIEU_MAU !== "OVER_19") {
                              handleChange("KIEU_MAU", "OVER_19");
                              handleChange("KHAM_NHI_KHOA", 0);
                              handleChange("KHAM_NOI_KHOA", 1);
                              handleChange("KHAM_NGOI_KHOA", 1);
                              handleChange("KHAM_DA_LIEU", 1);
                              handleChange("KHAM_SAN_PHU_KHOA", record.GIOI_TINH === 2 ? 1 : 0);
                            } else if (age < 18 && record.KIEU_MAU !== "UNDER_18") {
                              handleChange("KIEU_MAU", "UNDER_18");
                              handleChange("KHAM_NHI_KHOA", 1);
                              handleChange("KHAM_NOI_KHOA", 0);
                              handleChange("KHAM_NGOI_KHOA", 0);
                              handleChange("KHAM_DA_LIEU", 0);
                              handleChange("KHAM_SAN_PHU_KHOA", 0);
                            }
                          }
                        }}
                        className={`flex-1 text-sm py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                          errors.NGAY_SINH ? "border-red-300" : ""
                        }`}
                        id="input-ngay-sinh"
                      />
                      <input
                        type="time"
                        value={birthDateVals.time}
                        onChange={(e) => {
                          const newD = { ...birthDateVals, time: e.target.value };
                          setBirthDateVals(newD);
                          handleChange("NGAY_SINH", compileDatetimeField(newD.date, newD.time));
                        }}
                        className="w-28 text-sm py-2 px-3 border border-slate-300 rounded-lg focus:outline-none"
                      />
                    </div>
                    <span className="text-[10px] text-slate-450 mt-1 block">
                      Lưu ý: Hệ thống sẽ tự kiểm tra để gợi ý mẫu tờ khai thích hợp nếu thay đổi năm sinh. Mặc định giờ: 00:00
                    </span>
                    {errors.NGAY_SINH && <p className="text-red-500 text-[11px] mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.NGAY_SINH}</p>}
                  </div>

                  {/* SO_CCCD */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Số CMND / CCCD / Định danh <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      value={record.SO_CCCD}
                      onChange={(e) => handleChange("SO_CCCD", e.target.value.replace(/\s+/g, ""))}
                      placeholder="Ghi 12 số định danh hoặc số căn cước"
                      className={`w-full text-sm py-2 px-3 border rounded-lg focus:outline-none focus:ring-2 font-mono ${
                        errors.SO_CCCD ? "border-red-350 focus:ring-red-100" : "border-slate-300 focus:ring-blue-100"
                      }`}
                      id="input-so-cccd"
                    />
                    {errors.SO_CCCD && <p className="text-red-500 text-[11px] mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.SO_CCCD}</p>}
                  </div>

                  {/* NGUOI_GIAM_HO */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Người giám hộ (Nếu là trẻ dưới 18 tuổi)
                    </label>
                    <input
                      type="text"
                      value={record.NGUOI_GIAM_HO}
                      onChange={(e) => handleChange("NGUOI_GIAM_HO", e.target.value)}
                      placeholder="Họ và tên người giám hộ"
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:outline-none"
                    />
                  </div>

                  {/* SO_CCCD_NGUOI_GIAM_HO */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      CCCD Người giám hộ (nếu có)
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      value={record.SO_CCCD_NGUOI_GIAM_HO}
                      onChange={(e) => handleChange("SO_CCCD_NGUOI_GIAM_HO", e.target.value.replace(/\s+/g, ""))}
                      placeholder="Số căn cước người giám hộ"
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:outline-none font-mono"
                    />
                  </div>

                  {/* NGAY_CAP_CCCD */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Ngày cấp giấy tờ (yyyyMMdd)
                    </label>
                    <input
                      type="date"
                      value={cccdIssueDate}
                      onChange={(e) => {
                        setCccdIssueDate(e.target.value);
                        handleChange("NGAY_CAP_CCCD", compileDateField(e.target.value));
                      }}
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  {/* NOI_CAP_CCCD */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Nơi cấp (Cục QLHC hoặc Tỉnh thành)
                    </label>
                    <input
                      type="text"
                      value={record.NOI_CAP_CCCD}
                      onChange={(e) => handleChange("NOI_CAP_CCCD", e.target.value)}
                      placeholder="Ví dụ: Cục Cảnh sát QLHC về trật tự xã hội"
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:outline-none"
                    />
                  </div>

                  {/* DIA_CHI */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Chỗ ở hiện tại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={record.DIA_CHI}
                      onChange={(e) => handleChange("DIA_CHI", e.target.value)}
                      placeholder="Số nhà, đường, thôn xóm, xã phường, quận huyện, tỉnh thành"
                      className={`w-full text-sm py-2 px-3 border rounded-lg focus:outline-none focus:ring-2 ${
                        errors.DIA_CHI ? "border-red-350" : "border-slate-300"
                      }`}
                    />
                  </div>

                  {/* Tích hợp Bộ chọn Địa danh Hành chính 2 cấp (Tỉnh & Xã) */}
                  <div className="md:col-span-2 border border-slate-150 bg-slate-50/50 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center border-b pb-2 mb-2">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-blue-600 animate-pulse" />
                        Địa danh hành chính (Chính quyền 2 cấp)
                      </span>
                      {record.MATINH_CU_TRU && record.MAXA_CU_TRU && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          {VIETNAM_ADMINISTRATIVE_DIVISIONS.find(p => p.code === record.MATINH_CU_TRU)?.communes.find(c => c.code === record.MAXA_CU_TRU)?.name || "Đã chọn"} - {VIETNAM_ADMINISTRATIVE_DIVISIONS.find(p => p.code === record.MATINH_CU_TRU)?.name || "Đã cập nhật"}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Cột 1: Tìm kiếm nhanh hợp nhất */}
                      <div className="relative">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          1. Tìm nhanh theo tên Xã hoặc Tỉnh
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={addressSearch}
                            onChange={(e) => {
                              setAddressSearch(e.target.value);
                              setIsAddressDropdownOpen(true);
                            }}
                            onFocus={() => setIsAddressDropdownOpen(true)}
                            placeholder="Gõ tìm 'Tràng Tiền', 'Bến Thành', ..."
                            className="w-full text-sm py-2 pl-9 pr-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                          />
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          {addressSearch && (
                            <button
                              type="button"
                              onClick={() => {
                                setAddressSearch("");
                                setIsAddressDropdownOpen(false);
                              }}
                              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                            >
                              Xóa
                            </button>
                          )}
                        </div>

                        {/* Listbox Dropdown */}
                        <AnimatePresence>
                          {isAddressDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.98, y: -4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.98, y: -4 }}
                              className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto"
                            >
                              <div className="p-1">
                                {getFlatDivisionsList()
                                  .filter(item => {
                                    const q = addressSearch.toLowerCase();
                                    return item.communeName.toLowerCase().includes(q) || item.provinceName.toLowerCase().includes(q);
                                  })
                                  .slice(0, 50) // limit list for performance
                                  .map((item, idx) => (
                                    <div
                                      key={`${item.provinceCode}-${item.communeCode}-${idx}`}
                                      onClick={() => {
                                        handleChange("MATINH_CU_TRU", item.provinceCode);
                                        handleChange("MAXA_CU_TRU", item.communeCode);
                                        
                                        // Isolate street/house prefix and compile pristine suggestions
                                        const streetPrefix = cleanStreetPrefix(record.DIA_CHI, record.MATINH_CU_TRU, record.MAXA_CU_TRU);
                                        const suggestedAddress = streetPrefix 
                                          ? `${streetPrefix}, ${item.communeName.trim()}, ${item.provinceName.trim()}` 
                                          : `${item.communeName.trim()}, ${item.provinceName.trim()}`;
                                        
                                        handleChange("DIA_CHI", suggestedAddress);

                                        setAddressSearch(`${item.communeName} - ${item.provinceName}`);
                                        setIsAddressDropdownOpen(false);
                                      }}
                                      className="text-xs text-left px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors flex flex-col gap-0.5 border-b border-slate-50 last:border-0"
                                    >
                                      <div className="flex justify-between items-center">
                                        <span className="font-bold text-slate-800">{item.communeName}</span>
                                        <span className="text-[10px] bg-blue-50 text-blue-700 font-mono px-1 py-0.2 rounded font-semibold">Xã: {item.communeCode}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-slate-500">{item.provinceName}</span>
                                        <span className="text-[9px] text-slate-400 font-mono">Tỉnh: {item.provinceCode}</span>
                                      </div>
                                    </div>
                                  ))
                                }
                                {getFlatDivisionsList().filter(item => {
                                  const q = addressSearch.toLowerCase();
                                  return item.communeName.toLowerCase().includes(q) || item.provinceName.toLowerCase().includes(q);
                                }).length === 0 && (
                                  <p className="text-xs text-slate-450 p-3 italic text-center">Không tìm thấy địa phương nào khớp.</p>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Cột 2: Chọn thủ công Dual Dropdown / Listboxes */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Chọn Tỉnh / Thành
                          </label>
                          <select
                            value={record.MATINH_CU_TRU}
                            onChange={(e) => {
                              const pCode = e.target.value;
                              handleChange("MATINH_CU_TRU", pCode);
                              
                              const streetPrefix = cleanStreetPrefix(record.DIA_CHI, record.MATINH_CU_TRU, record.MAXA_CU_TRU);
                              const matchedProv = VIETNAM_ADMINISTRATIVE_DIVISIONS.find(p => p.code === pCode);
                              
                              if (matchedProv && matchedProv.communes.length > 0) {
                                const firstComm = matchedProv.communes[0];
                                handleChange("MAXA_CU_TRU", firstComm.code);
                                setAddressSearch(`${firstComm.name} - ${matchedProv.name}`);
                                
                                const suggestedAddress = streetPrefix 
                                  ? `${streetPrefix}, ${firstComm.name.trim()}, ${matchedProv.name.trim()}` 
                                  : `${firstComm.name.trim()}, ${matchedProv.name.trim()}`;
                                handleChange("DIA_CHI", suggestedAddress);
                              } else {
                                handleChange("MAXA_CU_TRU", "");
                                setAddressSearch("");
                                handleChange("DIA_CHI", streetPrefix);
                              }
                            }}
                            className="w-full text-xs py-2 px-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium text-slate-800 cursor-pointer"
                          >
                            <option value="">-- Chọn Tỉnh --</option>
                            {VIETNAM_ADMINISTRATIVE_DIVISIONS.map(p => (
                              <option key={p.code} value={p.code}>
                                {p.name} ({p.code})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Chọn Xã / Phường
                          </label>
                          <select
                            value={record.MAXA_CU_TRU}
                            disabled={!record.MATINH_CU_TRU}
                            onChange={(e) => {
                              const xCode = e.target.value;
                              handleChange("MAXA_CU_TRU", xCode);

                              const streetPrefix = cleanStreetPrefix(record.DIA_CHI, record.MATINH_CU_TRU, record.MAXA_CU_TRU);
                              const parsedP = VIETNAM_ADMINISTRATIVE_DIVISIONS.find(p => p.code === record.MATINH_CU_TRU);
                              const parsedX = parsedP?.communes.find(c => c.code === xCode);
                              
                              if (parsedP && parsedX) {
                                setAddressSearch(`${parsedX.name} - ${parsedP.name}`);
                                const suggestedAddress = streetPrefix 
                                  ? `${streetPrefix}, ${parsedX.name.trim()}, ${parsedP.name.trim()}` 
                                  : `${parsedX.name.trim()}, ${parsedP.name.trim()}`;
                                handleChange("DIA_CHI", suggestedAddress);
                              }
                            }}
                            className="w-full text-xs py-2 px-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
                          >
                            <option value="">-- Chọn Xã --</option>
                            {record.MATINH_CU_TRU &&
                              VIETNAM_ADMINISTRATIVE_DIVISIONS.find(p => p.code === record.MATINH_CU_TRU)?.communes.map(c => (
                                <option key={c.code} value={c.code}>
                                  {c.name} ({c.code})
                                </option>
                              ))
                            }
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Hiển thị Mã số hành chính đã xuất theo Thông tư 17 để phục vụ tích hợp quốc gia */}
                    <div className="flex gap-4 items-center bg-slate-100 p-2 rounded-lg text-[10px] font-mono text-slate-500 justify-center">
                      <span>Mã Tỉnh (TT 10): <strong className="text-slate-700 bg-white px-1.5 py-0.5 rounded border">{record.MATINH_CU_TRU || "---"}</strong></span>
                      <span>Mã Xã (TT 11): <strong className="text-slate-700 bg-white px-1.5 py-0.5 rounded border">{record.MAXA_CU_TRU || "---"}</strong></span>
                    </div>
                  </div>

                  {/* DIEN_THOAI */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Điện thoại liên lạc
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      value={record.DIEN_THOAI}
                      onChange={(e) => handleChange("DIEN_THOAI", e.target.value.replace(/[^\d+]/g, ""))}
                      placeholder="Số di động của bệnh nhân/người thân"
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:outline-none font-mono"
                    />
                  </div>

                  {/* LY_DO_VV */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Lý do khám sức khỏe
                    </label>
                    <input
                      type="text"
                      value={record.LY_DO_VV}
                      onChange={(e) => handleChange("LY_DO_VV", e.target.value)}
                      placeholder="Khám định kỳ, Xin việc làm..."
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>

                {/* Các trường nghiệp vụ của Mẫu từ 18 tuổi trở lên */}
                {record.KIEU_MAU === "OVER_19" && (
                  <div className="border bg-slate-50/30 border-slate-200/80 p-5 rounded-2xl space-y-4 shadow-xs mt-6">
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-l-3 border-blue-600 pl-2.5 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      Thông tin nghề nghiệp & lịch sử công tác (Dành cho người từ 18 tuổi trở lên)
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* MA_NGHE_NGHIEP */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                          Mã nghề nghiệp (Thông tư 17)
                        </label>
                        <select
                          value={record.MA_NGHE_NGHIEP || "00"}
                          onChange={(e) => handleChange("MA_NGHE_NGHIEP", e.target.value)}
                          className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg bg-white"
                        >
                          <option value="00">Mã "00" - Chưa có thông tin / Thất nghiệp</option>
                          <option value="01">Mã "01" - Cán bộ hành chính công sở</option>
                          <option value="02">Mã "02" - Kỹ sư, chuyên gia công nghệ</option>
                          <option value="03">Mã "03" - Công nhân sản xuất công nghiệp nặng</option>
                          <option value="04">Mã "04" - Người làm nông, lâm, ngư nghiệp</option>
                          <option value="05">Mã "05" - Học sinh, sinh viên đại học/cao đẳng</option>
                          <option value="06">Mã "06" - Lực lượng vũ trang / Công an / Quân đội</option>
                          <option value="07">Mã "07" - Nhân viên y tế phụ trợ</option>
                          <option value="08">Mã "08" - Các ngành nghề dịch vụ khác</option>
                        </select>
                      </div>

                      {/* NOI_CONG_TAC_HIEN_TAI */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Nơi công tác, học tập hiện tại
                        </label>
                        <input
                          type="text"
                          value={record.NOI_CONG_TAC_HIEN_TAI || ""}
                          onChange={(e) => handleChange("NOI_CONG_TAC_HIEN_TAI", e.target.value)}
                          placeholder="Ví dụ: Công ty TNHH Phần mềm ABC"
                          className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:outline-none"
                        />
                      </div>

                      {/* NGAY_BAT_DAU_LAM_VIEC_HIEN_TAI */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Ngày bắt đầu làm việc hiện tại
                        </label>
                        <input
                          type="date"
                          value={record.NGAY_BAT_DAU_LAM_VIEC_HIEN_TAI ? parseDateField(record.NGAY_BAT_DAU_LAM_VIEC_HIEN_TAI) : ""}
                          onChange={(e) => handleChange("NGAY_BAT_DAU_LAM_VIEC_HIEN_TAI", compileDateField(e.target.value))}
                          className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:outline-none font-mono"
                        />
                      </div>

                      {/* NOI_CONG_TAC_TRUOC_DAY */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Nghề nghiệp hoặc công việc trước đây (nếu có)
                        </label>
                        <input
                          type="text"
                          value={record.NOI_CONG_TAC_TRUOC_DAY || ""}
                          onChange={(e) => handleChange("NOI_CONG_TAC_TRUOC_DAY", e.target.value)}
                          placeholder="Nhập nghề nghiệp hoặc đơn vị công tác cũ"
                          className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:outline-none"
                        />
                      </div>

                      {/* NGAY_BAT_DAU_LAM_VIEC_TRUOC_DAY */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Ngày bắt đầu làm công việc cũ đó
                        </label>
                        <input
                          type="date"
                          value={record.NGAY_BAT_DAU_LAM_VIEC_TRUOC_DAY ? parseDateField(record.NGAY_BAT_DAU_LAM_VIEC_TRUOC_DAY) : ""}
                          onChange={(e) => handleChange("NGAY_BAT_DAU_LAM_VIEC_TRUOC_DAY", compileDateField(e.target.value))}
                          className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:outline-none font-mono"
                        />
                      </div>

                      {/* NGAY_KET_THUC_LAM_VIEC_TRUOC_DAY */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Ngày kết thúc làm công việc cũ đó
                        </label>
                        <input
                          type="date"
                          value={record.NGAY_KET_THUC_LAM_VIEC_TRUOC_DAY ? parseDateField(record.NGAY_KET_THUC_LAM_VIEC_TRUOC_DAY) : ""}
                          onChange={(e) => handleChange("NGAY_KET_THUC_LAM_VIEC_TRUOC_DAY", compileDateField(e.target.value))}
                          className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Cơ sở y tế & Lượt khám */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="border-b pb-2 mb-4">
                  <h3 className="text-base font-bold text-slate-800">2. Thông tin chung về cơ sở khám sức khỏe</h3>
                  <p className="text-xs text-slate-500">Khai báo mã cơ sở y tế chịu trách nhiệm đánh giá kiểm tra sức khỏe.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* MA_CSKCB */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Mã cơ sở KBCB (05 ký tự số)
                    </label>
                    <input
                      type="text"
                      maxLength={5}
                      value={record.MA_CSKCB}
                      onChange={(e) => handleChange("MA_CSKCB", e.target.value.replace(/\D/g, ""))}
                      placeholder="Ví dụ: 79001"
                      className={`w-full text-sm py-2 px-3 border rounded-lg focus:outline-none font-mono ${
                        errors.MA_CSKCB ? "border-red-301" : "border-slate-300"
                      }`}
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Mã cơ sở do cơ quan có thẩm quyền cấp.</span>
                    {errors.MA_CSKCB && <p className="text-red-500 text-[11px] mt-1">{errors.MA_CSKCB}</p>}
                  </div>

                  {/* MA_GTIN_CSKCB (Tên cơ sở khám chữa bệnh) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Tên cơ sở khám chữa bệnh <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={255}
                      value={record.MA_GTIN_CSKCB}
                      onChange={(e) => handleChange("MA_GTIN_CSKCB", e.target.value)}
                      placeholder="Ví dụ: Bệnh viện Đa khoa Quận 1 hoặc Phòng khám đa khoa..."
                      className={`w-full text-sm py-2 px-3 border rounded-lg focus:outline-none ${
                        errors.MA_GTIN_CSKCB ? "border-red-305" : "border-slate-300"
                      }`}
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Tên hiển thị chính thức của đơn vị y tế trên hồ sơ.</span>
                    {errors.MA_GTIN_CSKCB && <p className="text-red-500 text-[11px] mt-1">{errors.MA_GTIN_CSKCB}</p>}
                  </div>

                  {/* MA_LK */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1 text-slate-500">
                      Mã Lượt khám (Mã đợt điều trị duy nhất)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={record.MA_LK}
                      className="w-full text-sm py-2 px-3 border border-slate-200 bg-slate-50 rounded-lg focus:outline-none font-mono text-slate-550"
                    />
                    <span className="text-[10px] italic text-slate-450 mt-1 block">Mã này được hệ thống tạo tự động để đảm bảo tính duy nhất.</span>
                  </div>

                  {/* NGAY_VAO */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Thời điểm khám sức khỏe (yyyyMMddHHmm)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={examDateVals.date}
                        onChange={(e) => {
                          const newD = { ...examDateVals, date: e.target.value };
                          setExamDateVals(newD);
                          handleChange("NGAY_VAO", compileDatetimeField(newD.date, newD.time));
                        }}
                        className="flex-1 text-sm py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                      <input
                        type="time"
                        value={examDateVals.time}
                        onChange={(e) => {
                          const newD = { ...examDateVals, time: e.target.value };
                          setExamDateVals(newD);
                          handleChange("NGAY_VAO", compileDatetimeField(newD.date, newD.time));
                        }}
                        className="w-28 text-sm py-2 px-3 border border-slate-300 rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Tiền sử & Thể lực */}
            {step === 3 && (
              <div className="space-y-6">
                {/* Family hist */}
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <h3 className="text-base font-bold text-slate-800">3. Tiền sử bệnh lý gia đình & cá nhân</h3>
                    <p className="text-xs text-slate-500">Ghi chép các bệnh truyền nhiễm, di truyền, dị ứng, vắc xin và các chỉ số thể lực cơ bản.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Có ai trong gia đình mắc bệnh không?
                      </label>
                      <select
                        value={record.TSGD_MAC_BENH}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          handleChange("TSGD_MAC_BENH", val);
                          if (val === 0) handleChange("TSGD_TEN_BENH", "");
                        }}
                        className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value={0}>Mã "0": Không</option>
                        <option value={1}>Mã "1": Có</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Mã ICD-10 bệnh gia đình mắc (Tối đa 12 mã, phân tách bằng dấu ";")
                      </label>
                      <input
                        type="text"
                        disabled={record.TSGD_MAC_BENH === 0}
                        value={record.TSGD_TEN_BENH}
                        onChange={(e) => handleChange("TSGD_TEN_BENH", e.target.value)}
                        placeholder="Ví dụ: I10; E11 (Tăng huyết áp; Đái tháo đường)"
                        className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg disabled:bg-slate-100 uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Personal & Obstetric / Sickness History */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Cột 1: Sản khoa hoặc Sản phụ khoa người lớn */}
                  {record.KIEU_MAU === "OVER_19" ? (
                    <div className="border p-4 rounded-xl space-y-3 bg-rose-50/10 border-rose-200">
                      <h4 className="font-bold text-xs uppercase text-rose-800 border-b pb-1 flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-rose-600" />
                        A. Tiền sử Sản Phụ Khoa người lớn
                      </h4>
                      
                      <div className="grid grid-cols-1 gap-2.5 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-slate-600 font-medium mb-1">Tuổi bắt đầu có kinh</label>
                            <input
                              type="number"
                              value={record.CO_KINH_NGUYET_NAM_BAO_NHIEU_TUOI || ""}
                              onChange={(e) => handleChange("CO_KINH_NGUYET_NAM_BAO_NHIEU_TUOI", e.target.value ? parseInt(e.target.value) : "")}
                              placeholder="Ví dụ: 13"
                              className="w-full text-sm py-1.5 px-2 border rounded bg-white text-center"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-600 font-medium mb-1">Tính chất kinh nguyệt</label>
                            <select
                              value={record.TINH_CHAT_KINH_NGUYET ?? 1}
                              onChange={(e) => handleChange("TINH_CHAT_KINH_NGUYET", parseInt(e.target.value))}
                              className="w-full text-xs py-1.5 px-2 border rounded bg-white"
                            >
                              <option value={1}>1: Đều đặn</option>
                              <option value={0}>0: Không đều (Rối loạn)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] text-slate-600 font-medium mb-1">Chu kỳ (ngày)</label>
                            <input
                              type="text"
                              value={record.CHU_KY_KINH || ""}
                              onChange={(e) => handleChange("CHU_KY_KINH", e.target.value)}
                              placeholder="28-30"
                              className="w-full text-xs py-1.5 px-2 border rounded bg-white text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-600 font-medium mb-1">Lượng kinh</label>
                            <input
                              type="text"
                              value={record.LUONG_KINH || ""}
                              onChange={(e) => handleChange("LUONG_KINH", e.target.value)}
                              placeholder="Vừa phải"
                              className="w-full text-xs py-1.5 px-2 border rounded bg-white text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-600 font-medium mb-1">Đau bụng kinh</label>
                            <select
                              value={record.DAU_BUNG_KINH ?? 0}
                              onChange={(e) => handleChange("DAU_BUNG_KINH", parseInt(e.target.value))}
                              className="w-full text-[11px] py-1.5 px-1 border rounded bg-white text-center"
                            >
                              <option value={0}>0: Không</option>
                              <option value={1}>1: Có đau</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 border-t pt-2">
                          <div>
                            <label className="block text-slate-600 font-medium mb-1">Đã lập gia đình?</label>
                            <select
                              value={record.DA_LAP_GIA_DINH ?? 0}
                              onChange={(e) => handleChange("DA_LAP_GIA_DINH", parseInt(e.target.value))}
                              className="w-full text-xs py-1.5 px-2 border rounded bg-white"
                            >
                              <option value={0}>0: Chưa lập gia đình</option>
                              <option value={1}>1: Đã lập gia đình</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-600 font-medium mb-1">Số lần mổ SPK</label>
                            <input
                              type="number"
                              value={record.SO_LAN_MO_SAN_PHU_KHOA ?? 0}
                              onChange={(e) => handleChange("SO_LAN_MO_SAN_PHU_KHOA", parseInt(e.target.value) || 0)}
                              className="w-full text-sm py-1.5 px-2 border rounded bg-white text-center font-mono font-bold text-slate-700"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-slate-600 font-medium mb-1">Chỉ số PARA (Sinh-Sớm-Sảy-Sống)</label>
                            <input
                              type="text"
                              maxLength={4}
                              value={record.PARA || ""}
                              onChange={(e) => handleChange("PARA", e.target.value.replace(/\D/g, ""))}
                              placeholder="VD: 2002"
                              className="w-full text-sm py-1.5 px-2 border rounded bg-white text-center font-mono font-bold tracking-widest text-emerald-800"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-600 font-medium mb-1">Tránh thai (BPTT)</label>
                            <select
                              value={record.CO_BPTT_KHONG ?? 0}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                handleChange("CO_BPTT_KHONG", val);
                                if (val === 0) handleChange("BIEN_PHAP_TRANH_THAI", "");
                              }}
                              className="w-full text-xs py-1.5 px-2 border rounded bg-white"
                            >
                              <option value={0}>0: Không sử dụng</option>
                              <option value={1}>1: Có sử dụng</option>
                            </select>
                          </div>
                        </div>

                        {record.CO_BPTT_KHONG === 1 && (
                          <div>
                            <label className="block text-slate-500 mb-1">Tên biện pháp tránh thai đang dùng</label>
                            <input
                              type="text"
                              value={record.BIEN_PHAP_TRANH_THAI || ""}
                              onChange={(e) => handleChange("BIEN_PHAP_TRANH_THAI", e.target.value)}
                              placeholder="Đặt vòng, Bao cao su, Thuốc tránh thai..."
                              className="w-full p-1.5 border rounded"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="border p-4 rounded-xl space-y-3 bg-slate-50/20">
                      <h4 className="font-bold text-xs uppercase text-slate-600 border-b pb-1">A. Sản khoa nhi đồng (Nếu có)</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Trạng thái sản khoa</label>
                          <select
                            value={record.SAN_KHOA}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              handleChange("SAN_KHOA", val);
                              if (val === 1) handleChange("BENH_GAY_RA_SAN_KHOA_KHONG_BINH_THUONG", "");
                            }}
                            className="w-full text-sm py-2 px-3 border border-slate-300 bg-white rounded-lg"
                          >
                            <option value={1}>Mã "1": Bình thường</option>
                            <option value={0}>Mã "0": Bất thường</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Bệnh sản khoa (ICD-10)</label>
                          <input
                            type="text"
                            disabled={record.SAN_KHOA === 1}
                            value={record.BENH_GAY_RA_SAN_KHOA_KHONG_BINH_THUONG}
                            onChange={(e) => handleChange("BENH_GAY_RA_SAN_KHOA_KHONG_BINH_THUONG", e.target.value)}
                            placeholder="Mã ICD-10 phân cách bằng ;"
                            className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg disabled:bg-slate-50 uppercase"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cột 2: Tiền sử bệnh bản thân & Bệnh nghề nghiệp */}
                  <div className="border p-4 rounded-xl space-y-4 bg-slate-50/20">
                    <h4 className="font-bold text-xs uppercase text-slate-600 border-b pb-1">
                      B. Tiền sử bệnh tật bản thân & gánh nặng bệnh lý
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Truyền nhiễm (Phát hiện)</label>
                          <select
                            value={record.MA_TSBT}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              handleChange("MA_TSBT", val);
                              if (val === 0) {
                                handleChange("TSBT_TEN_BENH", "");
                                handleChange("TSBT_NAM_PHAT_HIEN_BENH", "");
                              }
                            }}
                            className="w-full text-xs py-2 px-2 border border-slate-300 bg-white rounded-lg focus:outline-none"
                          >
                            <option value={0}>0: Không bệnh</option>
                            <option value={1}>1: Có bệnh truyền nhiễm</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Số mã ICD-10 truyền nhiễm</label>
                          <input
                            type="text"
                            disabled={record.MA_TSBT === 0}
                            value={record.TSBT_TEN_BENH}
                            onChange={(e) => handleChange("TSBT_TEN_BENH", e.target.value)}
                            placeholder="Mã ICD-10"
                            className="w-full text-xs py-2 px-2 border border-slate-300 rounded-lg disabled:bg-slate-50 uppercase focus:outline-none"
                          />
                        </div>
                      </div>

                      {record.KIEU_MAU === "OVER_19" && (
                        <div className="border-t pt-2.5 mt-1 space-y-3 bg-blue-50/20 p-2.5 rounded border border-blue-100 text-xs">
                          <span className="font-bold text-[11px] text-blue-700 block uppercase">Bệnh lý nghề nghiệp người lớn</span>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] text-slate-500 font-medium mb-1">Năm phát hiện bệnh bản thân</label>
                              <input
                                type="text"
                                maxLength={4}
                                value={record.TSBT_NAM_PHAT_HIEN_BENH || ""}
                                onChange={(e) => handleChange("TSBT_NAM_PHAT_HIEN_BENH", e.target.value.replace(/\D/g, ""))}
                                placeholder="Ví dụ: 2021"
                                className="w-full p-1.5 border rounded text-center font-mono"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] text-slate-500 font-medium mb-1">Năm phát hiện bệnh NN</label>
                              <input
                                type="text"
                                maxLength={4}
                                value={record.TSBT_NAM_PHAT_HIEN_BENH_NGHE_NGHIEP || ""}
                                onChange={(e) => handleChange("TSBT_NAM_PHAT_HIEN_BENH_NGHE_NGHIEP", e.target.value.replace(/\D/g, ""))}
                                placeholder="Ví dụ: 2023"
                                className="w-full p-1.5 border rounded text-center font-mono"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] text-slate-500 font-medium mb-1">Tên bệnh nghề nghiệp mắc phải</label>
                            <input
                              type="text"
                              value={record.TSBT_TEN_BENH_NGHE_NGHIEP || ""}
                              onChange={(e) => handleChange("TSBT_TEN_BENH_NGHE_NGHIEP", e.target.value)}
                              placeholder="Ví dụ: Bệnh bụi phổi silic, điếc nghề nghiệp..."
                              className="w-full p-1.5 border rounded"
                            />
                          </div>
                        </div>
                      )}

                      <div className="border-t pt-2.5">
                        <label className="block text-xs font-medium text-slate-600 mb-1">Đang điều trị bệnh?</label>
                        <select
                          value={record.CO_DANG_DIEU_TRI_BENH}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            handleChange("CO_DANG_DIEU_TRI_BENH", val);
                            if (val === 0) {
                              handleChange("TEN_BENH_DANG_DIEU_TRI", "");
                              handleChange("TEN_THUOC", "");
                            }
                          }}
                          className="w-full text-xs py-2 px-3 border border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-800"
                        >
                          <option value={0}>Mã "0": Không</option>
                          <option value={1}>Mã "1": Có</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Mã bệnh đ.trị</label>
                          <input
                            type="text"
                            disabled={record.CO_DANG_DIEU_TRI_BENH === 0}
                            value={record.TEN_BENH_DANG_DIEU_TRI}
                            onChange={(e) => handleChange("TEN_BENH_DANG_DIEU_TRI", e.target.value)}
                            placeholder="Mã ICD-10"
                            className="w-full text-xs py-1.5 px-2 border border-slate-300 rounded-lg disabled:bg-slate-50 uppercase font-mono font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Tên thuốc đang dùng</label>
                          <input
                            type="text"
                            disabled={record.CO_DANG_DIEU_TRI_BENH === 0}
                            value={record.TEN_THUOC}
                            onChange={(e) => handleChange("TEN_THUOC", e.target.value)}
                            placeholder="Biệt dược, hàm lượng"
                            className="w-full text-xs py-1.5 px-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vaccines Checklist */}
                <div className="border p-4 rounded-xl space-y-4 bg-slate-50/20">
                  <h4 className="font-bold text-xs uppercase text-slate-600 border-b pb-1">C. Lịch sử Tiêm Chủng (0: Không; 1: Được tiêm; 99: Không thông tin)</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {/* BCG */}
                    <div className="bg-white p-2 border rounded-lg">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Vắc xin BCG (Lao)</label>
                      <select 
                        value={record.TIEM_CHUNG_BCG} 
                        onChange={(e)=>handleChange("TIEM_CHUNG_BCG", parseInt(e.target.value))}
                        className="w-full text-xs font-mono p-1 border rounded bg-transparent"
                      >
                        <option value={1}>1: Được tiêm</option>
                        <option value={0}>0: Không tiêm</option>
                        <option value={99}>99: Không rõ lý lịch</option>
                      </select>
                    </div>

                    {/* DPT (BH_HG_UV) */}
                    <div className="bg-white p-2 border rounded-lg">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Vắc xin DPT (Bạch hầu...)</label>
                      <select 
                        value={record.TIEM_CHUNG_BH_HG_UV} 
                        onChange={(e)=>handleChange("TIEM_CHUNG_BH_HG_UV", parseInt(e.target.value))}
                        className="w-full text-xs font-mono p-1 border rounded bg-transparent"
                      >
                        <option value={1}>1: Được tiêm</option>
                        <option value={0}>0: Không tiêm</option>
                        <option value={99}>99: Không rõ lý lịch</option>
                      </select>
                    </div>

                    {/* Sởi */}
                    <div className="bg-white p-2 border rounded-lg">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Vắc xin Sởi</label>
                      <select 
                        value={record.TIEM_CHUNG_SOI} 
                        onChange={(e)=>handleChange("TIEM_CHUNG_SOI", parseInt(e.target.value))}
                        className="w-full text-xs font-mono p-1 border rounded bg-transparent"
                      >
                        <option value={1}>1: Được tiêm</option>
                        <option value={0}>0: Không tiêm</option>
                        <option value={99}>99: Không rõ lý lịch</option>
                      </select>
                    </div>

                    {/* Bại liệt */}
                    <div className="bg-white p-2 border rounded-lg">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Vắc xin Bại liệt</label>
                      <select 
                        value={record.TIEM_CHUNG_BAI_LIET} 
                        onChange={(e)=>handleChange("TIEM_CHUNG_BAI_LIET", parseInt(e.target.value))}
                        className="w-full text-xs font-mono p-1 border rounded bg-transparent"
                      >
                        <option value={1}>1: Được tiêm</option>
                        <option value={0}>0: Không tiêm</option>
                        <option value={99}>99: Không rõ lý lịch</option>
                      </select>
                    </div>

                    {/* VNNB */}
                    <div className="bg-white p-2 border rounded-lg">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Vắc xin VNNB B</label>
                      <select 
                        value={record.TIEM_CHUNG_VNNB_B} 
                        onChange={(e)=>handleChange("TIEM_CHUNG_VNNB_B", parseInt(e.target.value))}
                        className="w-full text-xs font-mono p-1 border rounded bg-transparent"
                      >
                        <option value={1}>1: Được tiêm</option>
                        <option value={0}>0: Không tiêm</option>
                        <option value={99}>99: Không rõ lý lịch</option>
                      </select>
                    </div>

                    {/* Hep B [Bắt buộc] */}
                    <div className="bg-white p-2 border border-blue-200 rounded-lg">
                      <label className="block text-[11px] font-bold text-blue-700 mb-1">Vắc xin Viêm gan B *</label>
                      <select 
                        value={record.TIEM_CHUNG_VGB} 
                        onChange={(e)=>handleChange("TIEM_CHUNG_VGB", parseInt(e.target.value))}
                        className="w-full text-xs font-mono p-1 border border-blue-205 rounded bg-blue-50/20"
                      >
                        <option value={1}>1: Được tiêm</option>
                        <option value={0}>0: Không tiêm</option>
                        <option value={99}>99: Không rõ lý lịch</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-white p-3 rounded-lg border">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Tiêm các vắc xin khác?</label>
                      <select
                        value={record.TIEM_CHUNG_CAC_LOAI_KHAC}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          handleChange("TIEM_CHUNG_CAC_LOAI_KHAC", val);
                          if (val === 0) handleChange("TIEM_CHUNG_VAC_XIN_KHAC", "");
                        }}
                        className="w-full text-xs py-1 px-2 border rounded bg-transparent"
                      >
                        <option value={0}>0: Không tiêm khác</option>
                        <option value={1}>1: Có tiêm chủng khác</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Tên cụ thể các loại vắc xin khác</label>
                      <input
                        type="text"
                        disabled={record.TIEM_CHUNG_CAC_LOAI_KHAC === 0}
                        value={record.TIEM_CHUNG_VAC_XIN_KHAC}
                        onChange={(e) => handleChange("TIEM_CHUNG_VAC_XIN_KHAC", e.target.value)}
                        placeholder="Ví dụ: Thủy đậu; Viêm màng não mũ..."
                        className="w-full text-xs py-1 px-2 border rounded disabled:bg-slate-50"
                      />
                    </div>
                  </div>
                </div>

                {/* PHYSICAL STATS WITH AUTO BMI CALCULATOR */}
                <div className="space-y-4">
                  <div className="border-b pb-1">
                    <h3 className="text-sm font-bold text-slate-705 uppercase tracking-wide">D. Khám Thể Lực</h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-650 uppercase mb-1">Chiều cao (cm)</label>
                      <input
                        type="text"
                        value={record.CHIEU_CAO}
                        onChange={(e) => {
                          // Allow numbers with max 2 decimals
                          const input = e.target.value;
                          if (/^\d*(\.\d{0,2})?$/.test(input) || input === "") {
                            handleChange("CHIEU_CAO", input);
                          }
                        }}
                        placeholder="Ví dụ: 172.5"
                        className="w-full text-sm py-2 text-center border border-slate-300 rounded-lg font-mono font-semibold text-slate-900"
                        id="form-chieu-cao"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-650 uppercase mb-1">Cân nặng (kg)</label>
                      <input
                        type="text"
                        value={record.CAN_NANG}
                        onChange={(e) => {
                          const input = e.target.value;
                          if (/^\d*(\.\d{0,2})?$/.test(input) || input === "") {
                            handleChange("CAN_NANG", input);
                          }
                        }}
                        placeholder="Ví dụ: 65"
                        className="w-full text-sm py-2 text-center border border-slate-300 rounded-lg font-mono font-semibold text-slate-900"
                        id="form-can-nang"
                      />
                    </div>

                    <div className="bg-blue-50/50 border border-blue-200 rounded-lg pt-1 pb-1">
                      <label className="block text-[11px] font-bold text-blue-700 uppercase mb-1 text-center">BMI Xếp Xử</label>
                      <div className="text-center font-mono font-black text-blue-900 text-lg py-1">
                        {record.CHI_SO_BMI || "---"}
                      </div>
                      <span className="text-[9px] text-blue-600 block text-center leading-none">Tự động tính</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-650 uppercase mb-1">Mạch (nhịp/phút)</label>
                      <input
                        type="text"
                        value={record.MACH}
                        onChange={(e) => handleChange("MACH", e.target.value)}
                        placeholder="Ví dụ: 75"
                        className="w-full text-sm py-2 text-center border border-slate-300 rounded-lg font-mono"
                      />
                    </div>

                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-[11px] font-bold text-slate-650 uppercase mb-1">Huyết áp (mmHg)</label>
                      <input
                        type="text"
                        value={record.HUYET_AP}
                        onChange={(e) => handleChange("HUYET_AP", e.target.value)}
                        placeholder="Ví dụ: 120/80"
                        className="w-full text-sm py-2 text-center border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Khám lâm sàng */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="border-b pb-2 mb-4">
                  <h3 className="text-base font-bold text-slate-800">4. Chẩn đoán lâm sàng các khoa chuyên khoa</h3>
                  <p className="text-xs text-slate-500">Kích hoạt và điền kết luận bộ phận khám mắt, tai mũi họng, răng hàm mặt & khám nhi khoa tương tự văn bản mẫu.</p>
                </div>

                {/* Clinical Specialties for Under-18 (Pediatrics) OR Over-18 (Internal/Surgery/Derma/Gynae) */}
                {record.KIEU_MAU === "OVER_19" ? (
                  <div className="space-y-4">
                    {/* 1. KHÁM NỘI KHOA */}
                    <div className="border p-4 rounded-xl space-y-4 bg-slate-50/20 border-slate-205">
                      <div className="flex justify-between items-center border-b pb-2">
                        <h4 className="font-bold text-sm uppercase text-blue-800 flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-blue-600" />
                          A1. Khám Nội Khoa chuyên sâu
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">Khám Nội:</span>
                          <select
                            value={record.KHAM_NOI_KHOA ?? 1}
                            onChange={(e) => handleChange("KHAM_NOI_KHOA", parseInt(e.target.value))}
                            className="text-xs p-1 border rounded bg-white font-medium"
                          >
                            <option value={1}>Có khám (Mã 1)</option>
                            <option value={0}>Không (Mã 0)</option>
                          </select>
                        </div>
                      </div>

                      {record.KHAM_NOI_KHOA !== 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block text-slate-600 font-medium mb-1">1. Tuần hoàn (Hệ tim mạch)</label>
                            <input
                              type="text"
                              value={record.NOI_KHOA_TUAN_HOAN || ""}
                              onChange={(e) => handleChange("NOI_KHOA_TUAN_HOAN", e.target.value)}
                              placeholder="Tiếng tim T1 T2 rõ, không âm bệnh lý"
                              className="w-full p-2 border rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 font-medium mb-1">2. Hô hấp (Hệ lồng ngực)</label>
                            <input
                              type="text"
                              value={record.NOI_KHOA_HO_HAP || ""}
                              onChange={(e) => handleChange("NOI_KHOA_HO_HAP", e.target.value)}
                              placeholder="Rì rào phế nang hai phế trường rõ"
                              className="w-full p-2 border rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 font-medium mb-1">3. Tiêu hóa (Hệ thành bụng)</label>
                            <input
                              type="text"
                              value={record.NOI_KHOA_TIEU_HOA || ""}
                              onChange={(e) => handleChange("NOI_KHOA_TIEU_HOA", e.target.value)}
                              placeholder="Bụng mềm, không u cục, lách/gan không sờ thấy"
                              className="w-full p-2 border rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 font-medium mb-1">4. Thận - Tiết Niệu (Hố thận)</label>
                            <input
                              type="text"
                              value={record.NOI_KHOA_THAN_TIETNIEU || ""}
                              onChange={(e) => handleChange("NOI_KHOA_THAN_TIETNIEU", e.target.value)}
                              placeholder="Nước tiểu trong, không phát hiện bệnh tiết niệu"
                              className="w-full p-2 border rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 font-medium mb-1">5. Cơ - Xương - Khớp</label>
                            <input
                              type="text"
                              value={record.NOI_KHOA_CO_XUONG_KHOP || ""}
                              onChange={(e) => handleChange("NOI_KHOA_CO_XUONG_KHOP", e.target.value)}
                              placeholder="Biên độ vận động khớp bình thường"
                              className="w-full p-2 border rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 font-medium mb-1">6. Thần kinh (Vận động/Phản xạ)</label>
                            <input
                              type="text"
                              value={record.NOI_KHOA_THAN_KINH || ""}
                              onChange={(e) => handleChange("NOI_KHOA_THAN_KINH", e.target.value)}
                              placeholder="Cảm giác bình thường, không liệt khu trú"
                              className="w-full p-2 border rounded"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-slate-600 font-medium mb-1">7. Tâm thần (Tinh thần/Trí tuệ)</label>
                            <input
                              type="text"
                              value={record.NOI_KHOA_TAM_THAN || ""}
                              onChange={(e) => handleChange("NOI_KHOA_TAM_THAN", e.target.value)}
                              placeholder="Tỉnh tá, tiếp xúc tốt, không hoang tưởng"
                              className="w-full p-2 border rounded"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2. KHÁM NGOẠI KHOA & DA LIỄU */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Khám Ngoại Khoa */}
                      <div className="border p-4 rounded-xl space-y-3 bg-slate-50/20 border-slate-205">
                        <div className="flex justify-between items-center border-b pb-1.5">
                          <h4 className="font-bold text-xs uppercase text-slate-800 flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-blue-500" />
                            A2. Khám Ngoại Khoa (Cơ học)
                          </h4>
                          <select
                            value={record.KHAM_NGOI_KHOA ?? 1}
                            onChange={(e) => handleChange("KHAM_NGOI_KHOA", parseInt(e.target.value))}
                            className="text-[10px] p-1 border rounded bg-white font-bold"
                          >
                            <option value={1}>Có khám</option>
                            <option value={0}>Không khám</option>
                          </select>
                        </div>
                        {record.KHAM_NGOI_KHOA !== 0 && (
                          <div>
                            <label className="block text-[10px] text-slate-500 font-medium mb-1">Nhận xét ngoại khoa</label>
                            <textarea
                              rows={2}
                              value={record.KET_QUA_KHAM_NGOI_KHOA || ""}
                              onChange={(e) => handleChange("KET_QUA_KHAM_NGOI_KHOA", e.target.value)}
                              placeholder="Không sẹo vết mổ cũ, không trĩ, không thoát vị bẹn..."
                              className="w-full text-xs p-2 border rounded bg-white"
                            />
                          </div>
                        )}
                      </div>

                      {/* Khám Da Liễu */}
                      <div className="border p-4 rounded-xl space-y-3 bg-slate-50/20 border-slate-205">
                        <div className="flex justify-between items-center border-b pb-1.5">
                          <h4 className="font-bold text-xs uppercase text-slate-800 flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-blue-500" />
                            A3. Khám Da Liễu (Tế bào/Bì)
                          </h4>
                          <select
                            value={record.KHAM_DA_LIEU ?? 1}
                            onChange={(e) => handleChange("KHAM_DA_LIEU", parseInt(e.target.value))}
                            className="text-[10px] p-1 border rounded bg-white font-bold"
                          >
                            <option value={1}>Có khám</option>
                            <option value={0}>Không khám</option>
                          </select>
                        </div>
                        {record.KHAM_DA_LIEU !== 0 && (
                          <div>
                            <label className="block text-[10px] text-slate-500 font-medium mb-1">Nhận xét da liễu</label>
                            <textarea
                              rows={2}
                              value={record.KET_QUA_KHAM_DA_LIEU || ""}
                              onChange={(e) => handleChange("KET_QUA_KHAM_DA_LIEU", e.target.value)}
                              placeholder="Da bình thường, không phát hiện tổn thương sùi, nấm..."
                              className="w-full text-xs p-2 border rounded bg-white"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 3. KHÁM SẢN PHỤ KHOA (Visible for female or optionally available) */}
                    <div className="border p-4 rounded-xl space-y-3 bg-rose-50/5 border-rose-200">
                      <div className="flex justify-between items-center border-b pb-1.5">
                        <h4 className="font-bold text-xs uppercase text-rose-800 flex items-center gap-1.5">
                          <Heart className="w-3.5 h-3.5 text-rose-600" />
                          A4. Khám Sản Phụ Khoa lâm sàng
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-450 italic">(Cực kỳ thích hợp cho bệnh nhân Nữ)</span>
                          <select
                            value={record.KHAM_SAN_PHU_KHOA ?? 0}
                            onChange={(e) => handleChange("KHAM_SAN_PHU_KHOA", parseInt(e.target.value))}
                            className="text-[10px] p-1 border rounded bg-white font-bold text-rose-700"
                          >
                            <option value={0}>Không khám (Mã 0)</option>
                            <option value={1}>Có khám (Mã 1)</option>
                          </select>
                        </div>
                      </div>
                      {record.KHAM_SAN_PHU_KHOA === 1 && (
                        <div>
                          <label className="block text-[11px] text-slate-600 font-bold mb-1">Kết quả khám lâm sàng sản phụ khoa</label>
                          <textarea
                            rows={2}
                            value={record.KET_QUA_KHAM_SAN_PHU_KHOA || ""}
                            onChange={(e) => handleChange("KET_QUA_KHAM_SAN_PHU_KHOA", e.target.value)}
                            placeholder="Phần phụ mềm, âm đạo không bất thường, cổ tử cung nhẵn..."
                            className="w-full text-xs p-2 border rounded bg-white font-medium text-slate-800"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="border p-4 rounded-xl space-y-4 bg-slate-50/20">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h4 className="font-bold text-sm uppercase text-blue-800 flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-blue-600" />
                        A. Khám Nhi Khoa
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Có khám chuyên khoa Nhi:</span>
                        <select
                          value={record.KHAM_NHI_KHOA}
                          onChange={(e) => handleChange("KHAM_NHI_KHOA", parseInt(e.target.value))}
                          className="text-xs p-1 border rounded bg-white font-medium"
                        >
                          <option value={0}>Không (Mã 0)</option>
                          <option value={1}>Có khám (Mã 1)</option>
                        </select>
                      </div>
                    </div>

                    {record.KHAM_NHI_KHOA === 1 && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs"
                      >
                        <div>
                          <label className="block text-slate-500 font-medium mb-1">Tuần hoàn</label>
                          <input
                            type="text"
                            value={record.NHI_KHOA_TUAN_HOAN}
                            onChange={(e) => handleChange("NHI_KHOA_TUAN_HOAN", e.target.value)}
                            placeholder="Tuần hoàn đều, T1, T2 rõ"
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 font-medium mb-1">Hô hấp</label>
                          <input
                            type="text"
                            value={record.NHI_KHOA_HO_HAP}
                            onChange={(e) => handleChange("NHI_KHOA_HO_HAP", e.target.value)}
                            placeholder="Rì rào phế nang êm dịu"
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 font-medium mb-1">Tiêu hóa</label>
                          <input
                            type="text"
                            value={record.NHI_KHOA_TIEU_HOA}
                            onChange={(e) => handleChange("NHI_KHOA_TIEU_HOA", e.target.value)}
                            placeholder="Bụng mềm, gan lách không to"
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 font-medium mb-1">Thận - tiết niệu</label>
                          <input
                            type="text"
                            value={record.NHI_KHOA_THAN_TIETNIEU}
                            onChange={(e) => handleChange("NHI_KHOA_THAN_TIETNIEU", e.target.value)}
                            placeholder="Hố thận không sưng, chạm thận âm tính"
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 font-medium mb-1">Thần kinh</label>
                          <input
                            type="text"
                            value={record.NHI_KHOA_THAN_KINH}
                            onChange={(e) => handleChange("NHI_KHOA_THAN_KINH", e.target.value)}
                            placeholder="Phản xạ gân xương bình thường"
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 font-medium mb-1">Tâm thần</label>
                          <input
                            type="text"
                            value={record.NHI_KHOA_TAM_THAN}
                            onChange={(e) => handleChange("NHI_KHOA_TAM_THAN", e.target.value)}
                            placeholder="Tỉnh táo, tiếp xúc tốt"
                            className="w-full p-2 border rounded"
                          />
                        </div>

                        <div className="md:col-span-2 border-t pt-2 gap-2 grid grid-cols-3 bg-slate-100/40 p-2.5 rounded">
                          <div>
                            <label className="block text-slate-500 font-medium mb-1">Có nội dung khám nhi khác?</label>
                            <select
                              value={record.NHI_KHOA_KHAC}
                              onChange={(e) => handleChange("NHI_KHOA_KHAC", parseInt(e.target.value))}
                              className="w-full p-1.5 border rounded bg-white"
                            >
                              <option value={0}>Không</option>
                              <option value={1}>Có</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-500 font-medium mb-1">Tên khám nhi khác</label>
                            <input
                              type="text"
                              disabled={record.NHI_KHOA_KHAC === 0}
                              value={record.TEN_LOAI_KHAM_NHI_KHOA_KHAC}
                              onChange={(e) => handleChange("TEN_LOAI_KHAM_NHI_KHOA_KHAC", e.target.value)}
                              placeholder="Tên khám khác"
                              className="w-full p-1.5 border rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-medium mb-1">Kết quả khám nhi khác</label>
                            <input
                              type="text"
                              disabled={record.NHI_KHOA_KHAC === 0}
                              value={record.KET_QUA_KHAM_NHI_KHOA_KHAC}
                              onChange={(e) => handleChange("KET_QUA_KHAM_NHI_KHOA_KHAC", e.target.value)}
                              placeholder="Kết quả nhận xét"
                              className="w-full p-1.5 border rounded"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Eyes section */}
                <div className="border p-4 rounded-xl space-y-4 bg-slate-50/20">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h4 className="font-bold text-sm uppercase text-indigo-805 flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-indigo-600" />
                      B. Khám Mắt
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Khám Mắt:</span>
                      <select
                        value={record.KHAM_MAT}
                        onChange={(e) => handleChange("KHAM_MAT", parseInt(e.target.value))}
                        className="text-xs p-1 border rounded bg-white font-medium"
                      >
                        <option value={1}>Có khám (Mã 1)</option>
                        <option value={0}>Không (Mã 0)</option>
                      </select>
                    </div>
                  </div>

                  {record.KHAM_MAT === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-lg border">
                        <div>
                          <label className="block text-slate-455 font-medium mb-1">Thị lực không kính (Mắt phải)</label>
                          <input
                            type="text"
                            value={record.KHONG_KINH_MAT_PHAI}
                            onChange={(e) => handleChange("KHONG_KINH_MAT_PHAI", e.target.value)}
                            placeholder="Ví dụ: 10/10"
                            className="w-full p-1.5 border rounded text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-455 font-medium mb-1">Thị lực không kính (Mắt trái)</label>
                          <input
                            type="text"
                            value={record.KHONG_KINH_MAT_TRAI}
                            onChange={(e) => handleChange("KHONG_KINH_MAT_TRAI", e.target.value)}
                            placeholder="Ví dụ: 9/10"
                            className="w-full p-1.5 border rounded text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-455 font-medium mb-1">Thị lực có kính (Mắt phải)</label>
                          <input
                            type="text"
                            value={record.CO_KINH_MAT_PHAI}
                            onChange={(e) => handleChange("CO_KINH_MAT_PHAI", e.target.value)}
                            placeholder="Nếu có đeo kính"
                            className="w-full p-1.5 border rounded text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-455 font-medium mb-1">Thị lực có kính (Mắt trái)</label>
                          <input
                            type="text"
                            value={record.CO_KINH_MAT_TRAI}
                            onChange={(e) => handleChange("CO_KINH_MAT_TRAI", e.target.value)}
                            placeholder="Nếu có đeo kính"
                            className="w-full p-1.5 border rounded text-center"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="block text-slate-500 font-medium mb-1">Bệnh lý khác về mắt (nếu gập)</label>
                          <input
                            type="text"
                            value={record.BENH_KHAC_MAT}
                            onChange={(e) => handleChange("BENH_KHAC_MAT", e.target.value)}
                            placeholder="Cận thị, Viễn thị, Loạn thị, Tăng nhãn áp..."
                            className="w-full p-1.5 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 font-medium mb-1">Kết luận đánh giá thị lực</label>
                          <input
                            type="text"
                            value={record.KET_LUAN_MAT}
                            onChange={(e) => handleChange("KET_LUAN_MAT", e.target.value)}
                            placeholder="Mắt bình thường / Cận thị đã chỉnh kính"
                            className="w-full p-1.5 border rounded font-semibold text-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ear Nose Throat */}
                <div className="border p-4 rounded-xl space-y-4 bg-slate-50/20">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h4 className="font-bold text-sm uppercase text-indigo-805 flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-emerald-600" />
                      C. Khám Tai Mũi Họng
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Khám TMH:</span>
                      <select
                        value={record.KHAM_TAI_MUI_HONG}
                        onChange={(e) => handleChange("KHAM_TAI_MUI_HONG", parseInt(e.target.value))}
                        className="text-xs p-1 border rounded bg-white font-medium"
                      >
                        <option value={1}>Có khám (Mã 1)</option>
                        <option value={0}>Không (Mã 0)</option>
                      </select>
                    </div>
                  </div>

                  {record.KHAM_TAI_MUI_HONG === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-lg border">
                        <div>
                          <label className="block text-slate-455 font-medium mb-1">Thính lực Nói Thường (Tai trái)</label>
                          <input
                            type="text"
                            maxLength={10}
                            value={record.TAI_TRAI_NOI_THUONG}
                            onChange={(e) => handleChange("TAI_TRAI_NOI_THUONG", e.target.value)}
                            placeholder="Ví dụ: 5m, 6m"
                            className="w-full p-1.5 border rounded text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-455 font-medium mb-1">Thính lực Nói Thầm (Tai trái)</label>
                          <input
                            type="text"
                            maxLength={10}
                            value={record.TAI_TRAI_NOI_THAM}
                            onChange={(e) => handleChange("TAI_TRAI_NOI_THAM", e.target.value)}
                            placeholder="Ví dụ: 0.5m"
                            className="w-full p-1.5 border rounded text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-455 font-medium mb-1">Thính lực Nói Thường (Tai phải)</label>
                          <input
                            type="text"
                            maxLength={10}
                            value={record.TAI_PHAI_NOI_THUONG}
                            onChange={(e) => handleChange("TAI_PHAI_NOI_THUONG", e.target.value)}
                            placeholder="Ví dụ: 5m"
                            className="w-full p-1.5 border rounded text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-455 font-medium mb-1">Thính lực Nói Thầm (Tai phải)</label>
                          <input
                            type="text"
                            maxLength={10}
                            value={record.TAI_PHAI_NOI_THAM}
                            onChange={(e) => handleChange("TAI_PHAI_NOI_THAM", e.target.value)}
                            placeholder="Ví dụ: 0.5m"
                            className="w-full p-1.5 border rounded text-center"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="block text-slate-500 font-medium mb-1">Các bệnh lý chuyên khoa TMH</label>
                          <input
                            type="text"
                            value={record.BENH_KHAC_TAI_MUI_HONG}
                            onChange={(e) => handleChange("BENH_KHAC_TAI_MUI_HONG", e.target.value)}
                            placeholder="Viêm họng mạn, lệch vách ngăn mũi, viêm tai giữa..."
                            className="w-full p-1.5 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 font-medium mb-1">Kết luận kiểm tra TMH</label>
                          <input
                            type="text"
                            value={record.KET_LUAN_TAI_MUI_HONG}
                            onChange={(e) => handleChange("KET_LUAN_TAI_MUI_HONG", e.target.value)}
                            placeholder="TMH bình thường / Viêm VA họng hạt nhẹ"
                            className="w-full p-1.5 border rounded font-semibold text-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dental portion */}
                <div className="border p-4 rounded-xl space-y-4 bg-slate-50/20">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h4 className="font-bold text-sm uppercase text-slate-800 flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-purple-600" />
                      D. Khám Răng Hàm Mặt
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Khám Răng Hàm Mặt:</span>
                      <select
                        value={record.KHAM_RANG_HAM_MAT}
                        onChange={(e) => handleChange("KHAM_RANG_HAM_MAT", parseInt(e.target.value))}
                        className="text-xs p-1 border rounded bg-white font-medium"
                      >
                        <option value={1}>Có khám (Mã 1)</option>
                        <option value={0}>Không (Mã 0)</option>
                      </select>
                    </div>
                  </div>

                  {record.KHAM_RANG_HAM_MAT === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-2 bg-white p-3 rounded-lg border">
                        <div>
                          <label className="block text-slate-455 font-medium mb-1">Cơ cấu Hàm Trên</label>
                          <input
                            type="text"
                            value={record.HAM_TREN}
                            onChange={(e) => handleChange("HAM_TREN", e.target.value)}
                            placeholder="Đầy đủ, không răng sâu"
                            className="w-full p-1.5 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-455 font-medium mb-1">Cơ cấu Hàm Dưới</label>
                          <input
                            type="text"
                            value={record.HAM_DUOI}
                            onChange={(e) => handleChange("HAM_DUOI", e.target.value)}
                            placeholder="Không cao răng, khớp cắn đều"
                            className="w-full p-1.5 border rounded"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="block text-slate-500 font-medium mb-1">Các bệnh răng miệng (nếu gặp)</label>
                          <input
                            type="text"
                            value={record.BENH_KHAC_RANG_HAM_MAT}
                            onChange={(e) => handleChange("BENH_KHAC_RANG_HAM_MAT", e.target.value)}
                            placeholder="Sâu răng, Viêm tủy răng, Nha chu..."
                            className="w-full p-1.5 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 font-medium mb-1">Kết luận kiểm tra RHM</label>
                          <input
                            type="text"
                            value={record.KET_LUAN_RANG_HAM_MAT}
                            onChange={(e) => handleChange("KET_LUAN_RANG_HAM_MAT", e.target.value)}
                            placeholder="Răng Hàm Mặt bình thường / Sâu răng số 37"
                            className="w-full p-1.5 border rounded font-semibold text-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 5: Cận lâm sàng */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="border-b pb-2 mb-4">
                  <h3 className="text-base font-bold text-slate-800">5. Thống kê kết quả Cận Lâm Sàng & Xét nghiệm</h3>
                  <p className="text-xs text-slate-500">Khai báo kết quả công thức máu, sinh hóa, nước tiểu và chẩn đoán chẩn đoán qua hình ảnh x quang/siêu âm.</p>
                </div>

                {/* Blood chemistry */}
                <div className="border p-4 rounded-xl space-y-4 bg-slate-50/20">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h4 className="font-bold text-sm uppercase text-rose-800">1. Xét nghiệm công thức máu & sinh hóa máu</h4>
                    <select
                      value={record.XET_NGHIEM_MAU}
                      onChange={(e) => handleChange("XET_NGHIEM_MAU", parseInt(e.target.value))}
                      className="text-xs p-1 border rounded bg-white font-medium"
                    >
                      <option value={0}>Không có chỉ định xét nghiệm (Mã 0)</option>
                      <option value={1}>Có xét nghiệm (Mã 1)</option>
                    </select>
                  </div>

                  {record.XET_NGHIEM_MAU === 1 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5 text-xs">
                      <div>
                        <label className="block text-slate-500 font-medium mb-1 text-center">Hồng cầu (HC)</label>
                        <input
                          type="text"
                          maxLength={10}
                          value={record.CHI_SO_HC}
                          onChange={(e) => handleChange("CHI_SO_HC", e.target.value)}
                          placeholder="4.5"
                          className="w-full p-1.5 border rounded text-center font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-medium mb-1 text-center">Bạch cầu (BC)</label>
                        <input
                          type="text"
                          maxLength={10}
                          value={record.CHI_SO_BACH_CAU}
                          onChange={(e) => handleChange("CHI_SO_BACH_CAU", e.target.value)}
                          placeholder="7.2"
                          className="w-full p-1.5 border rounded text-center font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-medium mb-1 text-center">Tiểu cầu (TC)</label>
                        <input
                          type="text"
                          maxLength={10}
                          value={record.CHI_SO_TIEU_CAU}
                          onChange={(e) => handleChange("CHI_SO_TIEU_CAU", e.target.value)}
                          placeholder="250"
                          className="w-full p-1.5 border rounded text-center font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-medium mb-1 text-center">Đường máu</label>
                        <input
                          type="text"
                          maxLength={10}
                          value={record.DUONG_MAU}
                          onChange={(e) => handleChange("DUONG_MAU", e.target.value)}
                          placeholder="5.1"
                          className="w-full p-1.5 border rounded text-center font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-medium mb-1 text-center font-sans">Urê máu</label>
                        <input
                          type="text"
                          maxLength={10}
                          value={record.URE}
                          onChange={(e) => handleChange("URE", e.target.value)}
                          placeholder="4.8"
                          className="w-full p-1.5 border rounded text-center font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-medium mb-1 text-center">Creatinin</label>
                        <input
                          type="text"
                          maxLength={10}
                          value={record.CREATININ}
                          onChange={(e) => handleChange("CREATININ", e.target.value)}
                          placeholder="80"
                          className="w-full p-1.5 border rounded text-center font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-medium mb-1 text-center">ASAT(GOT)</label>
                        <input
                          type="text"
                          maxLength={10}
                          value={record.ASAT}
                          onChange={(e) => handleChange("ASAT", e.target.value)}
                          placeholder="24"
                          className="w-full p-1.5 border rounded text-center font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-medium mb-1 text-center">ALAT(GPT)</label>
                        <input
                          type="text"
                          maxLength={10}
                          value={record.ALAT}
                          onChange={(e) => handleChange("ALAT", e.target.value)}
                          placeholder="22"
                          className="w-full p-1.5 border rounded text-center font-mono font-bold"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Urine results */}
                <div className="border p-4 rounded-xl space-y-4 bg-slate-50/20">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h4 className="font-bold text-sm uppercase text-blue-900">2. Xét nghiệm hóa sinh nước tiểu</h4>
                    <select
                      value={record.XET_NGHIEM_NUOC_TIEU}
                      onChange={(e) => handleChange("XET_NGHIEM_NUOC_TIEU", parseInt(e.target.value))}
                      className="text-xs p-1 border rounded bg-white font-medium"
                    >
                      <option value={0}>Không chỉ định (Mã 0)</option>
                      <option value={1}>Có xét nghiệm nước tiểu (Mã 1)</option>
                    </select>
                  </div>

                  {record.XET_NGHIEM_NUOC_TIEU === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <label className="block text-slate-505 font-medium mb-1">Chỉ số Đường nước tiểu</label>
                        <input
                          type="text"
                          maxLength={10}
                          value={record.CHI_SO_DUONG}
                          onChange={(e) => handleChange("CHI_SO_DUONG", e.target.value)}
                          placeholder="Ví dụ: Âm tính"
                          className="w-full p-2 border rounded font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-505 font-medium mb-1">Chỉ số Protein nước tiểu</label>
                        <input
                          type="text"
                          maxLength={10}
                          value={record.CHI_SO_PROTEIN}
                          onChange={(e) => handleChange("CHI_SO_PROTEIN", e.target.value)}
                          placeholder="Ví dụ: Âm tính"
                          className="w-full p-2 border rounded font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-505 font-medium mb-1">Các chỉ số hóa sinh nước tiểu khác</label>
                        <input
                          type="text"
                          value={record.CHI_SO_KHAC}
                          onChange={(e) => handleChange("CHI_SO_KHAC", e.target.value)}
                          placeholder="pH, Định lượng..."
                          className="w-full p-2 border rounded font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Imaging and ECG and other */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Image diagnosis */}
                  <div className="border p-4 rounded-xl space-y-3 bg-slate-50/20">
                    <div className="flex justify-between items-center border-b pb-1">
                      <h4 className="font-bold text-xs uppercase text-slate-700">3. Chẩn đoán hình ảnh (X-Quang, Siêu âm...)</h4>
                      <select
                        value={record.CHAN_DOAN_HINH_ANH}
                        onChange={(e) => handleChange("CHAN_DOAN_HINH_ANH", parseInt(e.target.value))}
                        className="text-[10px] p-0.5 border rounded bg-white"
                      >
                        <option value={0}>Không có (0)</option>
                        <option value={1}>Có thực hiện (1)</option>
                      </select>
                    </div>
                    {record.CHAN_DOAN_HINH_ANH === 1 && (
                      <textarea
                        rows={3}
                        value={record.KET_QUA_CHAN_DOAN_HINH_ANH}
                        onChange={(e) => handleChange("KET_QUA_CHAN_DOAN_HINH_ANH", e.target.value)}
                        placeholder="Ví dụ: Tim phổi bình thường, bóng tim không to, phế trường sáng..."
                        className="w-full text-xs p-2 border rounded focus:outline-none"
                      />
                    )}
                  </div>

                  {/* ECG */}
                  <div className="border p-4 rounded-xl space-y-3 bg-slate-50/20">
                    <div className="flex justify-between items-center border-b pb-1">
                      <h4 className="font-bold text-xs uppercase text-slate-700">4. Điện tâm đồ (Điện tim)</h4>
                      <select
                        value={record.DIEN_TIM}
                        onChange={(e) => handleChange("DIEN_TIM", parseInt(e.target.value))}
                        className="text-[10px] p-0.5 border rounded bg-white"
                      >
                        <option value={0}>Không có (0)</option>
                        <option value={1}>Có thực hiện (1)</option>
                      </select>
                    </div>
                    {record.DIEN_TIM === 1 && (
                      <textarea
                        rows={3}
                        value={record.KET_QUA_DIEN_TIM}
                        onChange={(e) => handleChange("KET_QUA_DIEN_TIM", e.target.value)}
                        placeholder="Ví dụ: Nhịp xoang đều, tần số 75ck/p, trục trung gian..."
                        className="w-full text-xs p-2 border rounded focus:outline-none"
                      />
                    )}
                  </div>
                </div>

                {/* Other specialized exams */}
                <div className="border p-4 rounded-xl space-y-3 bg-slate-50/20">
                  <div className="flex justify-between items-center border-b pb-1">
                    <h4 className="font-bold text-xs uppercase text-slate-700">5. Các xét nghiệm / Thăm dò khác</h4>
                    <select
                      value={record.XET_NGHIEM_KHAC}
                      onChange={(e) => handleChange("XET_NGHIEM_KHAC", parseInt(e.target.value))}
                      className="text-[10px] p-0.5 border rounded bg-white"
                    >
                      <option value={0}>Không (0)</option>
                      <option value={1}>Có chỉ định khác (1)</option>
                    </select>
                  </div>
                  {record.XET_NGHIEM_KHAC === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-500 font-medium mb-1">Tên xét nghiệm</label>
                        <input
                          type="text"
                          value={record.TEN_XET_NGHIEM_KHAC}
                          onChange={(e) => handleChange("TEN_XET_NGHIEM_KHAC", e.target.value)}
                          placeholder="Xét nghiệm HPV, Sinh thiết da..."
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-medium mb-1">Kết quả xét nghiệm chuyên sâu</label>
                        <input
                          type="text"
                          value={record.KET_QUA_XET_NGHIEM_KHAC}
                          onChange={(e) => handleChange("KET_QUA_XET_NGHIEM_KHAC", e.target.value)}
                          placeholder="Ghi nhận kết quả"
                          className="w-full p-2 border rounded"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 6: Đánh giá & Chữ ký số */}
            {step === 6 && (
              <div className="space-y-6">
                <div className="border-b pb-2 mb-4">
                  <h3 className="text-base font-bold text-slate-800">6. Đánh giá kết luận & Xác thực Chữ ký số</h3>
                  <p className="text-xs text-slate-500">Bước cuối cùng: Xếp hạng phân loại sức khỏe chung, các khuyến nghị dự phòng điều trị bệnh và áp chữ ký số xác thực.</p>
                </div>

                {/* Concl */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Kết luận đánh giá phân loại sức khỏe <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={record.KET_LUAN_LOAI_SUC_KHOE}
                      onChange={(e) => handleChange("KET_LUAN_LOAI_SUC_KHOE", e.target.value)}
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:outline-none bg-white font-semibold text-emerald-800"
                    >
                      <option value="">-- Chọn phân loại sức khỏe --</option>
                      <option value="Loại I">Sức khỏe Loại I (Rất khỏe mạnh)</option>
                      <option value="Loại II">Sức khỏe Loại II (Khỏe mạnh, cận thị nhẹ...)</option>
                      <option value="Loại III">Sức khỏe Loại III (Trung bình, răng sâu...)</option>
                      <option value="Loại IV">Sức khỏe Loại IV (Yếu, có bệnh lý nền nặng)</option>
                      <option value="Loại V">Sức khỏe Loại V (Rất yếu, không đủ tiêu chuẩn)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Biện pháp phòng ngừa / các bệnh cần lưu ý
                    </label>
                    <input
                      type="text"
                      value={record.KET_LUAN_CAC_VAN_DE_SUC_KHOE}
                      onChange={(e) => handleChange("KET_LUAN_CAC_VAN_DE_SUC_KHOE", e.target.value)}
                      placeholder="Ví dụ: Đủ sức khỏe học tập; Theo dõi khúc xạ..."
                      className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>

                {/* Digital Sigs */}
                <div className="border p-5 rounded-xl bg-slate-50/50 space-y-4 border-slate-205">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-1 gap-2">
                    <h4 className="font-bold text-xs uppercase text-slate-600">Hệ thống đồng bộ Chữ Ký Số (CKS) - VNPT SmartCA</h4>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">Môi trường phê duyệt liên thông</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* sig 1 */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-between h-40">
                      <div>
                        <span className="text-[10px] font-black text-slate-450 uppercase tracking-wide">1. Chữ ký đối tượng</span>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Token CKS xác minh đối tượng tự khai báo.</p>
                      </div>
                      <div className="mt-2 space-y-1.5">
                        {record.CKS_NGUOI_KHAM ? (
                          <div className="text-[9px] bg-green-50 text-emerald-700 py-1 px-1.5 rounded border border-green-150 font-mono font-medium overflow-hidden text-ellipsis whitespace-nowrap text-center">
                            {record.CKS_NGUOI_KHAM.substring(0, 18)}...
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => triggerAutoSign("CKS_NGUOI_KHAM")}
                              className="w-full text-[10px] py-1 bg-slate-50 hover:bg-slate-105 text-slate-700 font-semibold border border-slate-300 rounded-md transition-colors cursor-pointer"
                            >
                              Áp chữ ký nhanh
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* sig 2 */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-between h-40">
                      <div>
                        <span className="text-[10px] font-black text-blue-700 uppercase tracking-wide">2. Bác sĩ lâm sàng</span>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Bác sĩ khám ký giám định chuyên môn y khoa.</p>
                      </div>
                      <div className="mt-2 space-y-1.5">
                        {record.CKS_NGUOI_KET_LUAN ? (
                          <div className="text-[9px] bg-blue-50 text-blue-700 py-1 px-1.5 rounded border border-blue-150 font-mono font-medium overflow-hidden text-ellipsis whitespace-nowrap text-center">
                            {record.CKS_NGUOI_KET_LUAN.substring(0, 18)}...
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setSmartCARole("doctor");
                                setIsSmartCAModalOpen(true);
                              }}
                              className="w-full text-[10px] py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Smartphone className="w-3 h-3" />
                              Ký SmartCA
                            </button>
                            <button
                              type="button"
                              onClick={() => triggerAutoSign("CKS_NGUOI_KET_LUAN")}
                              className="w-full text-[9px] py-0.5 text-slate-450 hover:text-slate-650 cursor-pointer"
                            >
                              Tự động điền nhanh
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* sig 3 */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-between h-40">
                      <div>
                        <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wide">3. Lãnh đạo phê duyệt</span>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Ban giám đốc duyệt phân loại sức khỏe.</p>
                      </div>
                      <div className="mt-2 space-y-1.5">
                        {record.CKS_LANH_DAO ? (
                          <div className="text-[9px] bg-indigo-50 text-indigo-700 py-1 px-1.5 rounded border border-indigo-150 font-mono font-medium overflow-hidden text-ellipsis whitespace-nowrap text-center">
                            {record.CKS_LANH_DAO.substring(0, 18)}...
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setSmartCARole("leader");
                                setIsSmartCAModalOpen(true);
                              }}
                              className="w-full text-[10px] py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Smartphone className="w-3 h-3" />
                              Ký SmartCA
                            </button>
                            <button
                              type="button"
                              onClick={() => triggerAutoSign("CKS_LANH_DAO")}
                              className="w-full text-[9px] py-0.5 text-slate-450 hover:text-slate-650 cursor-pointer"
                            >
                              Tự động điền nhanh
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* sig 4 */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-between h-40">
                      <div>
                        <span className="text-[10px] font-black text-rose-700 uppercase tracking-wide">4. Đơn vị bệnh viện</span>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Đóng con dấu số tròn pháp lý HSM.</p>
                      </div>
                      <div className="mt-2 space-y-1.5">
                        {record.CKS_BENH_VIEN ? (
                          <div className="text-[9px] bg-red-50 text-red-700 py-1 px-1.5 rounded border border-red-150 font-mono font-medium overflow-hidden text-ellipsis whitespace-nowrap text-center">
                            {record.CKS_BENH_VIEN.substring(0, 18)}...
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setSmartCARole("unit");
                                setIsSmartCAModalOpen(true);
                              }}
                              className="w-full text-[10px] py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-md shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Building2 className="w-3 h-3" />
                              Dấu SmartCA
                            </button>
                            <button
                              type="button"
                              onClick={() => triggerAutoSign("CKS_BENH_VIEN")}
                              className="w-full text-[9px] py-0.5 text-slate-450 hover:text-slate-650 cursor-pointer"
                            >
                              Tự động điền nhanh
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400">Khuyến nghị: Sử dụng ứng dụng trên di động để phê duyệt SmartCA</span>
                    <button 
                      type="button"
                      onClick={() => {
                        triggerAutoSign("CKS_NGUOI_KHAM");
                        triggerAutoSign("CKS_NGUOI_KET_LUAN");
                        triggerAutoSign("CKS_LANH_DAO");
                        triggerAutoSign("CKS_BENH_VIEN");
                      }} 
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Điền nhanh CKS Demo đồng bộ
                    </button>
                  </div>
                </div>

                {/* Simulated remote portal for SmartCA inside editor */}
                <AnimatePresence>
                  {isSmartCAModalOpen && (
                    <SmartCASignerModal
                      record={record}
                      isOpen={isSmartCAModalOpen}
                      onClose={() => setIsSmartCAModalOpen(false)}
                      onSuccess={handleSmartCASuccess}
                      initialRole={smartCARole}
                    />
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Control Navigation buttons */}
      <div className="mt-6 flex justify-between items-center bg-slate-50 p-4 border border-slate-200/80 rounded-2xl">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-105 rounded-xl transition-all shadow-xs cursor-pointer"
        >
          Hủy bỏ thay đổi
        </button>

        <div className="flex gap-2">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-705 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Lùi lại
            </button>
          )}

          {step < totalSteps ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              Tiếp tục
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-1.5 px-6 py-2.5 text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all cursor-pointer"
              id="btn-save-record"
            >
              <Save className="w-4 h-4" />
              Lưu trữ hồ sơ y tế
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
