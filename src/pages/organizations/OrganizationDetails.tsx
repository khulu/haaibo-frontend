import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useOrganizationsApi, { Organization } from "../../hooks/api/useOrganizationApi";
import Badge from "../../components/ui/badge/Badge";
import Label from "../../components/form/Label";

export default function OrganizationDetails() {
  const { id } = useParams<{ id: string }>();
  const { getOrganizationById } = useOrganizationsApi();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await getOrganizationById(id);
        setOrg(data);
      } catch (err: unknown) {
        if (err && typeof err === "object" && "message" in err) {
          setError((err as { message?: string }).message || "Failed to fetch organization");
        } else {
          setError("Failed to fetch organization");
        }
      } finally {
        setLoading(false);
      }
    })();
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);



  if (loading) return <div className="p-6">Loading organization...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!org) return <div className="p-6">Organization not found.</div>;

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 overflow-hidden rounded-full bg-gray-100 flex items-center justify-center">
            {org.logo ? (
              <img
                width={64}
                height={64}
                src={org.logo}
                alt={org.name}
              />
            ) : (
              <span className="text-gray-400 text-2xl font-bold">
                {org.name?.[0] || "?"}
              </span>
            )}
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {org.name}
            </h4>
            <Badge size="sm" color="info">Organization</Badge>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={() => navigate(`/organizations/edit/${org.id}`)}
          >
            Edit
          </button>
    
          <button
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded"
            onClick={() => navigate("/organizations")}
          >
            Back
          </button>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
          Organization Information
        </h4>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
          <div>
            <Label>Primary Color</Label>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {org.primaryColor || "-"}
            </p>
          </div>
          <div>
            <Label>Secondary Color</Label>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {org.secondaryColor || "-"}
            </p>
          </div>
          <div>
            <Label>Admin User</Label>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {org.adminUserName || org.adminUserId || "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
