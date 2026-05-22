/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from "xlsx";
import { HealthRecord, createEmptyRecord } from "./types";

// Translation / Mapping dictionary for 84+ fields
// Maps HealthRecord model keys -> User Friendly Vietnamese Headers for Excel Sheet columns
export const EXCEL_COLUMNS: { key: keyof HealthRecord; header: string; desc?: string }[] = [
  { key: "id", header: "Mã Hồ Sơ (ID)", desc: "ID duy nhất (Để trống sẽ tự động phát sinh)" },
  { key: "HO_TEN", header: "Họ Và Tên (Bắt buộc)", desc: "Họ tên người khám" },
  { key: "GIOI_TINH", header: "Giới Tính (1: Nam; 2: Nữ; 3: Chưa xác định)", desc: "Điền 1, 2 hoặc 3 (Hỗ trợ đọc chữ: Nam/Nữ)" },
  { key: "NGAY_SINH", header: "Ngày Sinh (yyyyMMddHHmm)", desc: "Định dạng NămThángNgàyGiờPhút (Ví dụ: 199508151430)" },
  { key: "SO_CCCD", header: "Số CMND/CCCD/Hộ Chiếu", desc: "Độ dài tối đa 15 chữ số" },
  { key: "DIEN_THOAI", header: "Điện thoại liên hệ", desc: "Số điện thoại liên lạc" },
  { key: "DIA_CHI", header: "Chỗ ở hiện tại", desc: "Địa chỉ cụ thể" },
  { key: "MATINH_CU_TRU", header: "Mã tỉnh cư trú", desc: "Tối đa 3 ký tự số" },
  { key: "MAXA_CU_TRU", header: "Mã xã cư trú", desc: "Tối đa 5 ký tự số" },
  { key: "NGUOI_GIAM_HO", header: "Họ tên người giám hộ", desc: "Họ và tên người giám hộ pháp lý" },
  { key: "SO_CCCD_NGUOI_GIAM_HO", header: "CCCD người giám hộ", desc: "Số định danh của người giám hộ" },
  { key: "NGAY_CAP_CCCD", header: "Ngày cấp CCCD (yyyyMMdd)", desc: "Định dạng NămThángNgày (Ví dụ: 20211012)" },
  { key: "NOI_CAP_CCCD", header: "Nơi cấp CCCD", desc: "Ví dụ: Cục Cảnh sát QLHC" },
  { key: "LY_DO_VV", header: "Lý do khám sức khỏe", desc: "Ví dụ: Khám xin việc, khám định kỳ" },
  { key: "CKS_NGUOI_KHAM", header: "Chữ ký số người khám", desc: "Mã chữ ký số xác thực của người khai" },

  // II. Thông tin chung về cơ sở khám
  { key: "MA_LK", header: "Mã Lượt Khám", desc: "Mã lượt khám sức khỏe (Ví dụ: LK-9831A)" },
  { key: "MA_CSKCB", header: "Mã Cơ Sở KCB (Mã định danh)", desc: "Mã số cơ sở y tế theo danh mục" },
  { key: "MA_GTIN_CSKCB", header: "Tên Cơ Sở Khám Chữa Bệnh", desc: "Tên bệnh viện, phòng khám hoặc cơ sở y tế thực hiện" },
  { key: "NGAY_VAO", header: "Ngày khám bệnh (yyyyMMddHHmm)", desc: "Ngày giờ bắt đầu khám" },

  // III. Tiền sử bệnh
  { key: "TSGD_MAC_BENH", header: "Gia đình có ai mắc bệnh (0: Không; 1: Có)", desc: "Điền 0 hoặc 1" },
  { key: "TSGD_TEN_BENH", header: "Tên bệnh gia đình mắc (Mã ICD-10 cách bởi ';')", desc: "Ví dụ: I10;E11 (Tăng huyết áp; Đái tháo đường)" },
  { key: "SAN_KHOA", header: "Sản khoa bình thường (0: Không; 1: Bình thường)", desc: "Điền 0 hoặc 1 (Ví dụ nữ giới)" },
  { key: "BENH_GAY_RA_SAN_KHOA_KHONG_BINH_THUONG", header: "Tên bệnh sản khoa bất thường (ICD-10)", desc: "Mã ICD-10" },

  // Tiêm chủng
  { key: "TIEM_CHUNG_BCG", header: "Tiêm chủng vắc xin BCG (0: Không; 1: Có; 99: Không rõ)", desc: "0, 1 hoặc 99" },
  { key: "TIEM_CHUNG_BH_HG_UV", header: "Vắc xin Bạch hầu - Ho gà - Uốn ván (0;1;99)", desc: "0, 1 hoặc 99" },
  { key: "TIEM_CHUNG_SOI", header: "Vắc xin Sởi (0;1;99)", desc: "0, 1 hoặc 99" },
  { key: "TIEM_CHUNG_BAI_LIET", header: "Vắc xin Bại liệt (0;1;99)", desc: "0, 1 hoặc 99" },
  { key: "TIEM_CHUNG_VNNB_B", header: "Vắc xin Viêm não Nhật Bản B (0;1;99)", desc: "0, 1 hoặc 99" },
  { key: "TIEM_CHUNG_VGB", header: "Vắc xin Viêm gan B (0;1;99) [Bắt buộc]", desc: "0, 1 hoặc 99" },
  { key: "TIEM_CHUNG_CAC_LOAI_KHAC", header: "Có tiêm vắc xin khác không (0;1)", desc: "0 hoặc 1" },
  { key: "TIEM_CHUNG_VAC_XIN_KHAC", header: "Tên các vắc xin khác", desc: "Tên mô tả cụ thể" },

  // Tiền sử bản thân
  { key: "MA_TSBT", header: "Có tiền sử bệnh bản thân không (0;1)", desc: "0 hoặc 1" },
  { key: "TSBT_TEN_BENH", header: "Tên bệnh tiền sử bản thân (Mã ICD-10 cách ';')", desc: "Ví dụ: H52.1" },
  { key: "CO_DANG_DIEU_TRI_BENH", header: "Có đang điều trị bệnh không (0;1)", desc: "0 hoặc 1" },
  { key: "TEN_BENH_DANG_DIEU_TRI", header: "Tên bệnh đang điều trị (Mã ICD-10)", desc: "Chi tiết bệnh lý đang điều trị" },
  { key: "TEN_THUOC", header: "Tên thuốc đang dùng điều trị", desc: "Tên các loại thuốc" },

  // IV. Thể lực
  { key: "CHIEU_CAO", header: "Chiều Cao (cm)", desc: "Chiều cao cơ thể (Ví dụ: 172.5)" },
  { key: "CAN_NANG", header: "Cân Nặng (kg)", desc: "Khối lượng cơ thể (Ví dụ: 68)" },
  { key: "CHI_SO_BMI", header: "Chỉ Số BMI", desc: "Tự động tính nếu bỏ trống (Cân nặng / Chiều cao^2)" },
  { key: "MACH", header: "Mạch (lần/phút)", desc: "Tần số tim mạch" },
  { key: "HUYET_AP", header: "Huyết Áp (mmHg)", desc: "Chỉ số huyết áp (Ví dụ: 120/80)" },

  // V. Khám Lâm Sàng
  { key: "KHAM_NHI_KHOA", header: "Có khám Nhi Khoa hay không (0;1)", desc: "0: Không cần hiện; 1: Đã khám" },
  { key: "NHI_KHOA_TUAN_HOAN", header: "Nhi khoa - Tuần hoàn (Kết quả)", desc: "Chi tiết khám tuần hoàn nhi" },
  { key: "NHI_KHOA_HO_HAP", header: "Nhi khoa - Hô hấp (Kết quả)", desc: "Chi tiết khám hô hấp nhi" },
  { key: "NHI_KHOA_TIEU_HOA", header: "Nhi khoa - Tiêu hóa (Kết quả)", desc: "Chi tiết khám tiêu hóa nhi" },
  { key: "NHI_KHOA_THAN_TIETNIEU", header: "Nhi khoa - Thận tiết niêu (Kết quả)", desc: "Khám thận - tiết niệu" },
  { key: "NHI_KHOA_THAN_KINH", header: "Nhi khoa - Thần kinh (Kết quả)", desc: "Khám thần kinh nhi" },
  { key: "NHI_KHOA_TAM_THAN", header: "Nhi khoa - Tâm thần (Kết quả)", desc: "Khám tâm thần nhi" },
  { key: "NHI_KHOA_KHAC", header: "Có loại khám Nhi khoa khác (0;1)", desc: "0 hoặc 1" },
  { key: "TEN_LOAI_KHAM_NHI_KHOA_KHAC", header: "Tên loại khám lâm sàng nhi khác", desc: "Tên bộ phận khám thêm" },
  { key: "KET_QUA_KHAM_NHI_KHOA_KHAC", header: "Kết quả khám lâm sàng nhi khác", desc: "Báo cáo chi tiết khám nhi" },

  // Khám Mắt
  { key: "KHAM_MAT", header: "Có khám Mắt không (0;1)", desc: "0 hoặc 1" },
  { key: "KHONG_KINH_MAT_PHAI", header: "Chỉ số thị lực Mắt phải (Không kính)", desc: "Ví dụ: 10/10 hoặc 3/10" },
  { key: "KHONG_KINH_MAT_TRAI", header: "Chỉ số thị lực Mắt trái (Không kính)", desc: "Ví dụ: 10/10 hoặc 4/10" },
  { key: "CO_KINH_MAT_PHAI", header: "Thị lực Mắt phải (Có kính)", desc: "Ví dụ: 10/10" },
  { key: "CO_KINH_MAT_TRAI", header: "Thị lực Mắt trái (Có kính)", desc: "Ví dụ: 10/10" },
  { key: "BENH_KHAC_MAT", header: "Các bệnh về mắt nếu có", desc: "Ví dụ: Cận thị, viễn thị" },
  { key: "KET_LUAN_MAT", header: "Kết luận chuyên khoa Mắt", desc: "Ví dụ: Bình thường" },

  // Tai Mũi Họng
  { key: "KHAM_TAI_MUI_HONG", header: "Có khám Tai Mũi Họng không (0;1)", desc: "0 hoặc 1" },
  { key: "TAI_TRAI_NOI_THUONG", header: "Thính lực tai trái nói thường (mét)", desc: "Ví dụ: 5m" },
  { key: "TAI_TRAI_NOI_THAM", header: "Thính lực tai trái nói thầm (mét)", desc: "Ví dụ: 0.5m" },
  { key: "TAI_PHAI_NOI_THUONG", header: "Thính lực tai phải nói thường (mét)", desc: "Ví dụ: 5m" },
  { key: "TAI_PHAI_NOI_THAM", header: "Thính lực tai phải nói thầm (mét)", desc: "Ví dụ: 0.5m" },
  { key: "BENH_KHAC_TAI_MUI_HONG", header: "Bệnh Tai Mũi Họng khác", desc: "Ghi chú bệnh tai mũi họng" },
  { key: "KET_LUAN_TAI_MUI_HONG", header: "Kết luận Tai - Mũi - Họng", desc: "Mô tả kết luận tổng quát" },

  // Răng Hàm Mặt
  { key: "KHAM_RANG_HAM_MAT", header: "Có khám Răng Hàm Mặt không (0;1)", desc: "0 hoặc 1" },
  { key: "HAM_TREN", header: "Tình trạng Hàm Trên", desc: "Đủ răng, sâu răng..." },
  { key: "HAM_DUOI", header: "Tình trạng Hàm Dưới", desc: "Đủ răng, sâu..." },
  { key: "BENH_KHAC_RANG_HAM_MAT", header: "Bệnh Răng Hàm Mặt khác", desc: "Bao gồm viêm lợi, viêm tủy..." },
  { key: "KET_LUAN_RANG_HAM_MAT", header: "Kết luận Răng - Hàm - Mặt", desc: "Kết luận tổng quan răng" },

  // VI. Khám Cận Lâm Sàng (Xét nghiệm)
  { key: "XET_NGHIEM_MAU", header: "Có xét nghiệm máu (0;1)", desc: "0 hoặc 1" },
  { key: "CHI_SO_HC", header: "Chỉ số Hồng Cầu (T/L)", desc: "Ví dụ: 4.5" },
  { key: "CHI_SO_BACH_CAU", header: "Chỉ số Bạch Cầu (G/L)", desc: "Ví dụ: 7.2" },
  { key: "CHI_SO_TIEU_CAU", header: "Chỉ số Tiểu Cầu (G/L)", desc: "Ví dụ: 250" },
  { key: "DUONG_MAU", header: "Đường Máu (mmol/L)", desc: "Đường huyết" },
  { key: "URE", header: "Chỉ số Ure (mmol/L)", desc: "Nồng độ ure" },
  { key: "CREATININ", header: "Chỉ số Creatinin (μmol/L)", desc: "Chức năng thận" },
  { key: "ASAT", header: "ASAT(GOT) (U/L)", desc: "Men gan ASAT" },
  { key: "ALAT", header: "ALAT(GPT) (U/L)", desc: "Men gan ALAT" },

  // Xét nghiệm nước tiểu
  { key: "XET_NGHIEM_NUOC_TIEU", header: "Có xét nghiệm nước tiểu (0;1)", desc: "0 hoặc 1" },
  { key: "CHI_SO_DUONG", header: "Đường nước tiểu (Glucose)", desc: "Ví dụ: Âm tính" },
  { key: "CHI_SO_PROTEIN", header: "Protein nước tiểu", desc: "Ví dụ: Âm tính" },
  { key: "CHI_SO_KHAC", header: "Chỉ số nước tiểu khác", desc: "Ph, Bạch cầu nước tiểu..." },

  // Chẩn đoán hình ảnh & Điện tim
  { key: "CHAN_DOAN_HINH_ANH", header: "Có chẩn đoán hình ảnh (0;1)", desc: "Siêu âm, X-quang..." },
  { key: "KET_QUA_CHAN_DOAN_HINH_ANH", header: "Kết quả chẩn đoán hình ảnh", desc: "Mô tả chi tiết kết quả" },
  { key: "DIEN_TIM", header: "Có thực hiện điện tim (0;1)", desc: "0 hoặc 1" },
  { key: "KET_QUA_DIEN_TIM", header: "Kết quả điện tim", desc: "Nhịp xoang đều..." },

  // Khác
  { key: "XET_NGHIEM_KHAC", header: "Có xét nghiệm khác (0;1)", desc: "0 hoặc 1" },
  { key: "TEN_XET_NGHIEM_KHAC", header: "Tên xét nghiệm chỉ định khác", desc: "Tên dịch vụ y tế" },
  { key: "KET_QUA_XET_NGHIEM_KHAC", header: "Kết quả xét nghiệm khác", desc: "Chi tiết báo cáo" },

  // VII. Kết luận
  { key: "KET_LUAN_LOAI_SUC_KHOE", header: "Phân loại sức khỏe (Ví dụ: Loại I / Loại II)", desc: "Yêu cầu điền đúng format: Loại I, Loại II, Loại III..." },
  { key: "KET_LUAN_CAC_VAN_DE_SUC_KHOE", header: "Các lưu ý sức khỏe khi công tác", desc: "Các khuyến cáo y khoa" },
  { key: "CKS_NGUOI_KET_LUAN", header: "Chữ ký số Bác Sĩ kết luận", desc: "Xác thực bác sĩ chủ trì" },
  { key: "CKS_BENH_VIEN", header: "Chữ ký số Bệnh Viện/Cơ sở", desc: "Xác thực danh tính cơ sở y tế" },

  // VIII. Khám Sức Khỏe Từ 18 Tuổi Trở Lên (Mẫu Người Lớn)
  { key: "KIEU_MAU", header: "Kiểu mẫu ứng dụng (UNDER_18 / OVER_19)", desc: "Mẫu khám" },
  { key: "NOI_CONG_TAC_HIEN_TAI", header: "Nơi công tác hiện tại", desc: "" },
  { key: "MA_NGHE_NGHIEP", header: "Mã nghề nghiệp (GD)", desc: "" },
  { key: "NOI_CONG_TAC_TRUOC_DAY", header: "Nơi làm việc trước đây (Công việc cũ)", desc: "" },
  { key: "NGAY_BAT_DAU_LAM_VIEC_HIEN_TAI", header: "Ngày bắt đầu làm công việc hiện tại (yyyyMMdd)", desc: "" },
  { key: "NGAY_KET_THUC_LAM_VIEC_TRUOC_DAY", header: "Ngày kết thúc công việc trước đây (yyyyMMdd)", desc: "" },
  { key: "CO_KINH_NGUYET_NAM_BAO_NHIEU_TUOI", header: "Tuổi bắt đầu hành kinh", desc: "" },
  { key: "TINH_CHAT_KINH_NGUYET", header: "Tính chất chu kỳ kinh (1: Đều; 0: Không đều)", desc: "" },
  { key: "CHU_KY_KINH", header: "Số ngày hoặc chu kỳ kinh", desc: "" },
  { key: "LUONG_KINH", header: "Lượng kinh nguyệt", desc: "" },
  { key: "DAU_BUNG_KINH", header: "Đau bụng kinh (0: Không; 1: Có)", desc: "" },
  { key: "DA_LAP_GIA_DINH", header: "Tình trạng hôn nhân / Đã lập gia đình (0: Chưa; 1: Có)", desc: "" },
  { key: "PARA", header: "PARA (Sinh-Sảy-Sớm-Sống)", desc: "Ví dụ: 2002" },
  { key: "SO_LAN_MO_SAN_PHU_KHOA", header: "Số lần phẫu thuật sản phụ khoa", desc: "" },
  { key: "BIEN_PHAP_TRANH_THAI", header: "Biện pháp tránh thai đang dùng", desc: "" },
  { key: "TSBT_NAM_PHAT_HIEN_BENH", header: "Năm phát hiện bệnh bản thân", desc: "" },
  { key: "TSBT_NAM_PHAT_HIEN_BENH_NGHE_NGHIEP", header: "Năm phát hiện bệnh nghề nghiệp", desc: "" },
  { key: "TSBT_TEN_BENH_NGHE_NGHIEP", header: "Tên bệnh nghề nghiệp mắc phải", desc: "" },
  { key: "KHAM_NOI_KHOA", header: "Có khám Nội Khoa (0: Không; 1: Có)", desc: "" },
  { key: "NOI_KHOA_TUAN_HOAN", header: "Khám Nội Khoa - Tuần hoàn (Kết quả)", desc: "" },
  { key: "NOI_KHOA_HO_HAP", header: "Khám Nội Khoa - Hô hấp (Kết quả)", desc: "" },
  { key: "NOI_KHOA_TIEU_HOA", header: "Khám Nội Khoa - Tiêu hóa (Kết quả)", desc: "" },
  { key: "NOI_KHOA_THAN_TIETNIEU", header: "Khám Nội Khoa - Thận tiết niệu (Kết quả)", desc: "" },
  { key: "NOI_KHOA_CO_XUONG_KHOP", header: "Khám Nội - Cơ xương khớp (Kết quả)", desc: "" },
  { key: "NOI_KHOA_THAN_KINH", header: "Khám Nội Khoa - Thần kinh (Kết quả)", desc: "" },
  { key: "NOI_KHOA_TAM_THAN", header: "Khám Nội Khoa - Tâm thần (Kết quả)", desc: "" },
  { key: "KHAM_NGOI_KHOA", header: "Có khám Ngoại Khoa (0: Không; 1: Có)", desc: "" },
  { key: "KET_QUA_KHAM_NGOI_KHOA", header: "Kết quả khám Ngoại Khoa", desc: "" },
  { key: "KHAM_DA_LIEU", header: "Có khám Da Liễu (0: Không; 1: Có)", desc: "" },
  { key: "KET_QUA_KHAM_DA_LIEU", header: "Kết quả khám Da Liễu", desc: "" },
  { key: "KHAM_SAN_PHU_KHOA", header: "Có khám Sản Phụ Khoa (0: Không; 1: Có)", desc: "" },
  { key: "KET_QUA_KHAM_SAN_PHU_KHOA", header: "Kết quả khám Sản Phụ Khoa", desc: "" }
];

