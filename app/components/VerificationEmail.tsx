import { Heading, Link, Text } from "@react-email/components";
import { Html } from "@react-email/html";

export function VerificationEmail({
  verificationUrl,
}: {
  verificationUrl: string;
}) {
  return (
    <Html>
      <Heading>Potvrda registracije</Heading>
      <Text>
        Hvala što ste se registrirali. Kliknite na link ispod kako biste
        potvrdili svoj račun:
      </Text>
      <Link href={verificationUrl}>{verificationUrl}</Link>
    </Html>
  );
}
