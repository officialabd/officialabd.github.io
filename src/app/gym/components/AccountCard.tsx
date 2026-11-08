"use client";

import Card from "./Card";
import { useUIStore } from "../stores";
import { formatRemaining, formatTime } from "../utils";
import { LogoutIcon } from "./icons";
import { Button, SectionTitle } from "./ui";

export interface AccountInfo {
    email: string | null;
    sessionIssuedAt: number | null;
    sessionExpiresAt: number | null;
    onLogout: () => void;
}

/** Signed-in account, login session details and sign out. */
export function AccountCard({ email, sessionIssuedAt, sessionExpiresAt, onLogout }: AccountInfo) {
    const nowTs = useUIStore((s) => s.nowTs);
    return (
        <Card heading={<SectionTitle text="Account" />}>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                    <dt className="text-slate-400">Signed in as</dt>
                    <dd className="font-semibold text-slate-100 break-all">{email ?? "-"}</dd>
                    <dt className="text-slate-400">Logged in</dt>
                    <dd className="text-slate-200">{formatTime(sessionIssuedAt)}</dd>
                    <dt className="text-slate-400">Session renews in</dt>
                    <dd className="text-slate-200">{formatRemaining(sessionExpiresAt ? sessionExpiresAt - nowTs : null)}</dd>
                </dl>
                <Button size="sm" variant="danger" onClick={onLogout}>
                    <LogoutIcon />
                    Sign out
                </Button>
            </div>
        </Card>
    );
}
