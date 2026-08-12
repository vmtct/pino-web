"use client";

import { useEffect } from "react";

// Transitional CMS bridge: maps the current UI copy to stable Notion Content Keys.
// This keeps the visual components intact while we progressively move copy into CMS-native props.
const TARGETS: Record<string, string[]> = {
  site_nav_open_studio: ["Open Studio", "Các buổi đang có"],
  site_nav_member_space: ["Member Space", "Mở Member Space →"],

  homepage_hero_eyebrow: ["PINO OPEN STUDIO · AGES 3–15", "PINO CREATIVE CLUB"],
  homepage_hero_title: ["Cho con một", "buổi chiều thật ý nghĩa.", "Một nơi để con tự do khám phá."],
  homepage_hero_description: [
    "Một buổi chiều để con thử Art và Piano — không cần chọn trước. Bắt đầu với một Open Studio pass miễn phí và xem điều gì thật sự chạm đến con.",
    "Âm nhạc, mỹ thuật và những trải nghiệm sáng tạo được thiết kế để con lớn lên theo cách của riêng mình.",
  ],
  homepage_hero_cta: ["Get their first pass", "Khám phá Open Studio →"],
  homepage_open_studio_heading: ["Don't choose a path yet.", "Just come play.", "Cho con một buổi chiều thật khác."],
  homepage_open_studio_cta: ["Get their first Open Studio pass", "Xem các buổi Open Studio →"],
  homepage_membership_heading: ["Một câu lạc bộ để con lớn lên cùng nghệ thuật."],
  homepage_membership_cta: ["Tìm hiểu về PINO →"],

  os_hero_eyebrow: ["PINO OPEN STUDIO · 1 BUỔI KHÁM PHÁ", "OPEN STUDIO"],
  os_hero_title: ["Nếu hôm nay con được tự chọn?"],
  os_hero_description: [
    "Một buổi chiều để con vẽ, chơi nhạc và khám phá điều mình thích. Không thêm áp lực. Chỉ là một khoảng thời gian thật sự của riêng con.",
    "Một buổi chiều để con thử một điều mới, gặp những người bạn mới và mang về một câu chuyện của riêng mình.",
  ],
  os_hero_cta: ["Chọn một buổi cho con →"],
  os_upcoming_heading: ["Các buổi sắp tới", "Con có thể", "khám phá gì?"],
  os_recent_heading: ["Những buổi vừa diễn ra", "Các buổi vừa diễn ra"],
  os_this_week: ["THIS WEEK AT PINO"],
  os_how_it_works_heading: ["HOW IT WORKS"],
  os_loading: ["Đang xem lịch Open Studio…", "Đang tải lịch Open Studio…"],
  os_load_error: ["Lịch Open Studio đang tạm thời chưa tải được."],
  os_retry: ["Tải lại"],
  os_no_sessions: ["Chưa có session để hiển thị.", "Hiện chưa có buổi nào được mở."],
  os_slot_remaining: ["chỗ còn lại"],
  os_slot_count: ["chỗ"],
  os_day_sessions: ["buổi"],
  os_day_today: ["Hôm nay"],
  os_day_monday: ["T2"],
  os_day_tuesday: ["T3"],
  os_day_wednesday: ["T4"],
  os_day_thursday: ["T5"],
  os_day_friday: ["T6"],
  os_day_saturday: ["T7"],
  os_day_sunday: ["CN"],
  os_view_detail: ["Xem chi tiết →"],
  os_status_available: ["OPEN", "Còn chỗ"],
  os_status_full: ["FULL", "Đã đầy"],
  os_status_updating: ["CHECK", "Đang cập nhật"],
  os_detail_explore_heading: ["Con sẽ khám phá gì?"],
  os_detail_skill_heading: ["Điều con sẽ học"],
  os_detail_register_cta: ["Đăng ký tham gia"],
  os_detail_booking_note: ["Chỉ cần số Zalo. PINO sẽ liên hệ để xác nhận lịch và chỗ trống cho bé."],
  os_booking_title: ["Đăng ký tham gia"],
  os_booking_phone_label: ["Số Zalo của phụ huynh"],
  os_booking_phone_placeholder: ["Nhập số điện thoại Zalo"],
  os_booking_submit: ["Gửi đăng ký →"],
  os_booking_success_title: ["PINO đã nhận đăng ký 🎉"],
  os_booking_success_description: ["Cảm ơn bạn. PINO sẽ liên hệ qua Zalo để xác nhận ngày, giờ và chỗ trống cho bé."],
  os_booking_success_no_account: ["Bạn chưa cần tạo tài khoản."],
  os_booking_error: ["Chưa thể gửi đăng ký lúc này. Vui lòng thử lại sau ít phút."],
  os_back_to_sessions: ["Xem các buổi khác"],
  os_member_cta: ["Mở Member Space →"],

  member_eyebrow: ["PINO MEMBER SPACE"],
  member_title: ["Một nơi để con tiếp tục khám phá."],
  member_phone_label: ["Số điện thoại phụ huynh"],
  member_phone_placeholder: ["Nhập số điện thoại đã đăng ký"],
  member_continue_cta: ["Tiếp tục →"],
  member_privacy_note: ["PINO chỉ sử dụng số điện thoại này để xác định tài khoản gia đình của bạn."],
  member_book_title: ["Đặt một buổi cho bé"],
  member_book_student: ["Bé nào sẽ tham gia?"],
  member_book_session: ["Chọn một buổi"],
  member_book_confirm: ["Xác nhận đăng ký"],
  member_book_confirmed: ["Đã xác nhận đăng ký"],
};

const normalize = (value: string) => value.replace(/\s+/g, " ").trim();

export default function CmsHydrator() {
  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      try {
        const response = await fetch("/api/web-content", { cache: "no-store" });
        if (!response.ok) return;
        const payload = await response.json() as { content?: Record<string, string> };
        if (cancelled) return;

        const content = payload.content || {};
        const textNodes: Text[] = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          if (node.parentElement && !["SCRIPT", "STYLE", "NOSCRIPT"].includes(node.parentElement.tagName)) {
            textNodes.push(node as Text);
          }
        }

        for (const [key, value] of Object.entries(content)) {
          if (!value || !TARGETS[key]) continue;
          const candidates = new Set(TARGETS[key].map(normalize));
          for (const textNode of textNodes) {
            const current = normalize(textNode.nodeValue || "");
            if (candidates.has(current)) textNode.nodeValue = value;
          }
        }
      } catch {
        // Keep local fallback copy when CMS is unavailable.
      }
    };

    hydrate();
    return () => { cancelled = true; };
  }, []);

  return null;
}
