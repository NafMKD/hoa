import { QueryClient, QueryCache } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner"; // or your toast library
import { useAuthStore } from "@/stores/auth-store";
import { routeTree } from './routeTree.gen'
import { createRouter } from '@tanstack/react-router'


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        if (import.meta.env.DEV) console.log({ failureCount, error });

        // Retry rules
        if (failureCount >= 0 && import.meta.env.DEV) return false; // dev: no retry
        if (failureCount > 3 && import.meta.env.PROD) return false; // prod: max 3 retries

        // Do not retry for auth errors
        if (error instanceof AxiosError) {
          const status = error.response?.status ?? 0;
          if ([401, 403].includes(status)) return false;
        }

        return true;
      },
      refetchOnWindowFocus: import.meta.env.PROD,
      staleTime: 10_000, // 10s
    },
    mutations: {
      onError: (error: unknown) => {
        handleServerError(error);

        if (error instanceof AxiosError) {
          const status = error.response?.status ?? 0;
          if (status === 304) toast.error("Content not modified!");
          if (status === 500) {
            toast.error("Internal Server Error!");
            router.navigate({ to: "/500" });
          }
        }
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error: unknown) => {
      if (!(error instanceof AxiosError)) return;

      const status = error.response?.status ?? 0;
      const authStore = useAuthStore.getState();

      switch (status) {
        case 401: // Unauthorized
          toast.error("Session expired! Please login again.");
          authStore.logout();
          const redirect = window.location.href;
          router.navigate({ to: "/sign-in", search: { redirect } });
          break;
        case 403: // Forbidden
          router.navigate({ to: "/403" });
          break;
        case 500: // Internal Server Error
          toast.error("Internal Server Error!");
          router.navigate({ to: "/500" });
          break;
      }
    },
  }),
});

// Create a new router instance
export const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })
  
  // Register the router instance for type safety
  declare module '@tanstack/react-router' {
    interface Register {
      router: typeof router
    }
  }

// Optional centralized server error handler
function handleServerError(error: unknown) {
  if (error instanceof AxiosError) {
    const msg = error.response?.data?.message || error.message;
    if (msg && import.meta.env.DEV) console.error("Server Error:", msg);
  } else if (import.meta.env.DEV) {
    console.error("Unexpected Error:", error);
  }
}

export default queryClient;
