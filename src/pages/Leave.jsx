import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, CheckCircle2, XCircle, Clock, Edit2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LEAVE_TYPES = { annual: "ลาพักร้อน", sick: "ลาป่วย", personal: "ลากิจ", maternity: "ลาคลอด", paternity: "ลาบิดา", other: "อื่นๆ" };
const STATUS_MAP = {
  pending: { label: "รออนุมัติ", color: "bg-yellow-100 text-yellow-700" },
  approved: { label: "อนุมัติ", color: "bg-green-100 text-green-700" },
  rejected: { label: "ไม่อนุมัติ", color: "bg-red-100 text-red-700" },
};
const EMPTY = { employee_id: "", employee_name: "", department: "", leave_type: "annual", start_date: "", end_date: "", days_count: 1, reason: "", status: "pending", approved_by: "", note: "" };

export default function Leave() {
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [quotaDialogOpen, setQuotaDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.LeaveRequest.list("-created_date"),
      base44.entities.Employee.filter({ status: "active" }),
    ]).then(([req, emp]) => { setRequests(req); setEmployees(emp); }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = requests.filter(r => {
    const matchSearch = !search || r.employee_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    const matchType = filterType === "all" || r.leave_type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const openAdd = () => { setForm(EMPTY); setEditing(null); setDialogOpen(true); };
  const openEdit = (r) => { setForm({ ...EMPTY, ...r }); setEditing(r.id); setDialogOpen(true); };
  const openQuota = (emp) => { setSelectedEmployee(emp); setQuotaDialogOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    const data = { ...form, days_count: Number(form.days_count) || 1 };
    if (editing) await base44.entities.LeaveRequest.update(editing, data);
    else await base44.entities.LeaveRequest.create(data);
    setSaving(false);
    setDialogOpen(false);
    load();
  };

  const handleApprove = async (id, approved) => {
    await base44.entities.LeaveRequest.update(id, { status: approved ? "approved" : "rejected", approved_date: new Date().toISOString().split("T")[0] });
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("ลบรายการนี้?")) return;
    await base44.entities.LeaveRequest.delete(id);
    load();
  };

  const getEmployeeLeaveUsed = (empId, leaveType) => {
    return requests.filter(r => r.employee_id === empId && r.leave_type === leaveType && r.status === "approved")
      .reduce((sum, r) => sum + (r.days_count || 0), 0);
  };

  const F = ({ label, children, required }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#0D1B40]">การลา</h1>
          <p className="text-gray-500 mt-1">จัดการคำขอลาและสิทธิ์การลา</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setQuotaDialogOpen(true)} variant="outline" className="gap-2 rounded-xl border-[#0D1B40] text-[#0D1B40]">
            <Info className="w-4 h-4" /> สิทธิ์การลา
          </Button>
          <Button onClick={openAdd} className="bg-[#0D1B40] hover:bg-[#162552] text-white gap-2 rounded-xl">
            <Plus className="w-4 h-4" /> ขอลาใหม่
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(STATUS_MAP).map(([k, v]) => (
          <div key={k} className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <div className="text-3xl font-bold text-[#0D1B40]">{requests.filter(r => r.status === k).length}</div>
            <div className={`text-xs px-2 py-1 rounded-full font-medium inline-block mt-1 ${v.color}`}>{v.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="ค้นหาชื่อพนักงาน..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40 h-9 text-sm"><SelectValue placeholder="ประเภทการลา" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกประเภท</SelectItem>
            {Object.entries(LEAVE_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="ทุกสถานะ" /></SelectTrigger>
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
          <div className="text-center py-16 text-gray-400 text-sm">ไม่พบรายการลา</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-[#F8F9FC]">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">พนักงาน</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">ประเภทการลา</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">วันที่ลา</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">จำนวนวัน</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">เหตุผล</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">สถานะ</th>
                  <th className="px-4 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-[#F8F9FC] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[#0D1B40]">{r.employee_name}</div>
                      <div className="text-xs text-gray-400">{r.department}</div>
                    </td>
                    <td className="px-4 py-4 text-gray-700">{LEAVE_TYPES[r.leave_type] || r.leave_type}</td>
                    <td className="px-4 py-4 text-gray-600 text-xs">{r.start_date} – {r.end_date}</td>
                    <td className="px-4 py-4 text-center font-semibold text-[#0D1B40]">{r.days_count}</td>
                    <td className="px-4 py-4 hidden md:table-cell text-gray-500 max-w-xs truncate">{r.reason || "—"}</td>
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_MAP[r.status]?.color || "bg-gray-100 text-gray-500"}`}>
                        {STATUS_MAP[r.status]?.label || r.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1">
                        {r.status === "pending" && (
                          <>
                            <button onClick={() => handleApprove(r.id, true)} className="p-2 rounded-lg hover:bg-green-50 text-green-600 transition-colors" title="อนุมัติ"><CheckCircle2 className="w-4 h-4" /></button>
                            <button onClick={() => handleApprove(r.id, false)} className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition-colors" title="ปฏิเสธ"><XCircle className="w-4 h-4" /></button>
                          </>
                        )}
                        <button onClick={() => openEdit(r)} className="p-2 rounded-lg hover:bg-[#E8EDFF] text-[#0D1B40] transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(r.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition-colors"><XCircle className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Leave Request Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#0D1B40]">{editing ? "แก้ไขคำขอลา" : "ขอลาใหม่"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <F label="พนักงาน" required>
              <Select value={form.employee_id} onValueChange={v => {
                const emp = employees.find(e => e.id === v);
                setForm(f => ({ ...f, employee_id: v, employee_name: emp ? `${emp.first_name} ${emp.last_name}` : "", department: emp?.department || "" }));
              }}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="เลือกพนักงาน" /></SelectTrigger>
                <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </F>
            <F label="ประเภทการลา" required>
              <Select value={form.leave_type} onValueChange={v => setForm(f => ({ ...f, leave_type: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(LEAVE_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </F>
            <div className="grid grid-cols-2 gap-3">
              <F label="วันที่เริ่มลา"><Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="h-9 text-sm" /></F>
              <F label="วันที่สิ้นสุด"><Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="h-9 text-sm" /></F>
              <F label="จำนวนวัน"><Input type="number" min="1" value={form.days_count} onChange={e => setForm(f => ({ ...f, days_count: e.target.value }))} className="h-9 text-sm" /></F>
              <F label="สถานะ">
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </F>
            </div>
            <F label="เหตุผล"><Input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} className="h-9 text-sm" /></F>
            <F label="หมายเหตุ (ผู้อนุมัติ)"><Input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} className="h-9 text-sm" /></F>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-[#0D1B40] hover:bg-[#162552] text-white min-w-20">
                {saving ? "บันทึก..." : "บันทึก"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quota Dialog */}
      <Dialog open={quotaDialogOpen} onOpenChange={setQuotaDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#0D1B40]">สิทธิ์การลาของพนักงาน</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {employees.length === 0 ? (
              <div className="text-center text-gray-400 py-8">ยังไม่มีพนักงาน</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-[#F8F9FC]">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">พนักงาน</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500">ลาพักร้อน</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500">ลาป่วย</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500">ลากิจ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {employees.map(emp => {
                      const annualUsed = getEmployeeLeaveUsed(emp.id, "annual");
                      const sickUsed = getEmployeeLeaveUsed(emp.id, "sick");
                      const personalUsed = getEmployeeLeaveUsed(emp.id, "personal");
                      return (
                        <tr key={emp.id} className="hover:bg-[#F8F9FC]">
                          <td className="px-4 py-3 font-medium text-[#0D1B40]">{emp.first_name} {emp.last_name}</td>
                          <td className="px-3 py-3 text-center">
                            <div className="text-sm font-semibold text-[#0D1B40]">{annualUsed}/{emp.annual_leave_quota || 10}</div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                              <div className="bg-[#0D1B40] h-1.5 rounded-full" style={{ width: `${Math.min(100, (annualUsed / (emp.annual_leave_quota || 10)) * 100)}%` }} />
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <div className="text-sm font-semibold text-[#0D1B40]">{sickUsed}/{emp.sick_leave_quota || 30}</div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (sickUsed / (emp.sick_leave_quota || 30)) * 100)}%` }} />
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <div className="text-sm font-semibold text-[#0D1B40]">{personalUsed}/{emp.personal_leave_quota || 3}</div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                              <div className="bg-[#C9A227] h-1.5 rounded-full" style={{ width: `${Math.min(100, (personalUsed / (emp.personal_leave_quota || 3)) * 100)}%` }} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}