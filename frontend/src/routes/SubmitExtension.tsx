import { ChangeEvent, FormEvent, useState } from "react";
import { Card, Flex, Heading, Text } from "@radix-ui/themes";
import {
  saveCommunityExtension,
} from "../data/community-submissions";
import { ExtensionType, SubmissionFormData } from "../types/extensions";

const INITIAL_FORM: SubmissionFormData = {
  title: "",
  summary: "",
  type: "paid-gate",
  imageUrl: "",
  githubUrl: "",
  contractUrl: "",
  guidedCommand: "",
};

export function SubmitExtensionPage() {
  const [form, setForm] = useState<SubmissionFormData>(INITIAL_FORM);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  function updateField(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function validate(data: SubmissionFormData): string {
    if (!data.title.trim()) return "Title is required.";
    if (!data.summary.trim()) return "Summary is required.";
    if (!data.imageUrl.trim()) return "Image URL is required.";
    if (!data.githubUrl.trim()) return "GitHub URL is required.";
    if (!data.contractUrl.trim()) return "Contract URL is required.";
    if (!data.guidedCommand.trim()) return "Guided command is required.";
    return "";
  }

  function onTypeChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value as ExtensionType;
    setForm((current) => ({ ...current, type: value }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    const validationError = validate(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    const saved = saveCommunityExtension(form);
    setSuccessMessage(`Saved ${saved.title}. It now appears in Explore.`);
    setForm(INITIAL_FORM);
  }

  return (
    <Flex direction="column" gap="4">
      <Heading size="7">Submit Extension</Heading>
      <Text>
        Community submissions are stored locally in this MVP and shown in the
        Explore grid.
      </Text>

      <Card>
        <form onSubmit={onSubmit} className="submit-form">
          <label>
            Title
            <input name="title" value={form.title} onChange={updateField} />
          </label>

          <label>
            Summary
            <textarea
              name="summary"
              rows={4}
              value={form.summary}
              onChange={updateField}
            />
          </label>

          <label>
            Type
            <select name="type" value={form.type} onChange={onTypeChange}>
              <option value="paid-gate">paid-gate</option>
              <option value="corpse-gate">corpse-gate</option>
            </select>
          </label>

          <label>
            Image URL
            <input name="imageUrl" value={form.imageUrl} onChange={updateField} />
          </label>

          <label>
            GitHub URL
            <input name="githubUrl" value={form.githubUrl} onChange={updateField} />
          </label>

          <label>
            Live Contract URL
            <input
              name="contractUrl"
              value={form.contractUrl}
              onChange={updateField}
            />
          </label>

          <label>
            Guided command
            <input
              name="guidedCommand"
              value={form.guidedCommand}
              onChange={updateField}
            />
          </label>

          <button type="submit">Save extension</button>
        </form>

        {error ? <Text className="error-text">{error}</Text> : null}
        {successMessage ? (
          <Text className="success-text">{successMessage}</Text>
        ) : null}
      </Card>
    </Flex>
  );
}
