export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#060d1f] gradient-mesh">
      {children}
    </div>
  );
}
