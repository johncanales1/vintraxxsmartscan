"use client";

import { useState } from "react";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Form } from "@/components/base/form/form";
import { Input, InputBase } from "@/components/base/input/input";
import { InputGroup } from "@/components/base/input/input-group";
import { NativeSelect } from "@/components/base/select/select-native";
import { TextArea } from "@/components/base/textarea/textarea";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";
import { Header } from "@/components/marketing/header-navigation/header";
import countries, { phoneCodeOptions } from "@/utils/countries";

const ContactFormAndImage01 = () => {
    const [selectedCountryPhone, setSelectedCountryPhone] = useState("US");

    return (
        <section className="bg-primary py-16 md:pt-16 md:pb-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="grid gap-16 lg:grid-cols-2">
                    <div className="flex w-full flex-col gap-12 sm:w-120 sm:justify-self-center lg:py-11">
                        <div className="flex flex-col">
                            <h2 className="text-display-md font-semibold text-primary">Get in touch</h2>
                            <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">Our friendly team would love to hear from you.</p>
                        </div>
                        <Form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const data = Object.fromEntries(new FormData(e.currentTarget));
                                console.log("Form data:", data);
                            }}
                            className="flex flex-col gap-8"
                        >
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col gap-x-8 gap-y-6 sm:flex-row">
                                    <Input isRequired size="md" name="firstName" label="First name" placeholder="First name" wrapperClassName="flex-1" />
                                    <Input isRequired size="md" name="lastName" label="Last name" placeholder="Last name" wrapperClassName="flex-1" />
                                </div>
                                <Input isRequired size="md" name="email" label="Email" type="email" placeholder="you@company.com" />
                                <InputGroup
                                    size="md"
                                    name="phone"
                                    label="Phone number"
                                    leadingAddon={
                                        <NativeSelect
                                            aria-label="Country code"
                                            value={selectedCountryPhone}
                                            onChange={(value) => setSelectedCountryPhone(value.currentTarget.value)}
                                            options={phoneCodeOptions.map((item) => ({
                                                label: item.label as string,
                                                value: item.id as string,
                                            }))}
                                        />
                                    }
                                >
                                    <InputBase
                                        type="tel"
                                        placeholder={countries.find((country) => country.code === selectedCountryPhone)?.phoneMask?.replaceAll("#", "0")}
                                    />
                                </InputGroup>
                                <TextArea isRequired label="Message" placeholder="Leave us a message..." rows={4} />
                                <Checkbox
                                    name="privacy"
                                    size="md"
                                    hint={
                                        <>
                                            You agree to our friendly{" "}
                                            <a
                                                href="#"
                                                className="rounded-xs underline underline-offset-3 outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
                                            >
                                                privacy policy.
                                            </a>
                                        </>
                                    }
                                />
                            </div>

                            <Button type="submit" size="xl">
                                Send message
                            </Button>
                        </Form>
                    </div>

                    <div className="max-lg:hidden lg:h-200">
                        <img src="https://www.untitledui.com/images/portraits/fleur-cook" className="size-full object-cover" alt="Fleur Cook" />
                    </div>
                </div>
            </div>
        </section>
    );
};

const navList = [
    {
        title: "Product",
        items: [
            { label: "Overview", href: "#" },
            { label: "Features", href: "#" },
            {
                label: "Solutions",
                href: "#",
                badge: (
                    <Badge color="gray" type="modern" size="sm" className="ml-1">
                        New
                    </Badge>
                ),
            },
            { label: "Tutorials", href: "#" },
            { label: "Pricing", href: "#" },
            { label: "Releases", href: "#" },
        ],
    },
    {
        title: "Company",
        items: [
            { label: "About us", href: "#" },
            { label: "Careers", href: "#" },
            { label: "Press", href: "#" },
            { label: "News", href: "#" },
            { label: "Media kit", href: "#" },
            { label: "Contact", href: "#" },
        ],
    },
    {
        title: "Resources",
        items: [
            { label: "Blog", href: "#" },
            { label: "Newsletter", href: "#" },
            { label: "Events", href: "#" },
            { label: "Help centre", href: "#" },
            { label: "Tutorials", href: "#" },
            { label: "Support", href: "#" },
        ],
    },
    {
        title: "Use cases",
        items: [
            { label: "Startups", href: "#" },
            { label: "Enterprise", href: "#" },
            { label: "Government", href: "#" },
            { label: "SaaS centre", href: "#" },
            { label: "Marketplaces", href: "#" },
            { label: "Ecommerce", href: "#" },
        ],
    },
    {
        title: "Social",
        items: [
            { label: "Twitter", href: "#" },
            { label: "LinkedIn", href: "#" },
            { label: "Facebook", href: "#" },
            { label: "GitHub", href: "#" },
            { label: "AngelList", href: "#" },
            { label: "Dribbble", href: "#" },
        ],
    },
    {
        title: "Legal",
        items: [
            { label: "Terms", href: "#" },
            { label: "Privacy", href: "#" },
            { label: "Cookies", href: "#" },
            { label: "Licenses", href: "#" },
            { label: "Settings", href: "#" },
            { label: "Contact", href: "#" },
        ],
    },
];

const FooterLarge01 = () => {
    return (
        <footer className="bg-primary py-12 md:pt-16">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <nav>
                    <ul className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
                        {navList.map((category) => (
                            <li key={category.title}>
                                <h4 className="text-sm font-semibold text-quaternary">{category.title}</h4>
                                <ul className="mt-4 flex flex-col gap-3">
                                    {category.items.map((item) => (
                                        <li key={item.label}>
                                            <Button color="link-gray" size="lg" href={item.href} iconTrailing={item.badge} className="gap-1">
                                                {item.label}
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="mt-12 flex flex-col justify-between gap-6 border-t border-secondary pt-8 md:mt-16 md:flex-row md:items-center">
                    <UntitledLogo className="h-8 w-min" />
                    <p className="text-md text-quaternary">© 2077 Untitled UI. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

const ContactPage01 = () => {
    return (
        <div className="bg-primary">
            <Header />

            <ContactFormAndImage01 />

            <FooterLarge01 />
        </div>
    );
};

export default ContactPage01;
