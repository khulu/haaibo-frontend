// File moved to ./users/UserEdit.tsx and can be deleted.
// This file is no longer needed.
// Please refer to the new location for the UserEdit component.
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useUserApi, { User } from "../../hooks/api/useUser";

export default function UserEdit() {
  const { id } = useParams<{ id: string }>();
  const { getUserById, updateUser } = useUserApi();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        if (id) {
          const data = await getUserById(id);
          setUser(data);
        }
      } catch (err: unknown) {
        if (err && typeof err === "object" && "message" in err) {
          setError((err as { message?: string }).message || "Failed to fetch user");
        } else {
          setError("Failed to fetch user");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id, getUserById]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    setSaving(true);
    try {
      await updateUser(id, user);
      navigate("/users");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "message" in err) {
        setError((err as { message?: string }).message || "Failed to update user");
      } else {
        setError("Failed to update user");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading user...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!user) return <div className="p-6">User not found</div>;

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-xl border border-gray-200 dark:bg-white/[0.03] dark:border-white/[0.05]">
      <h1 className="text-2xl font-bold mb-4">Edit User</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Full Name</label>
          <input
            type="text"
            name="fullName"
            value={user.fullName || ""}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Email</label>
          <input
            type="email"
            name="email"
            value={user.email || ""}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        {/* Add more fields as needed */}
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
