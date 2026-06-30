import HRDashboard from './pages/HRDashboard';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import Leave from './pages/Leave';
import Organization from './pages/Organization';
import Applicants from './pages/Applicants';
import __Layout from './Layout.jsx';

export const PAGES = {
    "employees": Employees,
    "attendance": Attendance,
    "leave": Leave,
    "organization": Organization,
    "applicants": Applicants,
}

export const pagesConfig = {
    mainPage: null,
    Pages: PAGES,
    Layout: __Layout,
};