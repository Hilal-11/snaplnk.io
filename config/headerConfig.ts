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
        id: 123,
        header_title: "FAQ's",
        link: "/faq"
    },
    {
        id: 23,
        header_title: "Pricing",
        link: "/pricing"
    },
    {
        id: 11,
        header_title: "API's",
        link: "/docs"
    },
    {
        id: 422,
        header_title: "Blogs",
        link: "/blogs"
    },
]
