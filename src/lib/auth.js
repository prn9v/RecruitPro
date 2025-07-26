// lib/auth.js - Debug Version
import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
        name: { label: "Name", type: "text" },
        isSignUp: { label: "Is Sign Up", type: "boolean" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        console.log("Credentials:", credentials)

        try {
          if (credentials.isSignUp === "true") {
            // Sign up logic
            const existingUser = await prisma.user.findUnique({
              where: { email: credentials.email },
            })

            if (existingUser) {
              throw new Error("User already exists")
            }

            if (!credentials.name) {
              throw new Error("Name is required for sign up")
            }

            const hashedPassword = await bcrypt.hash(credentials.password, 12)
            const validRole = credentials.role === "ADMIN" ? "ADMIN" : "USER"

            // Debug: Log the data we're trying to create
            const userData = {
              email: credentials.email,
              name: credentials.name,
              password: hashedPassword,
              role: validRole,
            }
            console.log("Attempting to create user with data:", userData)

            // Try to create user with explicit field mapping
            const user = await prisma.user.create({
              data: userData,
            })

            console.log("User created successfully:", user)

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            }
          } else {
            // Sign in logic
            const user = await prisma.user.findUnique({
              where: { email: credentials.email },
            })

            console.log("Found user for signin:", user ? { 
              id: user.id, 
              email: user.email, 
              role: user.role,
              hasPassword: !!user.password 
            } : null)

            if (!user || !user.password) {
              throw new Error("Invalid credentials")
            }

            const isValid = await bcrypt.compare(credentials.password, user.password)
            if (!isValid) {
              throw new Error("Invalid credentials")
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            }
          }
        } catch (error) {
          console.error("Detailed auth error:", {
            message: error.message,
            code: error.code,
            meta: error.meta,
            stack: error.stack
          })
          throw error
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.email = token.email
        session.user.name = token.name
      }
      return session
    },
    async redirect({ url, baseUrl, token }) {
      console.log("Redirect callback - URL:", url, "Token role:", token?.role)
      
      // If user is signing in, redirect based on their role
      if (url === baseUrl || url === `${baseUrl}/` || url.includes('/auth/signin') || url.includes('/auth/callback')) {
        const userRole = token?.role
        
        console.log("Redirecting user with role:", userRole)
        
        if (userRole === "ADMIN") {
          console.log("Redirecting to admin dashboard")
          return `${baseUrl}/admin/dashboard`
        } else if (userRole === "USER") {
          console.log("Redirecting to jobs page")
          return `${baseUrl}/jobs`
        }
      }
      
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      
      // Default redirect based on role from token
      if (token?.role === "ADMIN") {
        return `${baseUrl}/admin/dashboard`
      } else if (token?.role === "USER") {
        return `${baseUrl}/jobs`
      }
      
      return baseUrl
    },
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
}