"use client"
import { ThemeProvider } from "next-themes";
import MyHome from "./pages/home/home";

export default function Home() {
    return (
        <ThemeProvider attribute="class">
            <MyHome />
        </ThemeProvider>
    )
}