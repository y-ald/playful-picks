import Navbar from '@/components/Navbar';

const About = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container mx-auto px-4 pt-24">
        <div className="max-w-3xl mx-auto py-16">
          <h1 className="text-4xl font-bold mb-8">About Kaia Kids</h1>
          <div className="prose prose-lg">
            <p className="text-xl leading-relaxed text-gray-700">
              Our vision is to provide high-quality clothes that are elegant and beautiful for all occasions. 
              We are committed to contributing to the ecology of the planet by offering sustainable and high-quality clothing.
            </p>
            <div className="mt-12 grid gap-8 md:grid-cols-2">
              <div className="bg-accent-light p-8 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Quality First</h3>
                <p className="text-gray-700">
                  We carefully select materials and manufacturing processes to ensure our clothes meet the highest standards of quality and durability.
                </p>
              </div>
              <div className="bg-primary-light p-8 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Sustainability</h3>
                <p className="text-gray-700">
                  Our commitment to the environment drives us to use eco-friendly materials and sustainable production methods.
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
