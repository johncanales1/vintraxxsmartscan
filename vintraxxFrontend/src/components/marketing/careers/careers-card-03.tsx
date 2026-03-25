import { Badge } from "@/components/base/badges/badges";
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

export const CareersCard03 = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
                    <Badge className="hidden md:flex" size="lg" color="brand" type="pill-color">
                        Careers
                    </Badge>
                    <Badge className="md:hidden" size="md" color="brand" type="pill-color">
                        Careers
                    </Badge>

                    <h2 className="mt-4 text-display-sm font-semibold text-primary md:text-display-md">We're looking for talented people</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">We're a 100% remote team spread all across the world. Join us!</p>
                </div>
                <div className="mt-12 h-60 w-full md:mt-16 md:h-140">
                    <img src="https://www.untitledui.com/marketing/woman-artist-2.webp" alt="Woman artist" className="size-full object-cover" />
                </div>
                <div className="mx-auto mt-12 max-w-3xl md:mt-16">
                    <ul className="flex flex-col gap-8 md:gap-16">
                        {jobsByCategory.map(({ category, jobs }) => (
                            <li key={category}>
                                <h2 className="text-lg font-semibold text-primary md:text-xl">{category}</h2>
                                <ul className="mt-5 flex flex-col gap-4 md:gap-6">
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
            </div>
        </section>
    );
};
