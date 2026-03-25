"use client";

import { ArrowRight, CheckCircle, ChevronLeft, ChevronRight as ChevronRightIcon, CurrencyDollar, Heart, MarkerPin01, SearchLg, Shield01, Sliders04, Truck01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Form } from "@/components/base/form/form";
import { Input } from "@/components/base/input/input";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";
import { Header } from "@/components/marketing/header-navigation/header";
import { SectionDivider } from "@/components/shared-assets/section-divider";
import { cx } from "@/utils/cx";
import Link from "next/link";
import automallLogo from "@/assets/logo/brands/automall.png";
import automallImage from "@/assets/images/automall.png";

const CheckItemText = (props: { size?: "sm" | "md" | "lg"; text?: string; color?: "primary" | "success" }) => {
    const { text, color, size } = props;
    return (
        <li className="flex gap-3">
            <div className={cx(
                "flex shrink-0 items-center justify-center rounded-full",
                color === "success" ? "bg-success-secondary text-featured-icon-light-fg-success" : "bg-brand-primary text-featured-icon-light-fg-brand",
                size === "lg" ? "size-7 md:h-8 md:w-8" : size === "md" ? "size-7" : "size-6",
            )}>
                <svg width={size === "lg" ? 16 : size === "md" ? 15 : 13} height={size === "lg" ? 14 : size === "md" ? 13 : 11} viewBox="0 0 13 11" fill="none">
                    <path fillRule="evenodd" clipRule="evenodd" d="M11.0964 0.390037L3.93638 7.30004L2.03638 5.27004C1.68638 4.94004 1.13638 4.92004 0.736381 5.20004C0.346381 5.49004 0.236381 6.00004 0.476381 6.41004L2.72638 10.07C2.94638 10.41 3.32638 10.62 3.75638 10.62C4.16638 10.62 4.55638 10.41 4.77638 10.07C5.13638 9.60004 12.0064 1.41004 12.0064 1.41004C12.9064 0.490037 11.8164 -0.319963 11.0964 0.380037V0.390037Z" fill="currentColor" />
                </svg>
            </div>
            <span className={cx("text-tertiary", size === "lg" ? "pt-0.5 text-lg md:pt-0" : size === "md" ? "pt-0.5 text-md md:pt-0 md:text-lg" : "text-md")}>{text}</span>
        </li>
    );
};

const features = [
    { icon: SearchLg, title: "Smart Search", desc: "Advanced filters to find the perfect vehicle by make, model, price, and more" },
    { icon: Sliders04, title: "Easy Financing", desc: "Get pre-approved online without affecting your credit score" },
    { icon: Truck01, title: "Sell/Trade Options", desc: "Get instant competitive offers for your current vehicle" },
    { icon: Heart, title: "Save Favorites", desc: "Keep track of vehicles you love with favorites and saved searches" },
    { icon: Shield01, title: "Buyer Protection", desc: "Every vehicle comes with our quality guarantee and inspection report" },
    { icon: MarkerPin01, title: "Delivery Options", desc: "Pick up at dealership or have your vehicle delivered to your door" },
];

const howItWorks = [
    { step: "1", title: "Browse Our Inventory", desc: "Search through hundreds of quality vehicles with detailed photos and information" },
    { step: "2", title: "Reserve Your Vehicle", desc: "Place a refundable deposit to hold your chosen vehicle for 3 days" },
    { step: "3", title: "Get Financing", desc: "Complete your financing application online or work with our finance team" },
    { step: "4", title: "Pick Up or Delivery", desc: "Choose to pick up your vehicle or have it delivered to your door" },
];

