/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { HealthRecord, sampleRecordsList, createEmptyRecord } from "./types";
import Dashboard from "./components/Dashboard";
import RecordForm from "./components/RecordForm";
import PrintPreview from "./components/PrintPreview";
import Login from "./components/Login";
import { Activity, ShieldCheck, HeartPulse, LogOut } from "lucide-react";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const persisted = localStorage.getItem("MED_RECORDS_AUTH");
      const sessioned = sessionStorage.getItem("MED_RECORDS_AUTH");
      return persisted === "true" || sessioned === "true";
    }
    return false;
  });
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [viewState, setViewState] = useState<"dashboard" | "create" | "edit" | "view">("dashboard");
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const handleLogout = () => {
    localStorage.removeItem("MED_RECORDS_AUTH");
    sessionStorage.removeItem("MED_RECORDS_AUTH");
    setIsAuthenticated(false);
  };

  // Load from LocalStorage or default demo data on Mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("MED_RECORDS_STORE");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecords(parsed);
          return;
        }
      }
    } catch (e) {
      console.error("Lỗi khi tải dữ liệu từ localStorage:", e);
    }
    // Fallback to sample list
    setRecords(sampleRecordsList);
  }, []);

  // Save changes to LocalStorage
  const saveAndSyncRecords = (newRecords: HealthRecord[]) => {
    setRecords(newRecords);
    try {
      localStorage.setItem("MED_RECORDS_STORE", JSON.stringify(newRecords));
    } catch (e) {
      console.error("Lỗi khi ghi dữ liệu vào localStorage:", e);
    }
  };

  const handleAddRecord = () => {
    setSelectedRecordId(null);
    setViewState("create");
  };

  const handleEditRecord = (rec: HealthRecord) => {
    setSelectedRecordId(rec.id);
    setViewState("edit");
  };

  const handleViewRecord = (rec: HealthRecord) => {
    setSelectedRecordId(rec.id);
    setViewState("view");
  };

  const handleDeleteRecord = (id: string) => {
    const updated = records.filter(r => r.id !== id);
    saveAndSyncRecords(updated);
  };

  const handleSaveRecord = (record: HealthRecord) => {
    let updated: HealthRecord[];
    if (viewState === "create") {
      // Append new
      updated = [record, ...records];
    } else {
      // Modify existing
      updated = records.map(r => r.id === record.id ? record : r);
    }
    saveAndSyncRecords(updated);
    setViewState("dashboard");
  };

  const handleImportRecords = (newRecords: HealthRecord[]) => {
    // Merge new records, preventing ID duplicates
    const merged = [...records];
    newRecords.forEach(newItem => {
      const index = merged.findIndex(r => r.id === newItem.id);
      if (index !== -1) {
        merged[index] = newItem; // overwrite
      } else {
        merged.unshift(newItem); // prepends
      }
    });
    saveAndSyncRecords(merged);
  };

  const handleResetSampleData = () => {
    if (confirm("Hệ thống sẽ ghi đè toàn bộ dữ liệu hiện tại bằng 2 hồ sơ mẫu chuẩn quốc gia. Xác nhận tải?")) {
      saveAndSyncRecords(sampleRecordsList);
    }
  };

  const handleUpdateRecord = (updatedRec: HealthRecord) => {
    const updated = records.map(r => r.id === updatedRec.id ? updatedRec : r);
    saveAndSyncRecords(updated);
  };

  // Find currently active editing/view records
  const currentRecord = records.find(r => r.id === selectedRecordId);

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
      {/* Top Professional Navigation Header */}
      <header className="bg-white border-b border-rose-100 sticky top-0 z-30 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div 
            onClick={() => setViewState("dashboard")}
            className="flex items-center gap-2.5 cursor-pointer select-none"
            id="app-branding"
          >
            <div className="bg-red-500 text-white p-2 rounded-xl">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="font-sans font-black tracking-tight text-slate-900 text-base leading-none block">
                HỒ SƠ KHÁM SỨC KHỎE ĐIỆN TỬ
              </span>
              <span className="text-[10px] text-slate-450 uppercase tracking-widest leading-none mt-1 block">
                Medical Records Hub • QĐ 19/2025
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
            <div className="hidden lg:flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-[10px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              BẢO MẬT CHỮ KÝ SỐ (SHA256)
            </div>
            <div className="flex items-center gap-1.5 hover:text-red-500 transition-colors cursor-pointer select-none">
              <HeartPulse className="w-4 h-4 text-red-500" />
              <span>Y TẾ ĐỒNG BỘ MẪU VĂN BẢN</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl hover:text-red-600 transition-all cursor-pointer font-bold.5 border border-slate-200/50"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Content */}
      <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto print:p-0 print:max-w-none">
        {viewState === "dashboard" && (
          <Dashboard
            records={records}
            onAddRecord={handleAddRecord}
            onEditRecord={handleEditRecord}
            onViewRecord={handleViewRecord}
            onDeleteRecord={handleDeleteRecord}
            onImportRecords={handleImportRecords}
            onResetSampleData={handleResetSampleData}
            onUpdateRecord={handleUpdateRecord}
          />
        )}

        {(viewState === "create" || viewState === "edit") && (
          <RecordForm
            initialRecord={viewState === "edit" ? currentRecord : undefined}
            onSave={handleSaveRecord}
            onCancel={() => setViewState("dashboard")}
          />
        )}

        {viewState === "view" && currentRecord && (
          <PrintPreview
            record={currentRecord}
            onBack={() => setViewState("dashboard")}
            onUpdateRecord={handleUpdateRecord}
          />
        )}
      </main>

      {/* Footer (Hidden on prints) */}
      <footer className="bg-white border-t border-slate-205 py-6 mt-12 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400">
          <p className="font-medium">
            Form nhập và lưu trữ 84 trường thông tin khám sức khỏe điện tử đồng bộ.
          </p>
          <p className="mt-1">
            Ứng dụng chạy hoàn toàn bảo mật ở phía môi trường cục bộ (Client-Side Sandboxing) • Tuân thủ Thông tư 06/2026/TT-BYT áp dụng ICD 10
          </p>
        </div>
      </footer>
    </div>
  );
}
