// src/templates/LoginAlertEmail.tsx
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

interface LoginAlertEmailProps {
	siteTitle?: string;
	siteFooter?: string;
	greeting?: string;
	/** 当前登录的 IP */
	currentIp?: string;
	/** 当前登录的地理位置（如 "中国 / 北京"） */
	currentLocation?: string;
	/** 上次登录的地理位置 */
	previousLocation?: string;
	/** 登录时间字符串 */
	loginAt?: string;
	/** OKLCH hue (0–360)，与外观配置同步 */
	hue?: number;
}

export const LoginAlertEmail = ({
	siteTitle = "ohmyblog",
	siteFooter = "All Rights Reserved.",
	greeting = "你好，admin！",
	currentIp = "0.0.0.0",
	currentLocation = "未知",
	previousLocation = "未知",
	loginAt = "—",
	hue = 250,
}: LoginAlertEmailProps) => {
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
				<Preview>检测到来自新国家/地区的登录</Preview>
				<Body className="bg-white m-0 py-10 px-5">
					<Container style={{ maxWidth: "600px", margin: "0 auto" }}>
						<Heading className="text-xl font-bold text-fg mt-0 mb-6 text-left">
							{greeting}
						</Heading>

						<Text className="text-[15px] leading-relaxed text-fg-muted mt-0 mb-8">
							我们刚刚检测到你的账号在一个与以往不同的地理位置登录。如果是你本人操作，请忽略此邮件；如果不是，请立即修改密码并检查账号安全。
						</Text>

						{/* 登录详情卡片 */}
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
										登录详情
									</span>
								</Column>
							</Row>

							<Row>
								<Column style={{ width: "50%", paddingBottom: "20px" }}>
									<Text className={labelClass}>当前位置</Text>
									<Text className={`${valueClass} text-accent`}>
										{currentLocation}
									</Text>
								</Column>
								<Column style={{ width: "50%", paddingBottom: "20px" }}>
									<Text className={labelClass}>上次位置</Text>
									<Text className={`${valueClass} text-fg-muted`}>
										{previousLocation}
									</Text>
								</Column>
							</Row>
							<Row>
								<Column style={{ width: "50%" }}>
									<Text className={labelClass}>IP 地址</Text>
									<Text className={`${valueClass} text-fg-muted`}>
										{currentIp}
									</Text>
								</Column>
								<Column style={{ width: "50%" }}>
									<Text className={labelClass}>登录时间</Text>
									<Text className={`${valueClass} text-fg-muted`}>
										{loginAt}
									</Text>
								</Column>
							</Row>
						</Section>

						<Text className="text-sm italic text-fg-subtle mt-0 mb-8">
							如果不是你本人操作，建议立即修改密码并检查最近的活动记录。
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

export default LoginAlertEmail;
