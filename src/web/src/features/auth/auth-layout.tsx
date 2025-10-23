import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Props {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: Props) {
  return (
    <div className="bg-primary-foreground container grid h-svh max-w-none items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-2 py-8 sm:w-[480px] sm:p-8">
        <div className="mb-4 flex items-center justify-center">
          <h1 className="text-3xl font-semibold">Noah Garden HOA</h1>
        </div>
        {children}
      </div>
    </div>
  );
}
