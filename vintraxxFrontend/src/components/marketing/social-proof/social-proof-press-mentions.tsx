export const SocialProofPressMentions = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col gap-8">
                    <p className="text-center text-md font-medium text-tertiary">We've been mentioned in the press</p>
                    <div className="flex flex-col flex-wrap justify-center gap-x-8 gap-y-4 md:flex-row">
                        {/* Light mode images (hidden in dark mode) */}
                        <img alt="Washington" src="https://www.untitledui.com/logos/logotype/color/washington.svg" className="h-8 md:h-10 dark:hidden" />
                        <img alt="Techcrunch" src="https://www.untitledui.com/logos/logotype/color/techcrunch.svg" className="h-8 md:h-10 dark:hidden" />
                        <img alt="Bloomberg" src="https://www.untitledui.com/logos/logotype/color/bloomberg.svg" className="h-8 md:h-10 dark:hidden" />
                        <img alt="Gizmodo" src="https://www.untitledui.com/logos/logotype/color/gizmodo.svg" className="h-8 md:h-10 dark:hidden" />
                        <img alt="Forbes" src="https://www.untitledui.com/logos/logotype/color/forbes.svg" className="h-8 md:h-10 dark:hidden" />

                        {/* Dark mode images (hidden in light mode) */}
                        <img
                            alt="Washington"
                            src="https://www.untitledui.com/logos/logotype/white/washington.svg"
                            className="h-8 opacity-85 not-dark:hidden md:h-10"
                        />
                        <img
                            alt="Techcrunch"
                            src="https://www.untitledui.com/logos/logotype/white/techcrunch.svg"
                            className="h-8 opacity-85 not-dark:hidden md:h-10"
                        />
                        <img
                            alt="Bloomberg"
                            src="https://www.untitledui.com/logos/logotype/white/bloomberg.svg"
                            className="h-8 opacity-85 not-dark:hidden md:h-10"
                        />
                        <img
                            alt="Gizmodo"
                            src="https://www.untitledui.com/logos/logotype/white/gizmodo.svg"
                            className="h-8 opacity-85 not-dark:hidden md:h-10"
                        />
                        <img alt="Forbes" src="https://www.untitledui.com/logos/logotype/white/forbes.svg" className="h-8 opacity-85 not-dark:hidden md:h-10" />
                    </div>
                </div>
            </div>
        </section>
    );
};
