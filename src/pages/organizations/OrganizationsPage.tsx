import { useNavigate } from "react-router-dom";
import useOrganization from "@hooks/organization/useOrganization";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { resolveImageSrc } from "../../utils/resolveImageSrc";

export default function OrganizationsPage() {
  const { useOrganizationList } = useOrganization();
  const navigate = useNavigate();

  const { data: dataOrganizations, isLoading } = useOrganizationList();
 
  if (isLoading) return <div className="p-6">Loading organizations...</div>;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Organizations</h1>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => navigate("/organizations/create")}
        >
          Create Organization
        </button>
      </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Name</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Logo</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {dataOrganizations?.map((org) => (
              <TableRow key={org.id}>
                <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">
                  <div className="flex items-center gap-2">
                    <span>{org.name}</span>
               
                  </div>
                </TableCell>
                <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">
                  {org.logo ? (
                    <img src={resolveImageSrc(org.logo)} alt={org.name ?? ""} className="h-8" />
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">
                  <div className="flex gap-2">
                    <button className="px-2 py-1 bg-gray-200 text-gray-800 rounded" onClick={() => navigate(`/organizations/${org.id}`)}>View</button>
                    <button className="px-2 py-1 bg-blue-500 text-white rounded" onClick={() => navigate(`/organizations/edit/${org.id}`)}>Edit</button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
