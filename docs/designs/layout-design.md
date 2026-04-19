# Design Spec — Admin Layout (TASK-003)

## Layout Structure
- **Sidebar:** Fixed left, 256px desktop, collapsible to 64px tablet, Sheet overlay mobile
- **Header:** Sticky top, height 64px, chứa logo, search, notifications, user avatar dropdown
- **Main:** Padding 24px, max-width full, scroll independent

## Color Palette (Tailwind)
- Primary: `blue-600` (#2563EB)
- Background: `gray-50`
- Sidebar bg: `white` with `border-r`
- Text: `gray-900` (headings), `gray-600` (body)

## Navigation Items
| Label | Icon | Route |
|-------|------|-------|
| Dashboard | LayoutDashboard | /admin |
| Nhân viên | Users | /admin/employees |
| Chấm công | Clock | /admin/attendance |
| Ca làm việc | Calendar | /admin/shifts |
| Tồn kho | Package | /admin/inventory |
| Sổ quỹ | Wallet | /admin/cashbook |
| Lương | Banknote | /admin/payroll |
| Khách hàng | UserCheck | /admin/customers |

## Shadcn/ui Components Used
Sidebar, Sheet, DropdownMenu, Avatar, Breadcrumb, Sonner (Toast), Card, Table, Dialog, Form, Input, Select, Badge, Calendar, Skeleton

## Responsive Breakpoints
- Mobile < 768px: Sheet sidebar
- Tablet 768-1024px: Collapsed sidebar (icons)
- Desktop > 1024px: Full sidebar
