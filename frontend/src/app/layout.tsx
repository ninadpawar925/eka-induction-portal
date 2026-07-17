import "./globals.css";

export const metadata = {

  title: "Eka Infra",
  description: "Safety Induction Portal",

};

export default function RootLayout({

  children,

}: Readonly<{
  children: React.ReactNode;
}>) {

  return (

    <html lang="en">

      <body>

        {children}

      </body>

    </html>

  );

}