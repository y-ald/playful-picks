import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import AgeCategories from '../components/AgeCategories';
import NewArrivals from '../components/NewArrivals';

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <div className="py-16 bg-white">
        <AgeCategories />
      </div>
      <div className="py-16 bg-secondary-light">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">New Arrivals</h2>
          <NewArrivals />
        </div>
      </div>
    </div>
  );
};

export default Index;