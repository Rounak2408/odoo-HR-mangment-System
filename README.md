# Odoo HR Management System 👔

A modern, intelligent HR management system built with Next.js and Odoo integration. Streamline your HR operations with an intuitive interface for employee management, attendance tracking, leave management, and performance evaluation.

🌐 **Live Demo**: [odoo-hr-mangment-system.vercel.app](https://odoo-hr-mangment-system.vercel.app/)

---

## ✨ Features

### 🎯 Core HR Management

- **Employee Management** - Add, update, and manage employee profiles with comprehensive information
- **Attendance Tracking** - Real-time attendance monitoring with clock-in/clock-out functionality
- **Leave Management** - Simplified leave request and approval workflow
- **Performance Metrics** - Track and evaluate employee performance with detailed analytics
- **Salary & Payroll** - Integrated payroll management with automatic calculations

### 🎨 Modern UI/UX

- **Responsive Design** - Seamless experience across all devices (desktop, tablet, mobile)
- **Dark/Light Theme** - Built-in theme switching for user comfort
- **Interactive Dashboards** - Real-time data visualization with charts and graphs
- **Smooth Animations** - Engaging transitions and micro-interactions
- **Professional Components** - Clean, reusable UI components

### 🔐 Security & Compliance

- **Role-Based Access Control** - Different permission levels for Admins, Managers, and Employees
- **Data Encryption** - Secure storage of sensitive employee information
- **Activity Logging** - Complete audit trail of all system activities
- **GDPR Compliant** - Data privacy and protection built-in

### 📊 Advanced Analytics

- **Employee Demographics** - Visual insights into workforce composition
- **Attendance Analytics** - Track attendance trends and patterns
- **Leave Analytics** - Monitor leave usage and balances
- **Performance Reports** - Detailed employee performance metrics

---

## 🚀 Quick Start

### Prerequisites

- Node.js 16 or higher
- npm or yarn
- Odoo Server (v15 or higher)
- PostgreSQL database

### Installation

```bash
# Clone the repository
git clone https://github.com/Rounak2408/odoo-HR-mangment-System.git

cd odoo-HR-mangment-System

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build for Production

```bash
npm run build
npm start
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|----------|
| **Framework** | Next.js 14 with App Router |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **State Management** | Redux/Zustand |
| **Backend** | Odoo (Python) |
| **Database** | PostgreSQL |
| **API Integration** | REST & JSON-RPC |
| **Authentication** | JWT with OAuth2 |
| **Charts & Graphs** | Recharts |
| **UI Components** | shadcn/ui, Radix UI |
| **Icons** | Lucide React |
| **Deployment** | Vercel |

---

## 📁 Project Structure

```
odoo-HR-mangment-System/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Landing page
│   ├── dashboard/         # Dashboard pages
│   ├── employees/         # Employee management
│   ├── attendance/        # Attendance tracking
│   ├── leaves/            # Leave management
│   ├── payroll/           # Payroll system
│   └── settings/          # Settings & configuration
├── components/            # Reusable React components
│   ├── ui/               # UI components
│   ├── dashboard/        # Dashboard components
│   └── common/           # Common components
├── lib/                   # Utility functions & helpers
├── styles/                # Global styles
├── public/                # Static assets
└── hooks/                 # Custom React hooks
```

---

## 🎨 Key Features Deep Dive

### Employee Management

- **Profile Management** - Complete employee profiles with contact details, emergency contacts, and work history
- **Document Management** - Store and manage employee documents (ID, certificates, contracts)
- **Team Organization** - Department and team structure management
- **Skill Tracking** - Document employee skills and certifications

### Attendance System

- **Real-time Clock In/Out** - Mobile-friendly attendance marking
- **Geolocation** - Optional location tracking during check-in
- **Attendance Reports** - Monthly and annual attendance summaries
- **Shift Management** - Support for multiple shift configurations
- **Holiday Calendar** - Customize holidays per company/location

### Leave Management

- **Multiple Leave Types** - Support for sick leave, casual leave, earned leave, etc.
- **Auto-Approval Workflows** - Configurable approval chains
- **Leave Balance Tracking** - Automatic balance calculation
- **Leave Calendar** - Visual leave planning calendar
- **Bulk Leave Approval** - Batch approve multiple leave requests

### Performance Management

- **Goal Setting** - Define and track employee goals
- **360-Degree Feedback** - Collect feedback from multiple sources
- **Performance Ratings** - Regular performance evaluations
- **Development Plans** - Create personalized development plans
- **Promotion Tracking** - Document career progression

---

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Odoo Configuration
ODOO_URL=http://localhost:8069
ODOO_DB=your_database_name
ODOO_USERNAME=admin
ODOO_PASSWORD=your_password

# Next.js Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_NAME=Odoo HR System

# Authentication
JWT_SECRET=your_jwt_secret_key
NEXT_AUTH_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/hrms_db
```

### Customization

- **Colors** - Modify `tailwind.config.ts` for custom color schemes
- **Components** - Extend UI components in `components/ui/`
- **Workflows** - Configure approval workflows in Odoo settings
- **Reports** - Create custom reports using Odoo's reporting tools

---

## 📊 Dashboard Sections

### Overview
- Total employees, active employees, new joiners
- Attendance overview, absent count
- Leave requests pending approval
- Key performance indicators (KPIs)

### Employee Directory
- Searchable employee database
- Department-wise filtering
- Quick employee profile access
- Contact information directory

### Attendance Hub
- Daily attendance status
- Attendance calendar
- Late arrivals and absences
- Geolocation map (if enabled)

### Leave Management
- Leave request submission
- Approval workflow
- Leave balance overview
- Team leave calendar

### Payroll Module
- Salary structure management
- Automatic salary calculation
- Tax deduction handling
- Payslip generation and distribution

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

```bash
npm i -g vercel
vercel --prod
```

Connect your GitHub repository for automatic deployments:
1. Push to your GitHub repository
2. Connect to Vercel Dashboard
3. Vercel will automatically deploy on every push

### Deploy to Other Platforms

**Docker Deployment**
```bash
docker build -t odoo-hr-system .
docker run -p 3000:3000 odoo-hr-system
```

**Railway, Render, or Heroku**
- Connect your GitHub repository
- Set environment variables
- Deploy with one click

---

## 📚 API Documentation

### Employee Endpoints

```
GET    /api/employees             # Get all employees
GET    /api/employees/:id         # Get employee by ID
POST   /api/employees             # Create new employee
PUT    /api/employees/:id         # Update employee
DELETE /api/employees/:id         # Delete employee
```

### Attendance Endpoints

```
GET    /api/attendance            # Get attendance records
POST   /api/attendance/check-in   # Clock in
POST   /api/attendance/check-out  # Clock out
GET    /api/attendance/report     # Get attendance report
```

### Leave Endpoints

```
GET    /api/leaves               # Get leave requests
POST   /api/leaves               # Submit leave request
PUT    /api/leaves/:id/approve   # Approve leave
PUT    /api/leaves/:id/reject    # Reject leave
```

---

## 🤝 Contributing

Contributions are welcome! Follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code structure
- Write meaningful commit messages
- Test your changes before submitting
- Update documentation as needed
- Ensure TypeScript types are properly defined

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙋 Contributors

- **Rounak2408** (Owner) - Lead Developer
- **kumarhimanshu3132** - Co-Developer

### Special Thanks

Thank you to all contributors and the open-source community for their support and contributions!

---

## 📞 Support

For issues, questions, or suggestions:

- 📧 Email: [support email]
- 🐙 GitHub Issues: [Create an issue](https://github.com/Rounak2408/odoo-HR-mangment-System/issues)
- 💬 Discussions: [Join our community](https://github.com/Rounak2408/odoo-HR-mangment-System/discussions)

---

## 🎯 Roadmap

- [ ] Mobile App (React Native)
- [ ] Advanced Analytics & Reporting
- [ ] AI-powered insights and predictions
- [ ] Integration with popular HRIS tools
- [ ] Multi-language support
- [ ] Offline mode for mobile app
- [ ] Enhanced security with 2FA
- [ ] Custom workflow builder
- [ ] Integration with Slack & Teams
- [ ] Email notifications & alerts

---

## 🌟 Project Highlights

- **Built for Odoo Hackathon** - Innovative HR solution
- **Production Ready** - Deployed and tested
- **Modern Stack** - Next.js, TypeScript, Tailwind CSS
- **Fully Responsive** - Mobile, tablet, and desktop support
- **Secure & Scalable** - Enterprise-grade security
- **Community Driven** - Open to contributions

---

### Built with ❤️ using modern web technologies

**Showcasing the power of Odoo integration with Next.js and contemporary web development practices.**

---

*Last Updated: January 6, 2026*
