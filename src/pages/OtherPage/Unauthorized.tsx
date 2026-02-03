import React from "react";
import Button from "../../components/ui/button/Button";
import { useNavigate } from "react-router-dom";

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="p-6 max-w-2xl mx-auto text-center">
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90 mb-2">Unauthorized</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        You don’t have permission to access this page. If you believe this is an error, please contact your administrator.
      </p>
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
        <Button onClick={() => navigate("/")}>Go to Dashboard</Button>
      </div>
    </div>
  );
};

export default Unauthorized;
