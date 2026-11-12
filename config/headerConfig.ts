interface HeaderConfig {
    id: number;
    header_title: string;
    link?: string;
}
export const HEADER_CONFIG:HeaderConfig[] = [
    {
        id: 1,
        header_title: "Dashboard",
        link: "/dashboard"
    },
    {
        id: 2,
        header_title: "Short Links",
        link: "/dashboard/links"
    },
    {
        id: 3,
        header_title: "QR Codes",
        link: "/dashboard/qr-codes"
    },
    {
        id: 3,
        header_title: "Bio Pages",
        link: "/dashboard/bio-pages"
    },
    {
        id: 123,
        header_title: "FAQ's",
        link: "/faqs"
    },
    {
        id: 23,
        header_title: "Pricing",
        link: "/pricing"
    },
    {
        id: 422,
        header_title: "Analytics",
        link: "/dashboard/analytics"
    },
]
