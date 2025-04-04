import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { NavigationProvider } from '@/contexts/NavigationContext';

function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <NavigationProvider>
          <RouterProvider router={router} />
          <Toaster />
        </NavigationProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
