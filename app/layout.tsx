import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '请相信我 - 谎言鉴别游戏',
  description: '一人猜、四人辩、找真凶',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
