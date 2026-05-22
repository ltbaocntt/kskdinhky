/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Interface representing the 84 fields specified in the health examination documentation
export interface HealthRecord {
  id: string; // Unique client-side ID for local storage
  createdAt: string; // Time of local creation
  updatedAt: string; // Time of last update

  // I. Thông tin hành chính (1 - 14)
  HO_TEN: string;                   // TT 1: Họ và tên (Chuỗi, 255)
  GIOI_TINH: number;                // TT 2: Giới tính (Số, 1: Nam; 2: Nữ; 3: Chưa xác định)
  NGAY_SINH: string;                // TT 3: Ngày sinh (Chuỗi, 12: yyyyMMddHHmm)
  SO_CCCD: string;                  // TT 4: SỐ CMND / CCCD / HC / ĐD (Chuỗi, 15)
  NGUOI_GIAM_HO: string;            // TT 5: Người giám hộ (Chuỗi, 255)
  SO_CCCD_NGUOI_GIAM_HO: string;    // TT 6: CMND/CCCD/HC của người giám hộ (Chuỗi, 15)
  NGAY_CAP_CCCD: string;            // TT 7: Ngày cấp (Chuỗi, 8: yyyyMMdd)
  NOI_CAP_CCCD: string;             // TT 8: Nơi cấp (Chuỗi, 1024)
  DIA_CHI: string;                  // TT 9: Chỗ ở hiện tại (Chuỗi, 1024)
  MATINH_CU_TRU: string;            // TT 10: Mã Tỉnh (Chuỗi, 3)
  MAXA_CU_TRU: string;              // TT 11: Mã Xã (Chuỗi, 5)
  DIEN_THOAI: string;               // TT 12: Điện thoại (Chuỗi, 15)
  LY_DO_VV: string;                 // TT 13: Lý do khám sức khỏe (Chuỗi, n)
  CKS_NGUOI_KHAM: string;           // TT 14: Chữ ký số người khám (Chuỗi, 1024)

  // II. Thông tin chung về cơ sở khám sức khỏe (15 - 18)
  MA_LK: string;                    // TT 15: Lượt khám (Chuỗi, 100)
  MA_CSKCB: string;                 // TT 16: Mã cơ sở khám bệnh, chữa bệnh (Chuỗi, 5)
  MA_GTIN_CSKCB: string;            // TT 17: Tên cơ sở khám chữa bệnh (Chuỗi, 255)
  NGAY_VAO: string;                 // TT 18: Ngày khám sức khỏe (Chuỗi, 12: yyyyMMddHHmm)

  // III. Tiền sử bệnh của đối tượng khám sức khỏe (19 - 35)
  // III.1 Tiền sử gia đình
  TSGD_MAC_BENH: number;            // TT 19: Có ai trong gia đình mắc bệnh không (Số, 1: 0: Không; 1: Có)
  TSGD_TEN_BENH: string;            // TT 20: Tên bệnh cụ thể trong gia đình (Chuỗi, 1024 - tối đa 12 mã ICD-10 cách bởi ";")

  // III.2 Tiền sử bản thân
  // A. Sản khoa
  SAN_KHOA: number;                 // TT 21: Sản khoa bình thường hay không (Số, 1: 0: Không; 1: Bình thường)
  BENH_GAY_RA_SAN_KHOA_KHONG_BINH_THUONG: string; // TT 22: Tên bệnh gây ra sản khoa không bình thường (Chuỗi, 1024 - mã ICD-10 cách bởi ";")

  // B. Tiêm chủng
  TIEM_CHUNG_BCG: number;           // TT 23: Loại vắc xin BCG (Số, 2: 0: Không được tiêm; 1: Được tiêm; 99: Không có thông tin)
  TIEM_CHUNG_BH_HG_UV: number;      // TT 24: Vắc xin Bạch hầu, ho gà, uốn ván (Số, 2: 0; 1; 99)
  TIEM_CHUNG_SOI: number;           // TT 25: Vắc xin Sởi (Số, 2: 0; 1; 99)
  TIEM_CHUNG_BAI_LIET: number;      // TT 26: Vắc xin Bại liệt (Số, 2: 0; 1; 99)
  TIEM_CHUNG_VNNB_B: number;        // TT 27: Vắc xin Viêm não Nhật Bản B (Số, 2: 0; 1; 99)
  TIEM_CHUNG_VGB: number;           // TT 28: Vắc xin Viêm gan B (Số, 2: 0; 1; 99) [Bắt buộc]
  TIEM_CHUNG_CAC_LOAI_KHAC: number; // TT 29: Loại vắc xin khác (Số, 1: 0: Không; 1: Có)
  TIEM_CHUNG_VAC_XIN_KHAC: string;  // TT 30: Tên vắc xin khác (Chuỗi, 1024)

