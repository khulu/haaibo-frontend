import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useUserApi, { User } from "../../hooks/api/useUser";
import Badge from "../../components/ui/badge/Badge";

export default function UserDetails() {
  const { id } = useParams<{ id: string }>();
  const { getUserById, deleteUser } = useUserApi();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await getUserById(id);
        setUser(data);
      } catch (err: any) {
        setError(err?.message || "Failed to fetch user");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, getUserById]);

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteUser(id);
      navigate("/users");
    } catch (err: any) {
      setError(err?.message || "Failed to delete user");
    }
  };

  if (loading) return <div className="p-6">Loading user...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!user) return <div className="p-6">User not found.</div>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">User Details</h1>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 overflow-hidden rounded-full bg-gray-100 flex items-center justify-center">
          {user.profilePicture ? (
            <img width={64} height={64} src={user.profilePicture} alt={user.fullName} />
          ) : (
            <span className="text-gray-400 text-2xl font-bold">{user.fullName?.[0] || "?"}</span>
          )}
        </div>
        <div>
          <div className="font-bold text-lg">{user.fullName}</div>
          <div className="text-gray-500 text-sm">{user.email}</div>
          <Badge size="sm" color={user.role === 1 || user.role === "SuperAdmin" ? "success" : "warning"}>
            {typeof user.role === "number" ? (user.role === 1 ? "Admin" : "User") : user.role}
          </Badge>
        </div>
      </div>
      <div className="mb-2"><b>Department:</b> {user.department || "-"}</div>
      <div className="mb-2"><b>Phone:</b> {user.phone || "-"}</div>
      <div className="mb-2"><b>Company:</b> {user.companyName || "-"}</div>
      <div className="flex gap-4 mt-6">
        <button onClick={() => navigate(`/users/edit/${user.id}`)} className="px-4 py-2 bg-blue-600 text-white rounded">Edit</button>
        <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded">Delete</button>
        <button onClick={() => navigate("/users")} className="px-4 py-2 bg-gray-300 text-gray-800 rounded">Back</button>
      </div>
    </div>
  );
}
