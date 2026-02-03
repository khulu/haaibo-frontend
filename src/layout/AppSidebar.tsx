import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

// Assume these icons are imported from an icon library
import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  UserCircleIcon,
  GroupIcon,
  FolderIcon,
  AlertHexaIcon,
  PlugInIcon,
  // TimeIcon,
  PieChartIcon,
  DocsIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import SidebarWidget from "./SidebarWidget";
import getAuth from "../hooks/api/useAuthApi";
import useOrganizationsApi from "../hooks/api/useOrganizationApi";
import { resolveImageSrc } from "../utils/resolveImageSrc";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/",
    // subItems: [{ name: "Ecommerce", path: "/", pro: false }],
  },

  {
    icon: <UserCircleIcon />,
    name: "People",
    subItems: [
      { name: "Users", path: "/users" },
      { name: "Contacts", path: "/admin/contacts" },
    ],
  },
      {
    icon: <GroupIcon />,
    name: "Organizations",
    path: "/organizations",
  },
  {
    icon: <FolderIcon />,
    name: "Collections",
    path: "/collections",
  },
  {
    icon: <CalenderIcon />,
    name: "Bookings",
    path: "/bookings",
  },
  {
    icon: <BoxCubeIcon />,
    name: "Locations",
    path: "/locations",
  },
  {
    icon: <AlertHexaIcon />,
    name: "Issues",
    path: "/assets/issues",
  },
    {
    icon: <CalenderIcon />,
    name: "Events",
    path: "/events",
  },
  {
    icon: <PlugInIcon />,
    name: "Devices",
    path: "/assets",
  },
  // {
  //   icon: <TimeIcon />,
  //   name: "Reminders",
  //   path: "/assets/reminders",
  // },
  {
    icon: <PieChartIcon />,
    name: "Reports",
    path: "/assets/reports",
  },

  // {
  //   icon: <CalenderIcon />,
  //   name: "Calendar",
  //   path: "/calendar",
  // },
  // {
  //   icon: <UserCircleIcon />,
  //   name: "User Profile",
  //   path: "/profile",
  // },
  // {
  //   name: "Forms",
  //   icon: <ListIcon />,
  //   subItems: [{ name: "Form Elements", path: "/form-elements", pro: false }],
  // },
  // {
  //   name: "Tables",
  //   icon: <TableIcon />,
  //   subItems: [{ name: "Basic Tables", path: "/basic-tables", pro: false }],
  // },
  // {
  //   name: "Pages",
  //   icon: <PageIcon />,
  //   subItems: [
  //     { name: "Blank Page", path: "/blank", pro: false },
  //     { name: "404 Error", path: "/error-404", pro: false },
  //   ],
  // },
];

