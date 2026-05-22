/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { HealthRecord } from "../types";
import { 
  Plus, Search, FileText, Edit3, Trash2, FolderPlus, 
  Download, Upload, Heart, Award, ArrowUpRight, ShieldCheck, RefreshCcw,
  FileSignature, Check, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getGenderLabel, formatDate } from "./PrintPreview";
import { importRecordsFromExcel, exportRecordsToExcel, downloadExcelTemplateOnly } from "../excelHelper";
import SmartCASignerModal from "./SmartCASignerModal";

interface DashboardProps {
  records: HealthRecord[];
  onAddRecord: () => void;
  onEditRecord: (record: HealthRecord) => void;
  onViewRecord: (record: HealthRecord) => void;
  onDeleteRecord: (id: string) => void;
  onImportRecords: (newRecords: HealthRecord[]) => void;
  onResetSampleData: () => void;
  onUpdateRecord?: (record: HealthRecord) => void;
}

export default function Dashboard({
  records,
  onAddRecord,
  onEditRecord,
  onViewRecord,
  onDeleteRecord,
  onImportRecords,
  onResetSampleData,
  onUpdateRecord
}: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");

  // States for SmartCA interactive modal execution
  const [isSmartCAModalOpen, setIsSmartCAModalOpen] = useState(false);
  const [smartCARole, setSmartCARole] = useState<"doctor" | "leader" | "unit">("doctor");
  const [activeRecordToSign, setActiveRecordToSign] = useState<HealthRecord | null>(null);

  const handleOpenSmartCA = (rec: HealthRecord) => {
    setActiveRecordToSign(rec);
    if (!rec.CKS_NGUOI_KET_LUAN) {
      setSmartCARole("doctor");
    } else if (!rec.CKS_LANH_DAO) {
      setSmartCARole("leader");
    } else if (!rec.CKS_BENH_VIEN) {
      setSmartCARole("unit");
    } else {
      setSmartCARole("doctor"); // default fallback
    }
    setIsSmartCAModalOpen(true);
  };

  const handleSmartCASuccess = (updated: HealthRecord) => {
    if (onUpdateRecord) {
      onUpdateRecord(updated);
    }
    setActiveRecordToSign(updated);
  };

  // Filtering records based on search term and filters
  const filteredRecords = records.filter(rec => {
    const matchesSearch = 
      rec.HO_TEN.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.SO_CCCD.includes(searchTerm) ||
      rec.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.MA_LK && rec.MA_LK.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesGender = 
      genderFilter === "all" || 
      rec.GIOI_TINH.toString() === genderFilter;

    const matchesGrade = 
      gradeFilter === "all" || 
      (rec.KET_LUAN_LOAI_SUC_KHOE || "").toLowerCase().includes(gradeFilter.toLowerCase());

    return matchesSearch && matchesGender && matchesGrade;
  });

  // KPI calculations
  const totalRecords = records.length;
  
  // Average BMI
  const recordsWithBmi = records.filter(r => r.CHI_SO_BMI && !isNaN(parseFloat(r.CHI_SO_BMI)));
  const avgBmi = recordsWithBmi.length > 0 
    ? (recordsWithBmi.reduce((sum, r) => sum + parseFloat(r.CHI_SO_BMI), 0) / recordsWithBmi.length).toFixed(1)
    : "---";

  // Counts of Grade 1 or 2 health
  const healthyCount = records.filter(r => {
    const grade = (r.KET_LUAN_LOAI_SUC_KHOE || "").toLowerCase();
    return grade.includes("loại i") || grade.includes("loại ii");
  }).length;

  const healthyRate = totalRecords > 0 ? Math.round((healthyCount / totalRecords) * 100) : 0;

  // Handle Excel Import
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedRecords = await importRecordsFromExcel(file);
      if (parsedRecords.length > 0) {
        onImportRecords(parsedRecords);
        alert(`Đã nhập thành công ${parsedRecords.length} hồ sơ khám sức khỏe từ tệp Excel!`);
      } else {
        alert("Không tìm thấy dữ liệu hợp lệ trong file Excel.");
      }
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra khi đọc tệp Excel. Vui lòng kiểm tra lại định dạng tệp.");
    }
    // Reset file input so users can recheck
    e.target.value = "";
  };

  // Export records of selection or all to Excel
  const handleExcelExport = () => {
    if (records.length === 0) {
      alert("Chưa có hồ sơ nào để xuất dữ liệu.");
      return;
    }
    try {
      exportRecordsToExcel(records, `DanhSach_HoSo_KhamSucKhoe_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi xuất tệp Excel.");
    }
  };

  // Download official Excel template helper
  const handleDownloadTemplate = () => {
    try {
      downloadExcelTemplateOnly();
    } catch (err) {
      console.error(err);
      alert("Lỗi khi tải mẫu Excel.");
    }
  };

  return (
    <div className="space-y-6">
      {/* High-Level Overview KPIs (Grid layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/85 shadow-xs flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng số hồ sơ lưu trữ</span>
            <p className="text-2xl font-extrabold text-slate-800 mt-1 font-sans">{totalRecords}</p>
            <p className="text-[10px] text-slate-450 mt-1">Hồ sơ điện tử lưu ở LocalStorage</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/85 shadow-xs flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chỉ số BMI trung bình</span>
            <p className="text-2xl font-extrabold text-slate-800 mt-1 font-sans">{avgBmi}</p>
            <p className="text-[10px] text-slate-450 mt-1">Đánh giá cân nặng cơ thể</p>
          </div>
          <div className="bg-rose-50 p-3 rounded-xl text-rose-600">
            <Heart className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/85 shadow-xs flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tỷ lệ Sức khỏe tốt</span>
            <p className="text-2xl font-extrabold text-slate-800 mt-1 font-sans">{healthyRate}%</p>
            <p className="text-[10px] text-slate-450 mt-1">Xếp loại sức khỏe Loại I, II</p>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/85 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chứng chỉ số KSK</span>
              <p className="text-xs font-bold text-emerald-600 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Chuẩn XML/JSON gửi bộ
              </p>
            </div>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
              KẾT NỐI SẴN SÀNG
            </span>
          </div>
          <p className="text-[10px] text-slate-405 mt-2">Phù hợp quyết định 19/2025/QĐ-TTg</p>
        </div>
      </div>

      {/* Control panel and search */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo Tên bệnh nhân, CCCD, ID hồ sơ, Lượt khám..."
              className="w-full text-sm pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-sans"
              id="search-input"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {/* Gender filter */}
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="text-xs font-semibold py-2 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none cursor-pointer"
            >
              <option value="all">Tất cả giới tính</option>
              <option value="1">Nam</option>
              <option value="2">Nữ</option>
              <option value="3">Chưa xác định</option>
            </select>

            {/* Health rating check */}
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="text-xs font-semibold py-2 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none cursor-pointer"
            >
              <option value="all">Tất cả phân loại tốt/yếu</option>
              <option value="Loại I">Loại I</option>
              <option value="Loại II">Loại II</option>
              <option value="Loại III">Loại III</option>
              <option value="Loại IV">Loại IV</option>
              <option value="Loại V">Loại V</option>
            </select>
          </div>
        </div>

        {/* Database import/export and add button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-t border-slate-100 pt-4 gap-4">
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg cursor-pointer border border-emerald-200/60 transition-colors">
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              Nhập Excel
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                onChange={handleExcelImport} 
                className="hidden" 
              />
            </label>

            <button
              onClick={handleExcelExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-650 bg-slate-50 hover:bg-slate-100/80 rounded-lg border border-slate-200/60 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Xuất tệp Excel
            </button>

            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200/60 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              Tải file mẫu Excel
            </button>

            <button
              onClick={onResetSampleData}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200/60 transition-colors cursor-pointer"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              Tải dữ liệu mẫu
            </button>
          </div>

          <button
            onClick={onAddRecord}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-xs hover:shadow-sm transition-all cursor-pointer"
            id="btn-add-new-record"
          >
            <Plus className="w-4 h-4" />
            Thêm hồ sơ mới
          </button>
        </div>
      </div>

      {/* Grid records catalog list */}
      {filteredRecords.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl p-16 text-center border-2 border-dashed border-slate-200">
          <FolderPlus className="w-12 h-12 text-slate-350 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">Không tìm thấy hồ sơ nào</h3>
          <p className="text-xs text-slate-450 mt-1 max-w-sm mx-auto">
            Hãy thử tìm kiếm bằng từ khóa khác hoặc nhấp vào nút "Thêm hồ sơ mới" để ghi nhận thông tin hành chính kiểm tra sức khỏe.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="records-grid">
          {filteredRecords.map((rec) => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="bg-white border text-left border-slate-200/85 hover:border-slate-300 rounded-2xl shadow-xs hover:shadow-xs p-5 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className="text-[10px] font-mono font-black text-slate-400 bg-slate-100 py-0.5 px-1.5 rounded">
                    {rec.id}
                  </span>
                  <span className={`text-[10px] uppercase font-black py-0.5 px-2 rounded-full ${
                    !rec.KET_LUAN_LOAI_SUC_KHOE 
                      ? "bg-slate-100 text-slate-600"
                      : rec.KET_LUAN_LOAI_SUC_KHOE.includes("Loại I") || rec.KET_LUAN_LOAI_SUC_KHOE.includes("Loại II")
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                      : "bg-amber-50 text-amber-805 border border-amber-100"
                  }`}>
                    {rec.KET_LUAN_LOAI_SUC_KHOE || "Mới tạo / Chờ khám"}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight truncate">
                  {rec.HO_TEN || "Chưa điện họ tên"}
                </h3>

                <div className="space-y-1.5 mt-3 text-xs text-slate-500">
                  <p className="flex justify-between">
                    <span>CMND/CCCD:</span>
                    <span className="font-mono text-slate-700 font-semibold">{rec.SO_CCCD || "---"}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Giới tính:</span>
                    <span className="text-slate-700 font-medium">{getGenderLabel(rec.GIOI_TINH)}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Ngày kiểm tra:</span>
                    <span className="font-mono text-slate-700 font-semibold">{formatDate(rec.NGAY_VAO)}</span>
                  </p>
                  {rec.CHI_SO_BMI && (
                    <p className="flex justify-between">
                      <span>Chỉ số BMI:</span>
                      <span className="font-mono text-slate-800 font-bold">{rec.CHI_SO_BMI}</span>
                    </p>
                  )}
                  {rec.LY_DO_VV && (
                    <p className="text-[11px] bg-slate-50/50 p-2 rounded-lg text-slate-550 border border-slate-100/80 line-clamp-1 italic mt-1.5">
                      Lý do: {rec.LY_DO_VV}
                    </p>
                  )}
                </div>

                {/* Trạng thái Ký số Phê duyệt VNPT SmartCA */}
                <div className="mt-3.5 pt-3 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tiến trình Ký số SmartCA:</span>
                    <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.2 rounded-full uppercase tracking-tight scale-95 border border-blue-100">VNPT SmartCA</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 px-0.5 text-[9.5px] text-center">
                    {/* Bác sĩ khám lâm sàng */}
                    <div className={`py-1 px-0.5 rounded border ${rec.CKS_NGUOI_KET_LUAN ? "bg-emerald-50/30 text-emerald-700 border-emerald-150" : "bg-slate-50 text-slate-400 border-slate-150"}`}>
                      <div className="font-bold text-[8px] uppercase tracking-tight">1. Bác sĩ</div>
                      <div className="flex items-center justify-center gap-0.5 mt-0.5 font-bold">
                        {rec.CKS_NGUOI_KET_LUAN ? (
                          <>
                            <Check className="w-2.5 h-2.5 text-emerald-600 font-black" />
                            <span className="text-[8.5px] tracking-tight">ĐÃ KÝ</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-2.5 h-2.5 text-slate-350" />
                            <span className="text-slate-500 text-[8.5px] tracking-tight">CHỜ KÝ</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Ban Lãnh đạo */}
                    <div className={`py-1 px-0.5 rounded border ${rec.CKS_LANH_DAO ? "bg-indigo-50/30 text-indigo-700 border-indigo-150" : "bg-slate-50 text-slate-400 border-slate-150"}`}>
                      <div className="font-bold text-[8px] uppercase tracking-tight">2. Lãnh đạo</div>
                      <div className="flex items-center justify-center gap-0.5 mt-0.5 font-bold">
                        {rec.CKS_LANH_DAO ? (
                          <>
                            <Check className="w-2.5 h-2.5 text-indigo-600 font-black" />
                            <span className="text-[8.5px] tracking-tight">ĐÃ DUYỆT</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-2.5 h-2.5 text-slate-350" />
                            <span className="text-slate-500 text-[8.5px] tracking-tight">CHỜ DUYỆT</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Con dấu đơn vị */}
                    <div className={`py-1 px-0.5 rounded border ${rec.CKS_BENH_VIEN ? "bg-rose-50/30 text-rose-700 border-rose-150" : "bg-slate-50 text-slate-400 border-slate-150"}`}>
                      <div className="font-bold text-[8px] uppercase tracking-tight">3. Đơn vị</div>
                      <div className="flex items-center justify-center gap-0.5 mt-0.5 font-bold">
                        {rec.CKS_BENH_VIEN ? (
                          <>
                            <Check className="w-2.5 h-2.5 text-rose-600 font-black" />
                            <span className="text-[8.5px] tracking-tight">ĐÃ DẤU</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-2.5 h-2.5 text-slate-350" />
                            <span className="text-slate-500 text-[8.5px] tracking-tight">CHỜ DẤU</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action row at bottom */}
              <div className="flex gap-1.5 border-t border-slate-100 mt-4 pt-3">
                <button
                  onClick={() => onViewRecord(rec)}
                  className="flex-1 flex justify-center items-center gap-1.5 py-1.5 text-xs font-bold text-slate-650 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Chi tiết
                </button>

                <button
                  onClick={() => handleOpenSmartCA(rec)}
                  className="flex-1 flex justify-center items-center gap-1.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer transition-colors shadow-xs"
                >
                  <FileSignature className="w-3.5 h-3.5" />
                  Ký SmartCA
                </button>

                <button
                  onClick={() => onEditRecord(rec)}
                  className="flex justify-center items-center p-2 text-slate-500 hover:text-slate-800 bg-slate-55 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                  title="Sửa thông tin"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    if (confirm(`Bạn chắc chắn muốn xóa hồ sơ khám sức khỏe của bệnh nhân ${rec.HO_TEN}?`)) {
                      onDeleteRecord(rec.id);
                    }
                  }}
                  className="flex justify-center items-center p-2 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl cursor-pointer transition-colors"
                  title="Xóa hồ sơ"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Direct SmartCA overlay mock container */}
      <AnimatePresence>
        {isSmartCAModalOpen && activeRecordToSign && (
          <SmartCASignerModal
            record={activeRecordToSign}
            isOpen={isSmartCAModalOpen}
            onClose={() => setIsSmartCAModalOpen(false)}
            onSuccess={handleSmartCASuccess}
            initialRole={smartCARole}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
