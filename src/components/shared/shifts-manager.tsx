"use client";

import { useState, useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  createShift,
  updateShift,
  deleteShift,
  createShiftAssignment,
  deleteShiftAssignment,
} from "@/actions/shift";
import type { ShiftActionState } from "@/actions/shift";

type ShiftRow = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  _count: { assignments: number };
};

type AssignmentRow = {
  id: string;
  date: Date;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
  shift: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
  };
};

type EmployeeOption = {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
};

interface Props {
  shifts: ShiftRow[];
  assignments: AssignmentRow[];
  employees: EmployeeOption[];
  currentDate: string;
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function FormError({ state }: { state: ShiftActionState }) {
  if (!state || state.success) return null;
  return (
    <div className="space-y-1">
      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {state.error}
        </p>
      )}
      {state.fieldErrors && (
        <ul className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2 space-y-0.5 list-disc list-inside">
          {Object.values(state.fieldErrors)
            .flat()
            .map((err, i) => (
              <li key={i}>{err}</li>
            ))}
        </ul>
      )}
    </div>
  );
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function ShiftsManager({ shifts, assignments, employees, currentDate }: Props) {
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftRow | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  const [createState, createAction] = useFormState(createShift, null);
  const [updateState, updateAction] = useFormState(updateShift, null);
  const [assignState, assignAction] = useFormState(createShiftAssignment, null);

  useEffect(() => {
    if (createState?.success) {
      setShowShiftDialog(false);
    }
  }, [createState]);

  useEffect(() => {
    if (updateState?.success) {
      setShowShiftDialog(false);
      setEditingShift(null);
    }
  }, [updateState]);

  useEffect(() => {
    if (assignState?.success) {
      setShowAssignDialog(false);
    }
  }, [assignState]);

  function openCreate() {
    setEditingShift(null);
    setShowShiftDialog(true);
  }

  function openEdit(shift: ShiftRow) {
    setEditingShift(shift);
    setShowShiftDialog(true);
  }

  async function handleDeleteShift(id: string, name: string) {
    if (!window.confirm(`Xoa ca "${name}"?`)) return;
    const result = await deleteShift(id);
    if (result?.error) setDeleteErr(result.error);
    else setDeleteErr(null);
  }

  async function handleDeleteAssignment(id: string) {
    if (!window.confirm("Huy phan ca nay?")) return;
    await deleteShiftAssignment(id);
  }

  const isEditing = !!editingShift;
  const currentFormState = isEditing ? updateState : createState;
  const currentFormAction = isEditing ? updateAction : createAction;

  return (
    <div className="space-y-8">
      {deleteErr && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 text-sm flex justify-between items-center">
          <span>{deleteErr}</span>
          <button
            onClick={() => setDeleteErr(null)}
            className="ml-4 text-red-500 hover:text-red-700"
            aria-label="Dong thong bao loi"
          >
            &#10005;
          </button>
        </div>
      )}

      {/* Section 1: Danh sach ca */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-900">Danh sach ca lam viec</h2>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
          >
            + Them ca
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Ten ca</th>
                <th className="px-4 py-3 font-medium">Gio bat dau</th>
                <th className="px-4 py-3 font-medium">Gio ket thuc</th>
                <th className="px-4 py-3 font-medium">So phan ca</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shifts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                    Chua co ca lam viec nao. Nhan &quot;Them ca&quot; de tao moi.
                  </td>
                </tr>
              ) : (
                shifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{shift.name}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                        {shift.startTime}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                        {shift.endTime}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{shift._count.assignments}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(shift)}
                          className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded"
                          aria-label={`Sua ca ${shift.name}`}
                        >
                          Sua
                        </button>
                        <button
                          onClick={() => handleDeleteShift(shift.id, shift.name)}
                          className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                          aria-label={`Xoa ca ${shift.name}`}
                        >
                          Xoa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t text-xs text-gray-400">
          Tong: {shifts.length} ca
        </div>
      </div>

      {/* Section 2: Phan ca */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-900">Phan ca</h2>
          <button
            onClick={() => setShowAssignDialog(true)}
            disabled={employees.length === 0 || shifts.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Phan ca
          </button>
        </div>
        <form method="GET" className="flex flex-wrap gap-3 px-4 py-3 border-b bg-gray-50/50">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Ngay</label>
            <input
              type="date"
              name="date"
              defaultValue={currentDate}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="h-9 px-3 text-sm bg-gray-100 hover:bg-gray-200 rounded-md border border-input"
            >
              Loc
            </button>
          </div>
        </form>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Ngay</th>
                <th className="px-4 py-3 font-medium">Ma NV</th>
                <th className="px-4 py-3 font-medium">Ho ten</th>
                <th className="px-4 py-3 font-medium">Ca lam viec</th>
                <th className="px-4 py-3 font-medium">Gio</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    Chua co phan ca nao trong ngay nay.
                  </td>
                </tr>
              ) : (
                assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{formatDate(a.date)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {a.employee.employeeCode}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {a.employee.lastName} {a.employee.firstName}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{a.shift.name}</td>
                    <td className="px-4 py-3 text-gray-500">
                      <span className="font-mono text-xs">
                        {a.shift.startTime} &mdash; {a.shift.endTime}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteAssignment(a.id)}
                        className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                        aria-label="Huy phan ca"
                      >
                        Huy
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t text-xs text-gray-400">
          Tong: {assignments.length} phan ca
        </div>
      </div>

      {/* Dialog: Shift Form */}
      {showShiftDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {isEditing ? "Sua ca lam viec" : "Them ca lam viec"}
              </h3>
              <button
                onClick={() => {
                  setShowShiftDialog(false);
                  setEditingShift(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                aria-label="Dong"
              >
                &#10005;
              </button>
            </div>
            <form action={currentFormAction} className="space-y-4">
              {isEditing && (
                <input type="hidden" name="id" value={editingShift.id} />
              )}
              <FormError state={currentFormState} />
              <div className="space-y-1">
                <label
                  htmlFor="shift-name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Ten ca <span className="text-red-500">*</span>
                </label>
                <input
                  id="shift-name"
                  name="name"
                  type="text"
                  defaultValue={editingShift?.name ?? ""}
                  placeholder="VD: Ca sang"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label
                    htmlFor="shift-start"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Gio bat dau <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="shift-start"
                    name="startTime"
                    type="time"
                    defaultValue={editingShift?.startTime ?? ""}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="shift-end"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Gio ket thuc <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="shift-end"
                    name="endTime"
                    type="time"
                    defaultValue={editingShift?.endTime ?? ""}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowShiftDialog(false);
                    setEditingShift(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Huy
                </button>
                <SubmitButton
                  label={isEditing ? "Cap nhat" : "Luu ca"}
                  pendingLabel="Dang luu..."
                />
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog: Assign Shift */}
      {showAssignDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Phan ca cho nhan vien
              </h3>
              <button
                onClick={() => setShowAssignDialog(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                aria-label="Dong"
              >
                &#10005;
              </button>
            </div>
            <form action={assignAction} className="space-y-4">
              <FormError state={assignState} />
              <div className="space-y-1">
                <label
                  htmlFor="assign-employee"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nhan vien <span className="text-red-500">*</span>
                </label>
                <select
                  id="assign-employee"
                  name="employeeId"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">-- Chon nhan vien --</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.employeeCode} &mdash; {e.lastName} {e.firstName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="assign-shift"
                  className="block text-sm font-medium text-gray-700"
                >
                  Ca lam viec <span className="text-red-500">*</span>
                </label>
                <select
                  id="assign-shift"
                  name="shiftId"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">-- Chon ca --</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.startTime} &mdash; {s.endTime})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="assign-date"
                  className="block text-sm font-medium text-gray-700"
                >
                  Ngay <span className="text-red-500">*</span>
                </label>
                <input
                  id="assign-date"
                  name="date"
                  type="date"
                  defaultValue={currentDate}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignDialog(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Huy
                </button>
                <SubmitButton label="Phan ca" pendingLabel="Dang luu..." />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
