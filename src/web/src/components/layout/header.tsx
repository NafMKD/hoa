import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { DynamicBreadcrumb } from '../dynamic-breadcrumb'

type HeaderProps = React.HTMLAttributes<HTMLElement> & {
  ref?: React.Ref<HTMLElement>
}

export function Header({ className, children, ...props }: HeaderProps) {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      setOffset(document.body.scrollTop || document.documentElement.scrollTop)
    }

    // Add scroll listener to the body
    document.addEventListener('scroll', onScroll, { passive: true })

    // Clean up the event listener on unmount
    return () => document.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'z-50 h-16 header-fixed peer/header sticky top-0 w-[inherit]',
        offset > 10 && 'shadow  rounded-none',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'relative flex h-full items-center gap-3 p-4 sm:gap-4',
          "bg-linear-to-r from-primary via-blue-400 to-purple-500 dark:from-yellow-700 dark:via-blue-700 dark:to-purple-800",
          "rounded-t-xl",
          offset > 10 && 'after:bg-background/20 after:absolute after:inset-0 after:-z-10 after:backdrop-blur-lg rounded-none',
        )}
      >
        <SidebarTrigger variant='outline' className='max-md:scale-125' />
        <Separator orientation='vertical' className='h-6' />
        <DynamicBreadcrumb />
        {children}
      </div>
    </header>
  )
}
