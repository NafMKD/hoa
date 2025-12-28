interface Props {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: Props) {
  return (
    <div className="bg-muted/30 min-h-screen flex flex-col items-center justify-center p-4">
      {children}
    </div>
  );
}
