export type PinerDestination = "home" | "journey" | "collection" | "explore";

export const PINER_DESTINATIONS: ReadonlyArray<{ id: PinerDestination; label: string }> = [
  { id: "home", label: "Trang chủ" },
  { id: "journey", label: "Hành trình" },
  { id: "collection", label: "Thành quả" },
  { id: "explore", label: "Khám phá" },
] as const;

export type MembershipPresentation =
  | { label: "Premium"; detail: string }
  | { label: "Khám Phá"; detail: string }
  | { label: "Trải nghiệm"; detail: string }
  | { label: "Trải nghiệm đã kết thúc"; detail: string }
  | { label: "Premium đã kết thúc"; detail: string };

export interface PinerStudentScene {
  student: {
    id: string;
    displayName: string;
    shortName: string;
    avatarText: string;
  };
  home: {
    greeting: string;
    nextAction: { eyebrow: string; title: string; detail: string; cta: string };
    membership: MembershipPresentation;
    upcoming: Array<{ id: string; when: string; title: string; place: string }>;
  };
  journey: {
    pathTitle: string;
    pathNote: string;
    currentFocus: string;
    moments: Array<{ id: string; title: string; note: string; state: "done" | "current" | "next" }>;
  };
  collection: {
    headline: string;
    items: Array<{ id: string; kind: string; title: string; note: string }>;
  };
  explore: {
    intro: string;
    items: Array<{ id: string; label: "Khám Phá" | "Trải nghiệm" | "Premium"; title: string; meta: string; note: string }>;
  };
}

export interface PinerPrototypeHousehold {
  parentLabel: string;
  students: PinerStudentScene[];
}

/**
 * Presentation-only fixture for the Piner v1 shell while canonical DB/auth contracts are migrating.
 * Never use these objects as eligibility, Booking, Membership, authorization, or progress truth.
 */
export const PINER_PROTOTYPE_HOUSEHOLD: PinerPrototypeHousehold = {
  parentLabel: "Gia đình PINO",
  students: [
    {
      student: { id: "prototype-student-an", displayName: "An", shortName: "An", avatarText: "A" },
      home: {
        greeting: "Chào An, hôm nay mình tiếp tục điều gì?",
        nextAction: {
          eyebrow: "TIẾP TỤC",
          title: "Hoàn thiện đoạn điệp khúc",
          detail: "Piano House · bài đang học của An",
          cta: "Mở hành trình",
        },
        membership: { label: "Premium", detail: "Đang hoạt động · thông tin minh hoạ" },
        upcoming: [
          { id: "an-up-1", when: "Tối nay · 18:00", title: "Piano House", place: "PINO Cần Thơ" },
          { id: "an-up-2", when: "Chủ nhật · 15:00", title: "Open Studio", place: "PINO Cần Thơ" },
        ],
      },
      journey: {
        pathTitle: "Piano · Hành trình hiện tại",
        pathNote: "Path-native presentation — không quy đổi thành một level chung giả lập.",
        currentFocus: "Giữ nhịp đều khi phối hợp hai tay",
        moments: [
          { id: "an-j-1", title: "Giai điệu tay phải", note: "Đã lưu vào hành trình", state: "done" },
          { id: "an-j-2", title: "Phối hợp hai tay", note: "Đang tập trung", state: "current" },
          { id: "an-j-3", title: "Biểu cảm & dynamics", note: "Tiếp theo", state: "next" },
        ],
      },
      collection: {
        headline: "Những điều An đã làm được và giữ lại.",
        items: [
          { id: "an-c-1", kind: "Bản thu", title: "Always With Me", note: "Khoảnh khắc biểu diễn gần nhất" },
          { id: "an-c-2", kind: "Milestone", title: "Hai tay cùng chơi", note: "Một dấu mốc trong hành trình Piano" },
          { id: "an-c-3", kind: "Tác phẩm", title: "Khu rừng đêm", note: "Open Studio · acrylic" },
        ],
      },
      explore: {
        intro: "Những lý do thú vị để An quay lại PINO.",
        items: [
          { id: "an-e-1", label: "Khám Phá", title: "Open Studio · Acrylic", meta: "Chủ nhật · 15:00", note: "Thông tin hiển thị mẫu; quyền tham gia sẽ do Core quyết định." },
          { id: "an-e-2", label: "Premium", title: "Piano Practice Room", meta: "Theo lịch PINO House", note: "Presentation only — chưa nối entitlement." },
        ],
      },
    },
    {
      student: { id: "prototype-student-minh", displayName: "Minh", shortName: "Minh", avatarText: "M" },
      home: {
        greeting: "Chào Minh, hôm nay có gì đáng mong chờ?",
        nextAction: {
          eyebrow: "GỢI Ý HÔM NAY",
          title: "Mang bức vẽ tuần trước trở lại",
          detail: "Artchitect · tiếp tục từ tác phẩm của Minh",
          cta: "Xem hành trình",
        },
        membership: { label: "Khám Phá", detail: "Không có gói Premium đang hoạt động" },
        upcoming: [{ id: "minh-up-1", when: "Thứ bảy · 18:00", title: "Artchitect", place: "PINO Cần Thơ" }],
      },
      journey: {
        pathTitle: "Artchitect · Hành trình hiện tại",
        pathNote: "Mỗi Path giữ progression riêng của mình.",
        currentFocus: "Quan sát hình khối và ánh sáng",
        moments: [
          { id: "minh-j-1", title: "Đường nét", note: "Đã lưu vào hành trình", state: "done" },
          { id: "minh-j-2", title: "Hình khối", note: "Đang tập trung", state: "current" },
          { id: "minh-j-3", title: "Ánh sáng", note: "Tiếp theo", state: "next" },
        ],
      },
      collection: {
        headline: "Một góc nhỏ lưu những thứ Minh đã tạo ra.",
        items: [
          { id: "minh-c-1", kind: "Tác phẩm", title: "Ngôi nhà bên hồ", note: "Màu sáp" },
          { id: "minh-c-2", kind: "Milestone", title: "Quan sát hình khối", note: "Dấu mốc Artchitect" },
        ],
      },
      explore: {
        intro: "Khám phá thêm mà không làm lẫn với hành trình hiện tại.",
        items: [
          { id: "minh-e-1", label: "Khám Phá", title: "Open Studio · Make", meta: "Cuối tuần", note: "Core sẽ quyết định age-fit, capacity và access khi runtime contract sẵn sàng." },
          { id: "minh-e-2", label: "Trải nghiệm", title: "Piano thử một buổi", meta: "Theo lịch mở", note: "Copy minh hoạ; không phải entitlement thật." },
        ],
      },
    },
  ],
};
