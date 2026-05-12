// src/templates/FriendLinkApplyNotifyEmail.tsx
import {
	Body,
	Column,
	Container,
	Head,
	Heading,
	Html,
	Link,
	Preview,
	Row,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";
import type { TFriendLinkApplyNotifyEmailParams } from "../dtos/email.dto";
import { hueToEmailColors } from "../utils/emailColors";

export const FriendLinkApplyNotifyEmail = ({
	siteTitle = "ohmyblog",
	siteFooter = "All Rights Reserved.",
	greeting = "你好，Admin！",
	hue = 250,
	siteName = "示例站点",
	siteUrl = "https://example.com",
	siteDescription,
	siteTags,
	applicantEmail,
}: TFriendLinkApplyNotifyEmailParams) => {
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
				<Preview>收到一条新的友链申请 — {siteName}</Preview>
				<Body className="bg-white m-0 py-10 px-5">
					<Container style={{ maxWidth: "600px", margin: "0 auto" }}>
						<Heading className="text-xl font-bold text-fg mt-0 mb-6 text-left">
							{greeting}
						</Heading>

						<Text className="text-[15px] leading-relaxed text-fg-muted mt-0 mb-8">
							你的博客收到了一条新的友链申请，请登录后台审核。
						</Text>

						{/* 申请信息卡片 */}
						<Section className="bg-bg-muted-soft rounded-xl border border-border-soft p-6 mb-8">
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
										申请详情
									</span>
								</Column>
							</Row>

							<Row>
								<Column style={{ width: "30%", paddingBottom: "16px" }}>
									<Text className={labelClass}>站点名称</Text>
									<Text className={`${valueClass} text-fg`}>{siteName}</Text>
								</Column>
								<Column style={{ width: "70%", paddingBottom: "16px" }}>
									<Text className={labelClass}>站点地址</Text>
									<Link href={siteUrl} className={`${valueClass} text-accent`}>
										{siteUrl}
									</Link>
								</Column>
							</Row>

							{siteDescription && (
								<Row>
									<Column style={{ paddingBottom: "16px" }}>
										<Text className={labelClass}>站点简介</Text>
										<Text className={`${valueClass} text-fg-muted`}>
											{siteDescription}
										</Text>
									</Column>
								</Row>
							)}

							{siteTags && siteTags.length > 0 && (
								<Row>
									<Column style={{ paddingBottom: "16px" }}>
										<Text className={labelClass}>标签</Text>
										<Text className={`${valueClass} text-fg-muted`}>
											{siteTags.map((t) => `#${t}`).join("  ")}
										</Text>
									</Column>
								</Row>
							)}

							{applicantEmail && (
								<Row>
									<Column>
										<Text className={labelClass}>联系邮箱</Text>
										<Text className={`${valueClass} text-fg-muted`}>
											{applicantEmail}
										</Text>
									</Column>
								</Row>
							)}
						</Section>

						<Text className="text-sm italic text-fg-subtle mt-0 mb-8">
							请登录管理后台进行审批，通过后对方站点将在友链页面展示。
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

const labelClass =
	"text-[10px] font-bold uppercase text-fg-subtle m-0 mb-1.5 tracking-tight";
const valueClass = "text-sm font-mono leading-normal m-0";

export default FriendLinkApplyNotifyEmail;