  // C. Tiền sử bệnh bản thân
  MA_TSBT: number;                  // TT 31: Tiền sử bệnh/tật (Số, 1: 0: Không bệnh; 1: Có bệnh)
  TSBT_TEN_BENH: string;            // TT 32: Cụ thể có tiền sử bệnh/tật (Chuỗi, 1024 - ICD-10)
  CO_DANG_DIEU_TRI_BENH: number;    // TT 33: Có đang điều trị bệnh gì không (Số, 1: 0: Không; 1: Có)
  TEN_BENH_DANG_DIEU_TRI: string;   // TT 34: Cụ thể tên bệnh đang điều trị (Chuỗi, 1024 - ICD-10)
  TEN_THUOC: string;                // TT 35: Thuốc đang sử dụng điều trị (Chuỗi, 1024)

  // IV. Khám thể lực (36 - 40)
  CHIEU_CAO: string;                // TT 36: Chiều cao cm (Số chuỗi, 10 - tối đa 2 chữ số thập phân)
  CAN_NANG: string;                 // TT 37: Cân nặng kg (Chuỗi, 10)
  CHI_SO_BMI: string;               // TT 38: Chỉ số BMI (Chuỗi, 10)
  MACH: string;                     // TT 39: Mạch lần/phút (Chuỗi, 100)
  HUYET_AP: string;                 // TT 40: Huyết áp (Chuỗi, 100)

  // V. Khám lâm sàng (41 - 65)
  // A. Nhi khoa
  KHAM_NHI_KHOA: number;            // Có khám nhi hay không (0: Không; 1: Có) -> Thêm để quản lý ẩn/hiện logic thân thiện
  NHI_KHOA_TUAN_HOAN: string;       // TT 41: Nhỉ khoa tuần hoàn (Chuỗi, 1024)
  NHI_KHOA_HO_HAP: string;          // TT 42: Nhi khoa hô hấp (Chuỗi, 1024)
  NHI_KHOA_TIEU_HOA: string;         // TT 43: Nhi khoa tiêu hóa (Chuỗi, 1024)
  NHI_KHOA_THAN_TIETNIEU: string;   // TT 44: Nhi khoa thận - tiết niệu (Chuỗi, 1024)
  NHI_KHOA_THAN_KINH: string;       // TT 45: Nhi khoa thần kinh (Chuỗi, 1024)
  NHI_KHOA_TAM_THAN: string;        // TT 46: Nhi khoa tâm thần (Chuỗi, 1024)
  NHI_KHOA_KHAC: number;            // TT 47: Khám lâm sàng khác (Số, 1: 0: Không; 1: Có)
  TEN_LOAI_KHAM_NHI_KHOA_KHAC: string; // TT 48: Tên loại khám lâm sàng khác (Chuỗi, 1024)
  KET_QUA_KHAM_NHI_KHOA_KHAC: string;  // TT 49: Kết quả khám lâm sàng khác (Chuỗi, 1024)

  // B. Mắt
  KHAM_MAT: number;                 // Có khám mắt hay không (0: Không; 1: Có)
  KHONG_KINH_MAT_PHAI: string;      // TT 50: Không kính mắt phải (Chuỗi, 255)
  KHONG_KINH_MAT_TRAI: string;      // TT 51: Không kính mắt trái (Chuỗi, 255)
  CO_KINH_MAT_PHAI: string;         // TT 52: Có kính mắt phải (Chuỗi, 255)
  CO_KINH_MAT_TRAI: string;         // TT 53: Có kính mắt trái (Chuỗi, 255)
  BENH_KHAC_MAT: string;            // TT 54: Các bệnh về mắt nếu có (Chuỗi, 1024)
  KET_LUAN_MAT: string;             // TT 55: Kết luận về mắt (Chuỗi, 1024)

