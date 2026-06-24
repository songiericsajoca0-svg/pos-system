import './globals.css';

export const metadata = {
  title: 'The Point Ko.fi POS',
  description: 'Small business POS system using Next.js, Node.js and MongoDB'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
