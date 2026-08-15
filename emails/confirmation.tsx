import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button,
  Hr,
  Img,
} from '@react-email/components';

interface ConfirmationEmailProps {
  id: string;
  serviceId: string;
  firstName: string;
  lastName: string;
  date: string;
  time: string;
}

export function ConfirmationEmail({
  id,
  serviceId,
  firstName,
  lastName,
  date,
  time,
}: ConfirmationEmailProps) {
  const clientName = `${firstName} ${lastName}`;

  return (
    <Html>
      <Head />
      <Preview>Your VizTR session is confirmed</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={logoSectionStyle}>
            <Img
              src="https://viztr.io/logo.png"
              height="28"
              alt="VizTR"
              style={logoStyle}
            />
          </Section>

          <Heading style={headingStyle}>Session confirmed</Heading>

          <Text style={subtitleStyle}>
            {serviceId} · {clientName}
          </Text>

          <Section style={detailsSectionStyle}>
            <table style={tableStyle}>
              <tbody>
                <tr>
                  <td style={labelCellStyle}>Date</td>
                  <td style={valueCellStyle}>{date}</td>
                </tr>
                <tr>
                  <td style={labelCellStyle}>Time</td>
                  <td style={valueCellStyle}>{time} IST</td>
                </tr>
                <tr>
                  <td style={labelCellStyle}>Session ID</td>
                  <td style={idCellStyle}>{id}</td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Section style={buttonSectionStyle}>
            <Button href="https://viztr.io/portal" style={buttonStyle}>
              View session details
            </Button>
          </Section>

          <Hr style={hrStyle} />

          <Text style={footerStyle}>
            We&apos;ll send you a reminder 1 hour before your session.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle = {
  fontFamily: "'Inter', sans-serif",
  backgroundColor: '#0D0D0F',
  color: '#F0EDE8',
  margin: '0',
  padding: '0',
};

const containerStyle = {
  maxWidth: '480px',
  margin: '0 auto',
  padding: '32px 24px',
};

const logoSectionStyle = {
  marginBottom: '32px',
};

const logoStyle = {
  height: '28px',
};

const headingStyle = {
  fontFamily: "'Syne', sans-serif",
  fontSize: '20px',
  fontWeight: '600',
  color: '#F0EDE8',
  margin: '0 0 8px 0',
};

const subtitleStyle = {
  fontSize: '14px',
  color: '#A09D97',
  margin: '0 0 24px 0',
};

const detailsSectionStyle = {
  backgroundColor: '#141416',
  border: '1px solid rgba(255, 255, 255, 0.07)',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '24px',
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

const labelCellStyle = {
  padding: '8px 0',
  color: '#55534E',
  fontSize: '13px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  width: '100px',
};

const valueCellStyle = {
  padding: '8px 0',
  fontSize: '13px',
  fontWeight: '500',
  color: '#F0EDE8',
  textAlign: 'right' as const,
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
};

const idCellStyle = {
  padding: '8px 0',
  fontSize: '12px',
  fontFamily: "'JetBrains Mono', monospace",
  color: '#A09D97',
  textAlign: 'right' as const,
};

const buttonSectionStyle = {
  marginBottom: '24px',
};

const buttonStyle = {
  backgroundColor: '#534AB7',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '500',
  textDecoration: 'none',
  display: 'block',
  textAlign: 'center' as const,
};

const hrStyle = {
  borderColor: 'rgba(255, 255, 255, 0.07)',
  margin: '24px 0',
};

const footerStyle = {
  fontSize: '12px',
  color: '#55534E',
  textAlign: 'center' as const,
  margin: '0',
};
