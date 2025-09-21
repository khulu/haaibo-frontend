import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
// import Badge from "../ui/badge/Badge";
import { useNavigate } from "react-router-dom";
import useAsset from "@hooks/asset/useAsset";
import type { Asset } from "@hooks/api/useAssetApi";

export default function RecentOrders() {
  const { useAssetList } = useAsset();
  const navigate = useNavigate();
  const { data: dataAssets, isLoading } = useAssetList({});

  // Sort by createdAt descending and take 5 most recent
  const recentAssets = (dataAssets || [])
    .slice()
    .sort(
      (a: Asset, b: Asset) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Recent Asset Status Updates
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
            onClick={() => navigate("/assets")}
          >
            See all
          </button>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Products</TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Category</TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Price</TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading ? (
              <TableRow>
                <TableCell>Loading...</TableCell>
              </TableRow>
            ) : recentAssets.length === 0 ? (
              <TableRow>
                <TableCell>No recent assets found.</TableCell>
              </TableRow>
            ) : (
              recentAssets.map((asset: Asset) => (
                <TableRow key={asset.id}>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-[40px] w-[40px] overflow-hidden rounded-full bg-gray-100 flex items-center justify-center">
                        {asset.imageUrls && asset.imageUrls.length > 0 ? (
                          <img
                            src={asset.imageUrls[0]}
                            className="h-[40px] w-[40px]"
                            alt={asset.make || "Device"}
                          />
                        ) : (
                          <span className="text-gray-400 text-lg font-bold">
                            {asset.make?.[0] || "?"}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {asset.make} {asset.model}
                        </p>
                        <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                          {asset.serialNumber}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {asset.condition || asset.statusName || "-"}
                  </TableCell>
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {/* No price field, so show dash */}
                    -
                  </TableCell>
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${asset.statusName === 'Available' ? 'bg-green-100 text-green-800' : asset.statusName === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                      {asset.statusName || asset.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
