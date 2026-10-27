"use client";

import { AuthCard } from "@/components/auth/auth-card";
import { EmailStep } from "@/components/auth/email-step";
import { OtpStep } from "@/components/auth/otp-step";
import { StepTransition } from "@/components/auth/step-transition";
import { useEmailOtpFlow } from "@/hooks/use-email-otp-flow";
import { useTranslation } from "react-i18next";

export default function AuthPage({ step, redirectTo }: { step?: "code"; redirectTo?: string }) {
  const { t } = useTranslation("auth");
  const flow = useEmailOtpFlow({ step, redirectTo });
  const onCodeStep = flow.step === "code" && flow.pendingEmail !== null;

  return (
    <AuthCard onBack={onCodeStep ? flow.backToEmail : undefined} backLabel={t("code.changeEmail")}>
      <StepTransition stepKey={onCodeStep ? "code" : "email"}>
        {onCodeStep ? (
          <OtpStep
            key="code"
            email={flow.pendingEmail ?? ""}
            code={flow.code}
            status={flow.codeStatus}
            message={flow.codeMessage}
            secondsLeft={flow.secondsLeft}
            resending={flow.resending}
            sendLimited={flow.sendLimited}
            onChange={flow.changeCode}
            onVerify={flow.verify}
            onResend={flow.resend}
          />
        ) : (
          <EmailStep
            key="email"
            email={flow.email}
            error={flow.emailError}
            sending={flow.sending}
            onChange={flow.changeEmail}
            onSubmit={flow.submitEmail}
          />
        )}
      </StepTransition>
    </AuthCard>
  );
}
