// src/templates/SMTPTestEmail.tsx
import {
	Html,
	Head,
	Body,
	Container,
	Section,
	Row,
	Column,
	Heading,
	Text,
    Preview,
} from "@react-email/components";

interface SMTPTestEmailProps {
	siteTitle?: string;
	siteFooter?: string;
	greeting?: string;
	testMessage?: string;
	footerNote?: string;
	senderEmail?: string;
	sentAt?: string;
}

export const SMTPTestEmail = ({
	siteTitle = "ohmyblog - Just Do It",
	siteFooter = "All Rights Reserved.",
	greeting = "你好，admin！",
	testMessage = "这是一封用于验证 SMTP 配置的自动生成的测试邮件。如果你能收到此邮件，说明你的邮件服务已成功连接并准备就绪。",
	footerNote = "此邮件由系统自动发出，旨在测试连接稳定性，无需回复。",
	senderEmail = "no-reply@example.com",
	sentAt = "2026/04/28 18:03",
}: SMTPTestEmailProps) => {
    
    // 重新定义颜色，匹配你前端的截图 (绿色系)
    const colors = {
        accent: "#189a30",
        fg: "#243024",
        fgMuted: "#4b5563",
        fgSubtle: "#9ca3af",
        bgMuted: "#f0f9f0",
        border: "#ffffff",
    };

    return (
        <Html lang="zh">
                  <Head>

        <style>{`
          body { font-family: "Inter", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif !important; }
        `}</style>
      </Head>
            <Preview>SMTP 测试邮件</Preview>
            <Body style={{ backgroundColor: "#ffffff", margin: "0", padding: "40px 20px" }}>
                <Container style={{ maxWidth: "600px", margin: "0 auto" }}>
                    {/* 问候语 - text-xl font-bold */}
                    <Heading style={{ fontSize: "20px", fontWeight: "700", color: colors.fg, margin: "0 0 24px", textAlign: 'left' as const }}>
                        {greeting}
                    </Heading>

                    {/* 正文 - leading-relaxed */}
                    <Text style={{ color: colors.fgMuted, lineHeight: "1.6", fontSize: "15px", margin: "0 0 24px" }}>
                        {testMessage}
                    </Text>

                    {/* 连接详情卡片 - 模拟 rounded-xl p-6 border */}
                    <Section style={{ 
                        backgroundColor: colors.bgMuted, 
                        borderRadius: "12px", 
                        border: `1px solid ${colors.border}`, 
                        padding: "24px", 
                        marginBottom: "24px" 
                    }}>
                        {/* 标题栏 */}
                        <Row style={{ marginBottom: "20px" }}>
                            <Column>
                                <div style={{ 
                                    display: 'inline-block', 
                                    width: '8px', 
                                    height: '8px', 
                                    borderRadius: '50%', 
                                    backgroundColor: colors.accent, 
                                    marginRight: '8px' 
                                }} />
                                <span style={{ 
                                    fontSize: "12px", 
                                    fontWeight: "bold", 
                                    textTransform: "uppercase", 
                                    letterSpacing: "0.05em", 
                                    color: colors.fg, 
                                    opacity: 0.7 
                                }}>
                                    连接详情
                                </span>
                            </Column>
                        </Row>

                        {/* 数据网格 - 邮件中建议用 Row/Column 模拟 Grid */}
                        <Row>
                            <Column style={{ width: "50%", paddingBottom: "16px" }}>
                                <Text style={labelStyle}>传输协议</Text>
                                <Text style={{ ...valueStyle, color: colors.accent }}>SMTP / ESMTP</Text>
                            </Column>
                            <Column style={{ width: "50%", paddingBottom: "16px" }}>
                                <Text style={labelStyle}>加密方式</Text>
                                <Text style={{ ...valueStyle, color: colors.accent }}>STARTTLS / SSL</Text>
                            </Column>
                        </Row>
                        <Row>
                            <Column style={{ width: "50%" }}>
                                <Text style={labelStyle}>发件地址</Text>
                                <Text style={valueStyle}>{senderEmail}</Text>
                            </Column>
                            <Column style={{ width: "50%" }}>
                                <Text style={labelStyle}>时间戳</Text>
                                <Text style={valueStyle}>{sentAt}</Text>
                            </Column>
                        </Row>
                    </Section>

                    {/* 提示语 - italic opacity-60 */}
                    <Text style={{ fontSize: "14px", fontStyle: "italic", color: colors.fgSubtle, margin: "0 0 32px" }}>
                        {footerNote}
                    </Text>

                    {/* 底部版权 - border-t border-border/30 */}
                    <Section style={{ borderTop: `1px solid #f3f4f6`, paddingTop: "24px", textAlign: "center" as const }}>
                        <Text style={{ fontSize: "12px", color: colors.fgSubtle, margin: "0", lineHeight: "1.5" }}>
                            © {new Date().getFullYear()} {siteTitle} {siteFooter}
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

const labelStyle = {
	fontSize: "10px",
	fontWeight: "bold" as const,
	textTransform: "uppercase" as const,
	color: "#9ca3af",
	margin: "0 0 4px",
    letterSpacing: "0.02em",
};

const valueStyle = {
  fontSize: "13px",
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  color: "#4b5563",
  lineHeight: "1.5",
  margin: "0",
};

export default SMTPTestEmail;