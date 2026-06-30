import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Edit2, Trash2, ExternalLink, UserPlus, ChevronRight, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_STEPS = ["new", "screening", "interview", "offer", "hired", "rejected"];
const STATUS_MAP = {
  new: { label: "ใหม่", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  screening: { label: "คัดกรอง", color: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500" },
  interview: { label: "สัมภาษณ์", color: "bg-purple-100 text-purple-700", dot: "bg-purple-500" },
  offer: { label: "เสนองาน", color: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
  hired: { label: "รับเข้าทำงาน", color: "bg-green-100 text-green-700", dot: "bg-green-500" },
  rejected: { label: "ปฏิเสธ", color: "bg-red-100 text-red-700", dot: "bg-red-400" },
};
const SOURCES = { website: "เว็บไซต์บริษัท", linkedin: "LinkedIn", referral: "บุคคลแนะนำ", job_board: "Job Board", other: "อื่นๆ" };
const DEPARTMENTS = ["Management", "HR", "Finance", "IT", "Sales", "Marketing", "Operations", "Legal"];
const EMPTY = { first_name: "", last_name: "", email: "", phone: "", position_applied: "", department: "", cover_letter: "", source: "website", status: "new", interview_date: "", salary_expectation: "", experience_years: "", note: "", application_url: "" };

export default function Applicants() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    base44.entities.JobApplicant.list("-created_date").then(setApplicants).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = applicants.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || `${a.first_name} ${a.last_name} ${a.position_applied}`.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openAdd = () => { setForm(EMPTY); setEditing(null); setDialogOpen(true); };
  const openEdit = (a) => { setForm({ ...EMPTY, ...a }); setEditing(a.id); setDialogOpen(true); };
  const openDetail = (a) => { setSelected(a); setDetailOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    const data = { ...form, salary_expectation: Number(form.salary_expectation) || 0, experience_years: Number(form.experience_years) || 0 };
    if (editing) await base44.entities.JobApplicant.update(editing, data);
    else await base44.entities.JobApplicant.create(data);
    setSaving(false);
    setDialogOpen(false);
    load();
  };

  const handleStatusChange = async (id, status) => {
    await base44.entities.JobApplicant.update(id, { status });
    if (selected?.id === id) setSelected(s => ({ ...s, status }));
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("ลบข้อมูลผู้สมัครนี้?")) return;
    await base44.entities.JobApplicant.delete(id);
    setDetailOpen(false);
    load();
  };

  const statusCounts = STATUS_STEPS.reduce((acc, s) => { acc[s] = applicants.filter(a => a.status === s).length; return acc; }, {});

  const F = ({ label, children }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
  const inp = (field, type = "text", placeholder = "") => (
    <Input type={type} value={form[field] || ""} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} placeholder={placeholder} className="h-9 text-sm" />
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#0D1B40]">ผู้สมัครงาน</h1>
          <p className="text-gray-500 mt-1">ติดตามสถานะการสมัครงาน</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a
            href="https://blc-careers.example.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#C9A227] text-[#C9A227] hover:bg-[#FFF8E7] transition-colors text-sm font-medium"
          >
            <LinkIcon className="w-4 h-4" /> เว็บสมัครงาน
          </a>
          <Button onClick={openAdd} className="bg-[#0D1B40] hover:bg-[#162552] text-white gap-2 rounded-xl">
            <Plus className="w-4 h-4" /> เพิ่มผู้สมัคร
          </Button>
        </div>
      </div>

      {/* Pipeline overview */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {STATUS_STEPS.map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
            className={`bg-white rounded-2xl p-3 shadow-sm text-center transition-all border-2 ${filterStatus === s ? "border-[#C9A227]" : "border-transparent hover:border-gray-200"}`}
          >
            <div className="text-2xl font-bold text-[#0D1B40]">{statusCounts[s]}</div>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium mt-1 inline-block ${STATUS_MAP[s]?.color}`}>{STATUS_MAP[s]?.label}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="ค้นหาชื่อ, ตำแหน่ง..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 h-9 text-sm"><SelectValue placeholder="ทุกสถานะ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสถานะ</SelectItem>
            {STATUS_STEPS.map(s => <SelectItem key={s} value={s}>{STATUS_MAP[s]?.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center text-gray-400 shadow-sm">
          <UserPlus className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p>ไม่พบผู้สมัครงาน</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(a => (
            <div
              key={a.id}
              className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-[#C9A227]/30"
              onClick={() => openDetail(a)}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0D1B40] to-[#C9A227] flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                      {a.first_name?.[0]}{a.last_name?.[0]}
                    </div>
                    <div>
                      <div className="font-bold text-[#0D1B40]">{a.first_name} {a.last_name}</div>
                      <div className="text-sm text-gray-500">{a.position_applied}</div>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${STATUS_MAP[a.status]?.color}`}>
                    {STATUS_MAP[a.status]?.label}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-500">
                  {a.department && <div>{a.department}</div>}
                  {a.experience_years && <div>{a.experience_years} ปีประสบการณ์</div>}
                  {a.salary_expectation > 0 && <div>เงินเดือนที่ต้องการ: {a.salary_expectation?.toLocaleString()} บาท</div>}
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                  <span className="text-xs text-gray-400">{SOURCES[a.source] || a.source}</span>
                  {a.application_url && (
                    <a href={a.application_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-[#C9A227] hover:text-[#0D1B40]">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-[#0D1B40]">
                  {selected.first_name} {selected.last_name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0D1B40] to-[#C9A227] flex items-center justify-center text-white font-bold text-xl">
                    {selected.first_name?.[0]}{selected.last_name?.[0]}
                  </div>
                  <div>
                    <div className="text-lg font-bold text-[#0D1B40]">{selected.first_name} {selected.last_name}</div>
                    <div className="text-gray-500">{selected.position_applied}</div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_MAP[selected.status]?.color}`}>{STATUS_MAP[selected.status]?.label}</span>
                  </div>
                </div>

                {/* Status progression */}
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">เปลี่ยนสถานะ</div>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_STEPS.filter(s => s !== "rejected").map(s => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(selected.id, s)}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${selected.status === s ? STATUS_MAP[s]?.color + " ring-2 ring-offset-1" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                      >
                        {STATUS_MAP[s]?.label}
                      </button>
                    ))}
                    <button
                      onClick={() => handleStatusChange(selected.id, "rejected")}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${selected.status === "rejected" ? "bg-red-100 text-red-700 ring-2 ring-offset-1" : "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600"}`}
                    >
                      ปฏิเสธ
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-400">อีเมล:</span><div className="font-medium text-[#0D1B40]">{selected.email || "—"}</div></div>
                  <div><span className="text-gray-400">โทรศัพท์:</span><div className="font-medium text-[#0D1B40]">{selected.phone || "—"}</div></div>
                  <div><span className="text-gray-400">แผนก:</span><div className="font-medium text-[#0D1B40]">{selected.department || "—"}</div></div>
                  <div><span className="text-gray-400">แหล่งที่มา:</span><div className="font-medium text-[#0D1B40]">{SOURCES[selected.source] || "—"}</div></div>
                  <div><span className="text-gray-400">ประสบการณ์:</span><div className="font-medium text-[#0D1B40]">{selected.experience_years ? `${selected.experience_years} ปี` : "—"}</div></div>
                  <div><span className="text-gray-400">เงินเดือนที่ต้องการ:</span><div className="font-medium text-[#0D1B40]">{selected.salary_expectation ? `${Number(selected.salary_expectation).toLocaleString()} บาท` : "—"}</div></div>
                  {selected.interview_date && <div><span className="text-gray-400">วันสัมภาษณ์:</span><div className="font-medium text-[#0D1B40]">{selected.interview_date}</div></div>}
                </div>

                {selected.cover_letter && (
                  <div>
                    <div className="text-xs text-gray-400 mb-1">จดหมายสมัครงาน</div>
                    <div className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 whitespace-pre-wrap">{selected.cover_letter}</div>
                  </div>
                )}
                {selected.note && (
                  <div>
                    <div className="text-xs text-gray-400 mb-1">หมายเหตุ</div>
                    <div className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{selected.note}</div>
                  </div>
                )}
                {selected.application_url && (
                  <a href={selected.application_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[#C9A227] hover:text-[#0D1B40] text-sm font-medium">
                    <ExternalLink className="w-4 h-4" /> ดูใบสมัครออนไลน์
                  </a>
                )}

                <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                  <Button variant="ghost" onClick={() => { setDetailOpen(false); openEdit(selected); }} className="gap-2 text-[#0D1B40]">
                    <Edit2 className="w-4 h-4" /> แก้ไข
                  </Button>
                  <Button variant="ghost" onClick={() => handleDelete(selected.id)} className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" /> ลบ
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#0D1B40]">{editing ? "แก้ไขข้อมูลผู้สมัคร" : "เพิ่มผู้สมัครงานใหม่"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <F label="ชื่อ">{inp("first_name")}</F>
              <F label="นามสกุล">{inp("last_name")}</F>
              <F label="อีเมล">{inp("email", "email")}</F>
              <F label="โทรศัพท์">{inp("phone")}</F>
              <F label="ตำแหน่งที่สมัคร">{inp("position_applied")}</F>
              <F label="แผนก">
                <Select value={form.department} onValueChange={v => setForm(f => ({ ...f, department: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="เลือก" /></SelectTrigger>
                  <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </F>
              <F label="ประสบการณ์ (ปี)">{inp("experience_years", "number")}</F>
              <F label="เงินเดือนที่ต้องการ">{inp("salary_expectation", "number")}</F>
              <F label="แหล่งที่มา">
                <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(SOURCES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </F>
              <F label="สถานะ">
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_STEPS.map(s => <SelectItem key={s} value={s}>{STATUS_MAP[s]?.label}</SelectItem>)}</SelectContent>
                </Select>
              </F>
              <F label="วันสัมภาษณ์">{inp("interview_date", "date")}</F>
            </div>
            <F label="ลิงก์ใบสมัคร (จากเว็บ)">{inp("application_url", "url", "https://...")}</F>
            <F label="จดหมายสมัครงาน">
              <textarea value={form.cover_letter || ""} onChange={e => setForm(f => ({ ...f, cover_letter: e.target.value }))}
                rows={3} className="w-full border border-gray-200 rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0D1B40]/20" />
            </F>
            <F label="หมายเหตุ">{inp("note")}</F>
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