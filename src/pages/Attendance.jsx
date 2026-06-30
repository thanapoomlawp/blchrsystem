import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, CheckCircle2, XCircle, Clock, Calendar, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS = {
  present: { label: "มาทำงาน", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  absent: { label: "ขาดงาน", color: "bg-red-100 text-red-700", icon: XCircle },
  late: { label: "มาสาย", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  leave: { label: "ลา", color: "bg-blue-100 text-blue-700", icon: Calendar },
  holiday: { label: "วันหยุด", color: "bg-gray-100 text-gray-500", icon: Calendar },
};

const EMPTY = { employee_id: "", employee_name: "", date: new Date().toISOString().split("T")[0], check_in: "", check_out: "", status: "present", late_minutes: 0, note: "" };

export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.Attendance.list("-date"),
      base44.entities.Employee.filter({ status: "active" }),
    ]).then(([att, emp]) => { setRecords(att); setEmployees(emp); }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = records.filter(r => {
    const matchSearch = !search || r.employee_name?.toLowerCase().includes(search.toLowerCase());
    const matchDate = !filterDate || r.date === filterDate;
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchDate && matchStatus;
  });

  const summary = {
    present: filtered.filter(r => r.status === "present").length,
    absent: filtered.filter(r => r.status === "absent").length,
    late: filtered.filter(r => r.status === "late").length,
    leave: filtered.filter(r => r.status === "leave").length,
  };

  const openAdd = () => { setForm(EMPTY); setEditing(null); setDialogOpen(true); };
  const openEdit = (r) => { setForm({ ...EMPTY, ...r }); setEditing(r.id); setDialogOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    const data = { ...form, late_minutes: Number(form.late_minutes) || 0 };
    if (editing) await base44.entities.Attendance.update(editing, data);
    else await base44.entities.Attendance.create(data);
    setSaving(false);
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("ลบรายการนี้?")) return;
    await base44.entities.Attendance.delete(id);
    load();
  };

  const F = ({ label, children }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#0D1B40]">บันทึกเวลาทำงาน</h1>
          <p className="text-gray-500 mt-1">ติดตามการเข้า-ออกงาน การขาด และการมาสาย</p>
        </div>
        <Button onClick={openAdd} className="bg-[#0D1B40] hover:bg-[#162552] text-white gap-2 rounded-xl">
          <Plus className="w-4 h-4" /> บันทึกรายการ
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(summary).map(([k, v]) => {
          const s = STATUS[k];
          const Icon = s?.icon || CheckCircle2;
          return (
            <div key={k} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${k === "present" ? "bg-green-100" : k === "absent" ? "bg-red-100" : k === "late" ? "bg-yellow-100" : "bg-blue-100"}`}>
                <Icon className={`w-5 h-5 ${k === "present" ? "text-green-600" : k === "absent" ? "text-red-600" : k === "late" ? "text-yellow-600" : "text-blue-600"}`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#0D1B40]">{v}</div>
                <div className="text-xs text-gray-500">{s?.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="ค้นหาชื่อพนักงาน..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="h-9 text-sm w-auto" />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="ทุกสถานะ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสถานะ</SelectItem>
            {Object.entries(STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
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
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>ไม่พบข้อมูลการบันทึกเวลา</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-[#F8F9FC]">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">พนักงาน</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">วันที่</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">เข้างาน</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">ออกงาน</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">มาสาย (นาที)</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">สถานะ</th>
                  <th className="px-4 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(r => {
                  const s = STATUS[r.status];
                  return (
                    <tr key={r.id} className="hover:bg-[#F8F9FC] transition-colors">
                      <td className="px-6 py-4 font-medium text-[#0D1B40]">{r.employee_name || "—"}</td>
                      <td className="px-4 py-4 text-gray-600">{r.date}</td>
                      <td className="px-4 py-4 text-gray-600">{r.check_in || "—"}</td>
                      <td className="px-4 py-4 text-gray-600">{r.check_out || "—"}</td>
                      <td className="px-4 py-4 hidden md:table-cell text-gray-600">{r.late_minutes > 0 ? `${r.late_minutes} นาที` : "—"}</td>
                      <td className="px-4 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${s?.color || "bg-gray-100 text-gray-500"}`}>{s?.label || r.status}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(r)} className="p-2 rounded-lg hover:bg-[#E8EDFF] text-[#0D1B40] transition-colors"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(r.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition-colors"><XCircle className="w-4 h-4" /></button>
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

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#0D1B40]">{editing ? "แก้ไขรายการ" : "บันทึกเวลาใหม่"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <F label="พนักงาน">
              <Select value={form.employee_id} onValueChange={v => {
                const emp = employees.find(e => e.id === v);
                setForm(f => ({ ...f, employee_id: v, employee_name: emp ? `${emp.first_name} ${emp.last_name}` : "" }));
              }}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="เลือกพนักงาน" /></SelectTrigger>
                <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </F>
            <div className="grid grid-cols-2 gap-3">
              <F label="วันที่"><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="h-9 text-sm" /></F>
              <F label="สถานะ">
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </F>
              <F label="เวลาเข้างาน"><Input type="time" value={form.check_in} onChange={e => setForm(f => ({ ...f, check_in: e.target.value }))} className="h-9 text-sm" /></F>
              <F label="เวลาออกงาน"><Input type="time" value={form.check_out} onChange={e => setForm(f => ({ ...f, check_out: e.target.value }))} className="h-9 text-sm" /></F>
              <F label="มาสาย (นาที)"><Input type="number" value={form.late_minutes} onChange={e => setForm(f => ({ ...f, late_minutes: e.target.value }))} className="h-9 text-sm" /></F>
            </div>
            <F label="หมายเหตุ"><Input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} className="h-9 text-sm" /></F>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-[#0D1B40] hover:bg-[#162552] text-white min-w-20">
                {saving ? "บันทึก..." : "บันทึก"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}