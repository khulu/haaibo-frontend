export default function SidebarWidget() {
  return (
    <div
      className={`
        mx-auto mb-10 w-full max-w-60 rounded-2xl bg-gray-50 px-4 py-5 text-center dark:bg-white/[0.03]`}
    >
      <a
        href="https://haiboo.com"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full h-full"
      >
        <img
          src="/images/logo/powered-by-haibo-white.png"
          alt="Powered by Haaibo Logo"
          className="w-full h-full object-cover rounded-2xl"
        />
      </a>
    </div>
  );
}
