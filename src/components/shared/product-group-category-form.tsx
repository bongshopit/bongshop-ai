"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateProductGroup } from "@/actions/inventory";
import type { ActionState } from "@/actions/inventory";

interface Props {
  id: string;
  current: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
    >
      {pending ? "Đang lưu..." : "Lưu"}
    </button>
  );
}

export function ProductGroupCategoryForm({ id, current }: Props) {
  const boundAction = updateProductGroup.bind(null, id) as unknown as (
    _prev: ActionState,
    formData: FormData
  ) => Promise<ActionState>;
  const [state, formAction] = useFormState<ActionState, FormData>(boundAction, null);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <select
        name="loyaltyCategory"
        defaultValue={current}
        className="text-xs border rounded px-2 py-1 bg-white"
      >
        <option value="DEFAULT">Mặc định</option>
        <option value="SUA">Sữa</option>
        <option value="TA_BIM">Tã bỉm</option>
      </select>
      <SubmitButton />
      {state && "error" in state && (
        <span className="text-xs text-red-500">{state.error}</span>
      )}
    </form>
  );
}
