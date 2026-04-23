"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { confirmPayroll, markPaid } from "@/actions/payroll";

interface PayrollStatusButtonProps {
  id: string;
  status: string;
}

export function PayrollStatusButton({ id, status }: PayrollStatusButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await confirmPayroll(id);
      router.refresh();
    });
  }

  function handlePaid() {
    startTransition(async () => {
      await markPaid(id);
      router.refresh();
    });
  }

  if (status === "DRAFT") {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={handleConfirm}
        disabled={isPending}
        className="text-blue-600 border-blue-300 hover:bg-blue-50"
      >
        {isPending ? "..." : "Xác nhận"}
      </Button>
    );
  }

  if (status === "CONFIRMED") {
    return (
      <Button
        size="sm"
        onClick={handlePaid}
        disabled={isPending}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        {isPending ? "..." : "Đã trả"}
      </Button>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      Đã thanh toán
    </span>
  );
}
