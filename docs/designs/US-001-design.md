# Design Spec — US-001: Quản lý nhân viên (TASK-004)

## Routes
| Route | Component Type | Mô tả |
|-------|---------------|-------|
| `/admin/employees` | Server Component | Danh sách + search/filter |
| `/admin/employees/new` | Server + Client Form | Tạo mới nhân viên |
| `/admin/employees/[id]` | Server Component | Chi tiết nhân viên |
| `/admin/employees/[id]/edit` | Server + Client Form | Sửa thông tin |

## Component Map
```
EmployeesPage (Server)
├── EmployeeSearch (Client — Suspense wrapper)
│   ├── Input (search by name/code)
│   ├── <select> phòng ban
│   └── <select> trạng thái
├── <table> danh sách (Tailwind)
│   ├── Badge span (active/inactive)
│   └── Link → /[id], /[id]/edit

NewEmployeePage (Server)
└── EmployeeForm (Client)
    ├── Input × 8 fields (grid 2 cols md)
    └── Button submit + Link cancel

EmployeeDetailPage (Server)
├── Card thông tin
├── EmployeeStatusButton (Client) — deactivate/activate
└── Button edit → /[id]/edit

EditEmployeePage (Server)
└── EmployeeForm (Client, pre-filled)
```

## Shadcn/ui & Tailwind Components
- `Button` — primary, outline, destructive variants
- `Input` — text, email, tel, number
- `Card`, `CardHeader`, `CardTitle`, `CardContent`
- Native `<table>` với `overflow-x-auto`
- Native `<select>` với Tailwind classes matching Input style
- Custom badge: `span` với `bg-green-100 text-green-700` (active) / `bg-gray-100 text-gray-500` (inactive)

## Layout - Employees List
```
[h1: Quản lý nhân viên]          [+ Thêm nhân viên]

[🔍 Tìm kiếm...] [Phòng ban ▼] [Trạng thái ▼]

┌─────────────────────────────────────────────┐
│ Mã NV │ Họ tên │ Email │ SĐT │ Phòng ban │...│
├───────┼────────┼───────┼─────┼───────────┼───┤
│ NV001 │ Admin  │ ...   │ ... │ Ban GĐ    │...│
└───────┴────────┴───────┴─────┴───────────┴───┘
Tổng: 2 nhân viên
```

## UX States
- **Loading:** Skeleton animate-pulse (loading.tsx)
- **Empty:** "Không tìm thấy nhân viên nào" — colspan table cell
- **Error:** error.tsx với reset button
- **Active:** badge `bg-green-100 text-green-700` — "Đang làm"
- **Inactive:** badge `bg-gray-100 text-gray-500` — "Đã nghỉ"
- **Form error:** `bg-red-50 text-red-600` banner + per-field error text
- **Pending:** Button disabled + "Đang lưu..."

## Form Fields
| Field | Type | Validation |
|-------|------|-----------|
| Mã nhân viên | text | required, unique, max 20 |
| Họ | text | required, max 50 |
| Tên | text | required, max 50 |
| Email | email | required, valid email |
| Số điện thoại | tel | required, 10-11 digits |
| Phòng ban | text | required, max 100 |
| Chức vụ | text | required, max 100 |
| Lương giờ (VNĐ) | number | required, min 0, step 1000 |

## Responsive Strategy
- Mobile: single column form, table scroll horizontally
- Tablet (md+): 2-column form grid
- Desktop: full table visible

## Accessibility
- Labels linked to inputs via `htmlFor`
- Required fields marked with `*` (red)
- Error messages below each field
- Confirm dialog trước khi deactivate