const vehicleCategories = [
    {
        id: "suvs",
        name: "Popular SUVs",
        vehicles: [
            { id: 1, year: 2023, make: "Toyota", model: "RAV4", trim: "XLE Premium", price: 32500, mileage: 15420, image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop" },
            { id: 2, year: 2022, make: "Honda", model: "CR-V", trim: "EX-L", price: 29900, mileage: 22150, image: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=400&h=300&fit=crop" },
            { id: 3, year: 2023, make: "Ford", model: "Explorer", trim: "Limited", price: 42500, mileage: 8900, image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&h=300&fit=crop" },
            { id: 4, year: 2021, make: "Chevrolet", model: "Tahoe", trim: "LT", price: 48900, mileage: 35200, image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop" },
            { id: 5, year: 2022, make: "Tesla", model: "Model Y", trim: "Long Range", price: 52000, mileage: 12500, image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=300&fit=crop" },
        ],
    },
    {
        id: "trucks",
        name: "Featured Trucks",
        vehicles: [
            { id: 6, year: 2023, make: "Ford", model: "F-150", trim: "XLT", price: 45900, mileage: 11200, image: "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=400&h=300&fit=crop" },
            { id: 7, year: 2022, make: "Chevrolet", model: "Silverado", trim: "LT", price: 42500, mileage: 18900, image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&h=300&fit=crop" },
            { id: 8, year: 2021, make: "Ram", model: "1500", trim: "Big Horn", price: 38900, mileage: 28500, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop" },
            { id: 9, year: 2023, make: "Toyota", model: "Tundra", trim: "SR5", price: 47500, mileage: 9800, image: "https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=400&h=300&fit=crop" },
            { id: 10, year: 2022, make: "GMC", model: "Sierra", trim: "SLE", price: 44900, mileage: 15600, image: "https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=400&h=300&fit=crop" },
        ],
    },
    {
        id: "sedans",
        name: "Reliable Sedans",
        vehicles: [
            { id: 11, year: 2023, make: "Honda", model: "Accord", trim: "Sport", price: 28500, mileage: 8500, image: "https://images.unsplash.com/photo-1623869675781-80aa31012a5a?w=400&h=300&fit=crop" },
            { id: 12, year: 2022, make: "Toyota", model: "Camry", trim: "SE", price: 26900, mileage: 19200, image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop" },
            { id: 13, year: 2023, make: "Tesla", model: "Model 3", trim: "Standard", price: 42000, mileage: 5600, image: "https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=400&h=300&fit=crop" },
            { id: 14, year: 2021, make: "BMW", model: "3 Series", trim: "330i", price: 38500, mileage: 24800, image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop" },
            { id: 15, year: 2022, make: "Mercedes", model: "C-Class", trim: "C300", price: 41900, mileage: 16500, image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop" },
        ],
    },
];

const HeroSection = () => {
    return (
        <div className="relative overflow-hidden bg-primary">
            <img alt="Grid pattern" aria-hidden="true" loading="lazy" src="https://www.untitledui.com/patterns/light/grid-sm-desktop.svg" className="pointer-events-none absolute top-0 left-1/2 z-0 hidden max-w-none -translate-x-1/2 md:block dark:brightness-[0.2]" />
            <img alt="Grid pattern" aria-hidden="true" loading="lazy" src="https://www.untitledui.com/patterns/light/grid-sm-mobile.svg" className="pointer-events-none absolute top-0 left-1/2 z-0 max-w-none -translate-x-1/2 md:hidden dark:brightness-[0.2]" />

            <Header />

            <section className="relative py-16 md:py-24">
                <div className="mx-auto flex w-full max-w-container flex-col justify-between gap-8 px-4 md:px-8 lg:flex-row lg:items-center">
                    <div className="flex max-w-3xl flex-1 flex-col items-start">
                        <img src={automallLogo.src} alt="VinTraxx Auto Mall" className="mb-6 h-16 object-contain" />
                        
                        <Badge color="brand" type="pill-color" size="md" className="mb-4">
                            Consumer Marketplace
                        </Badge>

                        <h1 className="text-display-md font-semibold text-primary md:text-display-lg lg:text-display-xl">
                            Find Your <span className="text-brand-primary">Perfect Vehicle</span>
                        </h1>
                        <p className="mt-4 text-lg text-balance text-tertiary md:mt-6 md:text-xl">
                            Browse hundreds of quality vehicles, get pre-approved for financing, and buy with confidence. Your next car is just a few clicks away.
                        </p>

                        <ul className="mt-8 flex shrink-0 flex-col gap-4 pl-2 lg:hidden">
                            <CheckItemText text="Extensive vehicle selection" size="lg" color="success" />
                            <CheckItemText text="Easy online financing" size="lg" color="success" />
                            <CheckItemText text="Quality guarantee on every vehicle" size="lg" color="success" />
                        </ul>

                        <Form onSubmit={(e) => { e.preventDefault(); }} className="mt-8 flex w-full flex-col items-stretch gap-4 md:mt-12 md:max-w-120 md:flex-row md:items-start">
                            <Input isRequired size="md" name="search" type="text" wrapperClassName="py-0.5" placeholder="Search make, model, or keyword" />
                            <Button type="submit" size="xl" iconTrailing={SearchLg}>Search</Button>
                        </Form>
                    </div>

                    <ul className="hidden shrink-0 flex-col gap-5 pb-6 pl-4 lg:flex">
                        <CheckItemText text="Extensive vehicle selection" size="lg" color="success" />
                        <CheckItemText text="Easy online financing" size="lg" color="success" />
                        <CheckItemText text="Quality guarantee on every vehicle" size="lg" color="success" />
                    </ul>
                </div>

                <div className="relative mt-16 w-full max-w-container px-4 md:mx-auto md:px-8">
                    <div className="overflow-hidden rounded-2xl ring-4 ring-screen-mockup-border md:ring-8">
                        <img src={automallImage.src} alt="VinTraxx Auto Mall" className="w-full object-cover" />
                    </div>
                </div>
            </section>
        </div>
    );
};

const FeaturesSection = () => {
    return (
        <section className="bg-secondary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="mx-auto mb-12 flex w-full max-w-3xl flex-col items-center text-center md:mb-16">
                    <span className="text-sm font-semibold text-brand-secondary md:text-md">Features</span>
                    <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">The Better Way to Buy a Car</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">Everything you need for a seamless car buying experience.</p>
                </div>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, idx) => {
                        const Icon = feature.icon;
                        return (
                            <div key={idx} className="flex flex-col rounded-2xl bg-primary p-8 shadow-lg ring-1 ring-secondary_alt transition-shadow hover:shadow-xl">
                                <FeaturedIcon icon={Icon} size="lg" color="brand" theme="light" />
                                <h3 className="mt-5 text-lg font-semibold text-primary">{feature.title}</h3>
                                <p className="mt-2 text-md text-tertiary">{feature.desc}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

const HowItWorksSection = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="mx-auto mb-12 flex w-full max-w-3xl flex-col items-center text-center md:mb-16">
                    <span className="text-sm font-semibold text-brand-secondary md:text-md">How It Works</span>
                    <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">Simple Steps to Your New Car</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">From browsing to driving in just 4 easy steps.</p>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {howItWorks.map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center rounded-2xl bg-secondary p-8 text-center">
                            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-brand-solid font-bold text-white text-xl">{item.step}</div>
                            <h3 className="text-lg font-semibold text-primary">{item.title}</h3>
                            <p className="mt-2 text-sm text-tertiary">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const InventorySection = () => {
    const scroll = (categoryId: string, direction: "left" | "right") => {
        const container = document.getElementById(`carousel-${categoryId}`);
        if (container) {
            const scrollAmount = 300;
            const newPosition = direction === "left" 
                ? container.scrollLeft - scrollAmount 
                : container.scrollLeft + scrollAmount;
            container.scrollTo({ left: newPosition, behavior: "smooth" });
        }
    };

    return (
        <section className="bg-secondary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="mx-auto mb-12 flex w-full max-w-3xl flex-col items-center text-center md:mb-16">
                    <FeaturedIcon icon={Truck01} size="lg" color="brand" theme="light" />
                    <h2 className="mt-5 text-display-sm font-semibold text-primary md:text-display-md">Browse Our Inventory</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">Quality pre-owned vehicles at competitive prices.</p>
                </div>

                <div className="space-y-12">
                    {vehicleCategories.map((category) => (
                        <div key={category.id} className="relative">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-primary">{category.name}</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => scroll(category.id, "left")}
                                        className="flex size-8 items-center justify-center rounded-full bg-primary shadow-md ring-1 ring-secondary_alt transition hover:bg-secondary"
                                    >
                                        <ChevronLeft className="size-4 text-secondary" />
                                    </button>
                                    <button
                                        onClick={() => scroll(category.id, "right")}
                                        className="flex size-8 items-center justify-center rounded-full bg-primary shadow-md ring-1 ring-secondary_alt transition hover:bg-secondary"
                                    >
                                        <ChevronRightIcon className="size-4 text-secondary" />
                                    </button>
                                </div>
                            </div>

                            <div
                                id={`carousel-${category.id}`}
                                className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
                                style={{ scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}
                            >
                                {category.vehicles.map((vehicle) => (
                                    <div
                                        key={vehicle.id}
                                        className="group min-w-[260px] max-w-[260px] flex-shrink-0 cursor-pointer overflow-hidden rounded-xl bg-primary shadow-md ring-1 ring-secondary_alt transition-all hover:shadow-lg hover:ring-brand-primary"
                                    >
                                        <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                                            <img
                                                src={vehicle.image}
                                                alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                                                className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                        </div>
                                        <div className="p-4">
                                            <h4 className="font-semibold text-primary line-clamp-1">
                                                {vehicle.year} {vehicle.make} {vehicle.model}
                                            </h4>
                                            <p className="mt-1 text-sm text-tertiary line-clamp-1">{vehicle.trim}</p>
                                            <div className="mt-3 flex items-center justify-between">
                                                <span className="text-lg font-bold text-brand-primary">
                                                    ${vehicle.price.toLocaleString("en-US")}
                                                </span>
                                                <span className="text-sm text-quaternary">
                                                    {vehicle.mileage.toLocaleString("en-US")} mi
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <Button size="xl" iconTrailing={ArrowRight}>View All Vehicles</Button>
                </div>
            </div>
        </section>
    );
};

const CTASection = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="mx-auto max-w-3xl text-center">
                    <h2 className="text-display-sm font-semibold text-primary md:text-display-md">Ready to Find Your Perfect Vehicle?</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-6 md:text-xl">Start browsing our inventory today and drive away in your dream car.</p>
                    <div className="mt-8 flex flex-col items-center gap-4 md:mt-12 md:flex-row md:justify-center">
                        <Button size="xl" iconTrailing={ArrowRight}>Browse Inventory</Button>
                        <Button color="secondary" size="xl" iconTrailing={CurrencyDollar}>Get Pre-Approved</Button>
                    </div>
                </div>
            </div>
        </section>
    );
};

const footerNavList = [
    { label: "Products", items: [{ label: "VinLane IMS", href: "/products/vinlane" }, { label: "VinTraxx Recon", href: "/products/recon" }, { label: "SmartScan", href: "/products/smartscan" }, { label: "VinClips", href: "/products/vinclips" }, { label: "Auto Mall", href: "/products/automall" }, { label: "Acquisition.io", href: "/products/acquisition" }] },
    { label: "Company", items: [{ label: "About us", href: "/about" }, { label: "Careers", href: "/careers" }, { label: "Press", href: "/press" }, { label: "News", href: "/news" }, { label: "Contact", href: "/contact" }] },
    { label: "Resources", items: [{ label: "Blog", href: "/blog" }, { label: "Help Center", href: "/help" }, { label: "Documentation", href: "/docs" }, { label: "Training", href: "/training" }, { label: "Support", href: "/support" }] },
    { label: "For Dealers", items: [{ label: "Independent Dealers", href: "/dealers/independent" }, { label: "Franchise Dealers", href: "/dealers/franchise" }, { label: "Dealer Groups", href: "/dealers/groups" }, { label: "Success Stories", href: "/success-stories" }] },
    { label: "Social", items: [{ label: "Twitter", href: "#" }, { label: "LinkedIn", href: "#" }, { label: "Facebook", href: "#" }, { label: "TikTok", href: "#" }, { label: "YouTube", href: "#" }] },
    { label: "Legal", items: [{ label: "Terms", href: "/terms" }, { label: "Privacy", href: "/privacy" }, { label: "Cookies", href: "/cookies" }, { label: "Settings", href: "/settings" }] },
];

const FooterLarge = () => {
    return (
        <footer className="dark-mode bg-primary py-12 md:pt-16">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col justify-center text-center">
                    <h2 className="text-display-xs font-semibold text-primary md:text-display-sm">Let's Revolutionize Your Dealership Together</h2>
                    <p className="mt-2 text-md text-tertiary md:mt-4 md:text-xl">Get in touch to see how VinTraxx can boost your operations and profits.</p>
                    <div className="mt-8 flex flex-col-reverse gap-3 self-stretch md:mt-12 md:flex-row md:self-center">
                        <Button color="secondary" size="xl">Contact Us</Button>
                        <Button size="xl">Request a Demo</Button>
                    </div>
                </div>
                <nav className="mt-12 md:mt-16">
                    <ul className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
                        {footerNavList.map((category) => (
                            <li key={category.label}>
                                <h4 className="text-sm font-semibold text-quaternary">{category.label}</h4>
                                <ul className="mt-4 flex flex-col gap-3">
                                    {category.items.map((item) => (<li key={item.label}><Button color="link-gray" size="lg" href={item.href}>{item.label}</Button></li>))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="mt-12 flex flex-col justify-between gap-6 border-t border-secondary pt-8 md:mt-16 md:flex-row md:items-center">
                    <Link href="/"><UntitledLogo className="h-10" /></Link>
                    <p className="text-md text-quaternary">© 2025 Vintraxx. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default function AutoMallPage() {
    return (
        <div className="bg-primary">
            <HeroSection />
            <FeaturesSection />
            <SectionDivider />
            <HowItWorksSection />
            <InventorySection />
            <CTASection />
            <FooterLarge />
        </div>
    );
}
