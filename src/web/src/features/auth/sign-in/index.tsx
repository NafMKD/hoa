import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card'
  import AuthLayout from '../auth-layout'
  import { UserAuthForm } from './components/user-auth-form'
import { useAuthStore } from '@/stores/auth-store';
import { useEffect } from 'react';
import { router } from '@/QueryClient';
  
  export default function SignIn() {
 const { user, initAuth } = useAuthStore();
    useEffect(() => {
      if (!user) {
        initAuth(); 
      } else {
        router.navigate({ to: `/${user.role}` });
      }
    }, []);

    return (
      <AuthLayout>
        <Card className='gap-4'>
          <CardHeader className="flex flex-col items-center text-center">
            <CardTitle className='text-lg tracking-tight'>Sign In</CardTitle>
            <CardDescription>
                Sign In in to start your session.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserAuthForm />
          </CardContent>
          <CardFooter>
            <p className='text-muted-foreground px-8 text-center text-sm'>
              By clicking Sign In, you agree to our{' '}
              <a
                href='/terms'
                className='hover:text-primary underline underline-offset-4'
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a
                href='/privacy'
                className='hover:text-primary underline underline-offset-4'
              >
                Privacy Policy
              </a>
              .
            </p>
          </CardFooter>
        </Card>
      </AuthLayout>
    )
  }
  