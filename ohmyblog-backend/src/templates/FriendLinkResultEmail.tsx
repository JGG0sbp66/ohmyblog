// src/templates/FriendLinkResultEmail.tsx
import {
	Body,
	Container,
	Head,
	Heading,
	Html,
	Preview,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";
import type { TFriendLinkResultEmailParams } from "../dtos/email.dto";
import { hueToEmailColors } from "../utils/emailColors";

export const FriendLinkResultEmail = ({
	siteTitle = "ohmyblog",
	siteFooter = "All Rights Reserved.",
	hue = 250,
	applicantSiteName = "你的站点",
	result = "approved",
	rejectReason,
}: TFriendLinkResultEmailParams) => {
	const colors = hueToEmailColors(hue);
	const isApproved = result === "approved";

	return (
		<Tailwind
			config={{
				theme: {
					extend: {
						colors: {
							accent: colors.accent,
							fg: colors.fg,
							"fg-muted": colors.fgMuted,
							"fg-subtle": colors.fgSubtle,
							"bg-muted": colors.bgMuted,
							"bg-muted-soft": colors.bgMutedSoft,
							border: colors.border,
							"border-soft": colors.borderSoft,
							"border-light": colors.borderLight,
						},
					},
				},
			}}
		>
			<Html lang="zh">
				<Head>
					<style>{`
            body { font-family: "Inter", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif !important; }
          `}</style>
				</Head>
				<Preview>
					{isApproved
						? `你的友链申请已通过 — ${siteTitle}`
						: `你的友链申请未通过 — ${siteTitle}`}
				</Preview>
				<Body className="bg-white m-0 py-10 px-5">
					<Container style={{ maxWidth: "600px", margin: "0 auto" }}>
						<Heading className="text-xl font-bold text-fg mt-0 mb-6 text-left">
							{isApproved ? "🎉 友链申请已通过！" : "友链申请未通过"}
						</Heading>

						<Text className="text-[15px] leading-relaxed text-fg-muted mt-0 mb-8">
							{isApproved
								? `感谢你申请加入 ${siteTitle} 的友链！「${applicantSiteName}」已审批通过，你的站点现已展示在友链页面中。`
								: `很遗憾，「${applicantSiteName}」的友链申请未能通过审核。`}
						</Text>

						{/* 拒绝原因（仅 rejected 时显示） */}
						{!isApproved && rejectReason && (
							<Section className="bg-bg-muted-soft rounded-xl border border-border-soft p-6 mb-8">
								<Text
									className="text-[10px] font-bold uppercase text-fg-subtle m-0 mb-2 tracking-tight"
								>
									未通过原因
								</Text>
								<Text className="text-sm text-fg-muted m-0">{rejectReason}</Text>
							</Section>
						)}

						{!isApproved && !rejectReason && (
							<Text className="text-sm italic text-fg-subtle mt-0 mb-8">
								如有疑问，欢迎通过其他方式联系博主。
							</Text>
						)}

						{isApproved && (
							<Text className="text-sm italic text-fg-subtle mt-0 mb-8">
								期待与你互访交流！
							</Text>
						)}

						<Section className="border-t border-border-light pt-6 text-center">
							<Text className="text-[12px] text-fg-subtle m-0 leading-normal">
								© {new Date().getFullYear()} {siteTitle} {siteFooter}
							</Text>
						</Section>
					</Container>
				</Body>
			</Html>
		</Tailwind>
	);
};

export default FriendLinkResultEmail;
