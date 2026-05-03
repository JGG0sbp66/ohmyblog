// src/templates/ResetPasswordEmail.tsx
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
import type { TResetPasswordEmailParams } from "../dtos/email.dto";
import { hueToEmailColors } from "../utils/emailColors";

export const ResetPasswordEmail = ({
	siteTitle = "ohmyblog",
	siteFooter = "All Rights Reserved.",
	greeting = "你好，admin！",
	code = "000000",
	expiresInMinutes = 15,
	ip = "122.224.54.123",
	location = "中国 / 浙江 / 杭州",
	hue = 250,
}: TResetPasswordEmailParams) => {
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
				<Preview>密码重置验证码</Preview>
				<Body className="bg-white m-0 py-10 px-5">
					<Container style={{ maxWidth: "600px", margin: "0 auto" }}>
						<Heading className="text-xl font-bold text-fg mt-0 mb-6 text-left">
							{greeting}
						</Heading>

						<Text className="text-[15px] leading-relaxed text-fg-muted mt-0 mb-8">
							我们收到了你的密码重置请求。请在重置页面输入下方的验证码完成重置。如果不是你本人操作，请忽略此邮件，你的账号仍然安全。
						</Text>

						{/* 验证码与安全信息卡片 */}
						<Section className="bg-bg-muted-soft rounded-xl border border-border-soft py-8 px-6 mb-8 text-center">
							<Text className="text-[10px] font-bold uppercase text-fg-subtle m-0 mb-3 tracking-widest">
								验证码
							</Text>
							<Text
								className="text-accent m-0"
								style={{
									fontFamily:
										"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
									fontSize: "32px",
									fontWeight: 700,
									letterSpacing: "8px",
									lineHeight: 1.2,
								}}
							>
								{code}
							</Text>
							<Text className="text-xs text-fg-subtle m-0 mt-3">
								有效期 {expiresInMinutes} 分钟
							</Text>

							{/* 底部安全信息区 */}
							<Section className="mt-6 pt-4 border-t border-border-light">
								<Text className="text-[11px] text-fg-muted m-0">
									请求来自 {location} · IP: {ip}
								</Text>
								<Text className="text-[10px] text-fg-subtle m-0 mt-1">
									{new Date().toLocaleString("zh-CN", { hour12: false })}
								</Text>
							</Section>
						</Section>

						<Text className="text-sm italic text-fg-subtle mt-0 mb-8">
							为了你的账号安全，请勿将此验证码透露给任何人。
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

export default ResetPasswordEmail;
