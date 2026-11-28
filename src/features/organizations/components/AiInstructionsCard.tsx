"use client";

import { useState, useTransition } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateAiInstructionsAction } from "../actions";
import { UpdateAiInstructionsSchema, type OrganizationDto } from "../schemas";
import { OrganizationFormCard } from "./OrganizationFormCard";

interface AiInstructionsCardProps {
  organization: OrganizationDto;
  onUpdated: (org: OrganizationDto) => void;
}

const MAX_INSTRUCTIONS_LENGTH = 4000;

export function AiInstructionsCard({
  organization,
  onUpdated,
}: AiInstructionsCardProps) {
  const [instructions, setInstructions] = useState(
    organization.ai_instructions,
  );
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function validate(value: string): string | null {
    const parsed = UpdateAiInstructionsSchema.safeParse({
      ai_instructions: value,
    });
    return parsed.success
      ? null
      : (parsed.error.issues[0]?.message ?? "Invalid instructions");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSavedMessage(null);

    const validationError = validate(instructions);
    setFieldError(validationError);
    if (validationError) return;

    startTransition(async () => {
      const result = await updateAiInstructionsAction({
        ai_instructions: instructions,
      });
      if (!result.ok) {
        setErrorMessage(result.message);
        return;
      }
      onUpdated(result.data);
      setInstructions(result.data.ai_instructions);
      setFieldError(null);
      setSavedMessage("Saved");
    });
  }

  return (
    <OrganizationFormCard
      title="Takodu Assistant"
      submitLabel="Save changes"
      isPending={isPending}
      errorMessage={errorMessage}
      savedMessage={savedMessage}
      onSubmit={handleSubmit}
      className="h-fit"
      contentClassName="space-y-4"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="ai-instructions">Assistant instructions</Label>
          <span className="text-xs tabular-nums text-muted-foreground">
            {instructions.length} / {MAX_INSTRUCTIONS_LENGTH}
          </span>
        </div>
        <Textarea
          id="ai-instructions"
          value={instructions}
          aria-invalid={Boolean(fieldError)}
          onChange={(e) => {
            const val = e.target.value;
            setInstructions(val);
            setSavedMessage(null);
            if (fieldError) setFieldError(validate(val));
          }}
          maxLength={MAX_INSTRUCTIONS_LENGTH}
          className="h-48 resize-none overflow-y-auto"
          placeholder="Describe how the assistant should greet customers, answer questions, and handle bookings..."
        />
        {fieldError ? (
          <p className="text-xs text-destructive">{fieldError}</p>
        ) : null}
      </div>
    </OrganizationFormCard>
  );
}
