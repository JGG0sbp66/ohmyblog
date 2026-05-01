// src/templates/SMTPTestEmail.tsx
import {
	Body,
	Column,
	Container,
	Head,
	Heading,
	Html,
	Preview,
	Row,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";
import { hueToEmailColors } from "../utils/emailColors";
import type { TSMTPTestEmailParams } from "../dtos/email.dto";

export const SMTPTestEmail = ({
	siteTitle = "ohmyblog - Just Do It",
	siteFooter = "All Rights Reserved.",
	greeting = "你好，admin！",
	testMessage = "这是一封用于验证 SMTP 配置的自动生成的测试邮件。如果你能收到此邮件，说明你的邮件服务已成功连接并准备就绪。",
	footerNote = "此邮件由系统自动发出，旨在测试连接稳定性，无需回复。",
	senderEmail = "no-reply@example.com",
	sentAt = "2026/04/28 18:03",
	hue = 250,
}: TSMTPTestEmailParams) => {
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
				<Preview>SMTP 测试邮件</Preview>
				<Body className="bg-white m-0 py-10 px-5">
					<Container style={{ maxWidth: "600px", margin: "0 auto" }}>
						{/* 问候语 */}
						<Heading className="text-xl font-bold text-fg mt-0 mb-6 text-left">
							{greeting}
						</Heading>

						{/* 正文 */}
						<Text className="text-[15px] leading-relaxed text-fg-muted mt-0 mb-8">
							{testMessage}
						</Text>

						{/* 连接详情卡片 */}
						<Section className="bg-bg-muted-soft rounded-xl border border-border-soft p-6 mb-8">
							{/* 标题栏 */}
							<Row className="mb-5">
								<Column>
									<div
										style={{
											display: "inline-block",
											width: "6px",
											height: "6px",
											borderRadius: "50%",
											backgroundColor: colors.accent,
											marginRight: "8px",
											verticalAlign: "middle",
										}}
									/>
									<span className="text-sm font-bold uppercase tracking-wider text-fg-muted">
										连接详情
									</span>
								</Column>
							</Row>

							{/* 数据网格 */}
							<Row>
								<Column style={{ width: "50%", paddingBottom: "20px" }}>
									<Text className={labelClass}>传输协议</Text>
									<Text className={`${valueClass} text-accent`}>
										SMTP / ESMTP
									</Text>
								</Column>
								<Column style={{ width: "50%", paddingBottom: "20px" }}>
									<Text className={labelClass}>加密方式</Text>
									<Text className={`${valueClass} text-accent`}>
										STARTTLS / SSL
									</Text>
								</Column>
							</Row>
							<Row>
								<Column style={{ width: "50%" }}>
									<Text className={labelClass}>发件地址</Text>
									<Text className={`${valueClass} text-fg-muted`}>
										{senderEmail}
									</Text>
								</Column>
								<Column style={{ width: "50%" }}>
									<Text className={labelClass}>时间戳</Text>
									<Text className={`${valueClass} text-fg-muted`}>
										{sentAt}
									</Text>
								</Column>
							</Row>
						</Section>

						{/* 提示语 */}
						<Text className="text-sm italic text-fg-subtle mt-0 mb-8">
							{footerNote}
						</Text>

						{/* 底部版权 */}
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

const labelClass =
	"text-[10px] font-bold uppercase text-fg-subtle m-0 mb-1.5 tracking-tight";

const valueClass = "text-sm font-mono leading-normal m-0";

export default SMTPTestEmail;
