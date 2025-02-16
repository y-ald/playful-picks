import Navbar from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';

const About = () => {
  const { language, translations } = useLanguage();
  const t = translations.about || {};

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container mx-auto px-4 pt-24">
        <div className="max-w-3xl mx-auto py-16">
          <h1 className="text-4xl font-bold mb-8">{t.title}</h1>
          <div className="prose prose-lg">
            <p className="text-xl leading-relaxed text-gray-700">
              {t.description}
            </p>
            <p className="text-xl leading-relaxed text-gray-700">
              {t.vision}
            </p>
            <div className="mt-12 grid gap-8 md:grid-cols-2">
              <div className="bg-accent-light p-8 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">{t.quality?.title}</h3>
                <p className="text-gray-700">
                  {t.quality?.description}
                </p>
              </div>
              <div className="bg-primary-light p-8 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">{t.sustainability?.title}</h3>
                <p className="text-gray-700">
                  {t.sustainability?.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
