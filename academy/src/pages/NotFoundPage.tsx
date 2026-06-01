import { Link } from '@tanstack/react-router'

export function NotFoundPage() {
  return (
    <div className="max-w-2xl py-12 text-center">
      <div className="text-6xl font-bold text-brand-500">404</div>
      <h1 className="mt-4 text-2xl font-bold">Không tìm thấy trang</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Nội dung bạn tìm có thể đã đổi đường dẫn hoặc chưa được viết.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium"
      >
        Về trang chủ
      </Link>
    </div>
  )
}
