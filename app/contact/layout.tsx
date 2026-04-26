import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata = {
  title: 'Contact — Talk to the Myncel Team',
  description: 'Book a demo, talk to sales, or get support. The Myncel team is here to help you set up your preventive maintenance program and get the most out of your account.',
  alternates: { canonical: 'https://myncel.com/contact' },
  openGraph: {
    title: 'Contact Myncel — Book a Demo or Talk to Sales',
    description: 'Get in touch with the Myncel team. Book a demo, ask about pricing, or get help with your account.',
    url: 'https://myncel.com/contact',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}