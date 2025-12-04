import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Token Management API',
  description: 'Manage access tokens for users',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
