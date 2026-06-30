import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, ClipboardCheck, Calendar, UserPlus, TrendingUp, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const StatCard = ({ icon: Icon, label, value, sub, color, bg }) => (
  <div className={`rounded-2xl p-6 flex items-center gap-4 shadow-sm border border-transparent ${bg}`}>
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color}`}>
      <Icon className="w-7 h-7 text-white" />
    </div>
    <div>
      <div className="text-3xl font-bold text-[#0D1B40]">{value}</div>
      <div className="text-sm font-semibold text-gray-600">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  </div>
);

const DEPT_COLORS = ["#0D1B40", "#C9A227", "#1E40AF", "#D97706", "#065F46", "#7C3AED"];

export default function HRDashboard() {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    Promise.all([
      base44.entities.Employee.list(),
      base44.entities.Attendance.filter({ date: today }),
      base44.entities.LeaveRequest.filter({ status: "pending" }),
      base44.entities.JobApplicant.list(),
    ]).then(([emp, att, leave, app]) => {
      setEmployees(emp);
      setAttendance(att);
      setLeaveRequests(leave);
      setApplicants(app);
    }).finally(() => setLoading(false));
  }, []);

  const activeEmployees = employees.filter(e => e.status === "active").length;
  const presentToday = attendance.filter(a => a.status === "present").length;
  const lateToday = attendance.filter(a => a.status === "late").length;
  const absentToday = attendance.filter(a => a.status === "absent").length;

  const deptData = Object.entries(
    employees.reduce((acc, e) => {
      acc[e.department || "อื่นๆ"] = (acc[e.department || "อื่นๆ"] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const statusData = [
    { name: "มาทำงาน", value: presentToday, color: "#059669" },
    { name: "สาย", value: lateToday, color: "#D97706" },
    { name: "ขาดงาน", value: absentToday, color: "#DC2626" },
    { name: "ไม่มีข้อมูล", value: Math.max(0, activeEmployees - presentToday - lateToday - absentToday), color: "#94A3B8" },
  ].filter(d => d.value > 0);

  const recentApplicants = applicants.slice(0, 5);

  const statusLabel = {
    new: "ใหม่", screening: "คัดกรอง", interview: "สัมภาษณ์",
    offer: "เสนองาน", hired: "รับเข้าทำงาน", rejected: "ปฏิเสธ"
  };
  const statusColor = {
    new: "bg-blue-100 text-blue-700", screening: "bg-yellow-100 text-yellow-700",
    interview: "bg-purple-100 text-purple-700", offer: "bg-orange-100 text-orange-700",
    hired: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-700"
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#0D1B40]">แดชบอร์ด HR</h1>
        <p className="text-gray-500 mt-1">ภาพรวมระบบทรัพยากรบุคคล BLC</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="พนักงานทั้งหมด" value={activeEmployees} sub={`จากทั้งหมด ${employees.length} คน`} color="bg-[#0D1B40]" bg="bg-white" />
        <StatCard icon={CheckCircle2} label="มาทำงานวันนี้" value={presentToday} sub={`คิดเป็น ${activeEmployees ? Math.round(presentToday/activeEmployees*100) : 0}%`} color="bg-emerald-600" bg="bg-white" />
        <StatCard icon={Clock} label="คำขอลาที่รออนุมัติ" value={leaveRequests.length} sub="รายการ" color="bg-amber-500" bg="bg-white" />
        <StatCard icon={UserPlus} label="ผู้สมัครงานใหม่" value={applicants.filter(a => a.status === "new").length} sub="รายการใหม่" color="bg-violet-600" bg="bg-white" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dept bar chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#0D1B40] mb-4">จำนวนพนักงานตามแผนก</h2>
          {deptData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#0D1B40" radius={[6,6,0,0]} name="จำนวน">
                  {deptData.map((_, i) => <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">ยังไม่มีข้อมูลพนักงาน</div>
          )}
        </div>

        {/* Attendance pie */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#0D1B40] mb-4">สถานะการมาทำงานวันนี้</h2>
          {statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {statusData.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                      <span className="text-gray-600">{s.name}</span>
                    </div>
                    <span className="font-semibold text-[#0D1B40]">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">ยังไม่มีข้อมูลการบันทึกเวลาวันนี้</div>
          )}
        </div>
      </div>

      {/* Recent Applicants + Pending Leave */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applicants */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0D1B40]">ผู้สมัครงานล่าสุด</h2>
            <a href="/applicants" className="text-[#C9A227] text-sm font-medium hover:underline">ดูทั้งหมด →</a>
          </div>
          {recentApplicants.length > 0 ? (
            <div className="space-y-3">
              {recentApplicants.map(app => (
                <div key={app.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="font-medium text-[#0D1B40] text-sm">{app.first_name} {app.last_name}</div>
                    <div className="text-xs text-gray-400">{app.position_applied}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[app.status] || "bg-gray-100 text-gray-600"}`}>
                    {statusLabel[app.status] || app.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8 text-sm">ยังไม่มีผู้สมัครงาน</div>
          )}
        </div>

        {/* Pending Leave */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0D1B40]">คำขอลาที่รออนุมัติ</h2>
            <a href="/leave" className="text-[#C9A227] text-sm font-medium hover:underline">ดูทั้งหมด →</a>
          </div>
          {leaveRequests.length > 0 ? (
            <div className="space-y-3">
              {leaveRequests.slice(0, 5).map(req => (
                <div key={req.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="font-medium text-[#0D1B40] text-sm">{req.employee_name}</div>
                    <div className="text-xs text-gray-400">
                      {{annual:"ลาพักร้อน",sick:"ลาป่วย",personal:"ลากิจ",maternity:"ลาคลอด",paternity:"ลาบิดา",other:"อื่นๆ"}[req.leave_type]} · {req.days_count} วัน
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-yellow-100 text-yellow-700">รออนุมัติ</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8 text-sm">ไม่มีคำขอลาที่รออนุมัติ</div>
          )}
        </div>
      </div>
    </div>
  );
}