export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (process.env.NODE_ENV !== "development") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-text-muted">Not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {children}
    </div>
  );
}
