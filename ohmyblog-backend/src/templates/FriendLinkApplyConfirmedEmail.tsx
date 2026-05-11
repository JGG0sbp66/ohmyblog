// src/templates/FriendLinkApplyConfirmedEmail.tsx
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
import type { TFriendLinkApplyConfirmedEmailParams } from "../dtos/email.dto";
import { hueToEmailColors } from "../utils/emailColors";

export const FriendLinkApplyConfirmedEmail = ({
	siteTitle = "ohmyblog",
	siteFooter = "All Rights Reserved.",
	hue = 250,
	applicantSiteName = "你的站点",
}: TFriendLinkApplyConfirmedEmailParams) => {
	const colors = hueToEmailColors(hue);

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
				<Preview>友链申请已收到 — {siteTitle}</Preview>
				<Body className="bg-white m-0 py-10 px-5">
					<Container style={{ maxWidth: "600px", margin: "0 auto" }}>
						<Heading className="text-xl font-bold text-fg mt-0 mb-6 text-left">
							你的友链申请已收到！
						</Heading>

						<Text className="text-[15px] leading-relaxed text-fg-muted mt-0 mb-8">
							感谢申请加入{" "}
							<span style={{ color: colors.accent, fontWeight: 600 }}>
								{siteTitle}
							</span>{" "}
							的友链！我们已收到「{applicantSiteName}」的申请，博主将会尽快进行审核。
						</Text>

						<Section className="bg-bg-muted-soft rounded-xl border border-border-soft p-6 mb-8">
							<Text
								className="text-[10px] font-bold uppercase text-fg-subtle m-0 mb-3 tracking-tight"
							>
								接下来会发生什么？
							</Text>
							<Text className="text-sm text-fg-muted m-0 leading-relaxed">
								审核通过后，你的站点将出现在友链页面，同时你会收到一封通知邮件。如果申请未通过，我们也会告知原因。
							</Text>
						</Section>

						<Text className="text-sm italic text-fg-subtle mt-0 mb-8">
							请勿回复此邮件，如有疑问请通过其他方式联系博主。
						</Text>

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

export default FriendLinkApplyConfirmedEmail;
