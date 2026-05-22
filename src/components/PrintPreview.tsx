/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { HealthRecord } from "../types";
import { 
  ArrowLeft, 
  Printer, 
  Shield, 
  CheckCircle,
  ShieldCheck,
  Smartphone,
  Check,
  Clock,
  FileSignature,
  Building2,
  Cpu,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import SmartCASignerModal from "./SmartCASignerModal";

interface PrintPreviewProps {
  record: HealthRecord;
  onBack: () => void;
  onUpdateRecord?: (record: HealthRecord) => void;
}

// Helper to format 12-character dates: yyyyMMddHHmm -> dd/MM/yyyy HH:mm
export function formatFullDate(val: string): string {
  if (!val || val.length < 8) return "---";
  const yyyy = val.substring(0, 4);
  const MM = val.substring(4, 6);
  const dd = val.substring(6, 8);
  const HH = val.length >= 10 ? val.substring(8, 10) : "00";
  const mm = val.length >= 12 ? val.substring(10, 12) : "00";
  return `${dd}/${MM}/${yyyy} lúc ${HH}:${mm}`;
}

// Helper to format 8-character dates: yyyyMMdd -> dd/MM/yyyy
export function formatDate(val: string): string {
  if (!val || val.length < 8) return "---";
  const yyyy = val.substring(0, 4);
  const MM = val.substring(4, 6);
  const dd = val.substring(6, 8);
  return `${dd}/${MM}/${yyyy}`;
}

// Helper to get gender label
export function getGenderLabel(val: number): string {
  switch (val) {
    case 1:
      return "Nam";
    case 2:
      return "Nữ";
    case 3:
    default:
      return "Chưa xác định";
  }
}

// Helper to get vaccine status
export function getVaccineLabel(val: number): string {
  switch (val) {
    case 1:
      return "Được tiêm";
    case 0:
      return "Không được tiêm";
    case 99:
    default:
      return "Không có thông tin";
  }
}

// Helper to parse security certificates
export function parseSignatureDetails(sigString: string) {
  if (!sigString) return null;
  const lines = sigString.split("\n");
  const isSmartCA = sigString.includes("VNPT SmartCA");
  
  // Extract fields with defaults
  let owner = "Cán bộ y tế";
  let title = "Người ký xác thực";
  let serial = "";
  let time = "";
  
  lines.forEach(line => {
    if (line.startsWith("Chủ thể:")) owner = line.substring(8).trim();
    if (line.startsWith("Chức danh:")) title = line.substring(10).trim();
    if (line.startsWith("Seri:")) serial = line.substring(5).trim();
    if (line.startsWith("Thời gian ký:")) time = line.substring(13).trim();
  });
  
  return { owner, title, serial, time, isSmartCA };
}

export default function PrintPreview({ record, onBack, onUpdateRecord }: PrintPreviewProps) {
  const [isSmartCAModalOpen, setIsSmartCAModalOpen] = useState(false);
  const [smartCARole, setSmartCARole] = useState<"doctor" | "leader" | "unit">("doctor");

  const handlePrint = () => {
    window.print();
  };

  const handleSignatureSuccess = (updatedRec: HealthRecord) => {
    if (onUpdateRecord) {
      onUpdateRecord(updatedRec);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6">
      {/* Action panel (Hidden on printing) */}
      <div id="print-controls" className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs print:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            id="btn-back-to-list"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách
          </button>
          <span className="text-xs font-mono text-slate-450 bg-slate-100 py-1 px-2 rounded">
            ID: {record.id}
          </span>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all cursor-pointer"
            id="btn-print"
          >
            <Printer className="w-4 h-4" />
            In hồ sơ sức khỏe (PDF)
          </button>
        </div>
      </div>

      {/* VNPT SmartCA Dashboard Integration Section */}
      <div className="mb-6 bg-white rounded-xl border border-blue-105 p-5 shadow-xs flex flex-col gap-4 print:hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <FileSignature className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-tight">Ký Số Điện Tử Phê Duyệt Đồng Bộ - VNPT SmartCA</h3>
              <p className="text-[11px] text-slate-500">Ký số từ xa chuẩn an toàn Quốc gia cho 02 thực thể: Bác sĩ khám và Đại diện Cơ sở khám chữa bệnh</p>
            </div>
          </div>
          <span className="text-[9px] font-bold text-blue-700 bg-blue-50 py-1 px-2.5 rounded-full uppercase tracking-wider">Môi trường Blue-REMOTE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Bác sĩ khám */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between hover:border-slate-300 transition-all">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">1. Bác sĩ khám</span>
                {record.CKS_NGUOI_KET_LUAN ? (
                  <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> ĐÃ KÝ
                  </span>
                ) : (
                  <span className="text-[9px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600 animate-pulse" /> CHỜ KÝ
                  </span>
                )}
              </div>
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-tight">Báo cáo kết luận y tế</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">Đại diện bác sĩ khám lâm sàng thực hiện kiểm định chuyên môn 84 trường chỉ số khám sức khỏe.</p>
              
              {record.CKS_NGUOI_KET_LUAN && (
                <div className="mt-2 p-2 rounded bg-white text-[9px] font-mono text-slate-500 leading-normal border max-h-16 overflow-y-auto w-full break-all">
                  {record.CKS_NGUOI_KET_LUAN}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setSmartCARole("doctor");
                setIsSmartCAModalOpen(true);
              }}
              className="mt-4 flex items-center justify-center gap-1 w-full text-xs py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              Ký số Bác sĩ khám
            </button>
          </div>

          {/* Card 2: Chữ ký Đại diện Cơ sở khám chữa bệnh */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between hover:border-slate-300 transition-all">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">2. Đại diện Cơ sở khám chữa bệnh</span>
                {record.CKS_BENH_VIEN ? (
                  <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> ĐÃ ĐÓNG DẤU
                  </span>
                ) : (
                  <span className="text-[9px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600 animate-pulse" /> CHỜ DẤU
                  </span>
                )}
              </div>
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-tight">Con dấu số Pháp nhân hoặc Chữ ký số Đại diện</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">Sử dụng chứng thư cơ sở khám chữa bệnh (HSM) hoặc đại diện pháp luật đóng dấu tròn ký số phê duyệt hồ sơ.</p>
              
              {record.CKS_BENH_VIEN && (
                <div className="mt-2 p-2 rounded bg-white text-[9px] font-mono text-slate-500 leading-normal border max-h-16 overflow-y-auto w-full break-all">
                  {record.CKS_BENH_VIEN}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setSmartCARole("unit");
                setIsSmartCAModalOpen(true);
              }}
              className="mt-4 flex items-center justify-center gap-1 w-full text-xs py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" />
              Ký số Đại diện Cơ sở
            </button>
          </div>
        </div>
      </div>

      {/* Official Health Record Representation in Vietnam */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white p-8 sm:p-12 md:p-16 border border-slate-300 rounded-lg shadow-lg relative print:shadow-none print:border-none print:p-0 text-slate-900"
        id="print-area"
      >
        {/* Header Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-6 mb-8 gap-4">
          <div className="text-left">
            <h4 className="text-xs uppercase font-extrabold text-slate-800 tracking-wide">
              {record.MA_GTIN_CSKCB || "BỆNH VIỆN / CƠ SỞ KHÁM CHỮA BỆNH"}
            </h4>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              Mã cơ sở (KCB): {record.MA_CSKCB || "---"}
            </p>
          </div>
          <div className="text-center md:text-right">
            <h3 className="text-xs uppercase font-bold tracking-wide text-slate-800">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </h3>
            <p className="text-xs font-medium text-slate-700 underline underline-offset-4 decoration-current mt-0.5">
              Độc lập - Tự do - Hạnh phúc
            </p>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900">
            HỒ SƠ KHÁM SỨC KHỎE ĐIỆN TỬ
          </h1>
          <p className="text-xs text-slate-500 mt-1.5 font-mono">
            Mã lượt khám: <span className="font-semibold text-slate-700">{record.MA_LK}</span> | Mã hồ sơ: <span className="font-semibold text-slate-700">{record.id}</span>
          </p>
        </div>

        {/* Section 1 */}
        <div className="mb-8">
          <div className="bg-slate-100 py-1.5 px-3 rounded mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">
              I. THÔNG TIN HÀNH CHÍNH & CSKB
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3.5 gap-x-6 text-sm">
            <div>
              <span className="text-slate-500 font-medium font-sans">1. Họ và tên người bệnh:</span>{" "}
              <span className="font-bold text-slate-900 uppercase font-sans">{record.HO_TEN || "---"}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">2. Giới tính:</span>{" "}
              <span className="font-semibold text-slate-800">{getGenderLabel(record.GIOI_TINH)}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">3. Ngày sinh (theo BHYT):</span>{" "}
              <span className="font-semibold text-slate-850 font-mono">{formatFullDate(record.NGAY_SINH)}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">4. SỐ CMND/CCCD/Hộ chiếu:</span>{" "}
              <span className="font-semibold text-slate-850 font-mono">{record.SO_CCCD || "---"}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">5. Người giám hộ:</span>{" "}
              <span className="font-semibold text-slate-800">{record.NGUOI_GIAM_HO || "Không có"}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">6. CCCD Người giám hộ:</span>{" "}
              <span className="font-semibold text-slate-800 font-mono">{record.SO_CCCD_NGUOI_GIAM_HO || "---"}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">7. Ngày cấp giấy tờ:</span>{" "}
              <span className="font-semibold text-slate-800 font-mono">{formatDate(record.NGAY_CAP_CCCD)}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">8. Nơi cấp giấy tờ:</span>{" "}
              <span className="font-semibold text-slate-800">{record.NOI_CAP_CCCD || "---"}</span>
            </div>
            <div className="md:col-span-2">
              <span className="text-slate-500 font-medium">9. Chỗ ở hiện tại:</span>{" "}
              <span className="font-semibold text-slate-800">{record.DIA_CHI || "---"}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">10. Mã Tỉnh cư trú:</span>{" "}
              <span className="font-semibold text-slate-800 font-mono">{record.MATINH_CU_TRU || "---"}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">11. Mã Xã cư trú:</span>{" "}
              <span className="font-semibold text-slate-800 font-mono">{record.MAXA_CU_TRU || "---"}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">12. Điện thoại liên lạc:</span>{" "}
              <span className="font-semibold text-slate-800 font-mono">{record.DIEN_THOAI || "---"}</span>
            </div>
            <div className="md:col-span-2">
              <span className="text-slate-500 font-medium">13. Lý do khám sức khỏe:</span>{" "}
              <span className="font-semibold text-slate-800">{record.LY_DO_VV || "---"}</span>
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div className="mb-8">
          <div className="bg-slate-100 py-1.5 px-3 rounded mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">
              II. TIỀN SỬ BỆNH TẬT
            </h2>
          </div>

          <div className="space-y-4 text-sm">
            {/* Fam Health */}
            <div className="border-b pb-3">
              <h3 className="font-bold text-slate-800 mb-1 text-xs uppercase tracking-wide">1. Tiền sử gia đình</h3>
              <p>
                <span className="text-slate-500">Người nhà có mắc bệnh bẩm sinh/truyền nhiễm không:</span>{" "}
                <span className="font-semibold text-slate-800">{record.TSGD_MAC_BENH === 1 ? "Có" : "Không"}</span>
              </p>
              {record.TSGD_MAC_BENH === 1 && record.TSGD_TEN_BENH && (
                <p className="mt-1">
                  <span className="text-slate-500">Mã bệnh lâm sàng (ICD-10):</span>{" "}
                  <span className="font-mono bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-semibold text-xs border border-red-100">{record.TSGD_TEN_BENH}</span>
                </p>
              )}
            </div>

            {/* Self Health */}
            <div className="border-b pb-3">
              <h3 className="font-bold text-slate-800 mb-1 text-xs uppercase tracking-wide">2. Tiền sử bản thân</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 font-medium">Sản khoa:</span>{" "}
                  <span className="font-semibold text-slate-850">
                    {record.SAN_KHOA === 1 ? "Bình thường" : "Bất thường"}
                  </span>
                  {record.SAN_KHOA === 0 && record.BENH_GAY_RA_SAN_KHOA_KHONG_BINH_THUONG && (
                    <div className="mt-1 text-xs">
                      <span className="text-slate-500">Chi tiết bệnh sản khoa:</span>{" "}
                      <span className="font-mono bg-amber-50 text-amber-800 px-1 rounded font-semibold">{record.BENH_GAY_RA_SAN_KHOA_KHONG_BINH_THUONG}</span>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-slate-500 font-medium">Tiền sử bệnh lý chung:</span>{" "}
                  <span className="font-semibold text-slate-800">{record.MA_TSBT === 1 ? "Có bệnh lý" : "Khỏe mạnh, không có bệnh lý"}</span>
                  {record.MA_TSBT === 1 && record.TSBT_TEN_BENH && (
                    <div className="mt-1 text-xs">
                      <span className="text-slate-500">Bệnh lý (ICD-10):</span>{" "}
                      <span className="font-mono bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded font-semibold">{record.TSBT_TEN_BENH}</span>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <span className="text-slate-500 font-medium">Hiện có đang điều trị bệnh:</span>{" "}
                  <span className="font-semibold text-slate-800">{record.CO_DANG_DIEU_TRI_BENH === 1 ? "Đang điều trị" : "Không"}</span>
                  {record.CO_DANG_DIEU_TRI_BENH === 1 && (
                    <div className="mt-1 rounded bg-slate-55 p-2 bg-slate-50 border border-slate-100 text-xs flex flex-col gap-1">
                      <div>
                        <span className="text-slate-500 font-medium">Bệnh đang điều trị:</span>{" "}
                        <span className="font-mono font-bold text-slate-800 text-xs">{record.TEN_BENH_DANG_DIEU_TRI || "---"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Thuốc dùng điều trị:</span>{" "}
                        <span className="font-semibold text-slate-800">{record.TEN_THUOC || "---"}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Vaccine table */}
            <div>
              <h3 className="font-bold text-slate-800 mb-2 text-xs uppercase tracking-wide">3. Lịch sử Tiêm chủng</h3>
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-1.5 text-left font-semibold text-slate-600">Vắc xin BCG</th>
                      <th className="px-3 py-1.5 text-left font-semibold text-slate-600">Bạch hầu, Ho gà, Uốn ván</th>
                      <th className="px-3 py-1.5 text-left font-semibold text-slate-600">Sởi</th>
                      <th className="px-3 py-1.5 text-left font-semibold text-slate-600">Bại liệt</th>
                      <th className="px-3 py-1.5 text-left font-semibold text-slate-600">Viêm não Nhật Bản B</th>
                      <th className="px-3 py-1.5 text-left font-semibold text-slate-600">Viêm gan B</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    <tr>
                      <td className="px-3 py-2 text-slate-805 font-medium">{getVaccineLabel(record.TIEM_CHUNG_BCG)}</td>
                      <td className="px-3 py-2 text-slate-805 font-medium">{getVaccineLabel(record.TIEM_CHUNG_BH_HG_UV)}</td>
                      <td className="px-3 py-2 text-slate-805 font-medium">{getVaccineLabel(record.TIEM_CHUNG_SOI)}</td>
                      <td className="px-3 py-2 text-slate-805 font-medium">{getVaccineLabel(record.TIEM_CHUNG_BAI_LIET)}</td>
                      <td className="px-3 py-2 text-slate-805 font-medium">{getVaccineLabel(record.TIEM_CHUNG_VNNB_B)}</td>
                      <td className="px-3 py-2 text-slate-805 font-medium font-semibold text-blue-800">{getVaccineLabel(record.TIEM_CHUNG_VGB)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {record.TIEM_CHUNG_CAC_LOAI_KHAC === 1 && record.TIEM_CHUNG_VAC_XIN_KHAC && (
                <p className="mt-2 text-xs text-slate-600">
                  <span className="text-slate-500 font-medium">Vắc xin khác đã tiêm:</span>{" "}
                  <span className="font-semibold text-slate-800">{record.TIEM_CHUNG_VAC_XIN_KHAC}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3 */}
        <div className="mb-8">
          <div className="bg-slate-100 py-1.5 px-3 rounded mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">
              III. KHÁM THỂ LỰC
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div className="border rounded-lg p-3 bg-slate-50/50">
              <p className="text-xs text-slate-400 uppercase font-medium">Chiều cao</p>
              <p className="text-lg font-bold text-slate-800 mt-1">{record.CHIEU_CAO ? `${record.CHIEU_CAO} cm` : "---"}</p>
            </div>
            <div className="border rounded-lg p-3 bg-slate-50/50">
              <p className="text-xs text-slate-400 uppercase font-medium">Cân nặng</p>
              <p className="text-lg font-bold text-slate-800 mt-1">{record.CAN_NANG ? `${record.CAN_NANG} kg` : "---"}</p>
            </div>
            <div className="border rounded-lg p-3 bg-blue-50/50 border-blue-200">
              <p className="text-xs text-blue-508 uppercase font-medium">Chỉ số BMI</p>
              <p className="text-lg font-black text-blue-900 mt-1">{record.CHI_SO_BMI || "---"}</p>
            </div>
            <div className="border rounded-lg p-3 bg-slate-50/50">
              <p className="text-xs text-slate-400 uppercase font-medium">Mạch</p>
              <p className="text-lg font-bold text-slate-800 mt-1">{record.MACH ? `${record.MACH} lần/phút` : "---"}</p>
            </div>
            <div className="border rounded-lg p-3 bg-slate-50/50 col-span-2 md:col-span-1">
              <p className="text-xs text-slate-400 uppercase font-medium">Huyết áp</p>
              <p className="text-lg font-bold text-slate-800 mt-1">{record.HUYET_AP ? `${record.HUYET_AP} mmHg` : "---"}</p>
            </div>
          </div>
        </div>

        {/* Section 4 */}
        <div className="mb-8">
          <div className="bg-slate-100 py-1.5 px-3 rounded mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">
              IV. KHÁM LÂM SÀNG
            </h2>
          </div>

          <div className="space-y-4 text-sm">
            {/* Nhi khoa */}
            {record.KHAM_NHI_KHOA === 1 && (
              <div className="border rounded-lg p-4 bg-slate-50/40">
                <h3 className="font-bold text-slate-905 mb-2 text-xs uppercase tracking-wide text-blue-700">A. Khám Nhi Khoa</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium">Tuần hoàn:</span>{" "}
                    <span className="text-slate-800 font-semibold">{record.NHI_KHOA_TUAN_HOAN || "Bình thường"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Hô hấp:</span>{" "}
                    <span className="text-slate-800 font-semibold">{record.NHI_KHOA_HO_HAP || "Bình thường"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Tiêu hóa:</span>{" "}
                    <span className="text-slate-800 font-semibold">{record.NHI_KHOA_TIEU_HOA || "Bình thường"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Thận - tiết niệu:</span>{" "}
                    <span className="text-slate-800 font-semibold">{record.NHI_KHOA_THAN_TIETNIEU || "Bình thường"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Thần kinh:</span>{" "}
                    <span className="text-slate-800 font-semibold">{record.NHI_KHOA_THAN_KINH || "Bình thường"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Tâm thần:</span>{" "}
                    <span className="text-slate-800 font-semibold">{record.NHI_KHOA_TAM_THAN || "Bình thường"}</span>
                  </div>
                  {record.NHI_KHOA_KHAC === 1 && (
                    <div className="md:col-span-2 bg-slate-100/50 p-2 rounded border mt-1">
                      <span className="text-slate-500 font-medium">Khám nhi khác ({record.TEN_LOAI_KHAM_NHI_KHOA_KHAC}):</span>{" "}
                      <span className="text-slate-805 font-bold">{record.KET_QUA_KHAM_NHI_KHOA_KHAC}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mắt */}
            {record.KHAM_MAT === 1 && (
              <div className="border rounded-lg p-4 bg-slate-50/40">
                <h3 className="font-bold text-slate-905 mb-2 text-xs uppercase tracking-wide text-blue-700">B. Khám Mắt</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3.5 gap-x-6">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="border p-1.5 rounded text-center">
                      <p className="text-slate-450 font-medium text-[10px] uppercase">Không kính (Phải)</p>
                      <p className="font-bold text-slate-800 mt-0.5">{record.KHONG_KINH_MAT_PHAI || "---"}</p>
                    </div>
                    <div className="border p-1.5 rounded text-center">
                      <p className="text-slate-450 font-medium text-[10px] uppercase">Không kính (Trái)</p>
                      <p className="font-bold text-slate-800 mt-0.5">{record.KHONG_KINH_MAT_TRAI || "---"}</p>
                    </div>
                    <div className="border p-1.5 rounded text-center">
                      <p className="text-slate-450 font-medium text-[10px] uppercase">Có kính (Phải)</p>
                      <p className="font-bold text-slate-800 mt-0.5">{record.CO_KINH_MAT_PHAI || "Không đeo"}</p>
                    </div>
                    <div className="border p-1.5 rounded text-center">
                      <p className="text-slate-450 font-medium text-[10px] uppercase">Có kính (Trái)</p>
                      <p className="font-bold text-slate-800 mt-0.5">{record.CO_KINH_MAT_TRAI || "Không đeo"}</p>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center space-y-1.5 text-xs">
                    <div>
                      <span className="text-slate-500 font-medium">Bệnh về mắt (nếu khó):</span>{" "}
                      <span className="text-slate-800 font-semibold">{record.BENH_KHAC_MAT || "Không"}</span>
                    </div>
                    <div className="bg-blue-50/40 p-2 rounded border border-blue-100">
                      <span className="text-blue-800 font-semibold">Kết luận bệnh về mắt:</span>{" "}
                      <span className="text-slate-850 font-bold">{record.KET_LUAN_MAT || "Bình thường"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tai Mũi Họng */}
            {record.KHAM_TAI_MUI_HONG === 1 && (
              <div className="border rounded-lg p-4 bg-slate-50/40">
                <h3 className="font-bold text-slate-905 mb-2 text-xs uppercase tracking-wide text-blue-700">C. Khám Tai Mũi Họng</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3.5 gap-x-6">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="border p-1.5 rounded">
                      <p className="text-slate-450 text-[10px] font-medium uppercase text-center">Nói thường (Trái)</p>
                      <p className="font-bold text-slate-800 text-center">{record.TAI_TRAI_NOI_THUONG || "---"}</p>
                    </div>
                    <div className="border p-1.5 rounded">
                      <p className="text-slate-450 text-[10px] font-medium uppercase text-center">Nói thầm (Trái)</p>
                      <p className="font-bold text-slate-800 text-center">{record.TAI_TRAI_NOI_THAM || "---"}</p>
                    </div>
                    <div className="border p-1.5 rounded">
                      <p className="text-slate-450 text-[10px] font-medium uppercase text-center">Nói thường (Phải)</p>
                      <p className="font-bold text-slate-800 text-center">{record.TAI_PHAI_NOI_THUONG || "---"}</p>
                    </div>
                    <div className="border p-1.5 rounded">
                      <p className="text-slate-450 text-[10px] font-medium uppercase text-center">Nói thầm (Phải)</p>
                      <p className="font-bold text-slate-800 text-center">{record.TAI_PHAI_NOI_THAM || "---"}</p>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center space-y-1.5 text-xs">
                    <div>
                      <span className="text-slate-500 font-medium">Bệnh về tai mũi họng (nếu có):</span>{" "}
                      <span className="text-slate-800 font-semibold">{record.BENH_KHAC_TAI_MUI_HONG || "Không"}</span>
                    </div>
                    <div className="bg-blue-50/40 p-2 rounded border border-blue-100">
                      <span className="text-blue-800 font-semibold">Kết luận TMH:</span>{" "}
                      <span className="text-slate-855 font-bold">{record.KET_LUAN_TAI_MUI_HONG || "Bình thường"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Răng Hàm Mặt */}
            {record.KHAM_RANG_HAM_MAT === 1 && (
              <div className="border rounded-lg p-4 bg-slate-50/40">
                <h3 className="font-bold text-slate-905 mb-2 text-xs uppercase tracking-wide text-blue-700">D. Khám Răng Hàm Mặt</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <p>
                      <span className="text-slate-500 font-medium">Khám Hàm Trên:</span>{" "}
                      <span className="font-semibold text-slate-800">{record.HAM_TREN || "Bình thường"}</span>
                    </p>
                    <p>
                      <span className="text-slate-500 font-medium">Khám Hàm Dưới:</span>{" "}
                      <span className="font-semibold text-slate-800">{record.HAM_DUOI || "Bình thường"}</span>
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <p>
                      <span className="text-slate-500 font-medium">Bệnh lý RHM (nếu có):</span>{" "}
                      <span className="font-semibold text-slate-805">{record.BENH_KHAC_RANG_HAM_MAT || "Không"}</span>
                    </p>
                    <div className="bg-blue-50/40 p-2 rounded border border-blue-100">
                      <span className="text-blue-800 font-semibold">Kết luận Răng-Hàm-Mặt:</span>{" "}
                      <span className="font-bold text-slate-855">{record.KET_LUAN_RANG_HAM_MAT || "Bình thường"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 5 */}
        <div className="mb-8">
          <div className="bg-slate-100 py-1.5 px-3 rounded mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">
              V. KHÁM CẬN LÂM SÀNG
            </h2>
          </div>

          <div className="space-y-4 text-sm">
            {/* Xét nghiệm máu */}
            {record.XET_NGHIEM_MAU === 1 ? (
              <div className="border rounded-lg p-4 bg-slate-50/40">
                <h3 className="font-bold text-slate-800 mb-2 text-xs uppercase tracking-wide text-indigo-700">1. Xét nghiệm máu & Sinh hóa</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 text-center text-xs">
                  <div className="border p-2 rounded bg-white">
                    <p className="text-slate-505 font-medium text-[10px]">HỒNG CẦU (HC)</p>
                    <p className="font-bold text-slate-800 mt-1">{record.CHI_SO_HC || "---"}</p>
                  </div>
                  <div className="border p-2 rounded bg-white">
                    <p className="text-slate-505 font-medium text-[10px]">BẠCH CẦU (BC)</p>
                    <p className="font-bold text-slate-800 mt-1">{record.CHI_SO_BACH_CAU || "---"}</p>
                  </div>
                  <div className="border p-2 rounded bg-white">
                    <p className="text-slate-505 font-medium text-[10px]">TIỂU CẦU (TC)</p>
                    <p className="font-bold text-slate-800 mt-1">{record.CHI_SO_TIEU_CAU || "---"}</p>
                  </div>
                  <div className="border p-2 rounded bg-white">
                    <p className="text-slate-505 font-medium text-[10px]">ĐƯỜNG MÁU</p>
                    <p className="font-bold text-slate-800 mt-1">{record.DUONG_MAU || "---"}</p>
                  </div>
                  <div className="border p-2 rounded bg-white">
                    <p className="text-slate-505 font-medium text-[10px]">URÊ</p>
                    <p className="font-bold text-slate-800 mt-1">{record.URE || "---"}</p>
                  </div>
                  <div className="border p-2 rounded bg-white">
                    <p className="text-slate-505 font-medium text-[10px]">CREATININ</p>
                    <p className="font-bold text-slate-800 mt-1">{record.CREATININ || "---"}</p>
                  </div>
                  <div className="border p-2 rounded bg-white">
                    <p className="text-slate-505 font-medium text-[10px]">ASAT (GOT)</p>
                    <p className="font-bold text-slate-800 mt-1">{record.ASAT || "---"}</p>
                  </div>
                  <div className="border p-2 rounded bg-white">
                    <p className="text-slate-505 font-medium text-[10px]">ALAT (GPT)</p>
                    <p className="font-bold text-slate-800 mt-1">{record.ALAT || "---"}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 italic text-xs">Không có chỉ định xét nghiệm máu.</p>
            )}

            {/* Xét nghiệm nước tiểu */}
            {record.XET_NGHIEM_NUOC_TIEU === 1 ? (
              <div className="border rounded-lg p-4 bg-slate-50/40">
                <h3 className="font-bold text-slate-800 mb-2 text-xs uppercase tracking-wide text-indigo-700">2. Xét nghiệm nước tiểu</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="border p-2 rounded bg-white">
                    <span className="text-slate-500 font-medium">Chỉ số Đường:</span>{" "}
                    <span className="font-bold text-indigo-900">{record.CHI_SO_DUONG || "---"}</span>
                  </div>
                  <div className="border p-2 rounded bg-white">
                    <span className="text-slate-500 font-medium">Chỉ số Protein:</span>{" "}
                    <span className="font-bold text-indigo-900">{record.CHI_SO_PROTEIN || "---"}</span>
                  </div>
                  {record.CHI_SO_KHAC && (
                    <div className="border p-2 rounded bg-white col-span-1 sm:col-span-1">
                      <span className="text-slate-500 font-medium">Chỉ số khác:</span>{" "}
                      <span className="font-semibold text-slate-800">{record.CHI_SO_KHAC}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-slate-500 italic text-xs">Không có chỉ định xét nghiệm nước tiểu.</p>
            )}

            {/* CĐHA & Điện tim & Khác */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 bg-slate-50/40">
                <h3 className="font-bold text-slate-800 mb-2 text-xs uppercase tracking-wide text-indigo-700">3. Chẩn đoán hình ảnh</h3>
                {record.CHAN_DOAN_HINH_ANH === 1 ? (
                  <p className="font-semibold text-slate-800 text-xs bg-white p-2.5 rounded border border-slate-100">
                    {record.KET_QUA_CHAN_DOAN_HINH_ANH || "Không phát hiện bất thường"}
                  </p>
                ) : (
                  <p className="text-slate-500 italic text-xs">Không có chỉ định CĐHA.</p>
                )}
              </div>

              <div className="border rounded-lg p-4 bg-slate-50/40">
                <h3 className="font-bold text-slate-800 mb-2 text-xs uppercase tracking-wide text-indigo-700">4. Điện tim (ECG)</h3>
                {record.DIEN_TIM === 1 ? (
                  <p className="font-semibold text-slate-800 text-xs bg-white p-2.5 rounded border border-slate-100">
                    {record.KET_QUA_DIEN_TIM || "Nhịp xoang bình thường"}
                  </p>
                ) : (
                  <p className="text-slate-500 italic text-xs">Không có chỉ định Điện tim.</p>
                )}
              </div>
            </div>

            {record.XET_NGHIEM_KHAC === 1 && record.TEN_XET_NGHIEM_KHAC && (
              <div className="border rounded-lg p-4 bg-purple-50/30 border-purple-100">
                <h3 className="font-bold text-purple-800 mb-2 text-xs uppercase tracking-wide">5. Xét nghiệm chuyên khoa khác</h3>
                <p className="text-xs">
                  <span className="text-slate-500 font-medium">Tên xét nghiệm:</span>{" "}
                  <span className="font-bold text-purple-950">{record.TEN_XET_NGHIEM_KHAC}</span>
                </p>
                <p className="text-xs mt-1 bg-white p-2 rounded border border-purple-100 mt-1.5 font-semibold text-slate-800">
                  {record.KET_QUA_XET_NGHIEM_KHAC || "---"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Section 6 */}
        <div className="mb-8">
          <div className="bg-slate-100 py-1.5 px-3 rounded mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">
              VI. KẾT LUẬN ĐỒNG BỘ
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
            <div className="bg-emerald-50/40 border border-emerald-250 p-4 rounded-lg">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1">
                Phân loại sức khỏe lâm sàng
              </h4>
              <p className="text-xl font-extrabold text-emerald-950 font-sans">
                {record.KET_LUAN_LOAI_SUC_KHOE || "Chưa xếp loại"}
              </p>
            </div>

            <div className="bg-slate-50 border p-4 rounded-lg">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Biện pháp / Vấn đề sức khỏe cần lưu ý
              </h4>
              <p className="font-semibold text-slate-800 text-sm mt-1">
                {record.KET_LUAN_CAC_VAN_DE_SUC_KHOE || "---"}
              </p>
            </div>
          </div>
        </div>

        {/* Signature & Authentication Section (3 Columns) */}
        <div className="mt-14 border-t pt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-[11px] text-slate-700">
          {/* Patient Sig */}
          <div className="flex flex-col justify-between items-center h-52">
            <div>
              <p className="font-bold uppercase text-slate-500 tracking-wider">NGƯỜI KHÁM SỨC KHỎE</p>
              <p className="text-slate-400 italic text-[10px] mt-0.5">Ký và ghi rõ họ tên</p>
            </div>
            <div className="h-24 flex items-center justify-center w-full">
              {record.CKS_NGUOI_KHAM ? (
                <div className="flex flex-col items-center gap-1 text-[9px] text-emerald-700 bg-emerald-50/60 border border-emerald-200 py-2 px-3 rounded-lg w-full max-w-[170px]">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-mono font-bold tracking-tight">CKS CHỨNG THỰC</span>
                  <span className="opacity-75 font-semibold text-[8px] truncate max-w-full">
                    {record.CKS_NGUOI_KHAM.includes("\n") 
                      ? record.CKS_NGUOI_KHAM.split("\n")[1]?.substring(0, 20) 
                      : record.CKS_NGUOI_KHAM.substring(0, 16)}...
                  </span>
                </div>
              ) : (
                <span className="text-slate-350 italic text-[10px] border border-dashed border-slate-200 bg-slate-50/50 py-2.5 px-3 rounded-md">Đã xác nhận vân tay/ký</span>
              )}
            </div>
            <p className="font-bold text-slate-800 uppercase mt-2">{record.HO_TEN || "---"}</p>
          </div>

          {/* Examining Doctor Sig (SmartCA check) */}
          <div className="flex flex-col justify-between items-center h-52">
            <div>
              <p className="font-bold uppercase text-slate-500 tracking-wider">BÁC SĨ KHÁM LÂM SÀNG</p>
              <p className="text-slate-400 italic text-[10px] mt-0.5">Xác nhận chuyên môn y tế</p>
            </div>
            <div className="h-24 flex items-center justify-center w-full">
              {record.CKS_NGUOI_KET_LUAN ? (() => {
                const details = parseSignatureDetails(record.CKS_NGUOI_KET_LUAN);
                if (details && details.isSmartCA) {
                  return (
                    <div className="flex flex-col items-center gap-0.5 text-[8.5px] text-blue-700 bg-blue-50/80 border border-blue-200 py-2 px-2.5 rounded-lg w-full max-w-[170px] shadow-xs">
                      <div className="flex items-center gap-1 text-blue-800 font-extrabold tracking-tight uppercase text-[8px] border-b pb-0.5 w-full justify-center">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                        <span>VNPT SmartCA</span>
                      </div>
                      <span className="font-bold text-slate-900 mt-1 truncate max-w-full">{details.owner}</span>
                      <span className="text-[7.5px] text-slate-500 italic truncate max-w-full leading-none">{details.title}</span>
                      <span className="text-[7px] text-slate-400 font-mono font-semibold mt-1 bg-white px-1 py-0.2 rounded border border-slate-150">{details.time}</span>
                    </div>
                  );
                }
                return (
                  <div className="flex flex-col items-center gap-1 text-[9px] text-blue-700 bg-blue-50 border border-blue-200 py-2 px-3 rounded-lg w-full max-w-[170px]">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <span className="font-mono font-bold tracking-tight">KÝ SỐ APPROVED</span>
                    <span className="opacity-75 font-semibold text-[8px] truncate max-w-full">{record.CKS_NGUOI_KET_LUAN.substring(0, 18)}</span>
                  </div>
                );
              })() : (
                <span className="text-slate-400 italic text-[10px] border border-dashed border-slate-205 bg-slate-50/50 py-2 px-4 rounded-md">Chờ bác sĩ ký số</span>
              )}
            </div>
            <p className="font-bold text-slate-800 uppercase mt-2">
              {record.CKS_NGUOI_KET_LUAN ? (parseSignatureDetails(record.CKS_NGUOI_KET_LUAN)?.owner.replace("BS. CKII. ", "").replace("BS. CK I. ", "").replace("BS. ", "") || "Bác sĩ khám") : "Bác sỹ Trưởng khoa"}
            </p>
          </div>

          {/* Unit / Hospital Sig (SmartCA check) */}
          <div className="flex flex-col justify-between items-center h-52">
            <div>
              <p className="font-bold uppercase text-slate-500 tracking-wider">ĐẠI DIỆN CƠ SỞ KHÁM CHỮA BỆNH</p>
              <p className="text-slate-400 italic text-[10px] mt-0.5">Ký số & đóng dấu điện tử pháp nhân</p>
            </div>
            <div className="h-24 flex items-center justify-center relative w-full">
              {record.CKS_BENH_VIEN ? (
                <div className="flex flex-col items-center justify-center w-full">
                  <div className="rounded-full border-4 border-red-500/80 p-2 text-center text-[9px] uppercase font-black text-red-500 tracking-widest rotate-[-5deg] w-24 h-24 flex flex-col justify-center items-center select-none shadow-xs border-dashed bg-white/20 print:bg-transparent z-10">
                    <span className="text-[7.5px] scale-95 leading-none">CƠ SỞ Y TẾ</span>
                    <span className="text-[6.5px] font-mono leading-none mt-1 text-red-400">{record.MA_CSKCB || "79001"}</span>
                    <span className="text-[7px] text-red-600 font-bold mt-1 max-w-[80px] break-words uppercase leading-none">
                      {record.CKS_BENH_VIEN.includes("\n") 
                        ? (parseSignatureDetails(record.CKS_BENH_VIEN)?.owner.replace("Bệnh viện ", "BV ").replace("Cần Thơ", "CT").replace("Hồ Chí Minh", "HCM") || "ĐÃ KÝ HSM")
                        : "ĐÃ KÝ SỐ"}
                    </span>
                  </div>
                  
                  {record.CKS_BENH_VIEN.includes("\n") && (
                    <div className="absolute top-[85%] text-[7px] text-slate-450 font-mono font-bold leading-none select-text print:block hidden">
                      SmartCA HSM: {parseSignatureDetails(record.CKS_BENH_VIEN)?.serial}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-slate-400 italic text-[10px] border border-dashed border-slate-205 bg-slate-50/50 py-2 px-4 rounded-md">Đợi dấu cơ sở</span>
              )}
            </div>
            <p className="font-bolder text-slate-800 uppercase mt-2">Đại diện Cơ sở khám chữa bệnh</p>
          </div>
        </div>
      </motion.div>

      {/* Embedding the interactive VNPT SmartCA simulator modal */}
      <AnimatePresence>
        {isSmartCAModalOpen && (
          <SmartCASignerModal
            record={record}
            isOpen={isSmartCAModalOpen}
            onClose={() => setIsSmartCAModalOpen(false)}
            onSuccess={handleSignatureSuccess}
            initialRole={smartCARole}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
