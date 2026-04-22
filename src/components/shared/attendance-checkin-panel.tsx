"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { checkIn, checkOut } from "@/actions/attendance";

function SubmitButton({ label, className }: { label: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className={className}>
      {label}
    </Button>
  );
}

interface AttendanceStatus {
  checkIn: Date | null;
  checkOut: Date | null;
  totalHours: number | null;
}

interface Props {
  todayAttendance: AttendanceStatus | null;
  hasEmployee: boolean;
}

function formatTime(date: Date | null) {
  if (!date) return "—";
  return new Date(date).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AttendanceCheckinPanel({ todayAttendance, hasEmployee }: Props) {
  const [checkInState, checkInAction] = useFormState(checkIn, null);
  const [checkOutState, checkOutAction] = useFormState(checkOut, null);

  const error = checkInState?.error || checkOutState?.error;

  const checkedIn = !!todayAttendance?.checkIn;
  const checkedOut = !!todayAttendance?.checkOut;

  let statusBadge: React.ReactNode;
  if (!checkedIn) {
    statusBadge = (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        Chưa check-in
      </span>
    );
  } else if (checkedIn && !checkedOut) {
    statusBadge = (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        Đang làm việc
      </span>
    );
  } else {
    statusBadge = (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        Đã hoàn thành
      </span>
    );
  }

  if (!hasEmployee) {
    return (
      <div className="rounded-lg border bg-gray-50 p-4 text-sm text-gray-500 mb-6">
        Tài khoản này chưa được liên kết với nhân viên. Vui lòng liên hệ Admin.
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-blue-50 border-blue-200 p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-blue-800 mb-2">
            Chấm công hôm nay —{" "}
            {new Date().toLocaleDateString("vi-VN", {
              weekday: "long",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </h2>
          <div className="flex items-center gap-3 text-sm text-gray-700">
            {statusBadge}
            {checkedIn && (
              <span>
                Vào: <strong>{formatTime(todayAttendance!.checkIn)}</strong>
              </span>
            )}
            {checkedOut && (
              <>
                <span>
                  Ra: <strong>{formatTime(todayAttendance!.checkOut)}</strong>
                </span>
                <span>
                  Tổng:{" "}
                  <strong>
                    {Number(todayAttendance!.totalHours).toFixed(2)}h
                  </strong>
                </span>
              </>
            )}
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        <div className="flex gap-2">
          {!checkedIn && (
            <form action={checkInAction}>
              <SubmitButton
                label="Check-in"
                className="bg-green-600 hover:bg-green-700 text-white"
              />
            </form>
          )}
          {checkedIn && !checkedOut && (
            <form action={checkOutAction}>
              <SubmitButton
                label="Check-out"
                className="border border-orange-400 text-orange-600 hover:bg-orange-50 bg-white"
              />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}