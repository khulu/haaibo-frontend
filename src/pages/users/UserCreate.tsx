import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useUserApi, { CreateUserInput } from "../../hooks/api/useUserApi";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import useOrganization from "@hooks/organization/useOrganization";

export default function UserCreate() {
  const { createUser } = useUserApi();
  const { useOrganizationList } = useOrganization();
  const { data: organizations } = useOrganizationList();
  const navigate = useNavigate();
  const [form, setForm] = useState<CreateUserInput>({
    fullName: "",
    email: "",
    phone: "",
    department: "",
    role: "0", // Ensure role is a string
    password: "",
    companyId: "",
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
      const payload = { ...form };
      if (!payload.companyId) {
        delete payload.companyId;
      }
      await createUser(payload);
      navigate("/users");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: "0", label: "Super Admin" },
    { value: "1", label: "Company Admin" },
    { value: "2", label: "Security" },
    { value: "3", label: "Employee" },
  ];

  return (
    <ComponentCard title="Create User">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            name="fullName"
            value={form.fullName || ""}
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
            value={form.email || ""}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            value={form.phone || ""}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            name="department"
            value={form.department || ""}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="role">Role</Label>
          <Select
            options={roleOptions}
            defaultValue={String(form.role)}
            onChange={(value) => setForm((prev) => ({ ...prev, role: value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={form.password || ""}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="companyId">Company</Label>
          <Select
            options={organizations?.map((org) => ({ value: org.id, label: org.name })) || []}
            placeholder="Select a company"
            onChange={(value) => setForm((prev) => ({ ...prev, companyId: value }))}
            className="dark:bg-dark-900"
          />
        </div>
        {error && <div className="text-red-500">{error}</div>}
        <div className="flex gap-4">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create"}
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded"
            onClick={() => navigate("/users")}
          >
            Cancel
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}
