"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deactivateEmployee, activateEmployee } from "@/actions/employee";

interface EmployeeStatusButtonProps {
  id: string;
  isActive: boolean;
}

export function EmployeeStatusButton({
  id,
  isActive,
}: EmployeeStatusButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleToggle() {
    const confirmMsg = isActive
      ? "Bạn có chắc muốn vô hiệu hóa nhân viên này?"
      : "Bạn có chắc muốn kích hoạt lại nhân viên này?";
    if (!confirm(confirmMsg)) return;

    startTransition(async () => {
      if (isActive) {
        await deactivateEmployee(id);
      } else {
        await activateEmployee(id);
      }
      router.refresh();
    });
  }

  return (
    <Button
      variant={isActive ? "destructive" : "default"}
      size="sm"
      onClick={handleToggle}
      disabled={isPending}
    >
      {isPending
        ? "Đang xử lý..."
        : isActive
          ? "Vô hiệu hóa"
          : "Kích hoạt lại"}
    </Button>
  );
}
