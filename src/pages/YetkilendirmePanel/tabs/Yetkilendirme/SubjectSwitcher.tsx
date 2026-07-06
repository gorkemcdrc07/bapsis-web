import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { Kullanici, RolKey, UserRoles } from "../../types";
import { ROLES } from "../../utils/constants";

interface SubjectSwitcherProps {
    users?: Kullanici[];
    userRoles?: UserRoles;
    selectedRole: RolKey;
    selectedUserId: string;
    setSelectedRole: Dispatch<SetStateAction<RolKey>>;
    setSelectedUserId: Dispatch<SetStateAction<string>>;
}

export default function SubjectSwitcher({
    users = [],
    userRoles = {},
    selectedRole,
    selectedUserId,
    setSelectedRole,
    setSelectedUserId,
}: SubjectSwitcherProps) {
    const [mode, setMode] = useState<"rol" | "kullanici">(
        selectedUserId ? "kullanici" : "rol"
    );
    const [search, setSearch] = useState("");

    const normalizedSearch = search.toLocaleLowerCase("tr-TR");

    const filteredUsers = users.filter((user) =>
        (user.name || "")
            .toLocaleLowerCase("tr-TR")
            .includes(normalizedSearch)
    );

    function pickRole(role: RolKey) {
        setSelectedUserId("");
        setSelectedRole(role);
        setMode("rol");
    }

    function pickUser(userId: string) {
        setSelectedUserId(userId);
        setMode("kullanici");
    }

    return (
        <div className="ypw-subject-switcher">
            <div className="ypw-subject-switcher-head">
                <strong>Kimin yetkisi?</strong>

                <div className="ypw-subject-mode">
                    <button
                        type="button"
                        className={mode === "rol" ? "active" : ""}
                        onClick={() => setMode("rol")}
                    >
                        Rol
                    </button>

                    <button
                        type="button"
                        className={mode === "kullanici" ? "active" : ""}
                        onClick={() => setMode("kullanici")}
                    >
                        Kullanıcı
                    </button>
                </div>
            </div>

            {mode === "rol" ? (
                <div className="ypw-subject-role-list">
                    {ROLES.map((role) => {
                        const active = !selectedUserId && selectedRole === role.key;

                        return (
                            <button
                                type="button"
                                key={role.key}
                                className={`ypw-subject-role-item ${active ? "active" : ""}`}
                                onClick={() => pickRole(role.key)}
                            >
                                <span className="ypw-subject-role-icon">
                                    <i className={`ti ${role.icon}`} />
                                </span>

                                {role.label}
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div className="ypw-subject-user-panel">
                    <div className="ypw-subject-user-search">
                        <i className="ti ti-search" />

                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Kullanıcı ara"
                        />
                    </div>

                    <div className="ypw-subject-user-list">
                        {filteredUsers.map((user) => {
                            const role = userRoles[user.id] ?? user.role;
                            const active = selectedUserId === user.id;

                            return (
                                <button
                                    type="button"
                                    key={user.id}
                                    className={`ypw-subject-user-item ${active ? "active" : ""}`}
                                    onClick={() => pickUser(user.id)}
                                >
                                    <span className="ypw-subject-user-avatar">
                                        {(user.name || "?")
                                            .substring(0, 1)
                                            .toLocaleUpperCase("tr-TR")}
                                    </span>

                                    <span className="ypw-subject-user-info">
                                        <strong>{user.name || "İsimsiz Kullanıcı"}</strong>

                                        <small>
                                            {ROLES.find((r) => r.key === role)?.label ?? role}
                                        </small>
                                    </span>
                                </button>
                            );
                        })}

                        {filteredUsers.length === 0 && (
                            <p className="ypw-subject-user-empty">
                                Kullanıcı bulunamadı.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}