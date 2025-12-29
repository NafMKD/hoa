
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    BreadcrumbEllipsis
} from "@/components/ui/breadcrumb"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Link } from "@tanstack/react-router"
import { Fragment } from "react/jsx-runtime"

// Custom labels for specific paths
const PATH_LABELS: Record<string, string> = {
    'admin': 'Dashboard',
    'buildings': 'Buildings',
    'units': 'Units',
    'users': 'Users',
    'financials': 'Financials',
    'templates': 'Templates',
    'fees': 'Fees',
    'invoices': 'Invoices',
    'payments': 'Payments',
    'leases': 'Leases',
}

// Paths that are container routes (have sub-pages but no standalone page)
const CONTAINER_ROUTES = ['financials']

// Check if a path segment looks like a dynamic ID (UUID, numeric ID, etc.)
const isDynamicId = (path: string): boolean => {
    // UUID pattern
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    // Numeric ID pattern
    const numericPattern = /^\d+$/
    // Short alphanumeric ID pattern (like nanoid)
    const shortIdPattern = /^[a-zA-Z0-9_-]{6,}$/

    return uuidPattern.test(path) || numericPattern.test(path) || shortIdPattern.test(path)
}

// Get the entity type label for a dynamic ID based on previous path segment
const getEntityLabel = (prevPath: string | undefined, id: string): string => {
    const entityLabels: Record<string, string> = {
        'buildings': 'Building',
        'units': 'Unit',
        'users': 'User',
        'templates': 'Template',
        'fees': 'Fee',
        'invoices': 'Invoice',
        'payments': 'Payment',
        'leases': 'Lease',
    }

    if (prevPath && entityLabels[prevPath]) {
        // Truncate long IDs
        const truncatedId = id.length > 8 ? `${id.slice(0, 4)}...${id.slice(-4)}` : id
        return `${entityLabels[prevPath]} #${truncatedId}`
    }

    // Fallback: truncate the ID
    return id.length > 12 ? `${id.slice(0, 6)}...${id.slice(-4)}` : id
}

const formatBreadcrumb = (path: string, prevPath?: string) => {
    // Check for custom label first
    if (PATH_LABELS[path]) {
        return PATH_LABELS[path]
    }

    // Check if it's a dynamic ID
    if (isDynamicId(path)) {
        return getEntityLabel(prevPath, path)
    }

    // Replace hyphens and underscores with spaces, then capitalize
    const formatted = path.replace(/[-_]/g, ' ')
    const capitalized = formatted.charAt(0).toUpperCase() + formatted.slice(1)

    // Truncate if too long
    return capitalized.length > 20
        ? `${capitalized.slice(0, 8)}...${capitalized.slice(-8)}`
        : capitalized
}

// List of supported locales to filter out
const LOCALES = ['en', 'nl']

// Layout route segments to filter out from breadcrumbs
const LAYOUT_SEGMENTS = ['admin']