  // C. Tai - Mũi - Họng
  KHAM_TAI_MUI_HONG: number;        // Có khám tai mũi họng không (0: Không, 1: Có)
  TAI_TRAI_NOI_THUONG: string;      // TT 56: Thính lực tai trái nói thường (Chuỗi, 10)
  TAI_TRAI_NOI_THAM: string;        // TT 57: Thính lực tai trái nói thầm (Chuỗi, 10)
  TAI_PHAI_NOI_THUONG: string;      // TT 58: Thính lực tai phải nói thường (Chuỗi, 10)
  TAI_PHAI_NOI_THAM: string;        // TT 59: Thính lực tai phải nói thầm (Chuỗi, 10)
  BENH_KHAC_TAI_MUI_HONG: string;   // TT 60: Các bệnh về tai mũi họng (Chuỗi, 1024)
  KET_LUAN_TAI_MUI_HONG: string;    // TT 61: Kết luận tai - mũi - họng (Chuỗi, 1024)

  // D. Răng - Hàm - Mặt
  KHAM_RANG_HAM_MAT: number;        // Có khám RHM không (0: Không, 1: Có)
  HAM_TREN: string;                 // TT 62: Khám hàm trên (Chuỗi, 1024)
  HAM_DUOI: string;                 // TT 63: Khám hàm dưới (Chuỗi, 1024)
  BENH_KHAC_RANG_HAM_MAT: string;   // TT 64: Các bệnh răng hàm mặt (Chuỗi, 1024)
  KET_LUAN_RANG_HAM_MAT: string;    // TT 65: Kết luận răng - hàm - mặt (Chuỗi, 1024)

  // VI. Khám cận lâm sàng (66 - 80)
  // A. Xét nghiệm máu
  XET_NGHIEM_MAU: number;            // Khám xét nghiệm máu không (0: Không, 1: Có)
  CHI_SO_HC: string;                // TT 66: Chỉ số hồng cầu (Chuỗi, 10)
  CHI_SO_BACH_CAU: string;          // TT 67: Chỉ số bạch cầu (Chuỗi, 10)
  CHI_SO_TIEU_CAU: string;          // TT 68: Chỉ số tiểu cầu (Chuỗi, 10)
  DUONG_MAU: string;                // TT 69: Đường máu (Chuỗi, 10)
  URE: string;                      // TT 70: Urê (Chuỗi, 10)
  CREATININ: string;                // TT 71: Creatinin (Chuỗi, 10)
  ASAT: string;                     // TT 72: ASAT(GOT) (Chuỗi, 10)
  ALAT: string;                     // TT 73: ALAT(GPT) (Chuỗi, 10)

  // B. Xét nghiệm nước tiểu
  XET_NGHIEM_NUOC_TIEU: number;     // Có xét nghiệm nước tiểu không (0: Không, 1: Có)
  CHI_SO_DUONG: string;             // TT 74: Chỉ số Đường (Chuỗi, 10)
  CHI_SO_PROTEIN: string;           // TT 75: Chỉ số Protein (Chuỗi, 10)
  CHI_SO_KHAC: string;              // TT 76: Chỉ số khác nếu có (Chuỗi, 1024)

  // C. Chẩn đoán hình ảnh
  CHAN_DOAN_HINH_ANH: number;       // Có CĐHA không (0: Không, 1: Có)
  KET_QUA_CHAN_DOAN_HINH_ANH: string; // TT 77: Kết quả chẩn đoán hình ảnh (Chuỗi, 1024)

  // D. Điện tim
  DIEN_TIM: number;                 // Có điện tim không (0: Không, 1: Có)
  KET_QUA_DIEN_TIM: string;         // TT 78: Kết quả điện tim (Chuỗi, 1024)

  // E. Xét nghiệm khác theo chỉ định
  XET_NGHIEM_KHAC: number;          // Có xét nghiệm khác không (0: Không, 1: Có)
  TEN_XET_NGHIEM_KHAC: string;      // TT 79: Tên xét nghiệm khác (Chuỗi, 1024)
  KET_QUA_XET_NGHIEM_KHAC: string;  // TT 80: Kết quả xét nghiệm khác (Chuỗi, 1024)

