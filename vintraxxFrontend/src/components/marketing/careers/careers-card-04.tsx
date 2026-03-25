"use client";

import { MarkerPin02 } from "@untitledui/icons";
import { Select } from "@/components/base/select/select";
import type { JobCard02Props } from "@/components/marketing/careers/base-components/job-card";
import { JobCard02 } from "@/components/marketing/careers/base-components/job-card";

const jobsByCategory: {
    category: string;
    description: string;
    jobs: JobCard02Props[];
}[] = [
    {
        category: "Design",
        description: "Open positions in our design team.",
        jobs: [
            {
                title: "Product Designer",
                description: "We're looking for a mid-level product designer to join our team.",
                href: "#",
                badgeColor: "blue",
                badgeText: "Design",
                salary: "80k - 100k",
                type: "Full-time",
                location: {
                    city: "Melbourne",
                    country: "Australia",
                    countryCode: "AU",
                },
            },
            {
                title: "UX Designer",
                description: "We're looking for a mid-level UX designer to join our team.",
                href: "#",
                badgeColor: "blue",
                badgeText: "Design",
                salary: "80k - 100k",
                type: "Full-time",
                location: {
                    city: "Melbourne",
                    country: "Australia",
                    countryCode: "AU",
                },
            },
        ],
    },
    {
        category: "Software Development",
        description: "Open positions in our software team.",
        jobs: [
            {
                title: "Engineering Manager",
                description: "We're looking for an experienced engineering manager to join our team.",
                href: "#",
                badgeColor: "pink",
                badgeText: "Software",
                salary: "80k - 100k",
                type: "Full-time",
                location: {
                    city: "Melbourne",
                    country: "Australia",
                    countryCode: "AU",
                },
            },
            {
                title: "Frontend Developer",
                description: "We're looking for an experienced frontend developer to join our team.",
                href: "#",
                badgeColor: "pink",
                badgeText: "Software",
                salary: "80k - 100k",
                type: "Full-time",
                location: {
                    city: "Melbourne",
                    country: "Australia",
                    countryCode: "AU",
                },
            },
            {
                title: "Backend Developer",
                description: "We're looking for an experienced backend developer to join our team.",
                href: "#",
                badgeColor: "pink",
                badgeText: "Software",
                salary: "80k - 100k",
                type: "Full-time",
                location: {
                    city: "Melbourne",
                    country: "Australia",
                    countryCode: "AU",
                },
            },
        ],
    },
    {
        category: "Customer Success",
        description: "Open positions in our CX team.",
        jobs: [
            {
                title: "Customer Success Manager",
                description: "We're looking for a mid-level product designer to join our team.",
                href: "#",
                badgeColor: "success",
                badgeText: "Customer Success",
                salary: "80k - 100k",
                type: "Full-time",
                location: {
                    city: "Melbourne",
                    country: "Australia",
                    countryCode: "AU",
                },
            },
        ],
    },
];

const locations = [
    {
        id: "worldwide",
        label: "Worldwide",
        icon: MarkerPin02,
    },
    {
        id: "europe",
        label: "Europe",
        icon: MarkerPin02,
    },
    {
        id: "north-america",
        label: "North America",
        icon: MarkerPin02,
    },
    {
        id: "asia",
        label: "Asia",
        icon: MarkerPin02,
    },
    {
        id: "oceania",
        label: "Oceania",
        icon: MarkerPin02,
    },
];

export const CareersCard04 = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col justify-between gap-12 lg:flex-row lg:items-start lg:gap-8">
                    <div className="flex w-full max-w-3xl flex-col">
                        <h2 className="text-display-sm font-semibold text-primary md:text-display-md">Start doing work that matters</h2>
                        <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">
                            Our philosophy is simple—hire a team of diverse, passionate people and foster a culture that empowers you to do your best work.
                        </p>
                    </div>

                    <div>
                        <div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-[1fr_240px]">
                            <p className="hidden text-right text-md font-medium whitespace-nowrap text-tertiary md:block">Location:</p>
                            <Select aria-label="Location" size="md" placeholderIcon={MarkerPin02} defaultSelectedKey="Worldwide" items={locations}>
                                {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="mt-8 md:mt-16">
                    <ul className="flex flex-col gap-8 md:gap-16">
                        {jobsByCategory.map(({ category, description, jobs }) => (
                            <li
                                key={category}
                                className="flex flex-col justify-between gap-5 border-secondary md:gap-8 lg:flex-row lg:items-start lg:gap-8 lg:border-t lg:pt-12"
                            >
                                <div>
                                    <h2 className="text-lg font-semibold text-primary lg:text-xl">{category}</h2>
                                    <p className="mt-1 text-md text-tertiary lg:mt-2">{description}</p>
                                </div>
                                <ul className="flex flex-1 flex-col gap-4 md:gap-6 lg:max-w-3xl">
                                    {jobs.map((job) => (
                                        <li key={job.title}>
                                            <JobCard02 {...job} />
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="mt-12 h-60 w-full md:mt-16 md:h-120 lg:h-180">
                    <img src="https://www.untitledui.com/marketing/collaboration.webp" alt="Collaboration" className="size-full object-cover" />
                </div>
            </div>
        </section>
    );
};