export function DynamicBreadcrumb() {
    const pathname = window.location.pathname

    // Filter out empty strings, locales, and layout segments
    const allPaths = pathname.split('/').filter((path) => path !== "" && !LOCALES.includes(path))

    // Remove 'admin' from display but keep it for href building
    const paths = allPaths.filter((path) => !LAYOUT_SEGMENTS.includes(path))

    // Check if we're on a container route sub-page (has sub-pages but no main page)
    const isContainerSubPage = (path: string, index: number) => {
        return CONTAINER_ROUTES.includes(path) && index < paths.length - 1
    }

    // Helper to check if a path should be non-clickable
    const shouldBeNonClickable = (path: string, index: number) => {
        return isContainerSubPage(path, index)
    }

    // Helper to build href for a path (includes 'admin' prefix)
    const buildHref = (index: number) => {
        // Reconstruct href with 'admin' prefix since we filtered it from display
        return `/admin/${paths.slice(0, index + 1).join('/')}`
    }

    // Get previous path for entity label context
    const getPrevPath = (index: number) => {
        return index > 0 ? paths[index - 1] : undefined
    }

    return (
        <Breadcrumb className="flex-1 min-w-0">
            <BreadcrumbList className="flex-nowrap overflow-x-auto overflow-y-hidden scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <BreadcrumbItem className="shrink-0">
                    <BreadcrumbLink asChild>
                        <Link to={"/admin"} className="whitespace-nowrap">Home</Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>

                {paths.length === 0 ? null : paths.length <= 2 ? (
                    // Show all items when there are 2 or fewer paths
                    paths.map((path, index) => {
                        const isLast = index === paths.length - 1
                        const href = buildHref(index)
                        const isNonClickable = shouldBeNonClickable(path, index)
                        const prevPath = getPrevPath(index)

                        return (
                            <Fragment key={index}>
                                <BreadcrumbSeparator className="shrink-0" />
                                <BreadcrumbItem className="shrink-0 min-w-0">
                                    {isLast || isNonClickable ? (
                                        <BreadcrumbPage className="whitespace-nowrap truncate">
                                            {formatBreadcrumb(path, prevPath)}
                                        </BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink asChild>
                                            <Link to={href} className="whitespace-nowrap truncate">{formatBreadcrumb(path, prevPath)}</Link>
                                        </BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                            </Fragment>
                        )
                    })
                ) : (
                    // For 3+ items, use progressive disclosure
                    <>
                        {/* First item - shown on tablet+ (sm) */}
                        <BreadcrumbSeparator className="shrink-0 hidden sm:block" />
                        <BreadcrumbItem className="shrink-0 hidden sm:flex min-w-0">
                            {shouldBeNonClickable(paths[0], 0) ? (
                                <BreadcrumbPage className="whitespace-nowrap truncate">
                                    {formatBreadcrumb(paths[0], undefined)}
                                </BreadcrumbPage>
                            ) : (
                                <BreadcrumbLink asChild>
                                    <Link to={buildHref(0)} className="whitespace-nowrap truncate">
                                        {formatBreadcrumb(paths[0], undefined)}
                                    </Link>
                                </BreadcrumbLink>
                            )}
                        </BreadcrumbItem>

                        {/* Second item - shown on desktop (md), only if there are 4+ items */}
                        {paths.length >= 4 && (
                            <>
                                <BreadcrumbSeparator className="shrink-0 hidden md:block" />
                                <BreadcrumbItem className="shrink-0 hidden md:flex min-w-0">
                                    {shouldBeNonClickable(paths[1], 1) ? (
                                        <BreadcrumbPage className="whitespace-nowrap truncate">
                                            {formatBreadcrumb(paths[1], paths[0])}
                                        </BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink asChild>
                                            <Link to={buildHref(1)} className="whitespace-nowrap truncate">
                                                {formatBreadcrumb(paths[1], paths[0])}
                                            </Link>
                                        </BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                            </>
                        )}

                        {/* Third item - shown on large screens (lg), only if there are 5+ items */}
                        {paths.length >= 5 && (
                            <>
                                <BreadcrumbSeparator className="shrink-0 hidden lg:block" />
                                <BreadcrumbItem className="shrink-0 hidden lg:flex min-w-0">
                                    {shouldBeNonClickable(paths[2], 2) ? (
                                        <BreadcrumbPage className="whitespace-nowrap truncate">
                                            {formatBreadcrumb(paths[2], paths[1])}
                                        </BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink asChild>
                                            <Link to={buildHref(2)} className="whitespace-nowrap truncate">
                                                {formatBreadcrumb(paths[2], paths[1])}
                                            </Link>
                                        </BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                            </>
                        )}

                        {/* Ellipsis with dropdown for hidden items */}
                        {/* Show ellipsis when there are middle items to hide (3+ total paths) */}
                        {paths.length >= 3 && (
                            <>
                                <BreadcrumbSeparator className="shrink-0" />
                                <BreadcrumbItem className="shrink-0">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger className="flex items-center focus:outline-none">
                                            <BreadcrumbEllipsis />
                                            <span className="sr-only">More breadcrumbs</span>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start">
                                            {/* Show all middle items in dropdown (items between first visible and last) */}
                                            {paths.slice(1, -1).map((path, relativeIndex) => {
                                                const actualIndex = relativeIndex + 1
                                                const href = buildHref(actualIndex)
                                                const isNonClickable = shouldBeNonClickable(path, actualIndex)
                                                const prevPath = paths[actualIndex - 1]

                                                return (
                                                    <DropdownMenuItem key={actualIndex} asChild disabled={isNonClickable}>
                                                        {isNonClickable ? (
                                                            <span className="cursor-default">{formatBreadcrumb(path, prevPath)}</span>
                                                        ) : (
                                                            <Link to={href}>{formatBreadcrumb(path, prevPath)}</Link>
                                                        )}
                                                    </DropdownMenuItem>
                                                )
                                            })}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </BreadcrumbItem>
                            </>
                        )}

                        {/* Last item - always shown */}
                        <BreadcrumbSeparator className="shrink-0" />
                        <BreadcrumbItem className="shrink-0 min-w-0">
                            <BreadcrumbPage className="whitespace-nowrap truncate">
                                {formatBreadcrumb(paths[paths.length - 1], paths[paths.length - 2])}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </>
                )}
            </BreadcrumbList>
        </Breadcrumb>
    )
}

