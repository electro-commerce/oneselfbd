import InitGTM from "@/components/GTM/InitGTM";
import PageTracking from "@/components/GTM/PageTracking";
import JsonLd from "@/components/shared/JsonLd";
import { Toaster } from "@/components/ui/toaster";
import { SITE } from "@/const/site.const";
import StoreProvider from "@/redux/StoreProvider";
import { Metadata } from "next";
import { Hind_Siliguri, Inter, Plus_Jakarta_Sans } from "next/font/google";
import { ReactNode, Suspense } from "react";
import "./globals.css";

const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-hind-siliguri",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.baseUrl),
  title: {
    default: `${SITE.nameEn} | ${SITE.taglineBn}`,
    template: `%s | ${SITE.nameEn}`,
  },
  description: `${SITE.descriptionBn} "${SITE.mottoBn}"`,
  keywords: [
    SITE.nameEn,
    SITE.nameBn,
    "Electronics Bangladesh",
    "Gadget Shop",
    "Tech Products",
    "Smart Gadgets",
    "Online Tech Store",
    "Oneself",
  ].join(", "),
  openGraph: {
    title: `${SITE.nameEn} | ${SITE.taglineBn}`,
    description: SITE.shortDescriptionBn,
    url: SITE.baseUrl,
    siteName: SITE.nameEn,
    locale: "bn_BD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.nameEn} | ${SITE.taglineBn}`,
    description: SITE.shortDescriptionBn,
  },
  icons: {
    icon: [
      {
        url: "/favicon.ico?v=78cce751f6",
        type: "image/x-icon",
        sizes: "16x16 32x32 48x48 64x64",
      },
      {
        url: "/favicon-16x16.png?v=78cce751f6",
        type: "image/png",
        sizes: "16x16",
      },
      {
        url: "/favicon-32x32.png?v=78cce751f6",
        type: "image/png",
        sizes: "32x32",
      },
      { url: "/icon.png?v=78cce751f6", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico?v=78cce751f6",
    apple: [
      {
        url: "/apple-icon.png?v=78cce751f6",
        type: "image/png",
        sizes: "180x180",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href={SITE.apiUrl} />
        <link rel="dns-prefetch" href={SITE.apiUrl} />
      </head>
      <body
        className={`${hindSiliguri.variable} ${plusJakartaSans.variable} ${inter.variable} ${hindSiliguri.className} antialiased`}
      >
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": ["Organization", "Store", "OnlineStore"],
            name: SITE.nameEn,
            description: SITE.descriptionBn,
            url: SITE.baseUrl,
            logo: `${SITE.baseUrl}${SITE.logoPath}`,
            image: `${SITE.baseUrl}${SITE.logoPath}`,
            telephone: SITE.phone,
            email: SITE.email,
            priceRange: "$$",
            address: {
              "@type": "PostalAddress",
              streetAddress: SITE.addressEn,
              addressLocality: "Khulna",
              addressRegion: "Khulna",
              postalCode: "9000",
              addressCountry: "BD",
            },
            openingHoursSpecification: [
              {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Saturday",
                  "Sunday",
                ],
                opens: "09:00",
                closes: "21:00",
              },
            ],
            contactPoint: {
              "@type": "ContactPoint",
              telephone: SITE.phone,
              email: SITE.email,
              contactType: "customer service",
            },
            sameAs: [
              SITE.social.facebook,
              SITE.social.youtube,
              SITE.social.facebookGroup,
            ],
          }}
        />
        <StoreProvider>
          <InitGTM />
          <Suspense fallback={null}>
            <PageTracking />
          </Suspense>
          {children}
          <Toaster />
        </StoreProvider>
      </body>
    </html>
  );
}
