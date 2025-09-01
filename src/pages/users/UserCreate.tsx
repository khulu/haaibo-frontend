import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useUserApi, { CreateUserInput } from "../../hooks/api/useUser";

export default function UserCreate() {
  const { createUser } = useUserApi();
  const navigate = useNavigate();
  const [form, setForm] = useState<CreateUserInput>({
    fullName: "",
    email: "",
    phone: "",
    department: "",
    role: 0,
    password: "",
    companyId: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createUser(form);
      navigate("/users");
    } catch (err: any) {
      setError(err?.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create User</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Full Name</label>
          <input name="fullName" value={form.fullName} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
        </div>
        <div>
          <label className="block mb-1 font-medium">Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
        </div>
        <div>
          <label className="block mb-1 font-medium">Phone</label>
          <input name="phone" value={form.phone} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        </div>
        <div>
          <label className="block mb-1 font-medium">Department</label>
          <input name="department" value={form.department} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        </div>
        <div>
          <label className="block mb-1 font-medium">Role</label>
          <select name="role" value={form.role} onChange={handleChange} className="w-full border px-3 py-2 rounded">
            <option value={0}>User</option>
            <option value={1}>Admin</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Password</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
        </div>
        <div>
          <label className="block mb-1 font-medium">Company ID</label>
          <input name="companyId" value={form.companyId} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        </div>
        {error && <div className="text-red-500">{error}</div>}
        <div className="flex gap-4">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>{loading ? "Creating..." : "Create"}</button>
          <button type="button" className="px-4 py-2 bg-gray-300 text-gray-800 rounded" onClick={() => navigate("/users")}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
