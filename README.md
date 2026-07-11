# Money Management - Project Summary

## Overview
A family money management app built with Next.js, TypeScript, and Tailwind CSS. This project helps a family track expenses, manage budgets, and plan savings.

## Features
- **Transaction Management**: Add, view, filter, and categorize transactions
- **Budget Planning**: Set and track budgets by category
- **Savings Goals**: Create and monitor savings targets
- **Debt Management**: Track and pay down debts
- **User Roles**: Separate tracking for husband and wife
- **Dashboard Analytics**: Visual charts and summaries of spending patterns
- **Responsive Design**: Works on mobile, tablet, and desktop

## Categories
A complete categorization system for transactions:
- **Income**: Gaji (Salary), Bonus/THR, Lainnya (Other)
- **Expenses**: 
  - Kebutuhan Rumah (House Needs)
  - Belanja Harian (Daily Shopping)
  - Makan & Minum (Food & Dining)
  - Transportasi (Transportation)
  - Hiburan (Entertainment)
  - Kesehatan (Health)
  - Anak (Kids)
  - Donasi (Donations)
  - Lainnya (Other)

## Project Structure
```
Money Management/
├─ app/
│  ├─ api/            # Backend API routes
│  ├─ components/    # UI components
│  ├─ layout.tsx     # Main layout
│  ├─ page.tsx       # Dashboard page
│  ├─ transactions/  # Transaction management
│  ├─ budgets/        # Budget management
│  ├─ savings/        # Savings goals
│  └─ debts/         # Debt management
├─ components/       # Reusable UI components
├─ lib/              # Helper functions & types
├─ public/           # Static assets
├─ prisma/           # Database schema
├─ README.md         # Project documentation
└─ package.json      # Dependencies and scripts
```

## Technologies Used
- **Next.js** with App Router
- **TypeScript** for type safety
- **Prisma** with PostgreSQL
- **Zustand** for state management
- **Tailwind CSS** for styling
- **Shadcn/ui** for UI components
- **Lucide React** for icons

## Installation & Setup

### Prerequisites
- Node.js 18+ (with pnpm)
- PostgreSQL database with appropriate credentials

### Steps to Run

1. **Clone Repository**
```bash
git clone <repository-url>
cd money-management
```

2. **Install Dependencies**
```bash
pnpm install
```

3. **Set Up Environment**
Create a `.env` file:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/db_name
```

4. **Initialize Database**
```bash
npx prisma generate
npx prisma db push
```

5. **Run Development Server**
```bash
pnpm dev
```

6. **Access Application**
Open your browser and navigate to:
`http://localhost:3000`

## Project Highlights

### Dashboard
The main dashboard provides:
- **Summary Cards**: Quick overview of total balance, monthly income/expense
- **Pie Chart**: Visual breakdown of expenses by category
- **Line Chart**: Spending trends over time
- **Budget Progress**: Active budget tracking
- **Recent Transactions**: Latest transaction activity

### Transaction Management
- CRUD (Create, Read, Update, Delete) operations
- Filtering by category, user, and time periods
- Search functionality
- Pagination for large datasets

### Budget Planning
- Set and track budgets per category
- Automatic spending calculation against budgets
- Visual progress indicators
- Over-budget alerts

### Savings Goals
- Create and manage savings targets
- Track progress with visual indicators
- Set deadlines and notifications

### Debt Management
- Track multiple debts
- Monitor payments and balances
- Set interest rates and payment schedules

## UI/UX Features

### Responsive Design
The application provides seamless experience across all device types:
- **Desktop**: Full feature set with expanded panel
- **Tablet**: Optimized layout with adaptive components
- **Mobile**: Touch-friendly interface with simplified navigation

### Accessibility
- Proper ARIA labels and semantic HTML
- Keyboard navigation support
- Screen reader compatibility
- High contrast options

### Real-time Updates
- Live updates for transaction lists
- Automatic budget calculations
- Real-time chart rendering

## Development Workflow

1. **Feature Development**
   - Use the `workflow-dev` skill for collaboration
   - Ensure thorough testing through TDD
   - Follow established code review processes

2. **Code Quality**
   - TypeScript throughout for type safety
   - Comprehensive error handling
   - Clean, maintainable code structure

3. **Testing**
   - Unit tests for core business logic
   - Integration tests for API endpoints
   - Component tests for UI elements

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Branch Strategy**
   - Feature branches from `develop`
   - Commit with clear, descriptive messages
   - Pull requests for feature merges

2. **Code Standards**
   - Follow existing code conventions
   - Maintain clean, readable code
   - Use TypeScript effectively

3. **Documentation**
   - Update README files as needed
   - Add comments for complex logic
   - Document new features

## Troubleshooting

### Common Issues

#### “Database connection failed"
```
Check your DATABASE_URL in .env file
Ensure PostgreSQL service is running
Verify database exists
```

#### “Cannot read properties of undefined (reading 'connect')"
```
1. Run `pnpm install` to ensure all dependencies are installed
2. Check environment variables
3. Verify Prisma schema is up to date
```

#### "Port 3000 is already in use"
```
bash
pnpm dev --port 3001
```

### Getting Help

For additional support or questions:
1. **Project Documentation**: Check the README and inline documentation
2. **Issue Tracking**: Use GitHub Issues for bug reports and feature requests
3. **Code Reviews**: Participate in peer reviews for code quality

## Future Enhancements

### Planned Features

1. **Advanced Analytics**
   - Spending patterns analysis
   - Comparative month-over-month analysis
   - Budget optimization recommendations

2. **Mobile App**
   - PWA (Progressive Web App) capabilities
   - Offline functionality
   - Push notifications for budget alerts

3. **Integration**
   - Bank account integration
   - Investment tracking
   - Tax preparation tools

4. **Collaboration**
   - Multi-user support with granular permissions
   - Family member sharing capabilities
   - Shared budget planning

## License

This project is licensed under the MIT License.

---

*Note: This project was developed in collaboration with the Hermes Agent (by Nous Research) and follows established best practices for modern web development.*