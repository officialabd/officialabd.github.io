"use client";

import { FormEvent, useState } from "react";
import Card from "../../_layouts/card/card";
import Basic from "../../_layouts/texts/basic";

interface AuthFormProps {
    onLogin: (email: string, password: string) => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

export function AuthForm({ onLogin, isLoading, error }: AuthFormProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        await onLogin(email.trim(), password);
    };

    return (
        <Card
            heading={
                <Basic
                    text="Sign in"
                    fontFamily="font-RobotoMono"
                    fontSize="text-2xl"
                    textColor="text-teal-300"
                />
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm text-slate-300">Email</label>
                        <input
                            className="w-full rounded-lg bg-slate-900/70 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            required
                            autoComplete="email"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm text-slate-300">Password</label>
                        <input
                            className="w-full rounded-lg bg-slate-900/70 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            required
                            autoComplete="current-password"
                        />
                    </div>
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-400 disabled:opacity-50"
                >
                    {isLoading ? "Loading..." : "Sign in"}
                </button>
            </form>
        </Card>
    );
}
