import "./globals.css"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/components/AuthProvider"
import Navigation from "@/components/Navigation"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "RecruitPro - Job Portal Platform",
  description: "Find your dream job or hire the best talent",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <main className="pt-16">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
