export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-500 text-xs font-bold text-white">
            W
          </div>
          <span className="text-sm font-semibold text-gray-800">
            Dim Sum Montijo
          </span>
        </div>

        <div className="flex gap-6 text-xs text-gray-400">
          <a href="#" className="hover:text-gray-600 transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-gray-600 transition-colors">
            Terms of Service
          </a>
          <a href="#" className="hover:text-gray-600 transition-colors">
            Support
          </a>
        </div>

        <p className="text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Dim Sum Montijo. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
