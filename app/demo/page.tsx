"use client";
import { Skeleton } from "boneyard-js/react";
import Image from "next/image";
import React from "react";

const Page = () => {
  return (
    <Skeleton name="profile-edit" loading={false}>
      <div className="max-w-3xl mx-auto px-4">
        <div className="border-x">
          <div>
            <button
              className="group/cover relative bg-muted/30 w-full aspect-4/1 overflow-hidden cursor-zoom-in"
              aria-label="View cover photo"
            >
              <Image
                src="https://res.cloudinary.com/dhtxrpqna/image/upload/v1778624936/user_covers/68513d1ae99975de510c72a0/i6wmmjiumqyeyuukepvb.jpg"
                alt="Cover"
                fill
                sizes="100vw"
                className="object-cover group-hover/cover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 flex justify-center items-center bg-black/20 opacity-0 group-hover/cover:opacity-100 transition-opacity">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-plus size-8 text-white/80"
                  aria-hidden="true"
                >
                  <path d="M5 12h14"></path>
                  <path d="M12 5v14"></path>
                </svg>
              </div>
            </button>
            <div className="relative pt-0 pb-0! border-b">
              <div className="flex flex-col gap-6 px-4 pb-6">
                <div className="relative -mt-12 sm:-mt-16 w-min">
                  <button
                    className="group/avatar relative bg-muted border-4 border-background rounded-full size-24 sm:size-32 overflow-hidden cursor-zoom-in"
                    aria-label="View profile photo"
                  >
                    <Image
                      src="https://res.cloudinary.com/dhtxrpqna/image/upload/v1778624859/user_profiles/68513d1ae99975de510c72a0/y4iu0xyl87ncvhvjq8uc.jpg"
                      alt="divya sachan"
                      fill
                      sizes="(max-width: 640px) 96px, 128px"
                      className="object-cover group-hover/avatar:scale-110 transition-transform"
                    />
                    <div className="absolute inset-0 flex justify-center items-center bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-plus size-6 text-white"
                        aria-hidden="true"
                      >
                        <path d="M5 12h14"></path>
                        <path d="M12 5v14"></path>
                      </svg>
                    </div>
                  </button>
                  <span className="right-1 bottom-1 absolute flex justify-center items-center bg-background p-1 rounded-full size-7">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-label="Verified"
                      className="size-5 text-blue-500"
                    >
                      <path d="M24 12a4.454 4.454 0 0 0-2.564-3.91 4.437 4.437 0 0 0-.948-4.578 4.436 4.436 0 0 0-4.577-.948A4.44 4.44 0 0 0 12 0a4.423 4.423 0 0 0-3.9 2.564 4.434 4.434 0 0 0-2.43-.178 4.425 4.425 0 0 0-2.158 1.126 4.42 4.42 0 0 0-1.12 2.156 4.42 4.42 0 0 0 .183 2.421A4.456 4.456 0 0 0 0 12a4.465 4.465 0 0 0 2.576 3.91 4.433 4.433 0 0 0 .936 4.577 4.459 4.459 0 0 0 4.577.95A4.454 4.454 0 0 0 12 24a4.439 4.439 0 0 0 3.91-2.563 4.26 4.26 0 0 0 5.526-5.526A4.453 4.453 0 0 0 24 12Zm-13.709 4.917-4.38-4.378 1.652-1.663 2.646 2.646L15.83 7.4l1.72 1.591-7.258 7.926Z"></path>
                    </svg>
                  </span>
                </div>
                <div className="flex-1 pb-1 min-w-0">
                  <div
                    data-slot="card-title"
                    className="mb-3 font-bold text-2xl truncate"
                  >
                    divya sachan
                  </div>
                  <div
                    data-slot="card-description"
                    className="text-muted-foreground flex flex-col space-y-2 text-base"
                  >
                    <a
                      className="group flex items-center gap-2 text-muted-foreground hover:text-foreground hover:underline underline-offset-4 transition-colors"
                      href="/divyasachan"
                    >
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-muted-foreground/15 bg-muted ring-1 ring-border ring-offset-1 ring-offset-background hover:text-foreground transition-colors [&amp;_svg]:pointer-events-none [&amp;_svg]:text-muted-foreground [&amp;_svg:not([class*='size-'])]:size-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-user-round"
                          aria-hidden="true"
                        >
                          <circle cx="12" cy="8" r="5"></circle>
                          <path d="M20 21a8 8 0 0 0-16 0"></path>
                        </svg>
                      </div>
                      @divyasachan
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-arrow-up-right size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        aria-hidden="true"
                      >
                        <path d="M7 7h10v10"></path>
                        <path d="M7 17 17 7"></path>
                      </svg>
                    </a>
                    <div className="flex items-center gap-2">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-muted-foreground/15 bg-muted ring-1 ring-border ring-offset-1 ring-offset-background hover:text-foreground transition-colors [&amp;_svg]:pointer-events-none [&amp;_svg]:text-muted-foreground [&amp;_svg:not([class*='size-'])]:size-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-mail"
                          aria-hidden="true"
                        >
                          <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path>
                          <rect
                            x="2"
                            y="4"
                            width="20"
                            height="16"
                            rx="2"
                          ></rect>
                        </svg>
                      </div>
                      divya16sachan@gmail.com
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-muted-foreground/15 bg-muted ring-1 ring-border ring-offset-1 ring-offset-background hover:text-foreground transition-colors [&amp;_svg]:pointer-events-none [&amp;_svg]:text-muted-foreground [&amp;_svg:not([class*='size-'])]:size-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-hash"
                          aria-hidden="true"
                        >
                          <line x1="4" x2="20" y1="9" y2="9"></line>
                          <line x1="4" x2="20" y1="15" y2="15"></line>
                          <line x1="10" x2="8" y1="3" y2="21"></line>
                          <line x1="16" x2="14" y1="3" y2="21"></line>
                        </svg>
                      </div>
                      68513d1ae99975de510c72a0
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <div className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-green-100 text-green-700 border-green-200">
                      Active Account
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    <span
                      data-slot="badge"
                      data-variant="secondary"
                      className="inline-flex items-center justify-center border border-transparent px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap [&amp;&gt;svg]:size-3 gap-1 [&amp;&gt;svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive overflow-hidden bg-secondary text-secondary-foreground [a&amp;]:hover:bg-secondary/90 rounded-md h-6 transition-all duration-200 shrink-0"
                    >
                      <img
                        alt="nodejs"
                        width="12"
                        height="12"
                        className="shrink-0"
                        src="/devicons/nodejs.svg"
                      />
                      <span>nodejs</span>
                    </span>
                    <span
                      data-slot="badge"
                      data-variant="secondary"
                      className="inline-flex items-center justify-center border border-transparent px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap [&amp;&gt;svg]:size-3 gap-1 [&amp;&gt;svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive overflow-hidden bg-secondary text-secondary-foreground [a&amp;]:hover:bg-secondary/90 rounded-md h-6 transition-all duration-200 shrink-0"
                    >
                      <img
                        alt="javascript"
                        width="12"
                        height="12"
                        className="shrink-0"
                        src="/devicons/javascript.svg"
                      />
                      <span>javascript</span>
                    </span>
                    <span
                      data-slot="badge"
                      data-variant="secondary"
                      className="inline-flex items-center justify-center border border-transparent px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap [&amp;&gt;svg]:size-3 gap-1 [&amp;&gt;svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive overflow-hidden bg-secondary text-secondary-foreground [a&amp;]:hover:bg-secondary/90 rounded-md h-6 transition-all duration-200 shrink-0"
                    >
                      <img
                        alt="typescript"
                        width="12"
                        height="12"
                        className="shrink-0"
                        src="/devicons/typescript.svg"
                      />
                      <span>typescript</span>
                    </span>
                    <span
                      data-slot="badge"
                      data-variant="secondary"
                      className="inline-flex items-center justify-center border border-transparent px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap [&amp;&gt;svg]:size-3 gap-1 [&amp;&gt;svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive overflow-hidden bg-secondary text-secondary-foreground [a&amp;]:hover:bg-secondary/90 rounded-md h-6 transition-all duration-200 shrink-0"
                    >
                      <img
                        alt="nextjs"
                        width="12"
                        height="12"
                        className="shrink-0 devicon-invertible dark:invert"
                        src="/devicons/nextjs.svg"
                      />
                      <span>nextjs</span>
                    </span>
                    <span
                      data-slot="badge"
                      data-variant="secondary"
                      className="inline-flex items-center justify-center border border-transparent px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap [&amp;&gt;svg]:size-3 gap-1 [&amp;&gt;svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive overflow-hidden bg-secondary text-secondary-foreground [a&amp;]:hover:bg-secondary/90 rounded-md h-6 transition-all duration-200 shrink-0"
                    >
                      <img
                        alt="figma"
                        width="12"
                        height="12"
                        className="shrink-0"
                        src="/devicons/figma.svg"
                      />
                      <span>figma</span>
                    </span>
                    <span
                      data-slot="badge"
                      data-variant="secondary"
                      className="inline-flex items-center justify-center border border-transparent px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap [&amp;&gt;svg]:size-3 gap-1 [&amp;&gt;svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive overflow-hidden bg-secondary text-secondary-foreground [a&amp;]:hover:bg-secondary/90 rounded-md h-6 transition-all duration-200 shrink-0"
                    >
                      <img
                        alt="react"
                        width="12"
                        height="12"
                        className="shrink-0"
                        src="/devicons/react.svg"
                      />
                      <span>react</span>
                    </span>
                    <span
                      data-slot="badge"
                      data-variant="secondary"
                      className="inline-flex items-center justify-center border border-transparent px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap [&amp;&gt;svg]:size-3 gap-1 [&amp;&gt;svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive overflow-hidden bg-secondary text-secondary-foreground [a&amp;]:hover:bg-secondary/90 rounded-md h-6 transition-all duration-200 shrink-0"
                    >
                      <img
                        alt="mongodb"
                        width="12"
                        height="12"
                        className="shrink-0"
                        src="/devicons/mongodb.svg"
                      />
                      <span>mongodb</span>
                    </span>
                    <span
                      data-slot="badge"
                      data-variant="secondary"
                      className="inline-flex items-center justify-center border border-transparent px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap [&amp;&gt;svg]:size-3 gap-1 [&amp;&gt;svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive overflow-hidden bg-secondary text-secondary-foreground [a&amp;]:hover:bg-secondary/90 rounded-md h-6 transition-all duration-200 shrink-0"
                    >
                      <img
                        alt="tailwindcss"
                        width="12"
                        height="12"
                        className="shrink-0"
                        src="/devicons/tailwindcss.svg"
                      />
                      <span>tailwindcss</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            dir="ltr"
            data-orientation="horizontal"
            data-slot="tabs"
            className="group/tabs flex gap-2 data-[orientation=horizontal]:flex-col w-full"
          >
            <div
              role="tablist"
              aria-orientation="horizontal"
              data-slot="tabs-list"
              data-variant="line"
              className="rounded-lg p-[3px] group-data-[orientation=horizontal]/tabs:h-9 data-[variant=line]:rounded-none group/tabs-list text-muted-foreground inline-flex items-center group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col gap-1 bg-transparent flex-nowrap justify-start -mb-px w-full h-12 overflow-x-auto overflow-y-hidden scrollbar-hide border-b"
              data-orientation="horizontal"
              style={{ outline: "none", willChange: "scroll-position" }}
            >
              <button
                type="button"
                role="tab"
                aria-selected="true"
                aria-controls="radix-_r_c_-content-profile"
                data-state="active"
                id="radix-_r_c_-trigger-profile"
                data-slot="tabs-trigger"
                className="focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring text-foreground/60 hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground relative inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent text-sm font-medium whitespace-nowrap transition-all group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 group-data-[variant=default]/tabs-list:data-[state=active]:shadow-sm group-data-[variant=line]/tabs-list:data-[state=active]:shadow-none [&amp;_svg]:pointer-events-none [&amp;_svg]:shrink-0 [&amp;_svg:not([class*='size-'])]:size-4 group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:border-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent dark:data-[state=active]:text-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 data-[state=active]:text-foreground after:bg-foreground after:absolute after:opacity-0 after:transition-opacity group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:-bottom-1.25 group-data-[orientation=horizontal]/tabs:after:h-0.5 group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-right-1 group-data-[orientation=vertical]/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100 h-auto data-[state=active]:bg-transparent px-6 py-3"
                data-orientation="horizontal"
                data-radix-collection-item=""
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-user-round mr-2 size-4"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="8" r="5"></circle>
                  <path d="M20 21a8 8 0 0 0-16 0"></path>
                </svg>
                Profile Info
              </button>
              <button
                type="button"
                role="tab"
                aria-selected="false"
                aria-controls="radix-_r_c_-content-photos"
                data-state="inactive"
                id="radix-_r_c_-trigger-photos"
                data-slot="tabs-trigger"
                className="focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring text-foreground/60 hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground relative inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent text-sm font-medium whitespace-nowrap transition-all group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 group-data-[variant=default]/tabs-list:data-[state=active]:shadow-sm group-data-[variant=line]/tabs-list:data-[state=active]:shadow-none [&amp;_svg]:pointer-events-none [&amp;_svg]:shrink-0 [&amp;_svg:not([class*='size-'])]:size-4 group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:border-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent dark:data-[state=active]:text-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 data-[state=active]:text-foreground after:bg-foreground after:absolute after:opacity-0 after:transition-opacity group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:-bottom-1.25 group-data-[orientation=horizontal]/tabs:after:h-0.5 group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-right-1 group-data-[orientation=vertical]/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100 h-auto data-[state=active]:bg-transparent px-6 py-3"
                data-orientation="horizontal"
                data-radix-collection-item=""
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-camera mr-2 size-4"
                  aria-hidden="true"
                >
                  <path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"></path>
                  <circle cx="12" cy="13" r="3"></circle>
                </svg>
                Photos
              </button>
              <button
                type="button"
                role="tab"
                aria-selected="false"
                aria-controls="radix-_r_c_-content-security"
                data-state="inactive"
                id="radix-_r_c_-trigger-security"
                data-slot="tabs-trigger"
                className="focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring text-foreground/60 hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground relative inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent text-sm font-medium whitespace-nowrap transition-all group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 group-data-[variant=default]/tabs-list:data-[state=active]:shadow-sm group-data-[variant=line]/tabs-list:data-[state=active]:shadow-none [&amp;_svg]:pointer-events-none [&amp;_svg]:shrink-0 [&amp;_svg:not([class*='size-'])]:size-4 group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:border-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent dark:data-[state=active]:text-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 data-[state=active]:text-foreground after:bg-foreground after:absolute after:opacity-0 after:transition-opacity group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:-bottom-1.25 group-data-[orientation=horizontal]/tabs:after:h-0.5 group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-right-1 group-data-[orientation=vertical]/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100 h-auto data-[state=active]:bg-transparent px-6 py-3"
                data-orientation="horizontal"
                data-radix-collection-item=""
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-shield-check mr-2 size-4"
                  aria-hidden="true"
                >
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
                Security
              </button>
            </div>
            <div
              data-state="active"
              data-orientation="horizontal"
              role="tabpanel"
              aria-labelledby="radix-_r_c_-trigger-profile"
              id="radix-_r_c_-content-profile"
              data-slot="tabs-content"
              className="flex-1 outline-none mt-0 focus-visible:ring-0"
            >
              <div className="stripe-divider"></div>
              <h2 className="px-4 py-1 text-2xl screen-line-top screen-line-bottom font-medium tracking-tight text-balance">
                Basic Info
              </h2>
              <div className="px-4 py-6 screen-line-bottom">
                <div className="gap-4 grid sm:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      data-slot="label"
                      className="flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
                      htmlFor="fullName"
                    >
                      Full Name
                    </label>
                    <input
                      data-slot="input"
                      className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-muted/30 focus:bg-background transition-colors"
                      id="fullName"
                      value="divya sachan"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      data-slot="label"
                      className="flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
                      htmlFor="userName"
                    >
                      Username
                    </label>
                    <input
                      data-slot="input"
                      className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-muted/30 focus:bg-background transition-colors"
                      id="userName"
                      value="divyasachan"
                    />
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-between">
                    <label
                      data-slot="label"
                      className="flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
                      htmlFor="bio"
                    >
                      Bio
                    </label>
                    <p className="text-[10px] text-muted-foreground text-right">
                      154/160
                    </p>
                  </div>
                  <textarea
                    data-slot="textarea"
                    className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border px-3 py-2 text-base shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm bg-muted/30 focus:bg-background transition-colors resize-none"
                    id="bio"
                    rows={3}
                  >
                    I'm an MCA graduate who loves writing poetry, reading
                    novels, and creating cultural art. I find joy in
                    storytelling, creativity, and preserving tradition.
                  </textarea>
                </div>
                <div className="mt-4">
                  <div className="space-y-3">
                    <div className="w-full space-y-2">
                      <div className="flex justify-between items-center">
                        <label
                          data-slot="label"
                          className="flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
                          htmlFor="_r_g_"
                        >
                          Search skills, &amp; tools
                        </label>
                        <span className="text-muted-foreground text-xs">
                          8/10
                        </span>
                      </div>
                      <button
                        data-slot="popover-trigger"
                        data-variant="outline"
                        data-size="default"
                        className="inline-flex cursor-pointer! items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 px-4 py-2 has-[&gt;svg]:px-3 h-auto min-h-8 w-full justify-between hover:bg-transparent"
                        id="_r_g_"
                        role="combobox"
                        aria-expanded="false"
                        type="button"
                        aria-haspopup="dialog"
                        aria-controls="radix-_r_h_"
                        data-state="closed"
                      >
                        <div className="flex flex-wrap items-center gap-1 pr-2.5">
                          <button
                            data-slot="button"
                            data-variant="outline"
                            data-size="default"
                            className="inline-flex cursor-pointer! items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 has-[&gt;svg]:px-3 rounded-sm px-2 py-1 h-6"
                          >
                            <div className="flex items-center gap-1">
                              <img
                                alt="nodejs"
                                width="14"
                                height="14"
                                className="shrink-0"
                                src="/devicons/nodejs.svg"
                              />
                              <span className="truncate">nodejs</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-x size-3"
                                aria-hidden="true"
                              >
                                <path d="M18 6 6 18"></path>
                                <path d="m6 6 12 12"></path>
                              </svg>
                            </div>
                          </button>
                          <button
                            data-slot="button"
                            data-variant="outline"
                            data-size="default"
                            className="inline-flex cursor-pointer! items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 has-[&gt;svg]:px-3 rounded-sm px-2 py-1 h-6"
                          >
                            <div className="flex items-center gap-1">
                              <img
                                alt="javascript"
                                width="14"
                                height="14"
                                className="shrink-0"
                                src="/devicons/javascript.svg"
                              />
                              <span className="truncate">javascript</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-x size-3"
                                aria-hidden="true"
                              >
                                <path d="M18 6 6 18"></path>
                                <path d="m6 6 12 12"></path>
                              </svg>
                            </div>
                          </button>
                          <button
                            data-slot="button"
                            data-variant="outline"
                            data-size="default"
                            className="inline-flex cursor-pointer! items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 has-[&gt;svg]:px-3 rounded-sm px-2 py-1 h-6"
                          >
                            <div className="flex items-center gap-1">
                              <img
                                alt="typescript"
                                width="14"
                                height="14"
                                className="shrink-0"
                                src="/devicons/typescript.svg"
                              />
                              <span className="truncate">typescript</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-x size-3"
                                aria-hidden="true"
                              >
                                <path d="M18 6 6 18"></path>
                                <path d="m6 6 12 12"></path>
                              </svg>
                            </div>
                          </button>
                          <button
                            data-slot="button"
                            data-variant="outline"
                            data-size="default"
                            className="inline-flex cursor-pointer! items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 has-[&gt;svg]:px-3 rounded-sm px-2 py-1 h-6"
                          >
                            <div className="flex items-center gap-1">
                              <img
                                alt="nextjs"
                                width="14"
                                height="14"
                                className="devicon-invertible dark:invert shrink-0"
                                src="/devicons/nextjs.svg"
                              />
                              <span className="truncate">nextjs</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-x size-3"
                                aria-hidden="true"
                              >
                                <path d="M18 6 6 18"></path>
                                <path d="m6 6 12 12"></path>
                              </svg>
                            </div>
                          </button>
                          <button
                            data-slot="button"
                            data-variant="outline"
                            data-size="default"
                            className="inline-flex cursor-pointer! items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 has-[&gt;svg]:px-3 rounded-sm px-2 py-1 h-6"
                          >
                            <div className="flex items-center gap-1">
                              <img
                                alt="figma"
                                width="14"
                                height="14"
                                className="shrink-0"
                                src="/devicons/figma.svg"
                              />
                              <span className="truncate">figma</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-x size-3"
                                aria-hidden="true"
                              >
                                <path d="M18 6 6 18"></path>
                                <path d="m6 6 12 12"></path>
                              </svg>
                            </div>
                          </button>
                          <button
                            data-slot="button"
                            data-variant="outline"
                            data-size="default"
                            className="inline-flex cursor-pointer! items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 has-[&gt;svg]:px-3 rounded-sm px-2 py-1 h-6"
                          >
                            <div className="flex items-center gap-1">
                              <img
                                alt="react"
                                width="14"
                                height="14"
                                className="shrink-0"
                                src="/devicons/react.svg"
                              />
                              <span className="truncate">react</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-x size-3"
                                aria-hidden="true"
                              >
                                <path d="M18 6 6 18"></path>
                                <path d="m6 6 12 12"></path>
                              </svg>
                            </div>
                          </button>
                          <button
                            data-slot="button"
                            data-variant="outline"
                            data-size="default"
                            className="inline-flex cursor-pointer! items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 has-[&gt;svg]:px-3 rounded-sm px-2 py-1 h-6"
                          >
                            <div className="flex items-center gap-1">
                              <img
                                alt="mongodb"
                                width="14"
                                height="14"
                                className="shrink-0"
                                src="/devicons/mongodb.svg"
                              />
                              <span className="truncate">mongodb</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-x size-3"
                                aria-hidden="true"
                              >
                                <path d="M18 6 6 18"></path>
                                <path d="m6 6 12 12"></path>
                              </svg>
                            </div>
                          </button>
                          <button
                            data-slot="button"
                            data-variant="outline"
                            data-size="default"
                            className="inline-flex cursor-pointer! items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 has-[&gt;svg]:px-3 rounded-sm px-2 py-1 h-6"
                          >
                            <div className="flex items-center gap-1">
                              <img
                                alt="tailwindcss"
                                width="14"
                                height="14"
                                className="shrink-0"
                                src="/devicons/tailwindcss.svg"
                              />
                              <span className="truncate">tailwindcss</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-x size-3"
                                aria-hidden="true"
                              >
                                <path d="M18 6 6 18"></path>
                                <path d="m6 6 12 12"></path>
                              </svg>
                            </div>
                          </button>
                        </div>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-chevrons-up-down text-muted-foreground/80 shrink-0"
                          aria-hidden="true"
                        >
                          <path d="m7 15 5 5 5-5"></path>
                          <path d="m7 9 5-5 5 5"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="stripe-divider"></div>
              <h2 className="px-4 py-1 text-2xl screen-line-top screen-line-bottom font-medium tracking-tight text-balance">
                SOCIAL LINKS
              </h2>
              <div className="space-y-4 px-4 py-6 screen-line-bottom">
                <div className="group flex items-center gap-2 slide-in-from-left-2 animate-in duration-200 fade-in">
                  <div className="relative flex items-center w-full">
                    <div className="left-3 absolute text-muted-foreground">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 48 48"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="size-4"
                      >
                        <path
                          d="M36.6526 3.8078H43.3995L28.6594 20.6548L46 43.5797H32.4225L21.7881 29.6759L9.61989 43.5797H2.86886L18.6349 25.56L2 3.8078H15.9222L25.5348 16.5165L36.6526 3.8078ZM34.2846 39.5414H38.0232L13.8908 7.63406H9.87892L34.2846 39.5414Z"
                          fill="currentColor"
                        ></path>
                      </svg>
                    </div>
                    <input
                      data-slot="input"
                      className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex-1 bg-muted/30 focus:bg-background pl-9 transition-colors"
                      placeholder="https://example.com/username"
                      type="url"
                      value="https://x.com/IamDivyaSachan"
                    />
                  </div>
                  <button
                    data-slot="button"
                    data-variant="ghost"
                    data-size="icon"
                    className="inline-flex cursor-pointer! items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:hover:bg-accent/50 size-9 hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0"
                    type="button"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-trash2 lucide-trash-2 size-4"
                      aria-hidden="true"
                    >
                      <path d="M10 11v6"></path>
                      <path d="M14 11v6"></path>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                      <path d="M3 6h18"></path>
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
                <div className="group flex items-center gap-2 slide-in-from-left-2 animate-in duration-200 fade-in">
                  <div className="relative flex items-center w-full">
                    <div className="left-3 absolute text-muted-foreground">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 48 48"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="size-4"
                      >
                        <g clip-path="url(#clip0_910_44)">
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M24.0199 0C10.7375 0 0 10.8167 0 24.1983C0 34.895 6.87988 43.9495 16.4241 47.1542C17.6174 47.3951 18.0545 46.6335 18.0545 45.9929C18.0545 45.4319 18.0151 43.509 18.0151 41.5055C11.3334 42.948 9.94198 38.6209 9.94198 38.6209C8.86818 35.8164 7.27715 35.0956 7.27715 35.0956C5.09022 33.6132 7.43645 33.6132 7.43645 33.6132C9.86233 33.7735 11.1353 36.0971 11.1353 36.0971C13.2824 39.7827 16.7422 38.7413 18.1341 38.1002C18.3328 36.5377 18.9695 35.456 19.6455 34.8552C14.3163 34.2942 8.70937 32.211 8.70937 22.9161C8.70937 20.2719 9.66321 18.1086 11.1746 16.4261C10.9361 15.8253 10.1008 13.3409 11.4135 10.0157C11.4135 10.0157 13.4417 9.3746 18.0146 12.4996C19.9725 11.9699 21.9916 11.7005 24.0199 11.6982C26.048 11.6982 28.1154 11.979 30.0246 12.4996C34.5981 9.3746 36.6262 10.0157 36.6262 10.0157C37.9389 13.3409 37.1031 15.8253 36.8646 16.4261C38.4158 18.1086 39.3303 20.2719 39.3303 22.9161C39.3303 32.211 33.7234 34.2539 28.3544 34.8552C29.2296 35.6163 29.9848 37.0583 29.9848 39.3421C29.9848 42.5871 29.9454 45.1915 29.9454 45.9924C29.9454 46.6335 30.383 47.3951 31.5758 47.1547C41.12 43.9491 47.9999 34.895 47.9999 24.1983C48.0392 10.8167 37.2624 0 24.0199 0Z"
                            fill="currentColor"
                          ></path>
                        </g>
                        <defs>
                          <clipPath id="clip0_910_44">
                            <rect
                              width="48"
                              height="48"
                              fill="currentColor"
                            ></rect>
                          </clipPath>
                        </defs>
                      </svg>
                    </div>
                    <input
                      data-slot="input"
                      className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex-1 bg-muted/30 focus:bg-background pl-9 transition-colors"
                      placeholder="https://example.com/username"
                      type="url"
                      value="https://github.com/divya16sachan"
                    />
                  </div>
                  <button
                    data-slot="button"
                    data-variant="ghost"
                    data-size="icon"
                    className="inline-flex cursor-pointer! items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:hover:bg-accent/50 size-9 hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0"
                    type="button"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-trash2 lucide-trash-2 size-4"
                      aria-hidden="true"
                    >
                      <path d="M10 11v6"></path>
                      <path d="M14 11v6"></path>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                      <path d="M3 6h18"></path>
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
                <div className="group flex items-center gap-2 slide-in-from-left-2 animate-in duration-200 fade-in">
                  <div className="relative flex items-center w-full">
                    <div className="left-3 absolute text-muted-foreground">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 48 48"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="size-4"
                      >
                        <g clip-path="url(#clip0_17_68)">
                          <path
                            d="M44.4469 0H3.54375C1.58437 0 0 1.54688 0 3.45938V44.5312C0 46.4437 1.58437 48 3.54375 48H44.4469C46.4062 48 48 46.4438 48 44.5406V3.45938C48 1.54688 46.4062 0 44.4469 0ZM14.2406 40.9031H7.11563V17.9906H14.2406V40.9031ZM10.6781 14.8688C8.39062 14.8688 6.54375 13.0219 6.54375 10.7437C6.54375 8.46562 8.39062 6.61875 10.6781 6.61875C12.9563 6.61875 14.8031 8.46562 14.8031 10.7437C14.8031 13.0125 12.9563 14.8688 10.6781 14.8688ZM40.9031 40.9031H33.7875V29.7656C33.7875 27.1125 33.7406 23.6906 30.0844 23.6906C26.3812 23.6906 25.8187 26.5875 25.8187 29.5781V40.9031H18.7125V17.9906H25.5375V21.1219H25.6312C26.5781 19.3219 28.9031 17.4188 32.3625 17.4188C39.5719 17.4188 40.9031 22.1625 40.9031 28.3313V40.9031Z"
                            fill="currentColor"
                          ></path>
                        </g>
                        <defs>
                          <clipPath id="clip0_17_68">
                            <rect
                              width="48"
                              height="48"
                              fill="currentColor"
                            ></rect>
                          </clipPath>
                        </defs>
                      </svg>
                    </div>
                    <input
                      data-slot="input"
                      className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex-1 bg-muted/30 focus:bg-background pl-9 transition-colors"
                      placeholder="https://example.com/username"
                      type="url"
                      value="https://www.linkedin.com/in/divyasachan"
                    />
                  </div>
                  <button
                    data-slot="button"
                    data-variant="ghost"
                    data-size="icon"
                    className="inline-flex cursor-pointer! items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:hover:bg-accent/50 size-9 hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0"
                    type="button"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-trash2 lucide-trash-2 size-4"
                      aria-hidden="true"
                    >
                      <path d="M10 11v6"></path>
                      <path d="M14 11v6"></path>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                      <path d="M3 6h18"></path>
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
                <div className="group flex items-center gap-2 slide-in-from-left-2 animate-in duration-200 fade-in">
                  <div className="relative flex items-center w-full">
                    <div className="left-3 absolute text-muted-foreground">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 48 48"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="size-4"
                      >
                        <g clip-path="url(#clip0_17_63)">
                          <path
                            d="M24 4.32187C30.4125 4.32187 31.1719 4.35 33.6938 4.4625C36.0375 4.56562 37.3031 4.95938 38.1469 5.2875C39.2625 5.71875 40.0688 6.24375 40.9031 7.07812C41.7469 7.92188 42.2625 8.71875 42.6938 9.83438C43.0219 10.6781 43.4156 11.9531 43.5188 14.2875C43.6313 16.8187 43.6594 17.5781 43.6594 23.9813C43.6594 30.3938 43.6313 31.1531 43.5188 33.675C43.4156 36.0188 43.0219 37.2844 42.6938 38.1281C42.2625 39.2438 41.7375 40.05 40.9031 40.8844C40.0594 41.7281 39.2625 42.2438 38.1469 42.675C37.3031 43.0031 36.0281 43.3969 33.6938 43.5C31.1625 43.6125 30.4031 43.6406 24 43.6406C17.5875 43.6406 16.8281 43.6125 14.3063 43.5C11.9625 43.3969 10.6969 43.0031 9.85313 42.675C8.7375 42.2438 7.93125 41.7188 7.09688 40.8844C6.25313 40.0406 5.7375 39.2438 5.30625 38.1281C4.97813 37.2844 4.58438 36.0094 4.48125 33.675C4.36875 31.1438 4.34063 30.3844 4.34063 23.9813C4.34063 17.5688 4.36875 16.8094 4.48125 14.2875C4.58438 11.9437 4.97813 10.6781 5.30625 9.83438C5.7375 8.71875 6.2625 7.9125 7.09688 7.07812C7.94063 6.23438 8.7375 5.71875 9.85313 5.2875C10.6969 4.95938 11.9719 4.56562 14.3063 4.4625C16.8281 4.35 17.5875 4.32187 24 4.32187ZM24 0C17.4844 0 16.6688 0.028125 14.1094 0.140625C11.5594 0.253125 9.80625 0.665625 8.2875 1.25625C6.70312 1.875 5.3625 2.69062 4.03125 4.03125C2.69063 5.3625 1.875 6.70313 1.25625 8.27813C0.665625 9.80625 0.253125 11.55 0.140625 14.1C0.028125 16.6687 0 17.4844 0 24C0 30.5156 0.028125 31.3312 0.140625 33.8906C0.253125 36.4406 0.665625 38.1938 1.25625 39.7125C1.875 41.2969 2.69063 42.6375 4.03125 43.9688C5.3625 45.3 6.70313 46.125 8.27813 46.7344C9.80625 47.325 11.55 47.7375 14.1 47.85C16.6594 47.9625 17.475 47.9906 23.9906 47.9906C30.5063 47.9906 31.3219 47.9625 33.8813 47.85C36.4313 47.7375 38.1844 47.325 39.7031 46.7344C41.2781 46.125 42.6188 45.3 43.95 43.9688C45.2812 42.6375 46.1063 41.2969 46.7156 39.7219C47.3063 38.1938 47.7188 36.45 47.8313 33.9C47.9438 31.3406 47.9719 30.525 47.9719 24.0094C47.9719 17.4938 47.9438 16.6781 47.8313 14.1188C47.7188 11.5688 47.3063 9.81563 46.7156 8.29688C46.125 6.70312 45.3094 5.3625 43.9688 4.03125C42.6375 2.7 41.2969 1.875 39.7219 1.26562C38.1938 0.675 36.45 0.2625 33.9 0.15C31.3313 0.028125 30.5156 0 24 0Z"
                            fill="currentColor"
                          ></path>
                          <path
                            d="M24 11.6719C17.1938 11.6719 11.6719 17.1938 11.6719 24C11.6719 30.8062 17.1938 36.3281 24 36.3281C30.8062 36.3281 36.3281 30.8062 36.3281 24C36.3281 17.1938 30.8062 11.6719 24 11.6719ZM24 31.9969C19.5844 31.9969 16.0031 28.4156 16.0031 24C16.0031 19.5844 19.5844 16.0031 24 16.0031C28.4156 16.0031 31.9969 19.5844 31.9969 24C31.9969 28.4156 28.4156 31.9969 24 31.9969Z"
                            fill="currentColor"
                          ></path>
                          <path
                            d="M39.6937 11.1843C39.6937 12.778 38.4 14.0624 36.8156 14.0624C35.2219 14.0624 33.9375 12.7687 33.9375 11.1843C33.9375 9.59053 35.2313 8.30615 36.8156 8.30615C38.4 8.30615 39.6937 9.5999 39.6937 11.1843Z"
                            fill="currentColor"
                          ></path>
                        </g>
                        <defs>
                          <clipPath id="clip0_17_63">
                            <rect
                              width="48"
                              height="48"
                              fill="currentColor"
                            ></rect>
                          </clipPath>
                        </defs>
                      </svg>
                    </div>
                    <input
                      data-slot="input"
                      className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex-1 bg-muted/30 focus:bg-background pl-9 transition-colors"
                      placeholder="https://example.com/username"
                      type="url"
                      value="https://www.instagram.com/divya16sachan"
                    />
                  </div>
                  <button
                    data-slot="button"
                    data-variant="ghost"
                    data-size="icon"
                    className="inline-flex cursor-pointer! items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:hover:bg-accent/50 size-9 hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0"
                    type="button"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-trash2 lucide-trash-2 size-4"
                      aria-hidden="true"
                    >
                      <path d="M10 11v6"></path>
                      <path d="M14 11v6"></path>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                      <path d="M3 6h18"></path>
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
                <div className="group flex items-center gap-2 slide-in-from-left-2 animate-in duration-200 fade-in">
                  <div className="relative flex items-center w-full">
                    <div className="left-3 absolute text-muted-foreground">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-link size-4"
                        aria-hidden="true"
                      >
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                      </svg>
                    </div>
                    <input
                      data-slot="input"
                      className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex-1 bg-muted/30 focus:bg-background pl-9 transition-colors"
                      placeholder="https://example.com/username"
                      type="url"
                      value="https://divyasachan.vercel.app"
                    />
                  </div>
                  <button
                    data-slot="button"
                    data-variant="ghost"
                    data-size="icon"
                    className="inline-flex cursor-pointer! items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:hover:bg-accent/50 size-9 hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0"
                    type="button"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-trash2 lucide-trash-2 size-4"
                      aria-hidden="true"
                    >
                      <path d="M10 11v6"></path>
                      <path d="M14 11v6"></path>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                      <path d="M3 6h18"></path>
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
                <button
                  data-slot="button"
                  data-variant="outline"
                  data-size="sm"
                  className="inline-flex cursor-pointer! items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md px-3 has-[&gt;svg]:px-2.5 gap-2 border-dashed"
                  type="button"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-plus size-4"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14"></path>
                    <path d="M12 5v14"></path>
                  </svg>
                  Add social link
                </button>
              </div>
              <div className="stripe-divider"></div>
              <h2 className="px-4 py-1 text-2xl screen-line-top screen-line-bottom font-medium tracking-tight text-balance">
                ACCOUNT SETTINGS
              </h2>
              <div className="screen-line-top px-4 py-6">
                <div className="gap-4 grid grid-cols-2">
                  <div className="space-y-3">
                    <label
                      data-slot="label"
                      className="flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
                    >
                      Account Role
                    </label>
                    <button
                      type="button"
                      role="combobox"
                      aria-controls="radix-_r_i_"
                      aria-expanded="false"
                      aria-autocomplete="none"
                      dir="ltr"
                      data-state="closed"
                      data-slot="select-trigger"
                      data-size="default"
                      className="border-input data-placeholder:text-muted-foreground [&amp;_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&amp;_svg]:pointer-events-none [&amp;_svg]:shrink-0 [&amp;_svg:not([class*='size-'])]:size-4 bg-muted/30"
                    >
                      <span
                        data-slot="select-value"
                        style={{ pointerEvents: "none" }}
                      >
                        Administrator
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-chevron-down size-4 opacity-50"
                        aria-hidden="true"
                      >
                        <path d="m6 9 6 6 6-6"></path>
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-3">
                    <label
                      data-slot="label"
                      className="flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
                    >
                      Account Status
                    </label>
                    <div className="flex justify-between items-center bg-background hover:bg-accent dark:bg-input/30 dark:hover:bg-input/50 shadow-xs p-3 border border-input rounded-md w-full h-10 transition-colors hover:text-accent-foreground cursor-pointer">
                      <span className="font-medium text-sm">Active</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked="false"
                        data-state="unchecked"
                        value="on"
                        data-slot="switch"
                        data-size="default"
                        className="peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 group/switch inline-flex shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-[1.15rem] data-[size=default]:w-8 data-[size=sm]:h-3.5 data-[size=sm]:w-6"
                      >
                        <span
                          data-state="unchecked"
                          data-slot="switch-thumb"
                          className="bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block rounded-full ring-0 transition-transform group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0"
                        ></span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="sticky bg-background bottom-0 border-t">
                <div className="flex justify-between items-stretch sm:items-center gap-4 py-3 px-4">
                  <div className="flex gap-2">
                    <button
                      data-slot="button"
                      data-variant="destructive"
                      data-size="default"
                      className="inline-flex cursor-pointer! items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 h-9 px-4 py-2 has-[&gt;svg]:px-3 shadow-sm w-9 sm:w-auto"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-trash"
                        aria-hidden="true"
                      >
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                        <path d="M3 6h18"></path>
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                      <span className="hidden sm:inline-block">
                        Delete Account
                      </span>
                    </button>
                    <button
                      data-slot="button"
                      data-variant="outline"
                      data-size="default"
                      className="inline-flex cursor-pointer! items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:text-accent-foreground dark:bg-input/30 dark:border-input h-9 px-4 py-2 has-[&gt;svg]:px-3 hover:bg-orange-50 dark:hover:bg-orange-900/20 border-orange-200 w-9 sm:w-auto text-orange-700"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-ban"
                        aria-hidden="true"
                      >
                        <path d="M4.929 4.929 19.07 19.071"></path>
                        <circle cx="12" cy="12" r="10"></circle>
                      </svg>
                      <span className="hidden sm:inline-block">Ban User</span>
                    </button>
                  </div>
                  <button
                    data-slot="button"
                    data-variant="default"
                    data-size="default"
                    className="inline-flex cursor-pointer! items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 has-[&gt;svg]:px-3 shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
            <div
              data-state="inactive"
              data-orientation="horizontal"
              role="tabpanel"
              aria-labelledby="radix-_r_c_-trigger-photos"
              id="radix-_r_c_-content-photos"
              data-slot="tabs-content"
              className="flex-1 outline-none mt-0 focus-visible:ring-0"
            ></div>
            <div
              data-state="inactive"
              data-orientation="horizontal"
              role="tabpanel"
              aria-labelledby="radix-_r_c_-trigger-security"
              id="radix-_r_c_-content-security"
              data-slot="tabs-content"
              className="flex-1 outline-none"
            ></div>
          </div>
        </div>
      </div>
    </Skeleton>
  );
};

export default Page;