  // VII. Kết luận (81 - 84)
  KET_LUAN_LOAI_SUC_KHOE: string;   // TT 81: Kết luận đánh giá sức khỏe (Chuỗi, 255)
  KET_LUAN_CAC_VAN_DE_SUC_KHOE: string; // TT 82: Các vấn đề sức khỏe lưu ý (Chuỗi, 255)
  CKS_NGUOI_KET_LUAN: string;       // TT 83: Chữ ký số người kết luận (Chuỗi, 1024)
  CKS_BENH_VIEN: string;            // TT 84: Chữ ký số CSKB thực thực hiện KSK (Chuỗi, 1024)
  CKS_LANH_DAO: string;             // Chữ ký số Lãnh đạo phê duyệt
}

export const createEmptyRecord = (): HealthRecord => {
  const now = new Date();
  
  // Helper to get formatted date string: yyyyMMddHHmm
  const formatYYYYMMDDHHMM = (d: Date): string => {
    const yyyy = d.getFullYear();
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const HH = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}${MM}${dd}${HH}${mm}`;
  };

  const formatYYYYMMDD = (d: Date): string => {
    const yyyy = d.getFullYear();
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}${MM}${dd}`;
  };

  const recordId = 'REC-' + Math.random().toString(36).substring(2, 11).toUpperCase();
  const dateStr = formatYYYYMMDDHHMM(now);

  return {
    id: recordId,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),

    HO_TEN: "",
    GIOI_TINH: 3, // 3: Chưa xác định
    NGAY_SINH: "", // Sẽ lưu yyyyMMddHHmm
    SO_CCCD: "",
    NGUOI_GIAM_HO: "",
    SO_CCCD_NGUOI_GIAM_HO: "",
    NGAY_CAP_CCCD: "", // yyyyMMdd
    NOI_CAP_CCCD: "",
    DIA_CHI: "",
    MATINH_CU_TRU: "",
    MAXA_CU_TRU: "",
    DIEN_THOAI: "",
    LY_DO_VV: "Khám sức khỏe định kỳ",
    CKS_NGUOI_KHAM: "",

    MA_LK: "LK-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
    MA_CSKCB: "",
    MA_GTIN_CSKCB: "",
    NGAY_VAO: dateStr,

    TSGD_MAC_BENH: 0, // 0: Không
    TSGD_TEN_BENH: "",

    SAN_KHOA: 1, // 1: Bình thường
    BENH_GAY_RA_SAN_KHOA_KHONG_BINH_THUONG: "",

    TIEM_CHUNG_BCG: 99, // 99: Không có thông tin
    TIEM_CHUNG_BH_HG_UV: 99,
    TIEM_CHUNG_SOI: 99,
    TIEM_CHUNG_BAI_LIET: 99,
    TIEM_CHUNG_VNNB_B: 99,
    TIEM_CHUNG_VGB: 99,
    TIEM_CHUNG_CAC_LOAI_KHAC: 0,
    TIEM_CHUNG_VAC_XIN_KHAC: "",

    MA_TSBT: 0,
    TSBT_TEN_BENH: "",
    CO_DANG_DIEU_TRI_BENH: 0,
    TEN_BENH_DANG_DIEU_TRI: "",
    TEN_THUOC: "",

    CHIEU_CAO: "",
    CAN_NANG: "",
    CHI_SO_BMI: "",
    MACH: "",
    HUYET_AP: "",

    KHAM_NHI_KHOA: 0,
    NHI_KHOA_TUAN_HOAN: "",
    NHI_KHOA_HO_HAP: "",
    NHI_KHOA_TIEU_HOA: "",
    NHI_KHOA_THAN_TIETNIEU: "",
    NHI_KHOA_THAN_KINH: "",
    NHI_KHOA_TAM_THAN: "",
    NHI_KHOA_KHAC: 0,
    TEN_LOAI_KHAM_NHI_KHOA_KHAC: "",
    KET_QUA_KHAM_NHI_KHOA_KHAC: "",

    KHAM_MAT: 1,
    KHONG_KINH_MAT_PHAI: "",
    KHONG_KINH_MAT_TRAI: "",
    CO_KINH_MAT_PHAI: "",
    CO_KINH_MAT_TRAI: "",
    BENH_KHAC_MAT: "",
    KET_LUAN_MAT: "",

    KHAM_TAI_MUI_HONG: 1,
    TAI_TRAI_NOI_THUONG: "",
    TAI_TRAI_NOI_THAM: "",
    TAI_PHAI_NOI_THUONG: "",
    TAI_PHAI_NOI_THAM: "",
    BENH_KHAC_TAI_MUI_HONG: "",
    KET_LUAN_TAI_MUI_HONG: "",

    KHAM_RANG_HAM_MAT: 1,
    HAM_TREN: "",
    HAM_DUOI: "",
    BENH_KHAC_RANG_HAM_MAT: "",
    KET_LUAN_RANG_HAM_MAT: "",

    XET_NGHIEM_MAU: 0,
    CHI_SO_HC: "",
    CHI_SO_BACH_CAU: "",
    CHI_SO_TIEU_CAU: "",
    DUONG_MAU: "",
    URE: "",
    CREATININ: "",
    ASAT: "",
    ALAT: "",

    XET_NGHIEM_NUOC_TIEU: 0,
    CHI_SO_DUONG: "",
    CHI_SO_PROTEIN: "",
    CHI_SO_KHAC: "",

    CHAN_DOAN_HINH_ANH: 0,
    KET_QUA_CHAN_DOAN_HINH_ANH: "",

    DIEN_TIM: 0,
    KET_QUA_DIEN_TIM: "",

    XET_NGHIEM_KHAC: 0,
    TEN_XET_NGHIEM_KHAC: "",
    KET_QUA_XET_NGHIEM_KHAC: "",

    KET_LUAN_LOAI_SUC_KHOE: "",
    KET_LUAN_CAC_VAN_DE_SUC_KHOE: "",
    CKS_NGUOI_KET_LUAN: "",
    CKS_BENH_VIEN: "",
    CKS_LANH_DAO: "",
  };
};

