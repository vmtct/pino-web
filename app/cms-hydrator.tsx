"use client";

import { useEffect } from "react";

const TARGETS: Record<string, string[]> = {
  site_nav_open_studio: ["Open Studio", "Các buổi đang có"],
  site_nav_member_space: ["Member Space", "Mở Member Space →"],
  homepage_hero_eyebrow: ["PINO OPEN STUDIO · AGES 3–15"],
  homepage_hero_title: ["Cho con một", "buổi chiều thật ý nghĩa."],
  homepage_hero_description: ["Một buổi chiều để con thử Art và Piano — không cần chọn trước. Bắt đầu với một Open Studio pass miễn phí và xem điều gì thật sự chạm đến con."],
  homepage_hero_cta: ["Get their first pass"],
  homepage_open_studio_heading: ["Don't choose a path yet.", "Just come play."],
  homepage_open_studio_cta: ["Get their first Open Studio pass"],
  os_hero_eyebrow: ["PINO OPEN STUDIO · 1 BUỔI KHÁM PHÁ"],
  os_hero_title: ["Nếu hôm nay con được tự chọn?"],
  os_hero_description: ["Một buổi chiều để con vẽ, chơi nhạc và khám phá điều mình thích. Không thêm áp lực. Chỉ là một khoảng thời gian thật sự của riêng con."],
  os_hero_cta: ["Chọn một buổi cho con →"],
  os_upcoming_heading: ["Các buổi sắp tới", "Con có thể"],
  os_recent_heading: ["Những buổi vừa diễn ra"],
  os_loading: ["Đang xem lịch Open Studio…"],
  os_load_error: ["Lịch Open Studio đang tạm thời chưa tải được."],
  os_retry: ["Tải lại"],
  os_no_sessions: ["Chưa có session để hiển thị."],
  os_slot_remaining: ["chỗ còn lại"],
  os_day_sessions: ["buổi"],
  os_day_today: ["Hôm nay"],
  os_view_detail: ["Xem chi tiết →"],
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
  os_booking_error: ["Chưa thể gửi đăng ký lúc này. Vui lòng thử lại sau ít phút."],
  os_back_to_sessions: ["Xem các buổi khác"],
  member_eyebrow: ["PINO MEMBER SPACE"],
  member_title: ["Một nơi để con tiếp tục khám phá."],
  member_phone_label: ["Số điện thoại phụ huynh"],
  member_phone_placeholder: ["Nhập số điện thoại đã đăng ký"],
  member_continue_cta: ["Tiếp tục →"],
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
          if (node.parentElement && !["SCRIPT", "STYLE", "NOSCRIPT"].includes(node.parentElement.tagName)) textNodes.push(node as Text);
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
        // The website keeps its local fallback copy if the CMS is unavailable.
      }
    };
    hydrate();
    return () => { cancelled = true; };
  }, []);

  return null;
}
