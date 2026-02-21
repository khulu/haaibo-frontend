import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useUserApi, { User as BaseUser, CreateUserInput } from "@hooks/api/useUserApi";
import useOrganization from "@hooks/organization/useOrganization";
import useAuthApi from "@hooks/api/useAuthApi";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";

interface User extends BaseUser {
  password?: string;
}

export default function UserEdit() {
  const { id } = useParams<{ id: string }>();
  const { getUserById, updateUser } = useUserApi();
  const { useOrganizationList } = useOrganization();
  const { data: organizations } = useOrganizationList();
  const auth = useAuthApi();
  const currentCompanyId = auth.getCompanyId();
  const [isSuperAdmin] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return false;
      const u = JSON.parse(raw);
      const role = u?.role;
      return role === 0 || role === 'SuperAdmin';
    } catch {
      return false;
    }
  });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        if (id) {
          const data = await getUserById(id);
          if (isMounted) setUser(data);
        }
      } catch (err: unknown) {
        if (err && typeof err === "object" && "message" in err) {
          if (isMounted) setError((err as { message?: string }).message || "Failed to fetch user");
        } else {
          if (isMounted) setError("Failed to fetch user");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (value: string) => {
    if (!user) return;
    setUser((prev) => ({ ...prev!, role: value }));
  };

  const handleCompanyChange = (value: string) => {
    if (!user) return;
    setUser((prev) => ({ ...prev!, companyId: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    setUser((prev) => ({ ...prev!, password: e.target.value }));
  };

  const updatedUser: CreateUserInput = {
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    department: user?.department || "",
    role: user?.role || "",
    password: user?.password || "",
    companyId: isSuperAdmin ? (user?.companyId || "") : (currentCompanyId ?? ""),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    setSaving(true);
    try {
      await updateUser(id, updatedUser);
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

  if (loading) return <div className="p-6 text-gray-900">Loading user...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!user) return <div className="p-6 text-gray-900">User not found</div>;

  return (
    <ComponentCard title="Edit User">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            name="fullName"
            value={user?.fullName || ""}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={user?.email || ""}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            value={user?.phone || ""}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            name="department"
            value={user?.department || ""}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="role">Role</Label>
          <Select
            options={
              isSuperAdmin
                ? [
                    { value: "0", label: "Super Admin" },
                    { value: "1", label: "Company Admin" },
                    { value: "2", label: "Security" },
                    { value: "3", label: "Employee" },
                  ]
                : [
                    { value: "1", label: "Company Admin" },
                    { value: "2", label: "Security" },
                    { value: "3", label: "Employee" },
                  ]
            }
            defaultValue={String(user?.role)}
            onChange={handleRoleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={user?.password || ""}
            onChange={handlePasswordChange}
            required
          />
        </div>
        {isSuperAdmin && (
          <div>
            <Label htmlFor="companyId">Company</Label>
            <Select
              options={organizations?.map((org: { id: string; name: string }) => ({ value: org.id, label: org.name })) || []}
              defaultValue={user?.companyId || ""}
              onChange={handleCompanyChange}
              className="dark:bg-dark-900"
            />
          </div>
        )}
        {error && <div className="text-red-500">{error}</div>}
        <div className="flex gap-4">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-gray-300 text-gray-900 rounded"
            onClick={() => navigate("/users")}
          >
            Cancel
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}
