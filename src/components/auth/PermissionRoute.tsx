import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface Props {
    permission: string;
    children: JSX.Element;
}

export default function PermissionRoute({
    permission,
    children,
}: Props) {
    const { hasPermission, loading } = useAuth();

    if (loading) {
        return <div>Yükleniyor...</div>;
    }

    if (!hasPermission(permission)) {
        return <Navigate to="/yetkisiz" replace />;
    }

    return children;
}