import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, ChevronDown, ChevronRight, Building2, Plus, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DEPT_COLORS = {
  Management: "#0D1B40", HR: "#7C3AED", Finance: "#059669",
  IT: "#2563EB", Sales: "#DC2626", Marketing: "#D97706", Operations: "#0891B2", Legal: "#374151"
};

const EMPTY_DEPT = { name: "", name_th: "", code: "", head_name: "", description: "", color: "#0D1B40" };

function DeptCard({ dept, employees, allDepts, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(true);
  const deptEmployees = employees.filter(e => e.department === dept.name && e.status === "active");
  const children = allDepts.filter(d => d.parent_department === dept.name);
  const color = DEPT_COLORS[dept.name] || dept.color || "#0D1B40";

  return (
    <div className="mb-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-4 p-4" style={{ borderLeft: `4px solid ${color}` }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + "1A" }}>
            <Building2 className="w-6 h-6" style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-[#0D1B40] text-lg">{dept.name_th || dept.name}</h3>
              {dept.name_th && <span className="text-sm text-gray-400">({dept.name})</span>}
              <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ background: color }}>
                {deptEmployees.length} คน
              </span>
            </div>
            {dept.head_name && <div className="text-sm text-gray-500 mt-0.5">หัวหน้า: {dept.head_name}</div>}
            {dept.description && <div className="text-xs text-gray-400 mt-0.5 truncate">{dept.description}</div>}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(dept)} className="p-2 rounded-lg hover:bg-[#E8EDFF] text-[#0D1B40] transition-colors"><Edit2 className="w-4 h-4" /></button>
            <button onClick={() => onDelete(dept.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
            <button onClick={() => setExpanded(e => !e)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {expanded && deptEmployees.length > 0 && (
          <div className="border-t border-gray-50 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {deptEmployees.map(emp => (
                <div key={emp.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-[#F0F4FF] transition-colors">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: color }}>
                    {emp.first_name?.[0]}{emp.last_name?.[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-[#0D1B40] text-sm truncate">{emp.first_name} {emp.last_name}</div>
                    <div className="text-xs text-gray-400 truncate">{emp.position || "—"}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {expanded && deptEmployees.length === 0 && (
          <div className="border-t border-gray-50 py-4 text-center text-gray-400 text-sm">ไม่มีพนักงานในแผนกนี้</div>
        )}
      </div>

      {/* Sub departments */}
      {children.length > 0 && expanded && (
        <div className="ml-8 mt-2 space-y-2">
          {children.map(child => (
            <DeptCard key={child.id} dept={child} employees={employees} allDepts={allDepts} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Organization() {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_DEPT);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.Department.list(),
      base44.entities.Employee.list(),
    ]).then(([depts, emp]) => { setDepartments(depts); setEmployees(emp); }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const rootDepts = departments.filter(d => !d.parent_department);

  const openAdd = () => { setForm(EMPTY_DEPT); setEditing(null); setDialogOpen(true); };
  const openEdit = (dept) => { setForm({ ...EMPTY_DEPT, ...dept }); setEditing(dept.id); setDialogOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    if (editing) await base44.entities.Department.update(editing, form);
    else await base44.entities.Department.create(form);
    setSaving(false);
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("ลบแผนกนี้?")) return;
    await base44.entities.Department.delete(id);
    load();
  };

  const F = ({ label, children }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
  const inp = (field, placeholder = "") => (
    <Input value={form[field] || ""} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} placeholder={placeholder} className="h-9 text-sm" />
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#0D1B40]">โครงสร้างองค์กร</h1>
          <p className="text-gray-500 mt-1">แผนผังแผนกและทีมงาน</p>
        </div>
        <Button onClick={openAdd} className="bg-[#0D1B40] hover:bg-[#162552] text-white gap-2 rounded-xl">
          <Plus className="w-4 h-4" /> เพิ่มแผนก
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <div className="text-3xl font-bold text-[#0D1B40]">{departments.length}</div>
          <div className="text-sm text-gray-500 mt-1">แผนกทั้งหมด</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <div className="text-3xl font-bold text-[#0D1B40]">{employees.filter(e => e.status === "active").length}</div>
          <div className="text-sm text-gray-500 mt-1">พนักงานที่ทำงานอยู่</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <div className="text-3xl font-bold text-[#0D1B40]">{employees.filter(e => e.position?.toLowerCase().includes("manager") || e.position?.toLowerCase().includes("ผู้จัดการ") || e.position?.toLowerCase().includes("หัวหน้า")).length}</div>
          <div className="text-sm text-gray-500 mt-1">ผู้จัดการ</div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rootDepts.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center text-gray-400 shadow-sm">
          <Building2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg">ยังไม่มีแผนก</p>
          <p className="text-sm mt-1">กดปุ่ม "เพิ่มแผนก" เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div>
          {rootDepts.map(dept => (
            <DeptCard key={dept.id} dept={dept} employees={employees} allDepts={departments} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#0D1B40]">{editing ? "แก้ไขแผนก" : "เพิ่มแผนกใหม่"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <F label="ชื่อแผนก (EN)">{inp("name", "e.g. HR")}</F>
              <F label="ชื่อแผนก (TH)">{inp("name_th", "เช่น ทรัพยากรบุคคล")}</F>
              <F label="รหัสแผนก">{inp("code", "e.g. HR001")}</F>
              <F label="หัวหน้าแผนก">{inp("head_name")}</F>
            </div>
            <F label="แผนกแม่">
              <Select value={form.parent_department || "none"} onValueChange={v => setForm(f => ({ ...f, parent_department: v === "none" ? "" : v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="ไม่มี (แผนกหลัก)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ไม่มี (แผนกหลัก)</SelectItem>
                  {departments.filter(d => d.id !== editing).map(d => <SelectItem key={d.id} value={d.name}>{d.name_th || d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </F>
            <F label="คำอธิบาย">{inp("description")}</F>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-[#0D1B40] hover:bg-[#162552] text-white">
                {saving ? "บันทึก..." : "บันทึก"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}