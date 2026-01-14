import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useOrganizationsApi, { CreateOrganizationInput } from "../../hooks/api/useOrganizationApi";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import FileInput from "../../components/form/input/FileInput";

export default function OrganizationCreate() {
  const { createOrganization, uploadLogo, updateBranding } = useOrganizationsApi();
  const navigate = useNavigate();
  const [form, setForm] = useState<CreateOrganizationInput>({
    name: "",
    adminUserId: null,
  });
  const [primaryColor, setPrimaryColor] = useState<string>("");
  const [secondaryColor, setSecondaryColor] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setLogoFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload: CreateOrganizationInput = {
        name: form.name,
        // Send adminUserId only if provided; else null to mark optional
        adminUserId: form.adminUserId && form.adminUserId.trim() !== "" ? form.adminUserId : null,
      };
      const created = await createOrganization(payload);
      // Optional: upload logo
      if (logoFile) {
        try {
          await uploadLogo(created.id, logoFile);
        } catch (err) {
          console.warn('Logo upload failed', err);
        }
      }
      // Optional: update branding colors
      if ((primaryColor && primaryColor.trim() !== "") || (secondaryColor && secondaryColor.trim() !== "")) {
        try {
          await updateBranding(created.id, {
            primaryColor: primaryColor || undefined,
            secondaryColor: secondaryColor || undefined,
          });
        } catch (err) {
          console.warn('Branding update failed', err);
        }
      }
      navigate("/organizations");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "message" in err) {
        setError((err as { message?: string }).message || "Failed to create organization");
      } else {
        setError("Failed to create organization");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentCard title="Create Organization">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="primaryColor">Primary Dark color (main design color)</Label>
            <input
              id="primaryColor"
              name="primaryColor"
              type="color"
              value={primaryColor || '#3D54E8'}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>
          <div>
            <Label htmlFor="secondaryColor">Accent color (complementary - NOT WHITE)</Label>
            <input
              id="secondaryColor"
              name="secondaryColor"
              type="color"
              value={secondaryColor || '#000000'}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="logo">Logo (optional)</Label>
          <FileInput onChange={handleLogoChange} className="mt-1" />
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
            onClick={() => navigate("/organizations")}
          >
            Cancel
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}
