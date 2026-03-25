"use client";

import { Check, Copy01, Link01 } from "@untitledui/icons";
import { BadgeGroup } from "@/components/base/badges/badge-groups";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Facebook, LinkedIn, X } from "@/components/foundations/social-icons";
import { useClipboard } from "@/hooks/use-clipboard";

export const ContentSplitImage01 = () => {
    const { copied, copy } = useClipboard();

    return (
        <div className="bg-primary">
            <div className="relative mx-auto flex max-w-container flex-col items-center px-4 py-16 md:flex-row md:px-8 md:pt-16 md:pb-24">
                <div className="flex max-w-180 flex-col items-start md:absolute">
                    <BadgeGroup size="md" addonText="Design" color="brand" theme="light" className="pr-3" iconTrailing={null}>
                        8 min read
                    </BadgeGroup>
                    <h1 className="mt-4 text-display-md font-semibold text-primary md:text-display-xl">How collaboration makes us better designers</h1>
                    <p className="mt-4 max-w-140 text-lg text-tertiary md:mt-6 md:text-xl">
                        Collaboration can make our teams stronger, and our individual designs better. Here's how to do it better.
                    </p>

                    <div className="mt-8 flex items-center gap-3 md:mt-12">
                        <img
                            src="https://www.untitledui.com/images/avatars/natali-craig?fm=webp&q=80"
                            className="size-12 rounded-full object-cover"
                            alt="Olivia Rhye"
                        />
                        <div>
                            <p className="text-md font-semibold text-primary">Natali Craig</p>
                            <p className="text-md text-tertiary">Published 14 Jan 2025</p>
                        </div>
                    </div>
                </div>

                <img
                    className="mt-16 h-100 w-full object-cover md:mt-0 md:ml-auto md:h-180 md:w-140 md:max-w-[50vw]"
                    src="https://www.untitledui.com/marketing/two-people-3.webp"
                    alt="Two people working"
                />

                <svg
                    className="absolute bottom-[53px] left-1/2 hidden -translate-x-[62%] lg:block"
                    width="349"
                    height="337"
                    viewBox="0 0 349 337"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M334.362 168.096C334.544 166.727 333.582 165.47 332.213 165.289C330.844 165.107 329.587 166.07 329.406 167.438L334.362 168.096ZM196.062 244.976L196.54 242.522L196.54 242.522L196.062 244.976ZM79.9305 219.721L78.7646 221.933L78.7654 221.933L79.9305 219.721ZM45.8562 104.044C44.8641 103.084 43.2814 103.11 42.3211 104.102C41.3608 105.094 41.3866 106.676 42.3788 107.637L45.8562 104.044ZM36.8047 147.192C36.7399 148.571 37.8055 149.742 39.1847 149.807C40.5639 149.872 41.7344 148.806 41.7992 147.427L36.8047 147.192ZM75.4853 108.658C76.8418 108.916 78.1502 108.025 78.4077 106.668C78.6653 105.312 77.7744 104.003 76.4179 103.746L75.4853 108.658ZM331.884 167.767C329.406 167.438 329.406 167.438 329.406 167.438C329.406 167.439 329.406 167.439 329.406 167.44C329.405 167.441 329.405 167.444 329.405 167.448C329.404 167.456 329.402 167.468 329.4 167.485C329.395 167.518 329.388 167.57 329.378 167.639C329.359 167.777 329.33 167.984 329.289 168.255C329.209 168.798 329.086 169.599 328.918 170.619C328.58 172.66 328.06 175.575 327.33 179.057C325.868 186.033 323.575 195.235 320.251 204.226C316.911 213.258 312.603 221.871 307.201 227.829C301.853 233.727 295.664 236.808 288.29 235.524L287.431 240.449C297.021 242.12 304.817 237.902 310.905 231.188C316.938 224.533 321.515 215.223 324.94 205.961C328.38 196.658 330.732 187.197 332.223 180.083C332.97 176.521 333.503 173.534 333.851 171.435C334.024 170.385 334.151 169.556 334.236 168.986C334.278 168.702 334.309 168.482 334.33 168.332C334.341 168.257 334.348 168.199 334.354 168.16C334.357 168.14 334.359 168.125 334.36 168.114C334.361 168.109 334.361 168.104 334.362 168.101C334.362 168.1 334.362 168.098 334.362 168.098C334.362 168.097 334.362 168.096 331.884 167.767ZM288.29 235.524C281.517 234.344 277.786 228.264 275.744 217.463C273.726 206.787 273.634 192.937 273.007 178.341C272.388 163.928 271.243 148.889 266.957 136.482C262.636 123.973 255.002 113.832 241.314 109.827L239.91 114.626C251.55 118.032 258.245 126.577 262.231 138.114C266.252 149.753 267.391 164.119 268.012 178.555C268.624 192.808 268.725 207.249 270.832 218.391C272.914 229.409 277.24 238.674 287.431 240.449L288.29 235.524ZM241.314 109.827C227.315 105.731 214.723 112.47 204.687 123.961C194.645 135.459 186.715 152.145 181.712 169.384C176.709 186.628 174.55 204.714 176.286 219.116C177.995 233.291 183.703 245.118 195.585 247.43L196.54 242.522C188.118 240.884 182.911 232.29 181.251 218.518C179.618 204.973 181.637 187.587 186.514 170.778C191.393 153.964 199.048 138.018 208.453 127.25C217.864 116.474 228.58 111.311 239.91 114.626L241.314 109.827ZM195.584 247.43C201.273 248.537 206.362 247.496 210.746 244.768C215.07 242.077 218.574 237.832 221.37 232.719C226.946 222.517 230.014 208.285 230.947 193.796C231.883 179.272 230.692 164.199 227.531 152.192C225.952 146.193 223.853 140.85 221.202 136.703C218.564 132.578 215.22 129.397 211.073 128.204L209.691 133.009C212.218 133.736 214.7 135.816 216.989 139.397C219.266 142.957 221.196 147.764 222.696 153.465C225.695 164.856 226.866 179.378 225.958 193.474C225.047 207.604 222.067 221.019 216.982 230.32C214.447 234.959 211.467 238.43 208.104 240.523C204.801 242.579 200.998 243.39 196.54 242.522L195.584 247.43ZM211.073 128.204C203.491 126.022 195.86 128.146 188.805 132.283C181.752 136.419 174.989 142.726 168.924 149.465C162.841 156.224 157.361 163.531 152.897 169.762C148.359 176.096 145.013 181.109 142.978 183.626L146.866 186.77C149.018 184.108 152.611 178.748 156.961 172.674C161.385 166.499 166.741 159.365 172.64 152.81C178.556 146.236 184.92 140.357 191.334 136.596C197.748 132.835 203.925 131.35 209.691 133.009L211.073 128.204ZM142.978 183.626C138.482 189.185 130.925 201.667 120.086 210.998C114.74 215.601 108.795 219.228 102.333 220.714C95.9369 222.186 88.8657 221.602 81.0957 217.509L78.7654 221.933C87.5715 226.572 95.8653 227.333 103.454 225.587C110.978 223.856 117.638 219.703 123.349 214.787C134.624 205.08 142.986 191.568 146.866 186.77L142.978 183.626ZM81.0965 217.51C73.6294 213.573 69.4997 206.861 67.1168 198.111C64.7107 189.276 64.1722 178.687 63.6988 167.357C63.2304 156.148 62.8256 144.263 60.5569 133.307C58.2806 122.315 54.084 112.008 45.8562 104.044L42.3788 107.637C49.6251 114.65 53.4993 123.883 55.6608 134.321C57.8298 144.796 58.2296 156.233 58.7031 167.566C59.1716 178.777 59.7121 189.95 62.2925 199.425C64.8959 208.985 69.6602 217.133 78.7646 221.933L81.0965 217.51ZM39.302 147.31C41.7992 147.427 41.7992 147.427 41.7992 147.426C41.7993 147.426 41.7993 147.426 41.7993 147.425C41.7993 147.424 41.7994 147.422 41.7995 147.42C41.7997 147.415 41.8001 147.409 41.8005 147.4C41.8014 147.381 41.8026 147.354 41.8043 147.318C41.8077 147.247 41.8127 147.14 41.8193 147.001C41.8325 146.722 41.8518 146.313 41.8767 145.79C41.9264 144.745 41.998 143.247 42.0856 141.433C42.2608 137.806 42.4999 132.921 42.7558 127.885C43.2709 117.75 43.8456 107.184 44.1029 104.875L39.1336 104.321C38.8547 106.825 38.2713 117.615 37.7623 127.632C37.5061 132.673 37.2667 137.563 37.0914 141.192C37.0037 143.007 36.9321 144.507 36.8823 145.553C36.8574 146.076 36.8381 146.486 36.8249 146.765C36.8183 146.904 36.8132 147.011 36.8099 147.083C36.8082 147.119 36.8069 147.146 36.806 147.165C36.8056 147.174 36.8053 147.181 36.8051 147.185C36.805 147.188 36.8049 147.189 36.8048 147.19C36.8048 147.191 36.8048 147.192 36.8048 147.192C36.8047 147.192 36.8047 147.192 39.302 147.31ZM44.1029 104.875C44.045 105.394 43.7514 105.699 43.6356 105.79C43.5635 105.846 43.6177 105.782 43.9488 105.685C44.6067 105.492 45.71 105.354 47.267 105.318C50.3293 105.247 54.4623 105.58 58.6937 106.078C62.8989 106.573 67.0985 107.218 70.2538 107.741C71.8295 108.002 73.1407 108.232 74.0567 108.396C74.5146 108.479 74.8735 108.544 75.1171 108.589C75.2389 108.612 75.3318 108.629 75.3939 108.641C75.4249 108.647 75.4482 108.651 75.4635 108.654C75.4712 108.655 75.4769 108.657 75.4805 108.657C75.4823 108.658 75.4836 108.658 75.4844 108.658C75.4848 108.658 75.4851 108.658 75.4852 108.658C75.4853 108.658 75.4853 108.658 75.9516 106.202C76.4179 103.746 76.4176 103.746 76.4172 103.746C76.4169 103.746 76.4163 103.746 76.4157 103.745C76.4145 103.745 76.4127 103.745 76.4104 103.744C76.4059 103.744 76.3993 103.742 76.3907 103.741C76.3735 103.737 76.3483 103.733 76.3154 103.727C76.2495 103.714 76.1526 103.696 76.0267 103.673C75.775 103.626 75.4073 103.559 74.94 103.475C74.0056 103.307 72.6721 103.073 71.0711 102.808C67.8726 102.278 63.5894 101.62 59.2783 101.112C54.9933 100.608 50.5765 100.24 47.151 100.319C45.4641 100.358 43.839 100.508 42.546 100.886C41.9017 101.074 41.1748 101.365 40.5487 101.856C39.879 102.382 39.2584 103.201 39.1336 104.321L44.1029 104.875Z"
                        fill="#101828"
                    />
                </svg>
            </div>

            <div className="mx-auto max-w-container px-4 pb-16 md:px-8 md:pb-24">
                <div className="mx-auto flex justify-center gap-16">
                    <div className="hidden w-60 flex-col gap-8 md:flex">
                        <div className="w-full border-t border-secondary" />
                        <div className="flex flex-col gap-4">
                            <p className="text-md font-semibold text-brand-secondary">Table of contents</p>
                            <ul className="flex flex-col gap-3">
                                {[
                                    {
                                        title: "Introduction",
                                        href: "#",
                                    },
                                    {
                                        title: "Software and tools",
                                        href: "#",
                                    },
                                    {
                                        title: "Other resources",
                                        href: "#",
                                    },
                                    {
                                        title: "Conclusion",
                                        href: "#",
                                    },
                                ].map((item) => (
                                    <li key={item.title}>
                                        <Button href={item.href} size="lg" color="link-gray">
                                            {item.title}
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="w-full border-t border-secondary" />
                        <div className="flex gap-3">
                            <Button color="secondary" size="md" onClick={() => copy("https://www.untitledui.com/")} iconLeading={copied ? Check : Link01} />
                            <Button color="secondary" size="md" className="text-fg-quaternary" iconLeading={X} />
                            <Button color="secondary" size="md" className="text-fg-quaternary" iconLeading={Facebook} />
                            <Button color="secondary" size="md" className="text-fg-quaternary" iconLeading={LinkedIn} />
                        </div>
                    </div>
                    <div className="max-w-prose md:max-w-180">
                        <div className="mx-auto prose md:prose-lg">
                            <p className="lead">
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec ullamcorper mattis lorem non. Ultrices praesent amet ipsum justo
                                massa. Eu dolor aliquet risus gravida nunc at feugiat consequat purus. Non massa enim vitae duis mattis. Vel in ultricies vel
                                fringilla.
                            </p>
                            <hr />
                            <h2>Introduction</h2>
                            <p>
                                Mi tincidunt elit, id quisque ligula ac diam, amet. Vel etiam suspendisse morbi eleifend faucibus eget vestibulum felis. Dictum
                                quis montes, sit sit. Tellus aliquam enim urna, etiam. Mauris posuere vulputate arcu amet, vitae nisi, tellus tincidunt. At
                                feugiat sapien varius id.
                            </p>
                            <p>
                                Eget quis mi enim, leo lacinia pharetra, semper. Eget in volutpat mollis at volutpat lectus velit, sed auctor. Porttitor fames
                                arcu quis fusce augue enim. Quis at habitant diam at. Suscipit tristique risus, at donec. In turpis vel et quam imperdiet. Ipsum
                                molestie aliquet sodales id est ac volutpat.
                            </p>
                            <figure>
                                <img className="h-60 md:h-120" src="https://www.untitledui.com/marketing/ai-woman-04.webp" alt="AI woman" />
                                <figcaption>
                                    Image courtesy of Edmond Dantès via{" "}
                                    <a
                                        href="https://www.pexels.com/photo/photo-of-woman-leaning-on-wooden-table-3182746/"
                                        className="rounded-xs outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
                                    >
                                        Pexels
                                    </a>
                                </figcaption>
                            </figure>
                            <p>
                                Ipsum sit mattis nulla quam nulla. Gravida id gravida ac enim mauris id. Non pellentesque congue eget consectetur turpis.
                                Sapien, dictum molestie sem tempor. Diam elit, orci, tincidunt aenean tempus. Quis velit eget ut tortor tellus. Sed vel, congue
                                felis elit erat nam nibh orci.
                            </p>
                            <figure>
                                <blockquote>
                                    <p>
                                        In a world older and more complete than ours they move finished and complete, gifted with extensions of the senses we
                                        have lost or never attained, living by voices we shall never hear.
                                    </p>
                                </blockquote>
                                <figcaption className="not-prose mt-6 flex gap-3 text-md md:mt-8">
                                    <img
                                        src="https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80"
                                        className="size-12 rounded-full object-cover"
                                        alt="Olivia Rhye"
                                    />
                                    <div>
                                        <p className="text-md font-semibold text-primary">Olivia Rhye</p>
                                        <cite className="text-md text-tertiary not-italic">Product Designer</cite>
                                    </div>
                                </figcaption>
                            </figure>
                            <p>
                                Dolor enim eu tortor urna sed duis nulla. Aliquam vestibulum, nulla odio nisl vitae. In aliquet pellentesque aenean hac
                                vestibulum turpis mi bibendum diam. Tempor integer aliquam in vitae malesuada fringilla.
                            </p>
                            <p>
                                Elit nisi in eleifend sed nisi. Pulvinar at orci, proin imperdiet commodo consectetur convallis risus. Sed condimentum enim
                                dignissim adipiscing faucibus consequat, urna. Viverra purus et erat auctor aliquam. Risus, volutpat vulputate posuere purus sit
                                congue convallis aliquet. Arcu id augue ut feugiat donec porttitor neque. Mauris, neque ultricies eu vestibulum, bibendum quam
                                lorem id. Dolor lacus, eget nunc lectus in tellus, pharetra, porttitor.
                            </p>
                            <p>
                                Ipsum sit mattis nulla quam nulla. Gravida id gravida ac enim mauris id. Non pellentesque congue eget consectetur turpis.
                                Sapien, dictum molestie sem tempor. Diam elit, orci, tincidunt aenean tempus. Quis velit eget ut tortor tellus. Sed vel, congue
                                felis elit erat nam nibh orci.
                            </p>
                            <h3>Software and tools</h3>
                            <p>
                                Mi tincidunt elit, id quisque ligula ac diam, amet. Vel etiam suspendisse morbi eleifend faucibus eget vestibulum felis. Dictum
                                quis montes, sit sit. Tellus aliquam enim urna, etiam. Mauris posuere vulputate arcu amet, vitae nisi, tellus tincidunt. At
                                feugiat sapien varius id.
                            </p>
                            <p>
                                Eget quis mi enim, leo lacinia pharetra, semper. Eget in volutpat mollis at volutpat lectus velit, sed auctor. Porttitor fames
                                arcu quis fusce augue enim. Quis at habitant diam at. Suscipit tristique risus, at donec. In turpis vel et quam imperdiet. Ipsum
                                molestie aliquet sodales id est ac volutpat.
                            </p>
                            <h3>Other resources</h3>
                            <p>
                                Sagittis et eu at elementum, quis in. Proin praesent volutpat egestas sociis sit lorem nunc nunc sit. Eget diam curabitur mi ac.
                                Auctor rutrum lacus malesuada massa ornare et. Vulputate consectetur ac ultrices at diam dui eget fringilla tincidunt. Arcu sit
                                dignissim massa erat cursus vulputate gravida id. Sed quis auctor vulputate hac elementum gravida cursus dis.
                            </p>
                            <ol>
                                <li>Lectus id duis vitae porttitor enim gravida morbi.</li>
                                <li>Eu turpis posuere semper feugiat volutpat elit, ultrices suspendisse. Auctor vel in vitae placerat.</li>
                                <li>Suspendisse maecenas ac donec scelerisque diam sed est duis purus.</li>
                            </ol>
                            <figure>
                                <img className="h-110 md:h-240" src="https://www.untitledui.com/marketing/smiling-girl-10.webp" alt="Smiling girl" />
                                <figcaption>
                                    <Link01 className="size-4 text-utility-gray-400" />
                                    <span>
                                        Image courtesy of Artem Podrez via{" "}
                                        <a
                                            href="https://www.pexels.com/photo/pensive-woman-sitting-in-light-workspace-7148059/"
                                            className="rounded-xs outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
                                        >
                                            Pexels
                                        </a>
                                    </span>
                                </figcaption>
                            </figure>
                            <p>
                                Lectus leo massa amet posuere. Malesuada mattis non convallis quisque. Libero sit et imperdiet bibendum quisque dictum
                                vestibulum in non. Pretium ultricies tempor non est diam. Enim ut enim amet amet integer cursus. Sit ac commodo pretium sed
                                etiam turpis suspendisse at.
                            </p>
                            <p>
                                Tristique odio senectus nam posuere ornare leo metus, ultricies. Blandit duis ultricies vulputate morbi feugiat cras placerat
                                elit. Aliquam tellus lorem sed ac. Montes, sed mattis suscipit accumsan. Cursus viverra aenean magna risus elementum faucibus
                                molestie pellentesque. Arcu ultricies sed mauris vestibulum.
                            </p>
                            <div className="not-prose my-8 rounded-2xl bg-secondary px-5 py-6 text-lg text-tertiary md:my-12 md:p-8 [&>p+p]:mt-4.5">
                                <h2 className="mb-4 text-display-xs font-semibold text-primary">Conclusion</h2>
                                <p>
                                    Morbi sed imperdiet in ipsum, adipiscing elit dui lectus. Tellus id scelerisque est ultricies ultricies. Duis est sit sed
                                    leo nisl, blandit elit sagittis. Quisque tristique quam sed. Nisl at scelerisque amet nulla purus habitasse.
                                </p>
                                <p>
                                    Nunc sed faucibus bibendum feugiat sed interdum. Ipsum egestas condimentum mi massa. In tincidunt pharetra consectetur sed
                                    duis facilisis metus. Etiam egestas in nec sed et. Quis lobortis at sit dictum eget nibh tortor commodo cursus.
                                </p>
                                <p>
                                    Odio felis sagittis, morbi feugiat tortor vitae feugiat fusce aliquet. Nam elementum urna nisi aliquet erat dolor enim.
                                    Ornare id morbi eget ipsum. Aliquam senectus neque ut id eget consectetur dictum. Donec posuere pharetra odio consequat
                                    scelerisque et, nunc tortor.
                                </p>
                            </div>
                        </div>

                        <div className="-mt-px flex flex-col items-start justify-between gap-y-6 border-t border-secondary pt-6 md:flex-row">
                            <div className="flex gap-2">
                                <Badge color="brand" size="md">
                                    Design
                                </Badge>
                                <Badge color="indigo" size="md">
                                    Research
                                </Badge>
                            </div>
                            <div className="flex gap-3 md:hidden">
                                <Button color="secondary" size="md" onClick={() => copy("https://www.untitledui.com/")} iconLeading={copied ? Check : Copy01} />
                                <Button color="secondary" size="md" className="text-fg-quaternary" iconLeading={X} />
                                <Button color="secondary" size="md" className="text-fg-quaternary" iconLeading={Facebook} />
                                <Button color="secondary" size="md" className="text-fg-quaternary" iconLeading={LinkedIn} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
