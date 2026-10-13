"use client";

import { ArrowRight } from "lucide-react";
import LoginForm from "@/app/login/LoginForm";
import { buildStartUrl, type OnboardingAnswers } from "@/lib/onboarding";
import StepFrame, { Photo } from "./StepFrame";

export default function AccountStep({ answers, signedIn }: { answers: OnboardingAnswers; signedIn: boolean }) {
  const startUrl = buildStartUrl(answers);
  return (
    <StepFrame step={3} answers={answers} aside={<Photo src="/images/get-started/account.jpg" className="h-full" />}>
      <div className="mx-auto flex min-h-full max-w-md flex-col justify-center py-8">
        {signedIn ? (
          <>
            <h1 className="font-display text-3xl leading-tight sm:text-4xl">You are all set, {answers.name}.</h1>
            <p className="mt-3 text-sm text-slateLight">You are already signed in. Continue to confirm your web address and open your dashboard.</p>
            <a href={startUrl} className="btn-premium mt-8 self-start">Open my dashboard <ArrowRight className="h-4 w-4" /></a>
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl leading-tight sm:text-4xl">Create your account</h1>
            <p className="mt-3 text-sm text-slateLight">One account for {answers.name}, your team and your website. No waiting for approval: you get your own business dashboard straight away.</p>
            <LoginForm next={startUrl} linkError={false} initialMode="signup" />
          </>
        )}
      </div>
    </StepFrame>
  );
}
