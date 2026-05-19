import "./globals.css";
import { headers } from 'next/headers';

export const metadata = {
  title: "英作チェッカー",
  description: "学生向け英作文チェックツール"
};

export default async function RootLayout({ children }) {
  const nonce = (await headers()).get('x-nonce');

  return (
    <html lang="ja">
      <head>
        <meta property="csp-nonce" content={nonce} />
      </head>
      <body className="bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
};