// const othersItems: NavItem[] = [
//   {
//     icon: <PieChartIcon />,
//     name: "Charts",
//     subItems: [
//       { name: "Line Chart", path: "/line-chart", pro: false },
//       { name: "Bar Chart", path: "/bar-chart", pro: false },
//     ],
//   },
//   {
//     icon: <BoxCubeIcon />,
//     name: "UI Elements",
//     subItems: [
//       { name: "Alerts", path: "/alerts", pro: false },
//       { name: "Avatar", path: "/avatars", pro: false },
//       { name: "Badge", path: "/badge", pro: false },
//       { name: "Buttons", path: "/buttons", pro: false },
//       { name: "Images", path: "/images", pro: false },
//       { name: "Videos", path: "/videos", pro: false },
//     ],
//   },
//   {
//     icon: <PlugInIcon />,
//     name: "Authentication",
//     subItems: [
//       { name: "Sign In", path: "/signin", pro: false },
//       { name: "Sign Up", path: "/signup", pro: false },
//     ],
//   },
// ];
const othersItems: NavItem[] = [];
interface AppSidebarProps {
  role?: number | string | null;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ role }) => {


  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const auth = getAuth();
  const companyId = auth.getCompanyId();
  const { getOrganizationById, getMyCompany } = useOrganizationsApi();
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [companyDetails, setCompanyDetails] = useState<{
    enableOfficeReservations?: boolean | null;
    reservationMenuLabel?: string | null;
    reportingReservationsMenuLabel?: string | null;
    allowAssetTracking?: boolean | null;
    enableEmployeeDashboardMenu?: boolean | null;
    employeeDashboardName?: string | null;
  } | null>(null);

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    const isCompanyAdmin = role === 1 || role === "Admin";
    const isEmployee = role === 2 || role === "Employee";

    (async () => {
      try {
        if (isCompanyAdmin && companyId) {
          const org = await getOrganizationById(companyId as string);
          if (org?.logo) setCompanyLogoUrl(org.logo);
          setCompanyDetails({
            enableOfficeReservations: org.enableOfficeReservations ?? null,
            reservationMenuLabel: org.reservationMenuLabel ?? null,
            reportingReservationsMenuLabel: org.reportingReservationsMenuLabel ?? null,
            allowAssetTracking: org.allowAssetTracking ?? null,
            enableEmployeeDashboardMenu: org.enableEmployeeDashboardMenu ?? null,
            employeeDashboardName: org.employeeDashboardName ?? null,
          });
          return;
        }
        if (isEmployee) {
          const org = await getMyCompany();
          if (org) {
            if (org.logo) setCompanyLogoUrl(org.logo);
            setCompanyDetails({
              enableOfficeReservations: org.enableOfficeReservations ?? null,
              reservationMenuLabel: org.reservationMenuLabel ?? null,
              reportingReservationsMenuLabel: org.reportingReservationsMenuLabel ?? null,
              allowAssetTracking: org.allowAssetTracking ?? null,
              enableEmployeeDashboardMenu: org.enableEmployeeDashboardMenu ?? null,
              employeeDashboardName: org.employeeDashboardName ?? null,
            });
          } else {
            // 404: Employee has no linked company — clear details
            setCompanyLogoUrl(null);
            setCompanyDetails(null);
          }
          return;
        }
        // SuperAdmin or other roles without a specific company: clear details
        setCompanyLogoUrl(null);
        setCompanyDetails(null);
      } catch {
        // silently ignore; fall back to defaults
        setCompanyLogoUrl(null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, companyId]);

  const defaultLightLogo = "/images/haiibo-logo.jpeg";
  const defaultDarkLogo = "/images/haiibo-logo.jpeg";
  const defaultCollapsedLogo = "/images/haaibo-logo.jpeg";

  const lightLogoSrc = resolveImageSrc(companyLogoUrl || undefined) || defaultLightLogo;
  const darkLogoSrc = resolveImageSrc(companyLogoUrl || undefined) || defaultDarkLogo;
  const collapsedLogoSrc = resolveImageSrc(companyLogoUrl || undefined) || defaultCollapsedLogo;

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
              aria-expanded={
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? true
                  : false
              }
              aria-controls={`submenu-${menuType}-${index}`}
              title={nav.name}
            >
              <span
                className={`menu-item-icon-size  ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
              id={`submenu-${menuType}-${index}`}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                      aria-label={subItem.name}
                      title={subItem.name}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  // Example: Only show 'Organizations' for admin roles (role === 1 or 'SuperAdmin')
  // Build dynamic nav items including optional Reservations and Employee Dashboard menus
  const dynamicNavItems: NavItem[] = (() => {
    const items = [...navItems];
    if (companyDetails?.enableOfficeReservations) {
      items.push({
        icon: <CalenderIcon />,
        name: companyDetails.reservationMenuLabel || "Reservations",
        path: "/reservations",
      });
    }
    // Show Reporting Reservations menu item if label is not empty
    if (companyDetails?.reportingReservationsMenuLabel?.trim() && companyDetails?.enableOfficeReservations) {
      items.push({
        icon: <DocsIcon />,
        name: companyDetails.reportingReservationsMenuLabel,
        path: "/reservation-reports",
      });
    }
    // Show Employee Dashboard menu item if enabled and user role is 'Employee'
    if (companyDetails?.enableEmployeeDashboardMenu && (role === 'Employee' || role === 2)) {
      items.push({
        icon: <GridIcon />,
        name: companyDetails.employeeDashboardName || "Employee Dashboard",
        path: "/employee-dashboard",
      });
    }
    return items;
  })();

  const isEmployee = role === 'Employee' || role === 2;

  let filteredNavItems = dynamicNavItems.filter(item => {
    if (item.name === "Organizations") {
      return role === 0 || role === "SuperAdmin";
    }
    if (item.name === "Admin") {
      return role === 0 || role === "SuperAdmin" || role === 1 || role === "Admin";
    }
    
    // Hide asset tracking related items if allowAssetTracking is false (except for SuperAdmin)
    const isSuperAdmin = role === 0 || role === "SuperAdmin";
    if (!isSuperAdmin && companyDetails?.allowAssetTracking === false) {
      const assetTrackingItems = [
        "Collections",
        "Bookings",
        // Keep `Locations` visible to company Admins even when asset tracking is disabled
        // so admins can manage locations independently of asset tracking settings.
        // "Locations",
        "Issues",
        "Events",
        "Devices",
        "Reminders",
        "Reports"
      ];
      if (assetTrackingItems.includes(item.name)) {
        return false;
      }
      // allow Locations for company admins (role === 1 or 'Admin') and super admins
      if (item.name === 'Locations' && (role === 1 || role === 'Admin' || isSuperAdmin)) {
        return true;
      }
      // otherwise, if item is Locations and not allowed above, hide it
      if (item.name === 'Locations') return false;
    }
    
    return true;
  });

  // If user is an employee, restrict the sidebar to only Employee Dashboard and Reservations
  if (isEmployee) {
    const employeeItems: NavItem[] = [];
    // Employee Dashboard (show even if companyDetails flag is false — employees expect this route)
    employeeItems.push({
      icon: <GridIcon />,
      name: companyDetails?.employeeDashboardName || 'Dashboard',
      path: '/employee-dashboard',
    });
    // Reservations (use company label when available) only if enabled
    if (companyDetails?.enableOfficeReservations) {
      employeeItems.push({
        icon: <CalenderIcon />,
        name: companyDetails?.reservationMenuLabel || 'Reservations',
        path: '/reservations',
      });
    }
    // Allow employees to raise issues when asset tracking is enabled
    if (companyDetails?.allowAssetTracking !== false) {
      // Asset bookings menu
      employeeItems.push({
        icon: <CalenderIcon />,
        name: 'Bookings',
        path: '/bookings',
      });
      // Devices menu
      employeeItems.push({
        icon: <PlugInIcon />,
        name: 'Devices',
        path: '/assets',
      });
      employeeItems.push({
        icon: <AlertHexaIcon />,
        name: 'Issues',
        path: '/assets/issues',
      });
    }
    filteredNavItems = employeeItems;
  }

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <div className="flex items-center gap-2">
              <img
                className="dark:hidden"
                src={lightLogoSrc}
                alt="Logo"
                width={40}
                height={40}
                style={{ objectFit: 'contain', borderRadius: 8 }}
              />
              <img
                className="hidden dark:block"
                src={darkLogoSrc}
                alt="Logo"
                width={40}
                height={40}
                style={{ objectFit: 'contain', borderRadius: 8 }}
              />
              <span className="font-bold text-lg text-gray-900 dark:text-white ml-2">Haaibo</span>
            </div>
          ) : (
            <img
              src={collapsedLogoSrc}
              alt="Logo"
              width={32}
              height={32}
              style={{ objectFit: 'contain', borderRadius: 8 }}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(filteredNavItems, "main")}
            </div>
            <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  ""
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          </div>
        </nav>
        {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
      </div>
    </aside>
  );
};

export default AppSidebar;
