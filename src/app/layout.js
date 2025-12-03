import "./globals.css";

export const metadata = {
	title: "英作チェッカー",
	description: "学生向け英作文チェックツール"
};

export default function RootLayout({ children }) {
	return (
		<html lang="ja">
			<body className="bg-slate-50 text-slate-900">
				{children}
			</body>
		</html>
	);
}