export const sampleRecordsList: HealthRecord[] = [
  {
    ...createEmptyRecord(),
    id: "REC-DEMO01",
    HO_TEN: "Nguyễn Văn A",
    GIOI_TINH: 1, // Nam
    NGAY_SINH: "199508151430", // 15/08/1995 14:30
    SO_CCCD: "031095012345",
    NGAY_CAP_CCCD: "20211012",
    NOI_CAP_CCCD: "Cục Cảnh sát QLHC về trật tự xã hội",
    DIA_CHI: "123 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh",
    MATINH_CU_TRU: "79", // HCM
    MAXA_CU_TRU: "26743", 
    DIEN_THOAI: "0908123456",
    LY_DO_VV: "Khám sức khỏe xin việc",
    CKS_NGUOI_KHAM: "CA_NGUYENVANA_SIGNED_VALID",

    MA_LK: "LK-9831A",
    MA_CSKCB: "79001",
    MA_GTIN_CSKCB: "Bệnh viện Quận 1 - Cơ sở 1",
    NGAY_VAO: "202605150830",

    TSGD_MAC_BENH: 0,
    TSGD_TEN_BENH: "",

    SAN_KHOA: 1,
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

    CHIEU_CAO: "172.5",
    CAN_NANG: "68",
    CHI_SO_BMI: "22.84",
    MACH: "75",
    HUYET_AP: "120/80",

    KHAM_NHI_KHOA: 0,
    NHI_KHOA_TUAN_HOAN: "",
    NHI_KHOA_HO_HAP: "",
    NHI_KHOA_TIEU_HOA: "",
    NHI_KHOA_THAN_TIETNIEU: "",
    NHI_KHOA_THAN_KINH: "",
    NHI_KHOA_TAM_THAN: "",
    NHI_KHOA_KHAC: 0,
    TEN_LOAI_KHAM_NHI_KHOA_KHAC: "",
    KET_QUA_KHAM_NHI_KHOA_KHAC: "",

    KHAM_MAT: 1,
    KHONG_KINH_MAT_PHAI: "10/10",
    KHONG_KINH_MAT_TRAI: "10/10",
    CO_KINH_MAT_PHAI: "",
    CO_KINH_MAT_TRAI: "",
    BENH_KHAC_MAT: "Không",
    KET_LUAN_MAT: "Mắt bình thường",

    KHAM_TAI_MUI_HONG: 1,
    TAI_TRAI_NOI_THUONG: "5m",
    TAI_TRAI_NOI_THAM: "0.5m",
    TAI_PHAI_NOI_THUONG: "5m",
    TAI_PHAI_NOI_THAM: "0.5m",
    BENH_KHAC_TAI_MUI_HONG: "Không",
    KET_LUAN_TAI_MUI_HONG: "Tai Mũi Họng bình thường",

    KHAM_RANG_HAM_MAT: 1,
    HAM_TREN: "Đủ răng, không sâu",
    HAM_DUOI: "Đủ răng, không sâu",
    BENH_KHAC_RANG_HAM_MAT: "Không",
    KET_LUAN_RANG_HAM_MAT: "Răng Hàm Mặt bình thường",

    XET_NGHIEM_MAU: 1,
    CHI_SO_HC: "4.5",
    CHI_SO_BACH_CAU: "7.2",
    CHI_SO_TIEU_CAU: "250",
    DUONG_MAU: "5.1",
    URE: "4.8",
    CREATININ: "80",
    ASAT: "24",
    ALAT: "22",

    XET_NGHIEM_NUOC_TIEU: 1,
    CHI_SO_DUONG: "Âm tính",
    CHI_SO_PROTEIN: "Âm tính",
    CHI_SO_KHAC: "",

    CHAN_DOAN_HINH_ANH: 1,
    KET_QUA_CHAN_DOAN_HINH_ANH: "X- quang phổi thẳng: Tim phổi bình thường",

    DIEN_TIM: 1,
    KET_QUA_DIEN_TIM: "Nhịp xoang đều tần số 75ck/phút",

    XET_NGHIEM_KHAC: 0,
    TEN_XET_NGHIEM_KHAC: "",
    KET_QUA_XET_NGHIEM_KHAC: "",

    KET_LUAN_LOAI_SUC_KHOE: "Loại I",
    KET_LUAN_CAC_VAN_DE_SUC_KHOE: "Đủ sức khỏe học tập và công tác.",
    CKS_NGUOI_KET_LUAN: "BS_PHANCHITHANH_SIGNED_VALID",
    CKS_BENH_VIEN: "BV_QUAN1_HSK_SIGNED_VALID",
    CKS_LANH_DAO: "GD_NGUYENHOANGNAM_SIGNED_VALID",
  },
  {
    ...createEmptyRecord(),
    id: "REC-DEMO02",
    HO_TEN: "Trần Thị B",
    GIOI_TINH: 2, // Nữ
    NGAY_SINH: "200004120000", // 12/04/2000 (Không có thông tin giờ phút -> mặc định 0000)
    SO_CCCD: "034200012354",
    NGAY_CAP_CCCD: "20220520",
    NOI_CAP_CCCD: "Cục Cảnh sát QLHC về trật tự xã hội",
    DIA_CHI: "456 Đường CMT8, Quận 3, TP. Hồ Chí Minh",
    MATINH_CU_TRU: "79",
    MAXA_CU_TRU: "26744",
    DIEN_THOAI: "0912345678",
    LY_DO_VV: "Khám sức khỏe định kỳ doanh nghiệp",
    CKS_NGUOI_KHAM: "CA_TRANTHIB_SIGNED_VALID",

    MA_LK: "LK-2481B",
    MA_CSKCB: "79002",
    MA_GTIN_CSKCB: "Bệnh viện Đa khoa Sài Gòn",
    NGAY_VAO: "202605180900",

    TSGD_MAC_BENH: 1,
    TSGD_TEN_BENH: "I10;E11", // Tăng huyết áp, Đái tháo đường (Mã ICD10)

    SAN_KHOA: 1,
    BENH_GAY_RA_SAN_KHOA_KHONG_BINH_THUONG: "",

    TIEM_CHUNG_BCG: 1,
    TIEM_CHUNG_BH_HG_UV: 1,
    TIEM_CHUNG_SOI: 1,
    TIEM_CHUNG_BAI_LIET: 1,
    TIEM_CHUNG_VNNB_B: 1,
    TIEM_CHUNG_VGB: 1,
    TIEM_CHUNG_CAC_LOAI_KHAC: 1,
    TIEM_CHUNG_VAC_XIN_KHAC: "Cúm mùa",

    MA_TSBT: 1,
    TSBT_TEN_BENH: "H52.1", // Cận thị
    CO_DANG_DIEU_TRI_BENH: 0,
    TEN_BENH_DANG_DIEU_TRI: "",
    TEN_THUOC: "",

    CHIEU_CAO: "158.0",
    CAN_NANG: "49.5",
    CHI_SO_BMI: "19.83",
    MACH: "80",
    HUYET_AP: "110/70",

    KHAM_NHI_KHOA: 0,
    NHI_KHOA_TUAN_HOAN: "",
    NHI_KHOA_HO_HAP: "",
    NHI_KHOA_TIEU_HOA: "",
    NHI_KHOA_THAN_TIETNIEU: "",
    NHI_KHOA_THAN_KINH: "",
    NHI_KHOA_TAM_THAN: "",
    NHI_KHOA_KHAC: 0,
    TEN_LOAI_KHAM_NHI_KHOA_KHAC: "",
    KET_QUA_KHAM_NHI_KHOA_KHAC: "",

    KHAM_MAT: 1,
    KHONG_KINH_MAT_PHAI: "3/10",
    KHONG_KINH_MAT_TRAI: "4/10",
    CO_KINH_MAT_PHAI: "10/10",
    CO_KINH_MAT_TRAI: "10/10",
    BENH_KHAC_MAT: "Cận thị",
    KET_LUAN_MAT: "Cận thị hai mắt đã chỉnh kính",

    KHAM_TAI_MUI_HONG: 1,
    TAI_TRAI_NOI_THUONG: "5m",
    TAI_TRAI_NOI_THAM: "0.5m",
    TAI_PHAI_NOI_THUONG: "5m",
    TAI_PHAI_NOI_THAM: "0.5m",
    BENH_KHAC_TAI_MUI_HONG: "Không",
    KET_LUAN_TAI_MUI_HONG: "Tai mũi họng bình thường",

    KHAM_RANG_HAM_MAT: 1,
    HAM_TREN: "Đủ răng",
    HAM_DUOI: "Đủ răng",
    BENH_KHAC_RANG_HAM_MAT: "Không",
    KET_LUAN_RANG_HAM_MAT: "Sức khỏe răng miệng tốt",

    XET_NGHIEM_MAU: 1,
    CHI_SO_HC: "4.1",
    CHI_SO_BACH_CAU: "6.5",
    CHI_SO_TIEU_CAU: "230",
    DUONG_MAU: "4.9",
    URE: "4.2",
    CREATININ: "65",
    ASAT: "20",
    ALAT: "18",

    XET_NGHIEM_NUOC_TIEU: 0,
    CHI_SO_DUONG: "",
    CHI_SO_PROTEIN: "",
    CHI_SO_KHAC: "",

    CHAN_DOAN_HINH_ANH: 1,
    KET_QUA_CHAN_DOAN_HINH_ANH: "X- quang phổi thẳng: Chưa thấy bất thường",

    DIEN_TIM: 0,
    KET_QUA_DIEN_TIM: "",

    XET_NGHIEM_KHAC: 0,
    TEN_XET_NGHIEM_KHAC: "",
    KET_QUA_XET_NGHIEM_KHAC: "",

    KET_LUAN_LOAI_SUC_KHOE: "Loại II",
    KET_LUAN_CAC_VAN_DE_SUC_KHOE: "Đủ sức khỏe công tác. Lưu ý cận thị đeo kính phù hợp.",
    CKS_NGUOI_KET_LUAN: "BS_LETHIMAI_SIGNED_VALID",
    CKS_BENH_VIEN: "BV_DK_SG_SIGNED_VALID",
    CKS_LANH_DAO: "GD_TRANTHIKIMCUC_SIGNED_VALID",
  }
];
