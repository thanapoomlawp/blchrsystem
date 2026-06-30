import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Edit2, Trash2, X, User, Phone, Mail, MapPin, Briefcase, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DEPARTMENTS = ["Management", "HR", "Finance", "IT", "Sales", "Marketing", "Operations", "Legal"];
const EMPLOYMENT_TYPES = { full_time: "พนักงานประจำ", part_time: "พนักงานพาร์ทไทม์", contract: "สัญญาจ้าง", intern: "ฝึกงาน" };
const STATUS_MAP = { active: { label: "ทำงานอยู่", color: "bg-green-100 text-green-700" }, on_leave: { label: "ลา", color: "bg-yellow-100 text-yellow-700" }, resigned: { label: "ลาออก", color: "bg-gray-100 text-gray-500" }, terminated: { label: "เลิกจ้าง", color: "bg-red-100 text-red-700" } };

const EMPTY = { employee_id: "", first_name: "", last_name: "", nickname: "", gender: "", birth_date: "", national_id: "", phone: "", email: "", address: "", province: "", postal_code: "", department: "", position: "", employment_type: "full_time", status: "active", start_date: "", salary: "", annual_leave_quota: 10, sick_leave_quota: 30, personal_leave_quota: 3 };

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    base44.entities.Employee.list().then(setEmployees).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || `${e.first_name} ${e.last_name} ${e.employee_id} ${e.position}`.toLowerCase().includes(q);
    const matchDept = filterDept === "all" || e.department === filterDept;
    const matchStatus = filterStatus === "all" || e.status === filterStatus;
    return matchSearch && matchDept && matchStatus;
  });

  const openAdd = () => { setForm(EMPTY); setEditing(null); setDialogOpen(true); };
  const openEdit = (emp) => { setForm({ ...EMPTY, ...emp }); setEditing(emp.id); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); };

  const handleSave = async () => {
    setSaving(true);
    const data = { ...form, salary: Number(form.salary) || 0, annual_leave_quota: Number(form.annual_leave_quota) || 10, sick_leave_quota: Number(form.sick_leave_quota) || 30, personal_leave_quota: Number(form.personal_leave_quota) || 3 };
    if (editing) await base44.entities.Employee.update(editing, data);
    else await base44.entities.Employee.create(data);
    setSaving(false);
    closeDialog();
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("ต้องการลบข้อมูลพนักงานนี้?")) return;
    await base44.entities.Employee.delete(id);
    load();
  };

  const F = ({ label, children, required }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>
      {children}
    </div>
  );

  const inp = (field, type = "text", placeholder = "") => (
    <Input type={type} value={form[field] || ""} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
      placeholder={placeholder} className="h-9 text-sm" />
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#0D1B40]">ข้อมูลพนักงาน</h1>
          <p className="text-gray-500 mt-1">จัดการข้อมูลพนักงานทั้งหมด ({employees.length} คน)</p>
        </div>
        <Button onClick={openAdd} className="bg-[#0D1B40] hover:bg-[#162552] text-white gap-2 rounded-xl">
          <Plus className="w-4 h-4" /> เพิ่มพนักงาน
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="ค้นหาชื่อ, รหัส, ตำแหน่ง..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="w-44 h-9 text-sm"><SelectValue placeholder="ทุกแผนก" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกแผนก</SelectItem>
            {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 h-9 text-sm"><SelectValue placeholder="ทุกสถานะ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสถานะ</SelectItem>
            {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>ไม่พบข้อมูลพนักงาน</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-[#F8F9FC]">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">พนักงาน</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">แผนก / ตำแหน่ง</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">ติดต่อ</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">ประเภท</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">สถานะ</th>
                  <th className="px-4 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(emp => (
                  <tr key={emp.id} className="hover:bg-[#F8F9FC] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0D1B40] to-[#C9A227] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {emp.first_name?.[0]}{emp.last_name?.[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-[#0D1B40]">{emp.first_name} {emp.last_name}</div>
                          <div className="text-xs text-gray-400">{emp.employee_id || "ไม่มีรหัส"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-800">{emp.department || "—"}</div>
                      <div className="text-xs text-gray-400">{emp.position || "—"}</div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="text-gray-600">{emp.phone || "—"}</div>
                      <div className="text-xs text-gray-400">{emp.email || "—"}</div>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell text-gray-600">{EMPLOYMENT_TYPES[emp.employment_type] || emp.employment_type || "—"}</td>
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_MAP[emp.status]?.color || "bg-gray-100 text-gray-500"}`}>
                        {STATUS_MAP[emp.status]?.label || emp.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(emp)} className="p-2 rounded-lg hover:bg-[#E8EDFF] text-[#0D1B40] transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(emp.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#0D1B40] text-xl">{editing ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงานใหม่"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="text-xs font-bold text-[#C9A227] uppercase tracking-wider">ข้อมูลส่วนตัว</div>
            <div className="grid grid-cols-2 gap-3">
              <F label="รหัสพนักงาน">{inp("employee_id", "text", "EMP001")}</F>
              <F label="เพศ">
                <Select value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="เลือก" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">ชาย</SelectItem>
                    <SelectItem value="female">หญิง</SelectItem>
                    <SelectItem value="other">อื่นๆ</SelectItem>
                  </SelectContent>
                </Select>
              </F>
              <F label="ชื่อ" required>{inp("first_name", "text", "ชื่อ")}</F>
              <F label="นามสกุล" required>{inp("last_name", "text", "นามสกุล")}</F>
              <F label="ชื่อเล่น">{inp("nickname")}</F>
              <F label="วันเกิด">{inp("birth_date", "date")}</F>
              <F label="เลขบัตรประชาชน">{inp("national_id")}</F>
              <F label="โทรศัพท์">{inp("phone")}</F>
            </div>
            <F label="อีเมล">{inp("email", "email")}</F>
            <F label="ที่อยู่">{inp("address", "text", "บ้านเลขที่ ถนน ตำบล")}</F>
            <div className="grid grid-cols-2 gap-3">
              <F label="จังหวัด">{inp("province")}</F>
              <F label="รหัสไปรษณีย์">{inp("postal_code")}</F>
            </div>
            <div className="text-xs font-bold text-[#C9A227] uppercase tracking-wider mt-2">ข้อมูลการทำงาน</div>
            <div className="grid grid-cols-2 gap-3">
              <F label="แผนก" required>
                <Select value={form.department} onValueChange={v => setForm(f => ({ ...f, department: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="เลือกแผนก" /></SelectTrigger>
                  <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </F>
              <F label="ตำแหน่ง" required>{inp("position")}</F>
              <F label="ประเภทการจ้าง">
                <Select value={form.employment_type} onValueChange={v => setForm(f => ({ ...f, employment_type: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="เลือก" /></SelectTrigger>
                  <SelectContent>{Object.entries(EMPLOYMENT_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </F>
              <F label="สถานะการทำงาน">
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="เลือก" /></SelectTrigger>
                  <SelectContent>{Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </F>
              <F label="วันที่เริ่มงาน">{inp("start_date", "date")}</F>
              <F label="เงินเดือน (บาท)">{inp("salary", "number")}</F>
            </div>
            <div className="text-xs font-bold text-[#C9A227] uppercase tracking-wider mt-2">โควต้าการลา (วัน/ปี)</div>
            <div className="grid grid-cols-3 gap-3">
              <F label="ลาพักร้อน">{inp("annual_leave_quota", "number")}</F>
              <F label="ลาป่วย">{inp("sick_leave_quota", "number")}</F>
              <F label="ลากิจ">{inp("personal_leave_quota", "number")}</F>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={closeDialog}>ยกเลิก</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-[#0D1B40] hover:bg-[#162552] text-white min-w-24">
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}