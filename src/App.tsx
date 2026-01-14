import OrganizationsPage from "./pages/organizations/OrganizationsPage";
import OrganizationDetails from "./pages/organizations/OrganizationDetails";
import OrganizationCreate from "./pages/organizations/OrganizationCreate";
import OrganizationEdit from "./pages/organizations/OrganizationEdit";
import UserCreate from "./pages/users/UserCreate";
import UserBulkUpload from "./pages/users/UserBulkUpload";
import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import PrivateRoute from "./components/auth/PrivateRoute";
import NotFound from "./pages/OtherPage/NotFound";

import UsersPage from "./pages/users/UsersPage";
import UserDetails from "./pages/users/UserDetails";
import UserEdit from "./pages/users/UserEdit";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import AssetsPage from "./pages/assets/AssetsPage";
import AssetCreate from "./pages/assets/AssetCreate";
import AssetDetails from "./pages/assets/AssetDetails";
import AssetEdit from "./pages/assets/AssetEdit";
import AssetBulkUpload from "./pages/assets/AssetBulkUpload";
import EventsPage from "./pages/events/EventsPage";
import CollectionsPage from "./pages/collections/CollectionsPage";
import CollectionsCreate from "./pages/collections/CollectionsCreate";
import CollectionsEdit from "./pages/collections/CollectionsEdit";
import CollectionDetails from "./pages/collections/CollectionDetails";
import AssetBookingsCreate from "./pages/bookings/AssetBookingsCreate";
import BookingsPage from "./pages/bookings/BookingsPage";
import LocationsPage from "./pages/locations/LocationsPage";
import IssuesPage from "./pages/issues/IssuesPage";
import IssueDetails from "./pages/issues/IssueDetails";
import IssueCreate from "./pages/issues/IssueCreate";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>
            <Route
              index
              path="/"
              element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              }
            />

            <Route
              path="/users"
              element={
                <PrivateRoute>
                  <UsersPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/users/:id"
              element={
                <PrivateRoute>
                  <UserDetails />
                </PrivateRoute>
              }
            />
            <Route
              path="/users/edit/:id"
              element={
                <PrivateRoute>
                  <UserEdit />
                </PrivateRoute>
              }
            />
                        <Route
              path="/users/create"
              element={
                <PrivateRoute>
                  <UserCreate />
                </PrivateRoute>
              }
            />
            <Route
              path="/users/create-bulk"
              element={
                <PrivateRoute>
                  <UserBulkUpload />
                </PrivateRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <PrivateRoute>
                  <Calendar />
                </PrivateRoute>
              }
            />
            <Route
              path="/blank"
              element={
                <PrivateRoute>
                  <Blank />
                </PrivateRoute>
              }
            />
            <Route
              path="/form-elements"
              element={
                <PrivateRoute>
                  <FormElements />
                </PrivateRoute>
              }
            />
            <Route
              path="/basic-tables"
              element={
                <PrivateRoute>
                  <BasicTables />
                </PrivateRoute>
              }
            />
            <Route
              path="/alerts"
              element={
                <PrivateRoute>
                  <Alerts />
                </PrivateRoute>
              }
            />
            <Route
              path="/avatars"
              element={
                <PrivateRoute>
                  <Avatars />
                </PrivateRoute>
              }
            />
            <Route
              path="/badge"
              element={
                <PrivateRoute>
                  <Badges />
                </PrivateRoute>
              }
            />
            <Route
              path="/buttons"
              element={
                <PrivateRoute>
                  <Buttons />
                </PrivateRoute>
              }
            />
            <Route
              path="/images"
              element={
                <PrivateRoute>
                  <Images />
                </PrivateRoute>
              }
            />
            <Route
              path="/videos"
              element={
                <PrivateRoute>
                  <Videos />
                </PrivateRoute>
              }
            />
            <Route
              path="/line-chart"
              element={
                <PrivateRoute>
                  <LineChart />
                </PrivateRoute>
              }
            />
            <Route
              path="/bar-chart"
              element={
                <PrivateRoute>
                  <BarChart />
                </PrivateRoute>
              }
            />
            <Route
              path="/organizations"
              element={
                <PrivateRoute>
                  <OrganizationsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/organizations/create"
              element={
                <PrivateRoute>
                  <OrganizationCreate />
                </PrivateRoute>
              }
            />
            <Route
              path="/organizations/:id"
              element={
                <PrivateRoute>
                  <OrganizationDetails />
                </PrivateRoute>
              }
            />
            <Route
              path="/organizations/edit/:id"
              element={
                <PrivateRoute>
                  <OrganizationEdit />
                </PrivateRoute>
              }
            />
            <Route
              path="/assets"
              element={
                <PrivateRoute>
                  <AssetsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/assets/issues"
              element={
                <PrivateRoute>
                  <IssuesPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/assets/issues/:id"
              element={
                <PrivateRoute>
                  <IssueDetails />
                </PrivateRoute>
              }
            />
            <Route
              path="/assets/:assetId/issues/new"
              element={
                <PrivateRoute>
                  <IssueCreate />
                </PrivateRoute>
              }
            />
            <Route
              path="/assets/create"
              element={
                <PrivateRoute>
                  <AssetCreate />
                </PrivateRoute>
              }
            />
            <Route
              path="/assets/create-bulk"
              element={
                <PrivateRoute>
                  <AssetBulkUpload />
                </PrivateRoute>
              }
            />
            <Route
              path="/assets/:id"
              element={
                <PrivateRoute>
                  <AssetDetails />
                </PrivateRoute>
              }
            />
            <Route
              path="/assets/edit/:id"
              element={
                <PrivateRoute>
                  <AssetEdit />
                </PrivateRoute>
              }
            />
            <Route
              path="/events"
              element={
                <PrivateRoute>
                  <EventsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/locations"
              element={
                <PrivateRoute>
                  <LocationsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/collections"
              element={
                <PrivateRoute>
                  <CollectionsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/collections/create"
              element={
                <PrivateRoute>
                  <CollectionsCreate />
                </PrivateRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <PrivateRoute>
                  <BookingsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/assets/bookings"
              element={
                <PrivateRoute>
                  <AssetBookingsCreate />
                </PrivateRoute>
              }
            />
            <Route
              path="/collections/:id"
              element={
                <PrivateRoute>
                  <CollectionDetails />
                </PrivateRoute>
              }
            />
            <Route
              path="/collections/edit/:id"
              element={
                <PrivateRoute>
                  <CollectionsEdit />
                </PrivateRoute>
              }
            />
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
