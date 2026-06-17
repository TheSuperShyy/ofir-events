import './globals.css';

export const metadata = {
  title: 'אופיר אירועים — העלאת מסמך למלאי',
  description: 'העלאת הצעת מחיר או הזמנה מאושרת (PDF) לעדכון המלאי לפי תאריך האירוע.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