// Helper to determine gender value from various textual entries
function parseGender(val: any): number {
  if (val === undefined || val === null || val === "") return 3;
  const str = String(val).trim().toLowerCase();
  if (str === "1" || str === "nam" || str.includes("m")) return 1;
  if (str === "2" || str === "nữ" || str === "nu" || str.includes("f")) return 2;
  return 3;
}

// Convert cell values appropriately based on data type
function coerceValue(key: keyof HealthRecord, val: any): any {
  if (val === undefined || val === null) {
    return "";
  }

  // Fields that must be numbers
  const numericKeys: (keyof HealthRecord)[] = [
    "GIOI_TINH",
    "TSGD_MAC_BENH",
    "SAN_KHOA",
    "TIEM_CHUNG_BCG",
    "TIEM_CHUNG_BH_HG_UV",
    "TIEM_CHUNG_SOI",
    "TIEM_CHUNG_BAI_LIET",
    "TIEM_CHUNG_VNNB_B",
    "TIEM_CHUNG_VGB",
    "TIEM_CHUNG_CAC_LOAI_KHAC",
    "MA_TSBT",
    "CO_DANG_DIEU_TRI_BENH",
    "KHAM_NHI_KHOA",
    "NHI_KHOA_KHAC",
    "KHAM_MAT",
    "KHAM_TAI_MUI_HONG",
    "KHAM_RANG_HAM_MAT",
    "XET_NGHIEM_MAU",
    "XET_NGHIEM_NUOC_TIEU",
    "CHAN_DOAN_HINH_ANH",
    "DIEN_TIM",
    "XET_NGHIEM_KHAC"
  ];

  if (numericKeys.includes(key)) {
    if (key === "GIOI_TINH") {
      return parseGender(val);
    }
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Rest are strings
  return String(val).trim();
}

/**
 * EXPORT: Export current list of Health Records to a professionally styled Excel file
 */
export function exportRecordsToExcel(records: HealthRecord[], filename: string = "HoSo_KhamSucKhoe_QuocGia_Export.xlsx") {
  // Map our technical records into human-friendly flat objects matching column headers
  const exportRows = records.map((rec) => {
    const rowObj: Record<string, any> = {};
    
    EXCEL_COLUMNS.forEach((col) => {
      let rawVal = rec[col.key];
      
      // Give readable text format to some tricky code fields on exporting
      if (col.key === "GIOI_TINH") {
        rawVal = rawVal === 1 ? "1 (Nam)" : rawVal === 2 ? "2 (Nữ)" : "3 (Chưa xác định)";
      }
      
      rowObj[col.header] = rawVal !== undefined ? rawVal : "";
    });

    return rowObj;
  });

  // Create workbook & worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSach_HoSo");

  // Adjust column widths automatically based on headers
  const maxProps = EXCEL_COLUMNS.map((col) => {
    const headerLen = col.header.length;
    // safe estimate
    return { wch: Math.max(headerLen + 4, 15) };
  });
  worksheet["!cols"] = maxProps;

  // Save the file
  XLSX.writeFile(workbook, filename);
}

/**
 * DOWNLOAD TEMPLATE: Downloads a clean national standard Excel template filled with professional guidelines and 2 sample cases
 */
export function downloadExcelTemplateOnly() {
  const sampleRecords: Partial<HealthRecord>[] = [
    {
      id: "REC-SAMPLE-01",
      HO_TEN: "Nguyễn Văn Đạt",
      GIOI_TINH: 1, // Nam
      NGAY_SINH: "199411200000",
      SO_CCCD: "001094012456",
      DIEN_THOAI: "0905111222",
      DIA_CHI: "78 Tràng Tiền, Quận Hoàn Kiếm, TP. Hà Nội",
      MATINH_CU_TRU: "01",
      MAXA_CU_TRU: "00001",
      LY_DO_VV: "Khám sức khỏe tuyển dụng công sở",
      MA_LK: "LK-TEMPF01",
      MA_CSKCB: "01001",
      MA_GTIN_CSKCB: "Bệnh viện Đa khoa Hà Nội",
      NGAY_VAO: "202605210800",
      TSGD_MAC_BENH: 0,
      TSGD_TEN_BENH: "",
      SAN_KHOA: 0,
      BENH_GAY_RA_SAN_KHOA_KHONG_BINH_THUONG: "",
      TIEM_CHUNG_BCG: 1,
      TIEM_CHUNG_BH_HG_UV: 1,
      TIEM_CHUNG_SOI: 1,
      TIEM_CHUNG_BAI_LIET: 1,
      TIEM_CHUNG_VNNB_B: 1,
      TIEM_CHUNG_VGB: 1,
      TIEM_CHUNG_CAC_LOAI_KHAC: 0,
      TIEM_CHUNG_VAC_XIN_KHAC: "",
      MA_TSBT: 0,
      TSBT_TEN_BENH: "",
      CO_DANG_DIEU_TRI_BENH: 0,
      TEN_BENH_DANG_DIEU_TRI: "",
      TEN_THUOC: "",
      CHIEU_CAO: "174.0",
      CAN_NANG: "70.0",
      CHI_SO_BMI: "23.12",
      MACH: "76",
      HUYET_AP: "120/80",
      KHAM_NHI_KHOA: 0,
      NHI_KHOA_TUAN_HOAN: "",
      NHI_KHOA_HO_HAP: "",
      NHI_KHOA_TIEU_HOA: "",
      NHI_KHOA_THAN_TIETNIEU: "",
      NHI_KHOA_THAN_KINH: "",
      NHI_KHOA_TAM_THAN: "",
      KHAM_MAT: 1,
      KHONG_KINH_MAT_PHAI: "10/10",
      KHONG_KINH_MAT_TRAI: "10/10",
      CO_KINH_MAT_PHAI: "",
      CO_KINH_MAT_TRAI: "",
      BENH_KHAC_MAT: "Không",
      KET_LUAN_MAT: "Thị lực đạt chuẩn quốc gia",
      KHAM_TAI_MUI_HONG: 1,
      TAI_TRAI_NOI_THUONG: "5m",
      TAI_TRAI_NOI_THAM: "0.5m",
      TAI_PHAI_NOI_THUONG: "5m",
      TAI_PHAI_NOI_THAM: "0.5m",
      BENH_KHAC_TAI_MUI_HONG: "Không",
      KET_LUAN_TAI_MUI_HONG: "Tai mũi họng bình thường",
      KHAM_RANG_HAM_MAT: 1,
      HAM_TREN: "Đủ răng, không sâu",
      HAM_DUOI: "Đủ răng, không sâu",
      BENH_KHAC_RANG_HAM_MAT: "Không",
      KET_LUAN_RANG_HAM_MAT: "Răng miệng tốt, không bệnh lý cấp tính",
      XET_NGHIEM_MAU: 1,
      CHI_SO_HC: "4.6",
      CHI_SO_BACH_CAU: "6.9",
      CHI_SO_TIEU_CAU: "245",
      DUONG_MAU: "5.0",
      URE: "4.5",
      CREATININ: "78",
      ASAT: "24",
      ALAT: "23",
      XET_NGHIEM_NUOC_TIEU: 1,
      CHI_SO_DUONG: "Âm tính",
      CHI_SO_PROTEIN: "Âm tính",
      CHI_SO_KHAC: "",
      CHAN_DOAN_HINH_ANH: 1,
      KET_QUA_CHAN_DOAN_HINH_ANH: "Hình ảnh X-Quang ngực thẳng: Phổi sạch vỏ tim bình thường",
      DIEN_TIM: 1,
      KET_QUA_DIEN_TIM: "Nhịp xoang bình thường chu kỳ 76 lần/phút",
      XET_NGHIEM_KHAC: 0,
      TEN_XET_NGHIEM_KHAC: "",
      KET_QUA_XET_NGHIEM_KHAC: "",
      KET_LUAN_LOAI_SUC_KHOE: "Loại I",
      KET_LUAN_CAC_VAN_DE_SUC_KHOE: "Đủ sức khỏe học tập, làm việc và đi công tác nước ngoài.",
      CKS_NGUOI_KET_LUAN: "BS_NGUYENVANPHUC_SIGNED",
      CKS_BENH_VIEN: "BV_BACHMAI_SIGNED"
    },
    {
      id: "REC-SAMPLE-02",
      HO_TEN: "Lê Thu Quỳnh",
      GIOI_TINH: 2, // Nữ
      NGAY_SINH: "200109050000",
      SO_CCCD: "031201011322",
      DIEN_THOAI: "0915222333",
      DIA_CHI: "45 Phạm Ngọc Thạch, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh",
      MATINH_CU_TRU: "79",
      MAXA_CU_TRU: "26744",
      LY_DO_VV: "Khám sức khỏe kiểm tra định kỳ hàng năm",
      MA_LK: "LK-TEMPF02",
      MA_CSKCB: "79001",
      MA_GTIN_CSKCB: "Bệnh viện Đa khoa Sài Gòn",
      NGAY_VAO: "202605210900",
      TSGD_MAC_BENH: 1,
      TSGD_TEN_BENH: "I10;E11",
      SAN_KHOA: 1,
      BENH_GAY_RA_SAN_KHOA_KHONG_BINH_THUONG: "",
      TIEM_CHUNG_BCG: 1,
      TIEM_CHUNG_BH_HG_UV: 1,
      TIEM_CHUNG_SOI: 1,
      TIEM_CHUNG_BAI_LIET: 1,
      TIEM_CHUNG_VNNB_B: 1,
      TIEM_CHUNG_VGB: 1,
      TIEM_CHUNG_CAC_LOAI_KHAC: 1,
      TIEM_CHUNG_VAC_XIN_KHAC: "Cúm, HPV",
      MA_TSBT: 1,
      TSBT_TEN_BENH: "H52.1", // Cận thị
      CO_DANG_DIEU_TRI_BENH: 0,
      TEN_BENH_DANG_DIEU_TRI: "",
      TEN_THUOC: "",
      CHIEU_CAO: "162.0",
      CAN_NANG: "51.2",
      CHI_SO_BMI: "19.51",
      MACH: "82",
      HUYET_AP: "115/75",
      KHAM_NHI_KHOA: 0,
      NHI_KHOA_TUAN_HOAN: "",
      NHI_KHOA_HO_HAP: "",
      NHI_KHOA_TIEU_HOA: "",
      NHI_KHOA_THAN_TIETNIEU: "",
      NHI_KHOA_THAN_KINH: "",
      NHI_KHOA_TAM_THAN: "",
      KHAM_MAT: 1,
      KHONG_KINH_MAT_PHAI: "2/10",
      KHONG_KINH_MAT_TRAI: "3/10",
      CO_KINH_MAT_PHAI: "10/10",
      CO_KINH_MAT_TRAI: "10/10",
      BENH_KHAC_MAT: "Cận thị nhẹ",
      KET_LUAN_MAT: "Cận thị đã chỉnh kính tối ưu",
      KHAM_TAI_MUI_HONG: 1,
      TAI_TRAI_NOI_THUONG: "5m",
      TAI_TRAI_NOI_THAM: "0.5m",
      TAI_PHAI_NOI_THUONG: "5m",
      TAI_PHAI_NOI_THAM: "0.5m",
      BENH_KHAC_TAI_MUI_HONG: "Không",
      KET_LUAN_TAI_MUI_HONG: "Vòm tai mũi họng thông thoáng",
      KHAM_RANG_HAM_MAT: 1,
      HAM_TREN: "Bình thường",
      HAM_DUOI: "Có răng khôn mọc lệch nhẹ",
      BENH_KHAC_RANG_HAM_MAT: "",
      KET_LUAN_RANG_HAM_MAT: "Răng đều, cần theo dõi răng khôn",
      XET_NGHIEM_MAU: 1,
      CHI_SO_HC: "4.2",
      CHI_SO_BACH_CAU: "6.1",
      CHI_SO_TIEU_CAU: "230",
      DUONG_MAU: "4.8",
      URE: "4.0",
      CREATININ: "62",
      ASAT: "21",
      ALAT: "19",
      XET_NGHIEM_NUOC_TIEU: 1,
      CHI_SO_DUONG: "Âm tính",
      CHI_SO_PROTEIN: "Âm tính",
      CHI_SO_KHAC: "",
      CHAN_DOAN_HINH_ANH: 1,
      KET_QUA_CHAN_DOAN_HINH_ANH: "Siêu âm tổng quát ổ bụng: Chưa ghi nhận bệnh lý thực thể",
      DIEN_TIM: 0,
      KET_QUA_DIEN_TIM: "",
      XET_NGHIEM_KHAC: 1,
      TEN_XET_NGHIEM_KHAC: "Anti-HBs định lượng",
      KET_QUA_XET_NGHIEM_KHAC: "Có kháng thể (>1000mUI/mL)",
      KET_LUAN_LOAI_SUC_KHOE: "Loại II",
      KET_LUAN_CAC_VAN_DE_SUC_KHOE: "Đủ sức khỏe học tập và công tác. Lưu ý theo dõi răng khôn định kỳ.",
      CKS_NGUOI_KET_LUAN: "BS_TRANTHIMAI_SIGNED",
      CKS_BENH_VIEN: "BV_VIETDUC_SIGNED"
    }
  ];

  // Base rows array
  const guideRows = sampleRecords.map((partialRecord) => {
    const defaultFullRec = { ...createEmptyRecord(), ...partialRecord };
    const rowObj: Record<string, any> = {};
    
    EXCEL_COLUMNS.forEach((col) => {
      let rawVal = defaultFullRec[col.key];
      if (col.key === "GIOI_TINH") {
        rawVal = rawVal === 1 ? "1 (Nam)" : rawVal === 2 ? "2 (Nữ)" : "3 (Chưa xác định)";
      }
      rowObj[col.header] = rawVal !== undefined ? rawVal : "";
    });

    return rowObj;
  });

  // Adding an instruction sheet as a second worksheet to make it extra professional and friendly!
  const instructionRows = EXCEL_COLUMNS.map((col) => {
    return {
      "Trường Dữ Liệu": col.header,
      "Tên Thuộc Tính": col.key,
      "Hướng Dẫn Điền Dữ Liệu": col.desc || "Chi tiết bổ trợ lâm sàng"
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(guideRows);
  const instructionSheet = XLSX.utils.json_to_sheet(instructionRows);
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet_Dang_Ky_HSK");
  XLSX.utils.book_append_sheet(workbook, instructionSheet, "Huong_Dan_Xep_Khuon");

  // Format col widths
  const maxProps = EXCEL_COLUMNS.map((col) => ({
    wch: Math.max(col.header.length + 4, 18)
  }));
  worksheet["!cols"] = maxProps;

  instructionSheet["!cols"] = [{ wch: 45 }, { wch: 35 }, { wch: 45 }];

  XLSX.writeFile(workbook, "Mau_Ho_So_Kham_Suc_Khoe_Phu_Hop_QD_84_Truong_Gold.xlsx");
}

/**
 * IMPORT: Parse an Excel file and map user columns back to our schema, validating and creating missing values
 */
export function importRecordsFromExcel(file: File): Promise<HealthRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error("Không thể đọc được nội dung tệp tin.");
        }

        const workbook = XLSX.read(data, { type: "array" });
        // Take first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet to JSON array
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        
        if (!Array.isArray(jsonData) || jsonData.length === 0) {
          resolve([]);
          return;
        }

        const parsedRecords: HealthRecord[] = jsonData.map((row, index) => {
          // Initialize empty record with unique random IDs
          const emptyRec = createEmptyRecord();
          // Modify its random ID if an ID is NOT explicitly supplied by template
          const rec: Record<string, any> = { ...emptyRec };

          // Map columns of Excel sheet row back to model properties
          EXCEL_COLUMNS.forEach((col) => {
            const rowValue = row[col.header];
            
            if (rowValue !== undefined && rowValue !== null) {
              const coerced = coerceValue(col.key, rowValue);
              rec[col.key] = coerced;
            }
          });

          // Ensure minimum values required
          if (!rec.id || String(rec.id).trim() === "" || rec.id.startsWith("REC-SAMPLE-")) {
            // Keep unique
            rec.id = "REC-" + Math.random().toString(36).substring(2, 11).toUpperCase();
          }

          if (!rec.HO_TEN || String(rec.HO_TEN).trim() === "") {
            rec.HO_TEN = `Bệnh nhân chưa đặt tên #${index + 1}`;
          }

          // Auto compute BMI if dimensions are filled in
          if (rec.CHIEU_CAO && rec.CAN_NANG) {
            const hCm = parseFloat(rec.CHIEU_CAO);
            const wKg = parseFloat(rec.CAN_NANG);
            if (!isNaN(hCm) && !isNaN(wKg) && hCm > 0) {
              const hM = hCm / 100;
              rec.CHI_SO_BMI = (wKg / (hM * hM)).toFixed(2);
            }
          }

          // Ensure timestamps
          rec.createdAt = new Date().toISOString();
          rec.updatedAt = new Date().toISOString();

          return rec as HealthRecord;
        });

        // filter records where HO_TEN looks empty/placeholder just in case
        resolve(parsedRecords);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => {
      reject(err);
    };

    reader.readAsArrayBuffer(file);
  });
}
